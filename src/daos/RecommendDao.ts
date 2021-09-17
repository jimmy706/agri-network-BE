import { runNeo4jQuery } from "@config/neo4j";
import UserModel, { User } from "@entities/User";
import mongoose from 'mongoose';

class RecommendDao {
    public async getRecommendedUsers(userId: String): Promise<User[]> {
        // Query users in same province and NOT follow
        const queryString = `MATCH (u{uid: $uid})-[:LIVED_IN]->(p1)<-[:LIVED_IN]-(other)
        WHERE NOT (u)-[:FOLLOWED]->(other)
        RETURN other.uid`;

        const queryParams = {
            uid: userId
        };

        const queryResult = await runNeo4jQuery(queryString, queryParams);

        const uids = [];
        for(let record of queryResult.records) {
            const uid = record.get('other.uid');
            uids.push(uid);
        }
        const uidsToObjectIds: any = uids.map(uid => mongoose.Types.ObjectId(uid));

        const users = UserModel.find({
            _id: {
                $in: uidsToObjectIds
            }
        });

        return users;
    }
}

export default RecommendDao;