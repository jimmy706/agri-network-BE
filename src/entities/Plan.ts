import { Schema, model } from 'mongoose';
import { PlanDetail, PlanDetailSchema } from './PlanDetail';

export interface Plan {
    from: Date;
    to: Date;
    expired: boolean;
    name: string;
    plantDetails: PlanDetail[];
    owner: string;
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
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});

const PlanModel = model<Plan>('Plan', PlanSchema);

export default PlanModel;

