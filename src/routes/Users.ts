import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

import UserDao from '@daos/User/UserDao';
import { User } from '@entities/User';

const userDao = new UserDao();
const { BAD_REQUEST, CREATED, OK } = StatusCodes;

interface AddUserRequest extends Request {
    body: User
}

export function getAllUsers(req: Request, res: Response) {
    return res.status(OK);
}



export async function add(req: AddUserRequest, res: Response): Promise<Response> {
    try {
        const { firstName, lastName, email, avatar, group, phoneNumber } = req.body;
        const newUser = await userDao.add({ firstName, lastName, email, avatar, group, phoneNumber });
        return res.status(CREATED).json(newUser);
    }
    catch(error) {
        return res.status(BAD_REQUEST).json(error);
    }
}



export function updateOneUser(req: Request, res: Response) {

    return res.status(OK).end();
}


export function deleteOneUser(req: Request, res: Response) {

    return res.status(OK).end();
}
