import FollowModel from '@entities/Follow';
import UserModel, { SimpleUser, User } from '@entities/User';
import { auth } from 'firebase-admin';
import { runNeo4jQuery } from 'src/config/neo4j';
import ErrorMessages from 'src/constant/errors';
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
        const follow = await FollowModel.findOne({ owner: sourceUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const followTargetUser = await FollowModel.findOne({owner: targetUserId}).orFail(new Error(ErrorMessages.NOT_FOUND));
        const sourceUser = await this.getOneById(sourceUserId);
        const targetUser = await this.getOneById(targetUserId);

        const isFollowed = follow.followings.findIndex(f => f.userId == targetUserId) > -1;
        if (!isFollowed) {
            follow.followings.push({
                displayName: `${targetUser.firstName} ${targetUser.lastName}`,
                avatar: targetUser.avatar,
                userId: targetUser._id
            });
            followTargetUser.followers.push({
                displayName: `${sourceUser.firstName} ${sourceUser.lastName}`,
                avatar: sourceUser.avatar,
                userId: sourceUser._id
            })
            await follow.save();
            await followTargetUser.save();
        }
        else {
            throw "Bạn đang follow người này!";
        }

    }

    public async unfollow(sourceUserId: string, targetUserId: string): Promise<void> {
        const follow = await FollowModel.findOne({owner: sourceUserId});
        const targetUserFollow = await FollowModel.findOne({owner: targetUserId});
        if(follow && targetUserFollow) {
            follow.followings = follow.followings.filter(f => f.userId != targetUserId);
            targetUserFollow.followers = targetUserFollow.followers.filter(f => f.userId != sourceUserId);
            await follow.save();
            await targetUserFollow.save();
        }
        else {
            throw ErrorMessages.NOT_FOUND;
        }
    }

    public async getFollowers(id: string): Promise<SimpleUser[]> {
        const follow = await FollowModel.findOne({ owner: id });
        if (follow) {
            return follow.followers;
        }
        else {
            throw ErrorMessages.NOT_FOUND;
        }
    }


     public async updateUser(user: User,id: string): Promise<User> {
         const result = await UserModel.findByIdAndUpdate(id,{
             firstName:user.firstName,
             lastName: user.lastName,
             province: user.province

        }).orFail(new Error(ErrorMessages. USER_NOT_FOUND));
            return result;
        }
}

export default UserDao;
