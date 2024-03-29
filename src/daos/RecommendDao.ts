import { runNeo4jQuery } from "@config/neo4j";
import ErrorMessages from "@constant/errors";
import FriendRequestModel from "@entities/FriendRequest";
import InterestModel from "@entities/Interest";
import ProductModel, { Product } from "@entities/product/Product";
import ProvideProductRange from "@entities/product/ProductRangeInfo";
import UserModel, { RecommendUser, User } from "@entities/User";
import AttributeConverter from "@utils/AttributesConverter";
import LocationHandler from "@utils/LocationHandler";
import mongoose from 'mongoose';
import { Result } from "neo4j-driver-core";
import InterestDao, { SearchInterestCriteria } from "./InterestDao";
import ProductDao, { DEFAULT_LIMIT_PRODUCTS_RENDER, SearchProductCriteria, SortProduct } from "./ProductDao";
import UserDao, { DEFAULT_LIMIT_USERS_RENDER, SearchUserCriteria } from "./UserDao";
import InterestTopic from '@entities/InterestTopic';

const DECLINE_POINT = 2;

class RecommendDao {
    private priority = ['ward', 'district', 'province'];
    private userDao: UserDao = new UserDao();
    private productDao: ProductDao = new ProductDao();
    private interestDao: InterestDao = new InterestDao();

    public async getRecommendedUsers(userId: string): Promise<RecommendUser[]> {

        const currentUser = await UserModel.findById(userId).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const uids = new Set<string>();
        let priorityIndex = 0;

        while (priorityIndex <= this.priority.length && uids.size < DEFAULT_LIMIT_USERS_RENDER) {
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
        for (let uid of uids) {
            const user = await UserModel.findById(uid).select("firstName lastName _id email type avatar location");
            if (user) {
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
        if (currentUser.location) {
            return this.sortRecommendUser(result, currentUser).slice(0, DEFAULT_LIMIT_USERS_RENDER);
        }

        return result;
    }

    public async getRecommendedProductsNearLocation(userId: string, radius: number): Promise<Product[]> {
        const queryCriteria = new SearchUserCriteria(DEFAULT_LIMIT_USERS_RENDER, 1);
        queryCriteria.radius = radius;
        const queryUserNearbyResult = await this.userDao.search(userId, queryCriteria);
        let result = [];

        if (queryUserNearbyResult.docs.length > 0) {
            const usersNearby = queryUserNearbyResult.docs;
            const uids = usersNearby.map(u => u._id);
            const queryProducts = await Promise.all(uids.map(uid => {
                const searchProdCriteria = new SearchProductCriteria(1, 1);
                searchProdCriteria.sort = SortProduct.VIEWS;
                searchProdCriteria.owner = uid;
                return this.productDao.search(searchProdCriteria);
            }));

            for (let queryResult of queryProducts) {
                if (queryResult.totalDocs > 0) {
                    result.push(queryResult.docs[0]);
                }
            }
        }
        return result.filter(p => p.owner != userId);
    }

    public async getRecommendedProductsFromFriends(userId: string): Promise<Product[]> {
        const queryString = `MATCH (u:User{uid: $uid})<-[:FRIENDED]-(friends)-[:PROVIDED]->(p:Product) 
        RETURN p.id, friends.uid ORDER BY -p.createdDate LIMIT ${DEFAULT_LIMIT_PRODUCTS_RENDER}`;
        const queryParams = {
            uid: userId
        }
        const result = await runNeo4jQuery(queryString, queryParams);
        let productRecords: Map<string, string> = new Map();
        for (let record of result.records) {
            const uid = record.get('friends.uid');
            const pid = record.get('p.id');
            if (!productRecords.has(uid)) {
                productRecords.set(uid, pid);
            }
        }

        let productIds: any = [];
        for (let entry of productRecords.entries()) {
            productIds.push(mongoose.Types.ObjectId(entry[1]));
        }

        const products = await ProductModel.find({
            _id: {
                $in: productIds
            }
        }).sort({createdDate: -1});

        return products;
    }

    public async getPopularProducts(userId: string, limit: number = DEFAULT_LIMIT_PRODUCTS_RENDER): Promise<Product[]> {
        const result = await ProductModel.aggregate([
            {
                $addFields: {
                    calculatetableCreatedDate: {
                        $convert: {
                            input: '$createdDate',
                            to: 'long'
                        }
                    }
                }
            },
            {
                $addFields: {
                    rankPoint: {
                        $divide: [
                            "$numberOfViews",
                            {
                                $pow: [
                                    {
                                        $subtract: [new Date().getTime(), "$calculatetableCreatedDate"]
                                    },
                                    DECLINE_POINT]
                            }
                        ]
                    }
                }
            },
            {
                $sort: {
                    rankPoint: -1
                }
            },
            {
                $project: {
                    price: 1, name: 1, numberOfViews: 1, thumbnails: 1, owner: 1,
                }
            },
            {
                $limit: limit
            }
        ]);

        return result.filter(p => p.owner != userId) as Product[];
    }

    public async getRecommededProductBaseOnInterest(userId: string): Promise<Product[]> {
        const criteria = new SearchInterestCriteria(1, 1);
        criteria.user = userId;
        const interestRequests = await this.interestDao.search(criteria);
        if (interestRequests.docs.length > 0) {
            const interestObj = interestRequests.docs[0];
            const attributes = new AttributeConverter(interestObj.attributes).toMap();
            const searchProductCriteria = new SearchProductCriteria(DEFAULT_LIMIT_PRODUCTS_RENDER, 1);

            if (attributes.has('name')) {
                searchProductCriteria.name = attributes.get('name');
            }
            if (attributes.has('priceFrom') && attributes.has('priceTo')) {
                searchProductCriteria.priceFrom = 0;
                searchProductCriteria.priceTo = parseInt(attributes.get('priceTo') as string);
            }
            if (attributes.has('category')) {
                const category = attributes.get('category') as string;
                searchProductCriteria.categories = [category];
            }
            searchProductCriteria.sort = SortProduct.CREATED_DATE;
            const result = await this.productDao.search(searchProductCriteria);
            return result.docs.filter(p => p.owner != userId);
        }

        return [];
    }


    public async generateProductFeeds(userId: string) {
        const nearByProducts = await this.getRecommendedProductsNearLocation(userId, 25);
        const productsFromFriends = await this.getRecommendedProductsFromFriends(userId);
        const popularProducts = await this.getPopularProducts(userId);
        const maybeInterestProducts = await this.getRecommededProductBaseOnInterest(userId);

        return {
            nearby: nearByProducts,
            fromFriends: productsFromFriends,
            popular: popularProducts,
            maybeInterest: maybeInterestProducts
        }
    }

    public async getDemandedUsers(userId: string) {
        const searchProductCriteria = new SearchProductCriteria(DEFAULT_LIMIT_PRODUCTS_RENDER, 1);
        searchProductCriteria.owner = userId;
        const productsFromUser = await this.productDao.search(searchProductCriteria);

        const products = productsFromUser.docs;
        const productProvideInfo = this.getProductProvideRange(products);

        const now = new Date();
        const fromDate = new Date(new Date().setMonth(now.getMonth() - 1));
        const interests: any = await InterestModel
            .find({
                createdDate: {
                    $gte: fromDate,
                    $lte: now,
                },
            })
            .sort({ createdDate: -1 })
            .populate({ path: 'user', select: 'firstName lastName avatar phoneNumber location' })
            .limit(30);

        const result = await this.getUsersMatchProvidedRage(productProvideInfo, interests, userId);
        return result;
    }

    private getProductProvideRange(products: Product[]): ProvideProductRange {
        const productProvideInfo: ProvideProductRange = {
            names: [],
            categories: new Set<string>(),
            priceRange: [0, Number.MAX_VALUE]
        }

        let minPrice = Number.MAX_VALUE;
        let maxPrice = 0;
        products.forEach(prod => {
            productProvideInfo.names.push(prod.name.trim().toLowerCase());
            if (prod.categories?.length > 0) {
                prod.categories.forEach(cate => {
                    if (!productProvideInfo.categories.has(String(cate))) {
                        productProvideInfo.categories.add(String(cate));
                    }
                });
            }
            const price = prod.price;
            if (minPrice > price) {
                minPrice = price;
            }
            if (maxPrice < price) {
                maxPrice = price;
            }
        });
        productProvideInfo.priceRange = [minPrice, maxPrice];

        return productProvideInfo;
    }

    private async getUsersMatchProvidedRage(providedRange: ProvideProductRange, interests: any, currentUserId: string): Promise<InterestTopic[]> {
        const pickedUsers: InterestTopic[] = [];
        for (let interest of interests) {
            const attributes = new AttributeConverter(interest.attributes).toMap();
            if (this.isAttributeMatchedWithProvideProductRage(providedRange, attributes)) {
                const indexPickedUser = pickedUsers.findIndex(topic => String(topic.user._id) == String(interest.user._id) && String(interest.user_id) != currentUserId);
                if (indexPickedUser == -1) {
                    const interestTopic: InterestTopic = {
                        name: attributes.get('name') || '',
                        createdDate: interest.createdDate,
                        user: interest.user
                    }
                    pickedUsers.push(interestTopic);
                }
            }
        }

        const result = await this.sortRecommendedUserOnDemand(pickedUsers, currentUserId);
        return result;
    }

    private async sortRecommendedUserOnDemand(interestTopics: InterestTopic[], currentUserId: string): Promise<InterestTopic[]> {
        const currentUser = await this.userDao.getById(currentUserId);

        const locationHandler = LocationHandler.getInstance();
        return interestTopics.sort((t1, t2) => {
            t1.distance = -1;
            t2.distance = -1;

            const l1 = t1.user.location;
            const l2 = t2.user.location;

            if (locationHandler.isLocationValid(l1) && locationHandler.isLocationValid(l2) && locationHandler.isLocationValid(currentUser.location)) {
                const d1 = locationHandler.getDistance(currentUser.location, l1);
                const d2 = locationHandler.getDistance(currentUser.location, l2);

                t1.distance = d1;
                t2.distance = d2;

                return d1 - d2;
            }

            return 0;
        });        
    }

    private isAttributeMatchedWithProvideProductRage(providedRange: ProvideProductRange, attributes: Map<string, string>): boolean {
        if (!AttributeConverter.hasAttributesNeededForProductRecommendation(attributes)) {
            return false;
        }
        const names = providedRange.names;
        const categories = Array.from(providedRange.categories);
        const priceRage = providedRange.priceRange;

        const name = attributes.get('name') as string;
        const cateory = attributes.get('category') as string;
        const priceFrom = parseFloat(attributes.get('priceFrom') as string);
        let check = names.some(prodName => prodName.toLowerCase().trim().includes(name.toLowerCase()))            
            && categories.includes(cateory);
        if (priceFrom) {
            check = check && priceFrom >= priceRage[0];
        }
        return check;
    }

    private sortRecommendUser(arr: RecommendUser[], currentUser: User): RecommendUser[] {
        const locationHandler = LocationHandler.getInstance();
        return arr.sort((u1, u2) => {           
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