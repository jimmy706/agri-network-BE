import { runNeo4jQuery } from "@config/neo4j";
import ErrorMessages from "@constant/errors";
import FriendRequestModel from "@entities/FriendRequest";
import UserModel, { RecommendUser, User } from "@entities/User";
import LocationHandler from "@utils/LocationHandler";
import mongoose from 'mongoose';
import { Result } from "neo4j-driver-core";
import { DEFAULT_LIMIT_USERS_RENDER } from "./UserDao";

class RecommendDao {
    public async getRecommendedUsers(userId: string): Promise<RecommendUser[]> {

        const currentUser = await UserModel.findById(userId).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const uids = new Set<string>();
        
        const queryUsersInWard = await this.queryRecommendUserPlacesBaseOnCriteria(currentUser, 'ward');

        for(let record of queryUsersInWard.records) {
            const uid = record.get('other.uid');
            uids.add(uid);
        }

        if(queryUsersInWard.records.length < DEFAULT_LIMIT_USERS_RENDER) {
            const queryUsersInDistrict = await this.queryRecommendUserPlacesBaseOnCriteria(currentUser, 'district');
            for(let record of queryUsersInDistrict.records) {
                const uid = record.get('other.uid');
                uids.add(uid);
            }
        }

        // Query FOAF
        const queryStringFoaf = `MATCH (u:User {uid: $uid})-[:FRIENDED]->(other:User)<-[:FRIENDED]-(foaf:User)
        WHERE NOT (u)-[:FRIENDED]->(foaf) AND foaf.uid <> $uid
        RETURN foaf.uid LIMIT ${DEFAULT_LIMIT_USERS_RENDER}`;
        const queryParamsFoaf = {
            uid: userId
        };

        const queryFoafResult = await runNeo4jQuery(queryStringFoaf, queryParamsFoaf);
        for(let record of queryFoafResult.records) {
            const uid = record.get('foaf.uid');
            uids.add(uid);
        }

        const uidsToObjectIds: any = Array.from(uids).map(uid => mongoose.Types.ObjectId(uid));
        const users = await UserModel.find({
            _id: {
                $in: uidsToObjectIds
            }
        });

        const friendRequestExits = await Promise.all(users.map(u => {
            const friendRequest = FriendRequestModel.findOne({from: userId, to: u._id});
            return friendRequest;
        }));


        const result: RecommendUser[] = [];
        for(let i = 0; i < users.length; i++) {
            const pendingFriendRequest = friendRequestExits[i] == null || undefined ? false : true;
            result.push({...users[i].toObject(), pendingFriendRequest, isFriend: false});
        }
        return result;
    }

    private sortRecommendUser(arr: RecommendUser[], currentUser: User): RecommendUser[] {
        return arr.sort((u1, u2) => {
            const locationHandler = LocationHandler.getInstance();

            const l1 = u1.location;
            const l2 = u2.location;

            if(locationHandler.isLocationValid(l1) && locationHandler.isLocationValid(l2) && locationHandler.isLocationValid(currentUser.location)) {
                const d1 = locationHandler.getDistance(currentUser.location, l1);
                const d2 = locationHandler.getDistance(currentUser.location, l2);
    
                return d1 - d2;
            }

           return 0;
        });
    }

    private queryRecommendUserPlacesBaseOnCriteria(currentUser: User, criteria: 'ward' | 'district'): Promise<Result> {
         const queryString = `
            MATCH (u{uid: "${currentUser._id}"})-[:LIVED_IN]->(p)<-[:LIVED_IN]-(other:User{${criteria}: "${currentUser[criteria]}"})
            WHERE NOT (u)-[:FRIENDED]->(other)
            RETURN other.uid LIMIT ${DEFAULT_LIMIT_USERS_RENDER}
         `;
         return runNeo4jQuery(queryString);
    }
}

export default RecommendDao;