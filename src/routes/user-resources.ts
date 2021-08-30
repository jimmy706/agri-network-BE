import UserDao from '@daos/UserDao';
import { User } from '@entities/User';
import { NextFunction, Request, Response } from 'express';
import StatusCodes from 'http-status-codes';


const userDao = new UserDao();
const { BAD_REQUEST, CREATED, OK, UNAUTHORIZED, NOT_FOUND } = StatusCodes;

interface AddUserRequest extends Request {
    body: User
}


export async function getbyId(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    try {
        const user = await userDao.getOneById(id);
        return res.status(OK).json(user);
    }
    catch (error) {
        return res.status(NOT_FOUND).json(error);
    }
}

export async function add(req: AddUserRequest, res: Response): Promise<Response> {
    try {
        const user = req.body;
        const newUser = await userDao.add(user);
        return res.status(CREATED).json(newUser);
    }
    catch (error) {
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
        console.log({error})
        return res.status(UNAUTHORIZED).json(error);
    }
}

export async function auth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const idToken = req.headers.authorization;
        if (idToken) {
            const decodedToken = await userDao.auth(idToken);
            const users = await userDao.getByKey('email', decodedToken.firebase.identities.email[0]);
            if(users.length > 0) {
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


export async function getFollowers(req: Request, res: Response): Promise<Response> {
    const { id } = req.body;
    try {
        const followers = await userDao.getFollowers(id);
        return res.status(OK).json(followers);
    }
    catch (error) {
        return res.status(NOT_FOUND).json(error);
    }
}

export async function getTokenFromUid(req: Request, res: Response): Promise<Response> {
    const { uid } = req.body;
    try {
        const token = await userDao.getToken(uid);
        return res.status(OK).json({token});
    }
    catch(error) {
        return res.status(UNAUTHORIZED).json(error);
    }
}

export async function follow(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if(req.params.authUser) {
        const sourceUser = JSON.parse(req.params.authUser);
        try {
            await userDao.follow(sourceUser.id, id);
            return res.status(OK).json('Follow thành công!');
        }
        catch(error) {
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED);
    }
}