import { model, Schema } from 'mongoose';

export interface PlanDetail {
    name: string;
    from: Date;
    to: Date;
    neededFactors: Needed[];
    isBroadcasted: boolean;
}

export interface Needed {
    name: string;
    categories: string[];
    priceRange: number[]
}

export const NeededSchema = new Schema<Needed>({
    name: String,
    categories: {
        type: [Schema.Types.ObjectId],
        ref: 'ProductCategory'
    },
    priceRange: {
        type: [Number],
        default: [0, Number.MAX_VALUE]
    },
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
    },
    isBroadcasted: {
        type: Boolean,
        default: false
    }
});

const PlanDetailModel = model<PlanDetail>('PlanDetail', PlanDetailSchema);

export default PlanDetailModel;