import { Schema, model } from 'mongoose';

export interface Product {
    name: string;
    price: number;
    productCategory: string;
    quantity: number;
    owner: string;
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
    productCategory: {
        type: String,
        require: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
});