import FollowModel, { Follow } from '@entities/Follow';
import UserModel, { User } from '@entities/User';
import { auth } from 'firebase-admin';
import { runNeo4jQuery } from '@config/neo4j';
import ErrorMessages from '@constant/errors';
import FirebaseDao from './FirebaseDao';

export const DEFAULT_LIMIT_USERS_RENDER = 10;
const firebaseDao = new FirebaseDao();

export interface CountFollowingsAndFollowers {
    followingsCount: number,
    followersCount: number
}

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
            CREATE (u:User {name: $name, email: $email, uid: $uid})
            CREATE (u)-[:LIVED_IN]->(p)
            `;
        const queryParam = {
            name: `${firstName} ${lastName}`,
            email,
            province,
            uid: savedUser._id
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

            await runNeo4jQuery(queryFollowUserNode, queryParams);

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

        const queryUnfollowUserNode = `
                MATCH (u1:User {uid: $uid1})-[r:FOLLOWED]->(u2:User {uid: $uid2})
                DELETE r
            `;
        const queryParams = {
            uid1: sourceUserId,
            uid2: targetUserId
        }

        await runNeo4jQuery(queryUnfollowUserNode, queryParams);

        follow.followings = follow.followings.filter(f => f != targetUserId);
        targetUserFollow.followers = targetUserFollow.followers.filter(f => f != sourceUserId);
        await follow.save();
        await targetUserFollow.save();

    }

    public async getFollowers(
        id: string,
        page: number = 1,
        limit: number = DEFAULT_LIMIT_USERS_RENDER,
        isIncludeFollowedQuery: boolean = false
    ): Promise<User[]> {

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const follow: any = await FollowModel.findOne({ owner: id }, { _id: 0, followers: { $slice: [startIndex, endIndex] } })
            .populate({ path: 'followers', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        if (isIncludeFollowedQuery) {
            const followers: User[] = JSON.parse(JSON.stringify(follow.followers));
            return followers.map(u => {
                let uid = u._id;
                const isFollowed = follow.followings.findIndex((f: string) => f == uid) != -1;

                u.isFollowed = isFollowed;
                return u;
            });
        }
        return follow.followers;
    }

    public async getFollowings(
        id: string,
        page: number = 1,
        limit: number = DEFAULT_LIMIT_USERS_RENDER,): Promise<User[]> {

        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        const follow: any = await FollowModel.findOne({ owner: id }, { _id: 0, followings: { $slice: [startIndex, endIndex] } })
            .populate({ path: 'followings', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        return follow.followings;
    }

    public async getCountFollowingAndFollower(id: string): Promise<CountFollowingsAndFollowers> {
        const follow: Follow = await FollowModel.findOne({ owner: id })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        return {
            followersCount: follow.followers.length,
            followingsCount: follow.followings.length
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


    public async searchUser( userParam: string): Promise<User[]>{

         const firstNameReq = userParam;
         const lastNameReq = userParam;

        const userResult: User[] =  await UserModel.find({ 
            $or:[
                {"firstName": {'$regex': firstNameReq}},
                {"lastName": {'$regex': lastNameReq}}
            ]   
           
        }).limit(5)
        if(userResult){
            return userResult;
        }
        throw new Error('User not found!');
    }
}

export default UserDao;
