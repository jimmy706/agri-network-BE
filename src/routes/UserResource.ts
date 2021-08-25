import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import UserDao from '@daos/UserDao';
import { User } from '@entities/User';

const userDao = new UserDao();
const { BAD_REQUEST, CREATED, OK, UNAUTHORIZED } = StatusCodes;

interface AddUserRequest extends Request {
    body: User
}

export async function getAll(req: Request, res: Response): Promise<Response> {
    const result = await userDao.getAll();
    return res.status(OK).json(result);
}



export async function add(req: AddUserRequest, res: Response): Promise<Response> {
    try {
        const { firstName, lastName, email, avatar, group, phoneNumber, type, username } = req.body;
        const newUser = await userDao.add({ firstName, lastName, email, avatar, group, phoneNumber, type, username });
        return res.status(CREATED).json(newUser);
    }
    catch(error) {
        return res.status(BAD_REQUEST).json(error);
    }
}

export async function login(req: Request, res: Response):Promise<Response> {
    try {
        const { idToken } = req.body;
        const result = await userDao.login(idToken);

        return res.status(OK).json(result);
    }
    catch(error) {
        return res.status(UNAUTHORIZED).json(error);
    }
}



export function updateOneUser(req: Request, res: Response) {

    return res.status(OK).end();
}


export function deleteOneUser(req: Request, res: Response) {

    return res.status(OK).end();
}
