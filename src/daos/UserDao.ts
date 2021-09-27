import { runNeo4jQuery } from '@config/neo4j';
import ErrorMessages from '@constant/errors';
import FollowModel, { Follow } from '@entities/Follow';
import FriendModel from '@entities/Friend';
import FriendRequestModel from '@entities/FriendRequest';
import UserModel, { User } from '@entities/User';
import UserDetail from '@entities/UserDetail';
import { auth } from 'firebase-admin';
import { FirebaseMessageTypes, FirebsaeMessage } from 'src/@types/express/FirebaseMessage';
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


    public async getOneById(currentLoginUserId: string, id: string): Promise<UserDetail> {
        const user = await UserModel.findById(id).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const follow = await FollowModel.findOne({ owner: id }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const friendObj = await FriendModel.findOne({ owner: id }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isFollowed: boolean = follow.followers.findIndex(f => f == currentLoginUserId) > -1;
        const numberOfFollowers: number = follow.followers.length;
        const numberOfFollowings: number = follow.followings.length;
        const numberOfFriends: number = friendObj.friends.length;
        const isFriend = friendObj.friends.findIndex(f => f == currentLoginUserId) > -1;

        const friendRequest = await FriendRequestModel.findOne({
            from: id,
            to: currentLoginUserId
        });
        const hasFriendRequest = friendRequest == null || undefined ? false : true;

        const userDetail: UserDetail = { ...user.toObject(), isFollowed, isFriend, numberOfFollowers, numberOfFollowings, numberOfFriends, hasFriendRequest };
        return userDetail;
    }

    public async getById(id: string): Promise<User> {
        const user = await UserModel.findById(id).orFail(new Error(ErrorMessages.USER_NOT_FOUND));

        return user;
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
            uid: String(savedUser._id)
        };
        const newFollowObj = new FollowModel({
            owner: savedUser._id
        });
        await newFollowObj.save();

        const friendObj = new FriendModel({
            owner: savedUser._id
        });
        await friendObj.save();

        await runNeo4jQuery(queryAddUserNode, queryParam);
        return savedUser;
    }

    public async auth(idToken: string): Promise<auth.DecodedIdToken> {
        const result = await firebaseDao.verifyIdToken(idToken);
        return result;
    }

    public async sendFriendRequest(fromUser: string, toUser: string): Promise<void> {
        const isFriendRequestExisted = await FriendRequestModel.findOne({
            from: fromUser,
            to: toUser,
        });
        const fromUser_userObject = await UserModel.findById(fromUser).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const fromUserFriends = await FriendModel.findOne({ owner: fromUser }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const isFriended = fromUserFriends.friends.findIndex(f => f == toUser) > -1;

        if (isFriendRequestExisted || isFriended) {
            throw new Error(ErrorMessages.FRIEND_REQUEST_EXISTED);
        }

        const friendRequest = new FriendRequestModel({
            from: fromUser,
            to: toUser,
            createdDate: new Date(),
            message: ''
        });

        await friendRequest.save();

        // Send notification to requested user here
        const notificationMessage: FirebsaeMessage = {
            title: "Lời mời kết bạn mới",
            message: `Bạn vừa nhận một lời mời kết bạn từ ${fromUser_userObject.firstName} ${fromUser_userObject.lastName}`,
            fromUser,
            toUser,
            type: FirebaseMessageTypes.FRIEND_REQUEST,
        };
        await firebaseDao.sendPushMessageToTopic(`add_friend_to_${toUser}`, notificationMessage);
    }

    public async deleteFriendRequest(fromUser: string, toUser: string): Promise<void> {
        const friendRequest = await FriendRequestModel.findOne({
            from: fromUser,
            to: toUser,
        }).orFail(new Error(ErrorMessages.NOT_FOUND));

        await friendRequest.delete();
    }

    public async addFriend(fromUser: string, toUser: string): Promise<void> {
        const friendObj = await FriendModel.findOne({ owner: fromUser }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isAlreadyFriend = friendObj.friends.findIndex(f => f == toUser) > -1;
        if (!isAlreadyFriend) {
            friendObj.friends.push(toUser);
            await friendObj.save();

            const queryAddFriend = `
            MATCH (u1:User {uid: $uid1})
            MATCH (u2:User {uid: $uid2})
            MERGE (u1)-[:FRIENDED]->(u2)`;
            const queryParams = {
                uid1: fromUser,
                uid2: toUser
            }
            await runNeo4jQuery(queryAddFriend, queryParams);
            await this.follow(fromUser, toUser);
        }
        else {
            throw new Error(ErrorMessages.ACTION_DISMISS);
        }
    }

    public async unFriend(fromUser: string, toUser: string): Promise<void> {
        const friendObj = await FriendModel.findOne({ owner: fromUser }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isAlreadyFriend = friendObj.friends.findIndex(f => f == toUser) > -1;
        if (isAlreadyFriend) {
            friendObj.friends = friendObj.friends.filter(f => f != toUser);
            await friendObj.save();

            const queryAddFriend = `
            MATCH (u1:User {uid: $uid1})-[r:FRIENDED]->(u2:User {uid: $uid2})
            DELETE r`;
            const queryParams = {
                uid1: fromUser,
                uid2: toUser
            }
            await runNeo4jQuery(queryAddFriend, queryParams);

        }
        else {
            throw new Error(ErrorMessages.ACTION_DISMISS);
        }
    }

    public async getFriends(userId: string): Promise<any> {
        const friendObj = await FriendModel.findOne({ owner: userId })
            .populate({ path: 'friends', select: 'firstName lastName avatar type' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        return friendObj.friends;
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
                MERGE (u1)-[:FOLLOWED]->(u2)`;

            const queryParams = {
                uid1: sourceUserId,
                uid2: targetUserId
            }

            await runNeo4jQuery(queryFollowUserNode, queryParams);

            await sourceFollow.save();
            await targetFollow.save();
        }
    }

    public async unfollow(sourceUserId: string, targetUserId: string): Promise<void> {
        const follow = await FollowModel.findOne({ owner: sourceUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const targetUserFollow = await FollowModel.findOne({ owner: targetUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const queryUnfollowUserNode = `
                MATCH (u1:User {uid: $uid1})-[r:FOLLOWED]->(u2:User {uid: $uid2})
                DELETE r`;
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
            .populate({ path: 'followers', select: 'firstName lastName avatar type' })
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
            .populate({ path: 'followings', select: 'firstName lastName avatar type' })
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


    public async searchUser(searchParam: string): Promise<User[]> {

        const userResult: User[] = await UserModel.find({
            $or: [
                { "firstName": { '$regex': searchParam, $options: "i" } },
                { "lastName": { '$regex': searchParam, $options: "i" } }

            ]
        }).limit(DEFAULT_LIMIT_USERS_RENDER)
        if (userResult) {
            return userResult;
        }
        throw new Error('User not found!');
    }
}

export default UserDao;
