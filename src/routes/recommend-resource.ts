import RecommendDao from "@daos/RecommendDao";
import { User } from "@entities/User";
import logger from "@shared/Logger";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';

const { BAD_REQUEST, CREATED, OK, UNAUTHORIZED, NOT_FOUND } = StatusCodes;

const recommendDao: RecommendDao = new RecommendDao();

export async function getRecommendedUsers(req: Request, res: Response): Promise<Response> {
    const authUser: User = JSON.parse(req.params.authUser);

    if(authUser) {
        try {
            const result = await recommendDao.getRecommendedUsers(authUser._id);

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