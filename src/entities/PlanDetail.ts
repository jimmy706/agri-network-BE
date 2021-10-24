import { Schema, model } from 'mongoose';
import Attribute, { AttributeSchema } from './Attribute';

export interface PlanDetail {
    name: string;
    from: Date;
    to: Date;
}

export interface Needed {
    name: string;
    categories: string[];
    priceRange: number[]
}

const NeededSchema = new Schema<Needed>({
    name: String,
    categories: {
        type: [Schema.Types.ObjectId],
        ref: 'ProductCategory'
    },
    priceRange: {
        type: [Number],
        default: [0, Number.MAX_VALUE]
    }
})

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
    neededFactors: {
        type: [NeededSchema],
        default: []
    }
});

const PlanDetailModel = model<PlanDetail>('PlanDetail', PlanDetailSchema);

export default PlanDetailModel;