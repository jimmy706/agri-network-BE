import InterestDao, { DEFAULT_LIMIT_INTEREST, SearchInterestCriteria } from "@daos/InterestDao";
import { User } from "@entities/User";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';

const { BAD_REQUEST, CREATED, UNAUTHORIZED, OK, NOT_FOUND } = StatusCodes;

const interestDao = new InterestDao();

export async function add(req: Request, res: Response): Promise<Response> {
    const authUser = JSON.parse(req.params.authUser) as User;

    const interest = req.body;
    interest.user = authUser._id;
    const newInterest = await interestDao.add(interest);

    return res.status(CREATED).json(newInterest);
}

export async function search(req: Request, res: Response): Promise<Response> {
    const criteria = new SearchInterestCriteria(DEFAULT_LIMIT_INTEREST, 1);

    const { limit, page, user, fromDate, toDate } = req.query;
    if (limit) {
        criteria.limit = parseInt(limit as string);
    }
    if (page) {
        criteria.page = parseInt(page as string);
    }
    if (user) {
        criteria.user = user as string;
    }
    if (fromDate && toDate) {
        criteria.fromDate = new Date(fromDate as string);
        criteria.toDate = new Date(toDate as string);
    }

    const result = await interestDao.search(criteria);

    return res.status(OK).json(result);
}