import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import ProductDao, { DEFAULT_LIMIT_PRODUCTS_RENDER, SearchProductCriteria, SortProduct } from '@daos/ProductDao';
import logger from '@shared/Logger';
import { User } from '@entities/User';
import { Product } from '@entities/product/Product';
import PostDao from '@daos/PostDao';
import { PostFormat } from '@entities/Post';
import Attribute from '@entities/Attribute';
import AuthChecker from '@utils/AuthChecker';
import ProductSampleConverter from '@utils/ProductSampleConverter';

const { OK, CREATED, NOT_FOUND, BAD_REQUEST, } = StatusCodes;

const productDao = new ProductDao();
const postDao = new PostDao();

function toSortProduct(n: number) {
    switch (n) {
        case 1:
            return SortProduct.NAME;
        case 2:
            return SortProduct.VIEWS;
        case 3:
            return SortProduct.CREATED_DATE;
        case 4:
            return SortProduct.PRICE;    
        default:
            return SortProduct.NAME;
    }
}

export async function add(req: Request, res: Response): Promise<Response> {
    const authUser = JSON.parse(req.params.authUser) as User;
    const product = req.body as Product;
    product.owner = authUser._id;
    const newProduct = await productDao.add(product);

    if (product.isBroadCasted) {
        broadCastProduct(newProduct, authUser);
    }
    return res.status(CREATED).json(newProduct);
}

export async function addFromSample(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    const authUser = AuthChecker.getInstance().getCurrentLoginUser(req);
    const sampleProduct = await productDao.getSampleById(id);
    const converter = new ProductSampleConverter(sampleProduct);

    const newProduct = converter.toProduct(authUser._id);
    const result = await productDao.add(newProduct);
    return res.status(CREATED).json(result);
}

async function broadCastProduct(newProduct: Product, authUser: User) {
    const categories = newProduct.categories as any[];
    const attributes: Attribute[] = [];
    attributes.push({ name: 'name', value: newProduct.name });
    attributes.push({ name: 'price', value: String(newProduct.price) });
    if (newProduct.thumbnails.length > 0) {
        attributes.push({ name: 'thumbnail', value: newProduct.thumbnails[0] });
    }

    const newPost = {
        content: `${authUser.lastName} vừa đăng một sản phẩm mới`,
        images: [],
        tags: categories.map(cate => cate.name),
        format: PostFormat.SELL,
        ref: newProduct._id,
        postedBy: authUser._id,
        attributes
    } as any;
    await postDao.add(newPost);
}

export async function addFromPlan(req: Request, res: Response): Promise<Response> {
    const authUser = JSON.parse(req.params.authUser) as User;

    const { planId } = req.params;
    const product = req.body as Product;
    product.owner = authUser._id;

    const newProduct = await productDao.addFromPlan(planId, product);

    if (product.isBroadCasted) {
        broadCastProduct(newProduct, authUser);
    }
    return res.status(CREATED).json(newProduct);
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
    catch (error) {
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
        if (limit) {
            query.limit = parseInt(limit as string);
        }
        if (page) {
            query.page = parseInt(page as string);
        }
        if (name) {
            query.name = name as string;
        }
        if (owner) {
            query.owner = owner as string;
        }
        if (priceFrom && priceTo) {
            query.priceFrom = parseFloat(priceFrom as string);
            query.priceTo = parseFloat(priceTo as string);
        }
        if (categories) {
            query.categories = String(categories).split(",").map(cate => cate.trim());
        }
        query.sort = toSortProduct(parseInt(sort as string));

        const result = await productDao.search(query);

        return res.status(OK).json(result);
    }
    catch (error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}

export async function addSample(req: Request, res: Response): Promise<Response> {
    const newSample = await productDao.addSample(req.body);
    return res.status(OK).json(newSample);
}

export async function getSamples(req: Request, res: Response) {
    const samples = await productDao.getSamples();
    return res.status(OK).json(samples);
}