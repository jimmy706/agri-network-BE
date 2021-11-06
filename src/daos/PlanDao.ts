import ErrorMessages from "@constant/errors";
import PlanModel, { Plan } from "@entities/Plan";
import PlanSampleModel, { PlanSample } from "@entities/PlanSample";
import ResponseError from "@entities/ResponseError";
import StatusCodes from 'http-status-codes';
import { FilterQuery } from "mongoose";
const { FORBIDDEN, NOT_FOUND } = StatusCodes;

export class SearchPlanCriteria {
    expired?: boolean;
    owner?: string;
    from?: Date;
    to?: Date;
    status?: string;

    constructor() {

    }

    public toQuery(): FilterQuery<Plan> {
        let result = {
        } as any;
        if (this.expired === true) {
            result.expired = true;
        } else if (this.expired === false) {
            result.expired = false;
        }
        if (this.owner) {
            result.owner = this.owner;
        }
        if (this.from) {
            result.from = {
                $gte: this.from
            };
        }
        if (this.to) {
            result.to = {
                $lte: this.to
            }
        }
        if (this.status) {
            result.status = this.status;
        }

        return result;
    }
}

export default class PlanDao {
    public async add(plan: Plan): Promise<Plan> {
        const newPlan = new PlanModel(plan);
        await newPlan.save();

        return newPlan;
    }

    public async remove(id: string, userId: string): Promise<void> {
        const plan = await PlanModel.findById(id).orFail(new ResponseError(ErrorMessages.NOT_FOUND, NOT_FOUND));

        if (plan.owner == userId) {
            await plan.remove();
        }
        else {
            throw new ResponseError("", FORBIDDEN);
        }
    }

    public async search(criteria: SearchPlanCriteria): Promise<Plan[]> {
        const query = criteria.toQuery();
        const result = await PlanModel.find(query).sort({from: -1});

        return result;
    }

    public async getById(id: string) {
        const plan = await PlanModel.findById(id)
            .populate({ path: 'owner', select: 'firstName lastName avatar' })
            .orFail(new ResponseError(ErrorMessages.NOT_FOUND, NOT_FOUND));
        return plan;
    }

    public async getPlanSamples() {
        const planSamples = await PlanSampleModel.find({});

        return planSamples;
    }

    public async addNewPlanSample(planSample: PlanSample) {
        const newPlanSample = new PlanSampleModel(planSample);
        await newPlanSample.save();
        return newPlanSample;
    }

    public async getPlanSampleById(id: string): Promise<PlanSample> {
        const planSample = await PlanSampleModel.findById(id).orFail(new ResponseError(ErrorMessages.NOT_FOUND, NOT_FOUND));

        return planSample;
    }
}