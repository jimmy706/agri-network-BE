import ProductCategoryModel,{ProductCategory} from "@entities/ProductCategory";

export class ProductCategoryDao{
    async getProductTypes(): Promise<ProductCategory[]>{
        const productTypes = await ProductCategoryModel.find();
        return productTypes;
    }
}