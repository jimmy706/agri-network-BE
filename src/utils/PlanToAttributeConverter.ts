import { Plan } from '@entities/Plan';
import Attribute from "@entities/Attribute";
import { PlanDetail } from '@entities/PlanDetail';
import moment from 'moment';

export default class PlanToAttributeConverter {
    plan: Plan;
    formatPattern = "yyyy-MM-DD";

    constructor(plan: Plan) {
        this.plan = plan;
    }

    public toAttributes(): Attribute[] {
        let attributes: Attribute[] = [];
        attributes.push({ name: 'name', value: this.plan.name });
        attributes.push({ name: 'from', value: moment(this.plan.from).format(this.formatPattern) });
        attributes.push({ name: 'to', value: moment(this.plan.to).format(this.formatPattern) });
        attributes.push({name: 'countStep', value: String(this.plan.plantDetails.length)});
        attributes = [...attributes, ...this.fromPlanDetailsToAttributes(this.plan.plantDetails)];

        return attributes;
    }

    private fromPlanDetailsToAttributes(planDetails: PlanDetail[]): Attribute[] {
        const attributes: Attribute[] = [];

        for (let i = 0; i < planDetails.length; i++) {
            const planDetail = planDetails[i];
            attributes.push({ name: `planDetails.${i}.name`, value: planDetail.name });
            attributes.push({ name: `planDetails.${i}.from`, value: moment(planDetail.from).format(this.formatPattern) });
            attributes.push({ name: `planDetails.${i}.to`, value: moment(planDetail.to).format(this.formatPattern) });
        }

        return attributes;
    }
}