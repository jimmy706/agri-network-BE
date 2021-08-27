import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import { ProvinceDao } from '@daos/ProvinceDao';
const { OK } = StatusCodes;

const provinceDao = new ProvinceDao();

export async function getAll(req: Request, res: Response):Promise<Response> {
    const result = await provinceDao.getAll();

    return res.status(OK).json(result);
}