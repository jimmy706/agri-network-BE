import RecommendDao from "@daos/RecommendDao";
import { User } from "@entities/User";
import logger from "@shared/Logger";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';

const { BAD_REQUEST, OK, UNAUTHORIZED } = StatusCodes;

const recommendDao: RecommendDao = new RecommendDao();

export async function getRecommendedUsers(req: Request, res: Response): Promise<Response> {
    const authUser: User = JSON.parse(req.params.authUser);

    if (authUser) {
        try {
            const result = await recommendDao.getRecommendedUsers(authUser._id);
            return res.status(OK).json(result);
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

export async function getRecommendedProductsNearby(req: Request, res: Response) {
    const authUser = JSON.parse(req.params.authUser) as User;
    if (authUser) {
        const { radius } = req.query;
        try {
            if (radius) {
                const result = await recommendDao.getRecommendedProductsNearLocation(authUser._id, Number(radius as string));
                return res.status(OK).json(result);
            }
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

export async function getRecommendedProductsFromFriends(req: Request, res: Response) {
    const authUser = JSON.parse(req.params.authUser) as User;
    if (authUser) {
        try {
            const authUser = JSON.parse(req.params.authUser) as User;
            const products = await recommendDao.getRecommendedProductsFromFriends(authUser._id);

            return res.status(OK).json(products);
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    return res.status(UNAUTHORIZED).json();
}

export async function getPopularProducts(req: Request, res: Response) {
    const authUser = JSON.parse(req.params.authUser) as User;

    const result = await recommendDao.getPopularProducts(authUser._id);
    return res.status(OK).json(result);
}

export async function getProductsFeed(req: Request, res: Response) {
    const authUser = JSON.parse(req.params.authUser) as User;
    const result = await recommendDao.generateProductFeeds(authUser._id);

    return res.status(OK).json(result);
}