import { Document, model, PaginateModel, Schema } from 'mongoose';
const mongoosePaginate = require('mongoose-paginate-v2');

export enum QuantityType {
    POUND = 'Tấn',
    WEIGHT = 'Tạ',
    STONE = 'Yến',
    KG = 'Kg',
    GRAM = 'Gram',
    REGULAR = 'Cái',
};

export interface Product extends Document {
    _id: string;
    name: string;
    price: number;
    categories: string[];
    quantity: number;
    quantityType: QuantityType;
    owner: string;
    createdDate: Date;
    numberOfViews: number;
    thumbnails: string[]
}

export interface ProductDetail extends Product {
    fromOwnerProducts: Product[];
    relatedProducts: Product[];
}

function limitCategories(val: string[]) {
    return val.length <= 3;
}

export const ProductSchema = new Schema<Product>({
    name: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true,
        default: 1000
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
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    createdDate: {
        type: Date,
        require: true,
        default: new Date()
    },
    thumbnails: {
        type: [String],
        require: false,
        default: []
    },
    numberOfViews: {
        type: Number,
        require: true,
        default: 1
    }
});
ProductSchema.plugin(mongoosePaginate);

interface ProductModelInf<T extends Document> extends PaginateModel<T> {};

const ProductModel = model<Product>('Product', ProductSchema) as ProductModelInf<Product>;

export default ProductModel;