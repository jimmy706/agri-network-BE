import { runNeo4jQuery } from "@config/neo4j";
import ErrorMessages from "@constant/errors";
import FriendRequestModel from "@entities/FriendRequest";
import UserModel, { RecommendUser, User } from "@entities/User";
import LocationHandler from "@utils/LocationHandler";
import { Result } from "neo4j-driver-core";
import UserDao, { DEFAULT_LIMIT_USERS_RENDER, SearchUserCriteria } from "./UserDao";
import mongoose from 'mongoose';
import ProductDao, { DEFAULT_LIMIT_PRODUCTS_RENDER, SearchProductCriteria, SortProduct } from "./ProductDao";
import ProductModel, { Product } from "@entities/Product";

class RecommendDao {
    private priority = ['ward', 'district', 'province'];
    private userDao: UserDao = new UserDao();
    private productDao: ProductDao = new ProductDao();

    public async getRecommendedUsers(userId: string): Promise<RecommendUser[]> {

        const currentUser = await UserModel.findById(userId).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const uids = new Set<string>();
        let priorityIndex = 0;

        while(priorityIndex <= this.priority.length && uids.size < DEFAULT_LIMIT_USERS_RENDER) {
            const queryUsers = await this.queryRecommendUserPlacesBaseOnCriteria(currentUser, this.priority[priorityIndex]);
            for (let record of queryUsers.records) {
                const uid = record.get('other.uid');
                uids.add(uid);
            }

            priorityIndex++;
        }

        // Query FOAF
        const queryStringFoaf = `MATCH (u:User {uid: $uid})-[:FRIENDED]->(other:User)<-[:FRIENDED]-(foaf:User)
        WHERE NOT (u)-[:FRIENDED]->(foaf) AND foaf.uid <> $uid
        RETURN foaf.uid LIMIT ${DEFAULT_LIMIT_USERS_RENDER}`;
        const queryParamsFoaf = {
            uid: userId
        };

        const queryFoafResult = await runNeo4jQuery(queryStringFoaf, queryParamsFoaf);
        for (let record of queryFoafResult.records) {
            const uid = record.get('foaf.uid');
            uids.add(uid);
        }
        const users = [];
        for(let uid of uids) {
            const user = await UserModel.findById(uid).select("firstName lastName _id email type avatar location");
            if(user) {
                users.push(user);
            }
        }

        const friendRequestExits = await Promise.all(users.map(u => {
            const friendRequest = FriendRequestModel.findOne({ from: userId, to: u._id });
            return friendRequest;
        }));


        const result: RecommendUser[] = [];
        for (let i = 0; i < users.length; i++) {
            const pendingFriendRequest = friendRequestExits[i] == null || undefined ? false : true;
            result.push({ ...users[i].toObject(), pendingFriendRequest, isFriend: false, distance: -1 });
        }
        if(currentUser.location) {
            return this.sortRecommendUser(result, currentUser).slice(0, DEFAULT_LIMIT_USERS_RENDER);
        }

        return result;
    }

    public async getRecommendedProductsNearLocation(userId: string, radius: number): Promise<Product[]> {
        const queryCriteria = new SearchUserCriteria(DEFAULT_LIMIT_USERS_RENDER, 1);
        queryCriteria.radius = radius;
        const queryUserNearbyResult = await this.userDao.search(userId, queryCriteria);
        let result = [];

        if(queryUserNearbyResult.docs.length > 0) {
            const usersNearby = queryUserNearbyResult.docs;
            const uids = usersNearby.map(u => u._id);
            const queryProducts = await Promise.all(uids.map(uid => {
                const searchProdCriteria = new SearchProductCriteria(1, 1);
                searchProdCriteria.sort = SortProduct.VIEWS;
                searchProdCriteria.owner = uid;
                return this.productDao.search(searchProdCriteria);
            }));

            for (let queryResult of queryProducts) {
                if(queryResult.totalDocs > 0) {
                    result.push(queryResult.docs[0]);
                }
            }
        }
        return result;
    }

    public async getRecommendedProductsFromFriends(userId: string): Promise<Product[]> {
        const queryString = `MATCH (u:User{uid: $uid})<-[:FRIENDED]-(friends)-[:PROVIDED]->(p:Product) 
        RETURN p.id, friends.uid ORDER BY p.createdDate LIMIT ${DEFAULT_LIMIT_PRODUCTS_RENDER}`;
        const queryParams = {
            uid: userId
        }
        const result = await runNeo4jQuery(queryString, queryParams);
        let productRecords:Map<string, string> = new Map();
        for (let record of result.records) {
            const uid = record.get('friends.uid');
            const pid = record.get('p.id');
            if(!productRecords.has(uid)) {
                productRecords.set(uid, pid);
            }
        }

        let productIds: any = [];
        for(let entry of productRecords.entries()) {
            productIds.push(mongoose.Types.ObjectId(entry[1]));
        }

        const products = await ProductModel.find({
            _id: {
                $in: productIds
            }
        });
        
        return products;
    }

    private sortRecommendUser(arr: RecommendUser[], currentUser: User): RecommendUser[] {
        return arr.sort((u1, u2) => {
            const locationHandler = LocationHandler.getInstance();
            u1.distance = -1;
            u2.distance = -1;

            const l1 = u1.location;
            const l2 = u2.location;

            if (locationHandler.isLocationValid(l1) && locationHandler.isLocationValid(l2) && locationHandler.isLocationValid(currentUser.location)) {
                const d1 = locationHandler.getDistance(currentUser.location, l1);
                const d2 = locationHandler.getDistance(currentUser.location, l2);

                u1.distance = d1;
                u2.distance = d2;

                return d1 - d2;
            }

            return 0;
        });
    }

    private queryRecommendUserPlacesBaseOnCriteria(currentUser: any, criteria: string): Promise<Result> {
        if (criteria != 'province') {
            // Query in ward and district
            const queryString = `
            MATCH (u{uid: "${currentUser._id}"})-[:LIVED_IN]->(p)<-[:LIVED_IN]-(other:User{${criteria}: "${currentUser[criteria]}"})
            WHERE NOT (u)-[:FRIENDED]->(other)
            RETURN other.uid LIMIT ${DEFAULT_LIMIT_USERS_RENDER}
         `;
            return runNeo4jQuery(queryString);
        }
        else {
            // Query in province
            const queryString = `
            MATCH (u{uid: "${currentUser._id}"})-[:LIVED_IN]->(p)<-[:LIVED_IN]-(other)
            WHERE NOT (u)-[:FRIENDED]->(other)
            RETURN other.uid LIMIT ${DEFAULT_LIMIT_USERS_RENDER}`;

            return runNeo4jQuery(queryString);
        }
    }
}

export default RecommendDao;