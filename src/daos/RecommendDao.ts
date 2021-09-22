import { runNeo4jQuery } from "@config/neo4j";
import UserModel, { User } from "@entities/User";
import mongoose from 'mongoose';
import { DEFAULT_LIMIT_USERS_RENDER } from "./UserDao";

class RecommendDao {
    public async getRecommendedUsers(userId: String): Promise<User[]> {

        // Query users in same province and NOT followed current user
        const queryString = `MATCH (u{uid: $uid})-[:LIVED_IN]->(p1)<-[:LIVED_IN]-(other)
        WHERE NOT (u)-[:FOLLOWED]->(other)
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
        const queryStringFoaf = `MATCH (u:User {uid: $uid})<-[:FOLLOWED]-(other:User)<-[:FOLLOWED]-(foaf:User)
        WHERE NOT (u)-[:FOLLOWED]->(foaf) AND foaf.uid <> $uid
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
        const users = UserModel.find({
            _id: {
                $in: uidsToObjectIds
            }
        });

        return users;
    }
}

export default RecommendDao;