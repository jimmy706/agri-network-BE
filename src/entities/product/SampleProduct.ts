import { model, Schema } from 'mongoose';
import { QuantityType } from './Product';

export interface SampleProduct {
    _id: string;
    name: string;
    categories: string[];
    quantity: number;
    quantityType: QuantityType;
    thumbnails: string[];
}


function limitCategories(val: string[]) {
    return val.length <= 3;
}

export const SampleProductSchema = new Schema<SampleProduct>({
    name: {
        type: String,
        require: true,
    },
    categories: {
        type: [{
            type: Schema.Types.ObjectId,
            require: true,
            ref: 'ProductCategory',
        }],
        validate: [limitCategories, 'Maximum number of categories']
    },
    quantity: {
        type: Number,
        default: 1,
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
    },
    thumbnails: {
        type: [String],
        require: false,
        default: []
    },
});

const SampleProductModel = model<SampleProduct>('SampleProduct', SampleProductSchema);

export default SampleProductModel;