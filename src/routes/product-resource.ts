import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import ProductDao, { DEFAULT_LIMIT_PRODUCTS_RENDER, SearchProductCriteria, SortProduct } from '@daos/ProductDao';
import logger from '@shared/Logger';
import { User } from '@entities/User';
import { Product } from '@entities/Product';

const { OK, CREATED, NOT_FOUND, UNAUTHORIZED, BAD_REQUEST, } = StatusCodes;

const productDao = new ProductDao();

function toSortProduct(n: number) {
    switch(n) {
        case 1:
            return SortProduct.NAME;
        case 2:
            return SortProduct.VIEWS;
        case 3:
            return SortProduct.CREATED_DATE;
        default:
            return SortProduct.NAME;            
    }
}

export async function add(req: Request, res: Response): Promise<Response> {
    if (req.params.authUser) {
        const authUser = JSON.parse(req.params.authUser) as User;
        try {
            const product = req.body as Product;
            product.owner = authUser._id;

            const newProduct = await productDao.add(product);
            return res.status(CREATED).json(newProduct);
        }
        catch(error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();

    }
}

export async function deleteById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const authUser = JSON.parse(req.params.authUser) as User;
    await productDao.deleteById(id, authUser._id);
    
    return res.status(OK).json();
}

export async function updateById(req: Request, res: Response) {
    const { id } = req.params;
    const authUser = JSON.parse(req.params.authUser) as User;

    await productDao.update(id, req.body, authUser._id);

    return res.status(OK).json();
}

export async function getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
        const result = await productDao.getById(id);
        return res.status(OK).json(result);
    }
    catch(error) {
        logger.err(error);
        return res.status(NOT_FOUND).json(error);
    }
}

export async function search(req: Request, res: Response): Promise<Response> {
    let limitQuery = DEFAULT_LIMIT_PRODUCTS_RENDER;
    let pageQuery = 1;
    const query: SearchProductCriteria = new SearchProductCriteria(limitQuery, pageQuery);

    try {
        const { limit, page, name, owner, priceFrom, priceTo, categories, sort = "1" } = req.query;
        if(limit) {
            query.limit = parseInt(limit as string);
        }
        if(page) {
            query.page = parseInt(page as string);
        }
        if(name) {
            query.name = name as string;
        }
        if(owner) {
            query.owner = owner as string;
        }
        if(priceFrom && priceTo) {
            query.priceFrom = parseFloat(priceFrom as string);
            query.priceTo = parseFloat(priceTo as string);
        }
        if(categories) {
            query.categories = String(categories).split(",").map(cate => cate.trim());
        }
        query.sort = toSortProduct(parseInt(sort as string));

        const result = await productDao.search(query);

        return res.status(OK).json(result);
    }
    catch(error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}