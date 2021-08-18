import { Schema, model } from 'mongoose';

export interface ProductCategory {
    name: string;    
}

export const ProductCategorySchema = new Schema<ProductCategory>({
    name: {
        type: String,
        require: true,
        unique: true
    }
});

const ProductCategoryModel = model<ProductCategory>('ProductCategory', ProductCategorySchema);

export default ProductCategoryModel;