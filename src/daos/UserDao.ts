import FollowModel from '@entities/Follow';
import UserModel, { User } from '@entities/User';
import logger from '@shared/Logger';
import { auth } from 'firebase-admin';
import { runNeo4jQuery } from '@config/neo4j';
import ErrorMessages from '@constant/errors';
import FirebaseDao from './FirebaseDao';


const firebaseDao = new FirebaseDao();

class UserDao {

    public async getToken(uid: string): Promise<string> {
        const token = await firebaseDao.createTokenFromUid(uid);
        return token;
    }

    public async getByKey(key: string, value: string): Promise<User[]> {
        const query: any = {};
        query[key] = value;
        const users = await UserModel.find(query);

        return users;
    }


    public async getOneById(id: string): Promise<User> {
        const user = await UserModel.findById(id);
        if (user) {
            return user;
        }
        throw new Error('User not found!');
    }


    public async getAll(): Promise<User[]> {
        const result = await UserModel.find();
        return result;
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
        const newFollowObj = new FollowModel({
            owner: savedUser._id
        });
        await newFollowObj.save();
        await runNeo4jQuery(queryAddUserNode, queryParam);
        return savedUser;
    }

    public async auth(idToken: string): Promise<auth.DecodedIdToken> {
        const result = await firebaseDao.verifyIdToken(idToken);
        return result;
    }

    public async follow(sourceUserId: string, targetUserId: string): Promise<void> {
        const sourceFollow = await FollowModel.findOne({ owner: sourceUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const targetFollow = await FollowModel.findOne({ owner: targetUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isFollowed = sourceFollow.followings.findIndex(f => f == targetUserId) > -1;
        if (!isFollowed) {
            sourceFollow.followings.push(targetUserId);
            targetFollow.followers.push(sourceUserId);

            const queryFollowUserNode = `
                MATCH (u1:User {uid: $uid1})
                MATCH (u2:User {uid: $uid2})
                MERGE (u1)-[:FOLLOWED]->(u2)
            `;

            const queryParams = {
                uid1: sourceUserId,
                uid2: targetUserId
            }

            const queryResult = await runNeo4jQuery(queryFollowUserNode, queryParams);
            logger.info(queryResult.summary);

            await sourceFollow.save();
            await targetFollow.save();
        }
        else {
            throw ErrorMessages.ALREADY_FOLLOWED;
        }
    }

    public async unfollow(sourceUserId: string, targetUserId: string): Promise<void> {
        const follow = await FollowModel.findOne({ owner: sourceUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const targetUserFollow = await FollowModel.findOne({ owner: targetUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));

        follow.followings = follow.followings.filter(f => f != targetUserId);
        targetUserFollow.followers = targetUserFollow.followers.filter(f => f != sourceUserId);
        await follow.save();
        await targetUserFollow.save();

    }

    public async getFollowers(id: string): Promise<User[]> {
        const follow: any = await FollowModel.findOne({ owner: id })
            .populate({ path: 'followers', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));
            
        if (follow) {
            return follow.followers;
        }
        else {
            throw ErrorMessages.NOT_FOUND;
        }
    }

    public async getFollowings(id: string): Promise<User[]> {
        const follow: any = await FollowModel.findOne({ owner: id })
            .populate({ path: 'followings', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));
            
        if (follow) {
            return follow.followings;
        }
        else {
            throw ErrorMessages.NOT_FOUND;
        }
    }


    public async updateUser(user: User, id: string): Promise<void> {
        await UserModel.updateOne({ _id: id }, {
            firstName: user.firstName,
            lastName: user.lastName,
            province: user.province,
            phoneNumber: user.phoneNumber,
            avatar: user.avatar
        }).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
    }
}

export default UserDao;
