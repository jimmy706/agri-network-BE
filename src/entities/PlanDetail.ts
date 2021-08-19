import { Schema, model } from 'mongoose';

export interface PlanDetail {
    name: string;
    from: Date;
    to: Date;
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

});

const PlanDetailModel = model<PlanDetail>('PlanDetail', PlanDetailSchema);

export default PlanDetailModel;