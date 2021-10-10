import { Schema, model } from 'mongoose';

export interface ProductCategory {
    name: string;
    views: number; 
}

export const ProductCategorySchema = new Schema<ProductCategory>({
    name: {
        type: String,
        require: true,
        unique: true
    },
    views: {
        type: Number,
        require: true,
        default: 0,
    }
});

const ProductCategoryModel = model<ProductCategory>('ProductCategory', ProductCategorySchema);

export default ProductCategoryModel;