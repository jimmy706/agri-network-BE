import { Schema, model } from 'mongoose';
import { PlanDetail, PlanDetailSchema } from './PlanDetail';

export interface Plan {
    from: Date;
    to: Date;
    expired: boolean;
    name: string;
    plantDetails: PlanDetail[]
}

export const PlanSchema = new Schema<Plan> ({
    from: {
        type: Date,
        require: true
    },
    to: {
        type: Date,
        require: true,
    },
    expired: {
        type: Boolean,
        default: false
    },
    name: {
        type: String,
        require: true
    },
    plantDetails: {
        type: [PlanDetailSchema]
    }
});

const PlanModel = model<Plan>('Plan', PlanSchema);

export default PlanModel;

