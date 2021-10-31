import ErrorMessages from "@constant/errors";
import PlanModel, { Plan } from "@entities/Plan";
import ResponseError from "@entities/ResponseError";
import StatusCodes from 'http-status-codes';
import { FilterQuery, Types } from "mongoose";
const { FORBIDDEN, NOT_FOUND } = StatusCodes;

export class SearchPlanCriteria {
    expired?: boolean;
    owner?: string;
    from?: Date;
    to?: Date;

    constructor() {

    }

    public toQuery(): FilterQuery<Plan> {
        let result = {
            expired: false
        } as any;
        if (this.expired) {
            result.expire = this.expired;
        }
        if (this.owner) {
            result.owner = Types.ObjectId(this.owner);
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
        const result = await PlanModel.find(query);

        return result;
    }

    public async getById(id: string) {
        const plan = await PlanModel.findById(id)
        .populate({ path: 'owner', select: 'firstName lastName avatar' })
        .orFail(new ResponseError(ErrorMessages.NOT_FOUND, NOT_FOUND));
        return plan;
    }
}