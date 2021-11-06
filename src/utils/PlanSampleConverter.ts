import { Plan } from "@entities/Plan";
import { PlanDetail } from "@entities/PlanDetail";
import { PlanSample, PlanSampleStep } from "@entities/PlanSample";

export default class PlanSampleConverter {
    planSample: PlanSample;
    constructor(planSample: PlanSample) {
        this.planSample = planSample;
    }

    public toPlan(startPlanDate: Date): Plan {
        const result = {
            owner: null
         } as any;
        result.name = this.planSample.name;
        result.from = startPlanDate;
        result.to = new Date(startPlanDate.getTime() + this.planSample.tookTime);
        result.result = this.planSample.result;

        const planDetails: PlanDetail[] = [];
        let startDate = startPlanDate;
        for(let step of this.planSample.plantDetails) {
            const planDetail = this.toPlanDetail(step, startDate);
            startDate = planDetail.to;
            planDetails.push(planDetail);
        }
        result.plantDetails = planDetails;

        return result;
    }

    private toPlanDetail(planSampleStep:PlanSampleStep, startDate: Date): PlanDetail {
        const { name, neededFactors, tookTime } = planSampleStep;
        

        return {
            name,
            neededFactors,
            from: startDate,
            to: new Date(startDate.getTime() + tookTime),
            isBroadcasted: false
        }
    }
}