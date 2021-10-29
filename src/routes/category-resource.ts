import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import {ProductCategory} from "@entities/product/ProductCategory";
import { ProductCategoryDao } from '@daos/ProductCategoryDao';

const { OK } = StatusCodes;

const productCategoryDao = new ProductCategoryDao();

export async function getProductType (req: Request, res: Response): Promise<Response> {

    const productCategory: ProductCategory[] = await productCategoryDao.getProductTypes();
    return   res.status(OK).json(productCategory);
}