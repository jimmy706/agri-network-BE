import ErrorMessages from '@constant/errors';
import { Schema, model } from 'mongoose';

export interface Product {
    _id: string;
    name: string;
    price: number;
    productCategory: string;
    quantity: number;
    owner: string;
    createdDate: Date;
    views: number;
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
    categories: [{
        type: Schema.Types.ObjectId,
        require: true,
        ref: 'ProductCategory'
    }],
    quantity: {
        type: Number,
        default: 1
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    createdDate: {
        type: Date,
        require: true,
        default: new Date()
    },
    views: {
        tpye: Number.MAX_VALUE,
        require: false,
        default: 0
    }
});

const ProductModel = model<Product>('Product', ProductSchema);

export default ProductModel;