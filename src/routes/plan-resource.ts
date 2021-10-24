import PlanDao, { SearchPlanCriteria } from "@daos/PlanDao";
import { UserType } from "@entities/User";
import AuthChecker from "@utils/AuthChecker";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';


const { CREATED, OK } = StatusCodes;

const planDao = new PlanDao();

export async function add(req: Request, res: Response) {
    const authChecker = AuthChecker.getInstance();
    const planRequest = req.body;
    const authUser = authChecker.getCurrentLoginUser(req);
    authChecker.rolesAllowed([UserType.PRODUCER], authUser);

    planRequest.owner = authUser._id;

    const result = await planDao.add(planRequest);
    return res.status(CREATED).json(result);
}

export async function remove(req: Request, res: Response) {
    const authChecker = AuthChecker.getInstance();
    const authUser = authChecker.getCurrentLoginUser(req);
    const { id } = req.params;
    await planDao.remove(id, authUser._id);

    return res.status(OK).json();
}

export async function search(req: Request, res: Response): Promise<Response> {
    const { owner, from, to, expired } = req.query;
    const criteria = new SearchPlanCriteria();
    criteria.expired = false;
    if (owner) {
        criteria.owner = owner as string;
    }
    if (from) {
        criteria.from = new Date(from as string);
    }
    if (to) {
        criteria.to = new Date(to as string);
    }
    if (expired == "1") {
        criteria.expired = true;
    }

    const result = await planDao.search(criteria);
    return res.status(OK).json(result);
}