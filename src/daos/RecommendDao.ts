import { runNeo4jQuery } from "@config/neo4j";
import ErrorMessages from "@constant/errors";
import FriendRequestModel from "@entities/FriendRequest";
import UserModel, { RecommendUser, User } from "@entities/User";
import LocationHandler from "@utils/LocationHandler";
import { Result } from "neo4j-driver-core";
import { DEFAULT_LIMIT_USERS_RENDER } from "./UserDao";

class RecommendDao {
    private priority = ['ward', 'district', 'province']

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

    public async getRecommendedProductsNearLocation(userId: string): Promise<void> {
        const currentUser = await UserModel.findById(userId).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const { province, district, ward, location } = currentUser;
        if (location) {
            // TODO: Get products from location
        }
        else {
            // TODO: Get products from same ward, district, province

        }
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

            return -1;
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