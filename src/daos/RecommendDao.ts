import { runNeo4jQuery } from "@config/neo4j";
import FriendRequestModel from "@entities/FriendRequest";
import UserModel, { RecommendUser, User } from "@entities/User";
import mongoose from 'mongoose';
import { DEFAULT_LIMIT_USERS_RENDER } from "./UserDao";

class RecommendDao {
    public async getRecommendedUsers(userId: string): Promise<RecommendUser[]> {

        // Query users in same province and NOT followed current user
        const queryString = `MATCH (u{uid: $uid})-[:LIVED_IN]->(p1)<-[:LIVED_IN]-(other)
        WHERE NOT (u)-[:FRIENDED]->(other)
        RETURN other.uid LIMIT ${DEFAULT_LIMIT_USERS_RENDER}`;

        const queryParams = {
            uid: userId
        };

        const queryResult = await runNeo4jQuery(queryString, queryParams);
        const uids = new Set<string>();
        for(let record of queryResult.records) {
            const uid = record.get('other.uid');
            uids.add(uid)
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
}

export default RecommendDao;