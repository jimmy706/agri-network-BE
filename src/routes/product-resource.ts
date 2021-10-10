import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import ProductDao from '@daos/ProductDao';

const { OK, CREATED, NOT_FOUND, UNAUTHORIZED } = StatusCodes;

const productDao = new ProductDao();

export function search(req: Request, res: Response): Response {
    return res.status(OK).json();
}