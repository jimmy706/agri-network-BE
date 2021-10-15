import ErrorMessages from "@constant/errors";
import ProductModel, { Product } from "@entities/Product";
import { FilterQuery, PaginateOptions, PaginateResult, Types } from "mongoose";
import { runNeo4jQuery } from "@config/neo4j";

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
        if(this.categories) {
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
                return { views: -1 }
            default:
                return { name: 1 }
        }
    }
}

class ProductDao {
    public async add(product: Product): Promise<Product> {
        console.log(product);
        const newProduct = new ProductModel(product);
        newProduct.createdDate = new Date();
        newProduct.views = 0;
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
            for(let cate of newProduct.categories) {
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

    public async getById(id: string): Promise<Product> {
        const result = await ProductModel.findById(id)
            .populate({ path: 'owner', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.PRODUCT_NOT_FOUND));
        result.views = result.views += 1;
        await result.save();

        return result;
    }

    public async search(criteria: SearchProductCriteria): Promise<PaginateResult<Product>> {
        const { limit, page } = criteria;
        const searchQuery = criteria.toQuery();
        const paginationOptions: PaginateOptions = {
            page,
            limit,
            select: 'name price owner views thumbnails',
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