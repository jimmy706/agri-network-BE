import { Document, model, Schema } from 'mongoose';
import { PlanDetail, PlanDetailSchema } from './PlanDetail';
import { QuantityType } from './product/Product';

export interface HarvestProduct {
    name: string;
    quantity: number;
    quantityType: QuantityType;
}

export interface Plan extends Document {
    _id: string;
    from: Date;
    to: Date;
    expired: boolean;
    name: string;
    plantDetails: PlanDetail[];
    owner: string;
    result: HarvestProduct;
    progress: number;
}

const HarvestProductSchema = new Schema<HarvestProduct>({
    name: {
        type: String,
        require: true
    },
    quantity: {
        type: Number,
        require: true
    },
    quantityType: {
        type: String,
        require: true,
        default: QuantityType.REGULAR,
        enum: [
            QuantityType.POUND,
            QuantityType.WEIGHT,
            QuantityType.STONE,
            QuantityType.KG,
            QuantityType.GRAM,
            QuantityType.REGULAR
        ]
    }
});

export const PlanSchema = new Schema<Plan>({
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
    },
    result: {
        type: HarvestProductSchema,
        require: true
    },
    progress: {
        type: Number,
        default: 0.0
    }
});

const PlanModel = model<Plan>('Plan', PlanSchema);

export default PlanModel;

