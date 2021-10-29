import ProductCategoryModel,{ProductCategory} from "@entities/product/ProductCategory";

export class ProductCategoryDao{
    async getProductTypes(): Promise<ProductCategory[]>{
        const productTypes = await ProductCategoryModel.find().sort('name');
        return productTypes;
    }
}