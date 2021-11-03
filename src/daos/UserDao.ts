import { runNeo4jQuery } from '@config/neo4j';
import ErrorMessages from '@constant/errors';
import FollowModel, { Follow } from '@entities/Follow';
import FriendModel from '@entities/Friend';
import FriendRequestModel, { FriendRequest } from '@entities/FriendRequest';
import UserModel, { User, UserWithDistance } from '@entities/User';
import UserDetail from '@entities/UserDetail';
import { auth } from 'firebase-admin';
import { FirebaseMessageTypes, FirebsaeMessage } from '@entities/FirebaseMessage';
import FirebaseDao from './FirebaseDao';
import { Location } from '@entities/Location';
import PaginationResponse from '@entities/PaginationResponse';
import LocationHandler from '@utils/LocationHandler';
import { FilterQuery } from 'mongoose';
import PaginationHandler from '@utils/PaginationHandler';

export const DEFAULT_LIMIT_USERS_RENDER = 12;
export const MAX_FRIENDS = 5000;
const firebaseDao = new FirebaseDao();

export interface CountFollowingsAndFollowers {
    followingsCount: number,
    followersCount: number
}

export class SearchUserCriteria {
    name?: string;
    radius?: number;
    limit: number;
    page: number;

    constructor(limit: number, page: number) {
        this.limit = limit;
        this.page = page;
    }

    public toQuery(): FilterQuery<User> {
        let result: any = {};
        if (this.name) {
            result = {
                $or: [
                    { "firstName": { '$regex': this.name, $options: "i" } },
                    { "lastName": { '$regex': this.name, $options: "i" } }
                ]
            }
        }

        return result;
    }
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
        const follow = await FollowModel.findOne({ owner: id })
            .orFail(new Error(ErrorMessages.NOT_FOUND));
        const friendObj = await FriendModel.findOne({ owner: id }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const currentLoginUserFriendObj = await FriendModel.findOne({ owner: currentLoginUserId }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isFollowed: boolean = follow.followers.findIndex(f => f == currentLoginUserId) > -1;
        const numberOfFollowers: number = follow.followers.length;
        const numberOfFollowings: number = follow.followings.length;
        const numberOfFriends: number = friendObj.friends.length;
        const isFriend = currentLoginUserFriendObj.friends.findIndex(f => f == id) > -1;

        const friendRequest = await FriendRequestModel.findOne({
            from: id,
            to: currentLoginUserId
        });
        const hasFriendRequest = friendRequest == null || undefined ? false : true;

        const pendingFriendRequest = await FriendRequestModel.findOne({ from: currentLoginUserId, to: id }) == null || undefined ? false : true;

        const userDetail: UserDetail = {
            ...user.toObject(),
            isFollowed,
            isFriend,
            numberOfFollowers,
            numberOfFollowings,
            numberOfFriends,
            hasFriendRequest,
            pendingFriendRequest
        };
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
        const { firstName, lastName, email, province, district, ward } = savedUser;
        const queryAddUserNode = `
            MATCH (p:Province{name: $province}) 
            CREATE (u:User {name: $name, email: $email, uid: $uid, district: $district, ward: $ward})
            CREATE (u)-[:LIVED_IN]->(p)
            `;
        const queryParam = {
            name: `${firstName} ${lastName}`,
            email,
            province,
            uid: String(savedUser._id),
            district,
            ward
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

    public async getAllFriendRequestsToUser(userId: string): Promise<FriendRequest[]> {
        const friendRequests = await FriendRequestModel
            .find({ to: userId })
            .populate({ path: 'from', select: 'firstName lastName avatar type' });

        return friendRequests;
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

    public async unfriend(fromUser: string, toUser: string): Promise<void> {
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

    public async getFriends(userId: string, page: number = 1, limit: number = DEFAULT_LIMIT_USERS_RENDER): Promise<PaginationResponse<User>> {
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const friendObj: any = await FriendModel.findOne({ owner: userId }, { _id: 0, friends: { $slice: [startIndex, endIndex] } })
            .orFail(new Error(ErrorMessages.NOT_FOUND));
        const queryCount = await FriendModel.aggregate([
            {
                $match: {
                    owner: userId
                }
            },
            {
                $project: {
                    count: {
                        $size: '$friends'
                    }
                }
            }
        ]);
        let count: number = queryCount[0]?.count;
        const hasNextPage = friendObj.friends.length < count;
        const hasPrevPage = page > 1;

        const friends = await UserModel.find({
            _id: {
                $in: friendObj.friends
            }
        }).select("firstName lastName avatar type");

        const result: PaginationResponse<User> = {
            totalDocs: count,
            page,
            limit,
            docs: friends,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? (page + 1) : page,
            prevPage: hasPrevPage ? (page - 1) : page,
        }
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

    public async update(updatedUser: User, id: string): Promise<void> {
        const user = await UserModel.findById(id).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const { firstName, lastName, location, avatar, province, district, ward } = updatedUser;
        user.firstName = firstName;
        user.lastName = lastName;
        user.location = location;
        user.avatar = avatar;
        if (user.province != updatedUser.province) {
            const deleteProvinceRelationship = `MATCH (u{uid: $uid})-[r:LIVED_IN]->(p:Province) DELETE r`;
            const deleteQueryParam = {
                uid: id,
            }
            await runNeo4jQuery(deleteProvinceRelationship, deleteQueryParam);
        }
        user.province = province;
        user.district = district;
        user.ward = ward;
        const updateUserQuery = `
        MATCH (p:Province{name: $province}) 
        MATCH (u{uid: $uid}) 
        SET u.district = $district, u.ward = $ward
        MERGE (u)-[:LIVED_IN]->(p)`;
        const updateUserQueryParam = {
            province,
            uid: id,
            district,
            ward
        };
        await runNeo4jQuery(updateUserQuery, updateUserQueryParam);

        await user.save();
    }

    public async updateLocation(newLocation: Location, userId: string): Promise<void> {
        const user = await UserModel.findById(userId).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        if (!user.location) {
            user.location = {
                lat: -360,
                lng: -360
            };
        }

        const oldLocation = user.location;
        if (oldLocation.lat != newLocation.lat && oldLocation.lng != newLocation.lng) {
            user.location = newLocation;
            await user.save();
        }
    }

    public async deleteAccount(idToken: string): Promise<void> {
        const decodedToken = await this.auth(idToken);
        await firebaseDao.deleteUser(decodedToken.uid);

        const email = decodedToken.email as string;
        const user = await UserModel.findOneAndDelete({ email }).orFail(new Error(ErrorMessages.USER_NOT_FOUND));
        const userId = String(user._id);

        await FollowModel.deleteOne({ owner: userId });
        await FriendModel.deleteOne({ owner: userId });

        const deleteUserQuery = `MATCH (u:User { uid: $uid }) DETACH DELETE u`;
        const deleteUserQueryParam = {
            uid: userId
        };
        await runNeo4jQuery(deleteUserQuery, deleteUserQueryParam);
    }

    public async searchUser(searchParam: string): Promise<User[]> {

        const userResult: User[] = await UserModel.find({
            $or: [
                { "firstName": { '$regex': searchParam, $options: "i" } },
                { "lastName": { '$regex': searchParam, $options: "i" } }

            ]
        }).limit(DEFAULT_LIMIT_USERS_RENDER)
        return userResult;
    }

    public async search(userId: string, criteria: SearchUserCriteria): Promise<PaginationResponse<any>> {

        const { page, limit, radius } = criteria;
        const user = await this.getById(userId);
        const query = criteria.toQuery();
        const locationHandler = LocationHandler.getInstance();

        if (radius && locationHandler.isLocationValid(user.location)) {
            return this.searchUserWithinRadius(user.location, criteria)
        }

        const startIndex = PaginationHandler.getStartIndex(page, limit);
        const users = await UserModel.find(query).skip(startIndex).limit(limit).sort({ firstName: 1, lastName: 1 });
        const totalDocs = await UserModel.countDocuments(query);

        return new PaginationHandler(limit, page, users, totalDocs).toPaginationResponse();
    }

    private async searchUserWithinRadius(location: Location, searchUserCriteria: SearchUserCriteria) {
        const { page, limit, radius } = searchUserCriteria;
        const earthRadius = 6371; // Radius of the earth in km
        const degRad = Math.PI / 180;
        const startIndex = PaginationHandler.getStartIndex(page, limit);
        const endIndex = PaginationHandler.getEndIndex(page, limit);
        const filterObject = {
            $match: {
                $and: [
                    {
                        distance: {
                            $lte: radius
                        }
                    },
                    searchUserCriteria.toQuery()
                ]
            }
        }

        const { lat, lng } = location;
        const ultimateQueriedWithinRadiusUsers: any[] = await UserModel.aggregate([
            {
                $addFields: {
                    dLat: {
                        $multiply: [
                            degRad,
                            { $subtract: ["$location.lat", lat] }
                        ]
                    },
                    dLng: {
                        $multiply: [
                            degRad,
                            { $subtract: ["$location.lng", lng] }
                        ]
                    },
                }
            },
            {
                $addFields: {
                    dRadLat: {
                        $pow: [{
                            $sin: {
                                $divide: ["$dLat", 2]
                            }
                        }, 2]
                    },
                    dRadCenter: {
                        $multiply: [
                            {
                                $cos: {
                                    $multiply: [
                                        degRad, lat
                                    ]
                                }
                            },
                            {
                                $cos: {
                                    $multiply: [
                                        degRad, "$location.lat"
                                    ]
                                }
                            }
                        ]
                    },
                    dRadLng: {
                        $pow: [{
                            $sin: {
                                $divide: ["$dLng", 2]
                            }
                        }, 2]
                    }
                }
            },
            {
                $addFields: {
                    area: {
                        $sum: [
                            "$dRadLat", {
                                $multiply: ["$dRadCenter", "$dRadLng"]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    c: {
                        $multiply: [
                            2, {
                                $atan2: [
                                    { $sqrt: "$area" },
                                    {
                                        $sqrt: {
                                            $subtract: [1, "$area"]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }
            },
            {
                $addFields: {
                    distance: {
                        $multiply: [
                            earthRadius,
                            "$c"
                        ]
                    }
                }
            },
            filterObject,
            {
                $project: {
                    firstName: 1, lastName: 1, distance: 1, _id: 1, avatar: 1, type: 1
                },
            },
            {
                $sort: {
                    distance: 1, firstName: 1, lastName: 1
                }
            }
        ]);
        const totalDocs: number = ultimateQueriedWithinRadiusUsers.length;
        const docs: Object[] = ultimateQueriedWithinRadiusUsers.slice(startIndex, endIndex);

        return new PaginationHandler(limit, page, docs, totalDocs).toPaginationResponse();
    }
}


export default UserDao;
