import { model, Schema } from 'mongoose';
import { HarvestProduct, HarvestProductSchema } from './Plan';
import { Needed, NeededSchema } from './PlanDetail';

export interface PlanSample {
    _id: string;
    tookTime: number,
    name: string;
    plantDetails: PlanSampleStep[];
    result: HarvestProduct;
    sampleResults: string[];
};

export interface PlanSampleStep {
    name: string;
    tookTime: number;
    neededFactors: Needed[];
}

export const PlanSampleStepSchema = new Schema<PlanSampleStep>({
    name: {
        type: String,
        require: true,
    },
    tookTime: {
        type: Number,
        require: true
    },
    neededFactors: {
        type: [NeededSchema],
        default: []
    },
})

export const PlanSampleSchema = new Schema<PlanSample>({
    tookTime: {
        type: Number,
        require: true,
    },
    name: {
        type: String,
        require: true
    },
    plantDetails: {
        type: [PlanSampleStepSchema]
    },
    result: {
        type: HarvestProductSchema,
        require: true
    },
    sampleResults: {
        type: [Schema.Types.ObjectId],
        require: false,
        default: [],
        ref: 'SampleProduct'
    }
});

const PlanSampleModel = model<PlanSample>('PlanSample', PlanSampleSchema);
export default PlanSampleModel;