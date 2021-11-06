import PlanDao, { SearchPlanCriteria } from "@daos/PlanDao";
import PostDao from "@daos/PostDao";
import { Plan } from "@entities/Plan";
import { PostFormat } from "@entities/Post";
import { User } from "@entities/User";
import AuthChecker from "@utils/AuthChecker";
import PlanSampleConverter from "@utils/PlanSampleConverter";
import PlanToAttributeConverter from "@utils/PlanToAttributeConverter";
import { Request, Response } from "express";
import StatusCodes from 'http-status-codes';


const { CREATED, OK } = StatusCodes;

const planDao = new PlanDao();
const postDao = new PostDao();

async function addPostFromPlan(plan: Plan, authUser: User) {
    const planToAttrconverter = new PlanToAttributeConverter(plan);

    const newPost = {
        content: `${authUser.lastName} vừa đăng một kế hoạch sản xuất mới.`,
        images: [],
        format: PostFormat.PLAN,
        ref: plan._id,
        postedBy: authUser._id,
        attributes: planToAttrconverter.toAttributes(),
        tags: ["chia sẻ", "kế hoạch sản xuất"],
        isPublic: false,
        schedulePublicDate: plan.from
    } as any;

    await postDao.add(newPost);
}


export async function add(req: Request, res: Response) {
    const authChecker = AuthChecker.getInstance();
    const planRequest = req.body;
    const authUser = authChecker.getCurrentLoginUser(req);

    planRequest.owner = authUser._id;

    const result = await planDao.add(planRequest);
    await addPostFromPlan(result, authUser);

    return res.status(CREATED).json(result);
}

export async function addPlanFromSample(req: Request, res: Response): Promise<Response> {
    const authChecker = AuthChecker.getInstance();
    const authUser = authChecker.getCurrentLoginUser(req);

    const { id } = req.params;
    let startDate = new Date();
    if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
    }
    const planSample = await planDao.getPlanSampleById(id);
    const planSampleConverter = new PlanSampleConverter(planSample);
    const newPlan = planSampleConverter.toPlan(startDate);
    newPlan.owner = authUser._id;

    const result = await planDao.add(newPlan);
    await addPostFromPlan(result, authUser);

    return res.status(CREATED).json(result);
}

export async function remove(req: Request, res: Response): Promise<Response> {
    const authChecker = AuthChecker.getInstance();
    const authUser = authChecker.getCurrentLoginUser(req);
    const { id } = req.params;
    await planDao.remove(id, authUser._id);

    return res.status(OK).json();
}

export async function search(req: Request, res: Response): Promise<Response> {
    const { owner, from, to, expired, status } = req.query;
    const criteria = new SearchPlanCriteria();
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
    } else if (expired == "0") {
        criteria.expired = false;
    }
    if (status) {
        criteria.status = status as string;
    }

    const result = await planDao.search(criteria);
    return res.status(OK).json(result);
}

export async function getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const plan = await planDao.getById(id);

    return res.status(OK).json(plan);
}

export async function getPlanSamples(req: Request, res: Response): Promise<Response> {
    const planSamples = await planDao.getPlanSamples();
    return res.status(OK).json(planSamples);
}

export async function addNewPlanSample(req: Request, res: Response): Promise<Response> {
    const newPlanSample = await planDao.addNewPlanSample(req.body);
    return res.status(OK).json(newPlanSample);
}

export async function getSamplePlan(req: Request, res: Response): Promise<Response> {
    const authChecker = AuthChecker.getInstance();
    const authUser = authChecker.getCurrentLoginUser(req);

    const { id } = req.params;
    let startDate = new Date();
    if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
    }
    const planSample = await planDao.getPlanSampleById(id);
    const planSampleConverter = new PlanSampleConverter(planSample);

    const result = planSampleConverter.toPlan(startDate);
    result.owner = authUser._id;

    return res.status(OK).json(result);
}