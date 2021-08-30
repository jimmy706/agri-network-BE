import FollowModel from '@entities/Follow';
import UserModel, { User } from '@entities/User';
import { auth } from 'firebase-admin';
import { createNeo4jTransaction, runNeo4jQuery } from 'src/config/neo4j';
import FirebaseDao from './FirebaseDao';


const firebaseDao = new FirebaseDao();

class UserDao {

    public async getToken(uid: string): Promise<string> {
        const token = await firebaseDao.createTokenFromUid(uid);
        return token;
    }

    public async getByKey(key: string, value: string): Promise<User[]> {
        const query:any = {};
        query[key] = value;
        const users = await UserModel.find(query);

        return users;
    }


    public async getOneById(id: string): Promise<User> {
        const user = await UserModel.findById(id);
        if(user) {
            return user;
        }
        throw new Error('User not found!');
    }


    public async getAll(): Promise<User[]> {
        const result = await UserModel.find();
        return result;
    }

    public async getFollowers(id: string): Promise<any> {
        const followers = await FollowModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'following',
                    foreignField: '_id',
                    as: 'followers'
                },
                $match: {
                    owner: id
                }
            },
        ]);
        return followers;
    }

    public async add(user: User): Promise<User> {
        const newUser = new UserModel(user);
        const savedUser = await newUser.save();
        const { firstName, lastName, email, province } = savedUser;

        const queryAddUserNode = `
            MATCH (p:Province{name: $province}) 
            CREATE (u:User {name: $name, email: $email})
            CREATE (u)-[:LIVED_IN]->(p)
            `;
        const queryParam = {
            name: `${firstName} ${lastName}`,
            email,
            province
        };
        await runNeo4jQuery(queryAddUserNode, queryParam);
        return savedUser;
    }

    public async auth(idToken: string): Promise<auth.DecodedIdToken> {
        const result = await firebaseDao.verifyIdToken(idToken);
        return result;
    }
  
    public async follow(sourceUser: string, targetUser: string): Promise<void> {
        const follow = await FollowModel.findOne({owner: sourceUser});
        if(!follow) {
            const newFollow = new FollowModel({
                owner: sourceUser,
                following: [targetUser]
            })
            await newFollow.save();
        }
        else {
            const isFollowed = follow.following.findIndex(f => f == targetUser) > -1;
            if(!isFollowed) {
                follow.following.push(targetUser);
                await follow.save();
            }
            else {
                throw "Bạn đang follow người này!";
            }
        }
    }
}

export default UserDao;
