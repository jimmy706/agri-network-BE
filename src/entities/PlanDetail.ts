import { Schema, model } from 'mongoose';

export interface PlanDetail {
    name: string;
    from: Date;
    to: Date;
    inNeed?: string;
}

export const PlanDetailSchema = new Schema<PlanDetail>({
    name: {
        type: String,
        require: true
    },
    from: {
        type: Date,
        require: true
    },
    to: {
        type: Date,
        require: true
    },
    inNeed: {
        type: String
    }
});

const PlanDetailModel = model<PlanDetail>('PlanDetail', PlanDetailSchema);

export default PlanDetailModel;