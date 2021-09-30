import UserDao, { DEFAULT_LIMIT_USERS_RENDER } from '@daos/UserDao';
import { User } from '@entities/User';
import logger from '@shared/Logger';
import { NextFunction, Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import SuccessMessages from '@constant/success';


const userDao = new UserDao();
const { BAD_REQUEST, CREATED, OK, UNAUTHORIZED, NOT_FOUND } = StatusCodes;

interface AddUserRequest extends Request {
    body: User
}

export async function getbyId(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        const authUser: User = JSON.parse(req.params.authUser);

        try {
            const user = await userDao.getOneById(authUser._id, id);
            return res.status(OK).json(user);
        }
        catch (error) {
            return res.status(NOT_FOUND).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function add(req: AddUserRequest, res: Response): Promise<Response> {
    try {
        const user = req.body;
        const newUser = await userDao.add(user);
        return res.status(CREATED).json(newUser);
    }
    catch (error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}

export async function getDecodedToken(req: Request, res: Response): Promise<Response> {
    try {
        const idToken = req.headers.authorization;
        if (idToken) {
            const result = await userDao.auth(idToken);
            return res.status(OK).json(result);
        }
        else {
            throw "Authorization failed";
        }
    }
    catch (error) {
        return res.status(UNAUTHORIZED).json(error);
    }
}

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const idToken = req.headers.authorization;
        if (idToken) {
            const decodedToken = await userDao.auth(idToken);
            const users = await userDao.getByKey('email', decodedToken.firebase.identities.email[0]);
            if (users.length > 0) {
                req.params.authUser = JSON.stringify(users[0]);
            }
            next();
        }
        else {
            throw "Authorization failed";
        }
    }
    catch (error) {
        res.status(UNAUTHORIZED).json(error);
    }
}

export async function getTokenFromUid(req: Request, res: Response): Promise<Response> {
    const { uid } = req.body;
    try {
        const token = await userDao.getToken(uid);
        return res.status(OK).json({ token });
    }
    catch (error) {
        return res.status(UNAUTHORIZED).json(error);
    }
}

export async function sendFriendRequest(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser = JSON.parse(req.params.authUser) as User;
            await userDao.sendFriendRequest(authUser._id, id);

            return res.status(OK).json();
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function cancelFriendRequest(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        const authUser = JSON.parse(req.params.authUser) as User;
        await userDao.deleteFriendRequest(authUser._id, id);
        return res.status(OK).json();
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

/**
 * approve friend request from user
 * @param req http request
 * @param res http response
 * @returns {Promise}
 */
export async function approveFriendRequest(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser = JSON.parse(req.params.authUser) as User;

            await userDao.addFriend(id, authUser._id);
            await userDao.addFriend(authUser._id, id);
            await userDao.deleteFriendRequest(id, authUser._id);

            return res.status(OK).json();
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

/**
 * reject friend request from user
 * @param req http request
 * @param res http response
 * @returns {Promise}
 */
export async function rejectFriendRequest(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser = JSON.parse(req.params.authUser) as User;

            await userDao.deleteFriendRequest(id, authUser._id);
            return res.status(OK).json();
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function getAllFriendRequests(req: Request, res: Response): Promise<Response> {
    if (req.params.authUser) {
        try {
            const authUser = JSON.parse(req.params.authUser) as User;
            const result = await userDao.getAllFriendRequestsToUser(authUser._id);
            return res.status(OK).json(result);
        }
        catch(error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function unfriend(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser = JSON.parse(req.params.authUser) as User;

            await userDao.unfollow(authUser._id, id);
            await userDao.unfriend(authUser._id, id);
            return res.status(OK).json();
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function getFriends(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const friends = await userDao.getFriends(id);

    return res.status(OK).json(friends);
}

export async function follow(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        const sourceUser = JSON.parse(req.params.authUser);
        try {
            await userDao.follow(sourceUser._id, id);
            return res.status(OK).json(SuccessMessages.FOLLOW_SUCCESS);
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function unfollow(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        const sourceUser = JSON.parse(req.params.authUser);
        try {
            await userDao.unfollow(sourceUser._id, id);
            return res.status(OK).json(SuccessMessages.UNFOLLOW_SUCCESS);
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function getFollowers(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    let page = 1;
    let limit = DEFAULT_LIMIT_USERS_RENDER;
    try {
        if (req.query.page && req.query.limit) {
            page = typeof req.query.page == 'string' ? Number.parseInt(req.query.page) : 1;
            limit = typeof req.query.limit == 'string' ? Number.parseInt(req.query.limit) : DEFAULT_LIMIT_USERS_RENDER;
        }
        const followers = await userDao.getFollowers(id, page, limit, true);
        return res.status(OK).json(followers);
    }
    catch (error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}

export async function getFollowings(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    let page = 1;
    let limit = DEFAULT_LIMIT_USERS_RENDER;
    try {
        const followings = await userDao.getFollowings(id, page, limit);
        return res.status(OK).json(followings);
    }
    catch (error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}

export async function update(req: Request, res: Response): Promise<Response> {
    const authUser: User = JSON.parse(req.params.authUser);
    const id = authUser._id;
    try {
        await userDao.updateUser(req.body, id);
        return res.status(OK).json();
    }
    catch (error) {
        return res.status(NOT_FOUND).json(error);
    }
}

export async function getUserLogin(req: Request, res: Response): Promise<Response> {
    const authUserLogin: User = JSON.parse(req.params.authUser);
    const id = authUserLogin._id;

    try {
        const userLogin = await userDao.getById(id);
        return res.status(OK).json(userLogin);
    }
    catch (error) {
        return res.status(NOT_FOUND).json(error);
    }
}

export async function searchByUser(req: Request, res: Response) {
    const search: any = req.query.search;
    try {
        const userResult: User[] = await userDao.searchUser(search);
        return res.status(OK).json(userResult);
    }
    catch (error) {
        return res.status(NOT_FOUND).json(error);
    }
}

