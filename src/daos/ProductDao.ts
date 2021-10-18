import ErrorMessages from "@constant/errors";
import ProductModel, { Product, ProductDetail } from "@entities/Product";
import { FilterQuery, PaginateOptions, PaginateResult, Types } from "mongoose";
import { runNeo4jQuery } from "@config/neo4j";
import StatusCodes from 'http-status-codes';
import ResponseError from "@entities/ResponseError";
const { OK, CREATED, NOT_FOUND, UNAUTHORIZED, BAD_REQUEST, FORBIDDEN } = StatusCodes;

export const DEFAULT_LIMIT_PRODUCTS_RENDER = 10;

export enum SortProduct {
    NAME = 1, VIEWS = 2, CREATED_DATE = 3
}

export class SearchProductCriteria {
    name?: string;
    priceFrom?: number;
    priceTo?: number;
    owner?: string;
    categories?: string[];
    sort: SortProduct;
    limit: number;
    page: number;

    constructor(limit: number, page: number) {
        this.limit = limit;
        this.page = page;
        this.sort = SortProduct.NAME;
    }

    public toQuery(): FilterQuery<Product> {
        let result: any = {};
        if (this.name) {
            result.name = {
                $regex: `${this.name}`,
                $options: "i"
            }
        }
        if (this.priceFrom && this.priceTo) {
            result.price = {
                $gte: this.priceFrom,
                $lte: this.priceTo
            }
        }
        if (this.owner) {
            result.owner = Types.ObjectId(this.owner);
        }
        if (this.categories) {
            result.categories = {
                $in: this.categories
            }
        }

        return result;
    }

    public getSort() {
        switch (this.sort) {
            case SortProduct.CREATED_DATE:
                return { createdDate: -1 }
            case SortProduct.NAME:
                return { name: 1 }
            case SortProduct.VIEWS:
                return { numberOfViews: -1 }
            default:
                return { name: 1 }
        }
    }
}

class ProductDao {
    public async add(product: Product): Promise<Product> {
        const newProduct = new ProductModel(product);
        newProduct.createdDate = new Date();
        const result = await newProduct.save();

        const queryStr = `
MATCH (u:User{uid: "${newProduct.owner}"})        
CREATE (p:Product{name: $name, id: $id, createdDate: $createdDate})
CREATE (u)-[:PROVIDED]->(p)`;
        const queryParams = {
            name: newProduct.name,
            id: String(newProduct._id),
            createdDate: newProduct.createdDate.getTime()
        };
        await runNeo4jQuery(queryStr, queryParams);

        // Wait for product imported
        setTimeout(() => {
            for (let cate of newProduct.categories) {
                const queryStringCreateRelationship = `
MATCH (p:Product{id: "${String(newProduct._id)}"})                
MATCH (c:Category{id: "${cate}"})
CREATE (p)-[:BELONGED_TO]->(c)
                `;
                runNeo4jQuery(queryStringCreateRelationship);
            }
        }, 2000);

        return result;
    }

    public async getById(id: string): Promise<any> {
        const product = await ProductModel.findById(id)
            .populate({ path: 'owner', select: 'firstName lastName avatar' })
            .populate({ path: 'categories', select: 'name' })
            .orFail(new Error(ErrorMessages.PRODUCT_NOT_FOUND));
        product.numberOfViews+=1;
        await product.save();
        
        const userOwner = product.owner as any;
        const searchProductsFromOwnerCriteria = new SearchProductCriteria(DEFAULT_LIMIT_PRODUCTS_RENDER, 1);
        searchProductsFromOwnerCriteria.sort = SortProduct.NAME;
        searchProductsFromOwnerCriteria.owner = String(userOwner._id);
        const relatedProductsFromOwner = await this.search(searchProductsFromOwnerCriteria);

        const searchProductsRelatedToCategoryCriteria = new SearchProductCriteria(DEFAULT_LIMIT_PRODUCTS_RENDER, 1);
        searchProductsRelatedToCategoryCriteria.categories = product.categories;
        searchProductsRelatedToCategoryCriteria.sort = SortProduct.VIEWS;
        const relatedCategoriesProducts = await this.search(searchProductsRelatedToCategoryCriteria);


        return {
            ...product.toObject(),
            fromOwnerProducts: relatedProductsFromOwner.docs.filter(p => p._id != String(product._id)),
            relatedProducts: relatedCategoriesProducts.docs.filter(p => p._id != String(product._id))
        };
    }

    public async deleteById(id: string, userId: string): Promise<void> {
        const product = await ProductModel.findById(id).orFail(new Error(ErrorMessages.PRODUCT_NOT_FOUND));
        if (product.owner == userId) {
            const deleteQuery = `MATCH (p:Product{id: $id}) DETACH DELETE p`;
            const deleteQueryParams = {
                id: product._id
            }
            await product.remove();
            await runNeo4jQuery(deleteQuery, deleteQueryParams);
        }
        else {
            throw new ResponseError(ErrorMessages.ACTION_DISMISS, FORBIDDEN); 
        }
    }

    public async update(id: string, product: Product, userId: string) {
        const productUpdating = await ProductModel.findById(id).orFail(new ResponseError(ErrorMessages.PRODUCT_NOT_FOUND, NOT_FOUND));
        if (productUpdating.owner == userId) {
            productUpdating.name = product.name;
            productUpdating.price = product.price;
            productUpdating.categories = product.categories;
            productUpdating.thumbnails = product.thumbnails;
            productUpdating.quantity = product.quantity;
            productUpdating.quantityType = product.quantityType;

            await productUpdating.save();
        }
        else {
            throw new ResponseError(ErrorMessages.ACTION_DISMISS, FORBIDDEN);
        }
    }

    public async search(criteria: SearchProductCriteria): Promise<PaginateResult<Product>> {
        const { limit, page } = criteria;
        const searchQuery = criteria.toQuery();
        const paginationOptions: PaginateOptions = {
            page,
            limit,
            select: 'name price numberOfViews thumbnails',
            sort: criteria.getSort(),
        };
        const products: PaginateResult<Product> = await new Promise((resolve, reject) => {
            ProductModel.paginate(searchQuery, paginationOptions, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result)
            })
        });

        return products;
    }
}

export default ProductDao;