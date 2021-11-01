import PlanDao, { SearchPlanCriteria } from "@daos/PlanDao";
import PostDao from "@daos/PostDao";
import Attribute from "@entities/Attribute";
import { PostFormat } from "@entities/Post";
import AuthChecker from "@utils/AuthChecker";
import PlanToAttributeConverter from "@utils/PlanToAttributeConverter";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';


const { CREATED, OK } = StatusCodes;

const planDao = new PlanDao();
const postDao = new PostDao();

export async function add(req: Request, res: Response) {
    const authChecker = AuthChecker.getInstance();
    const planRequest = req.body;
    const authUser = authChecker.getCurrentLoginUser(req);

    planRequest.owner = authUser._id;

    const result = await planDao.add(planRequest);
    const planToAttrconverter = new PlanToAttributeConverter(result);
   
    const newPost = {
        content: `${authUser.lastName} vừa đăng một kế hoạch sản xuất mới.`,
        images: [],
        format: PostFormat.PLAN,
        ref: result._id,
        postedBy: authUser._id,
        attributes: planToAttrconverter.toAttributes(),
        tags: ["chia sẻ", "kế hoạch sản xuất"],
    } as any;

    await postDao.add(newPost);

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

export async function getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const plan = await planDao.getById(id);

    return res.status(OK).json(plan);
}