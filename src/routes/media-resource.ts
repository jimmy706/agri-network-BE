import MediaDao, { UploadMediaParams } from "@daos/MediaDao";
import logger from "@shared/Logger";
import { Request, Response, NextFunction } from 'express';
import StatusCodes from 'http-status-codes';
const formidable = require('formidable');

const { BAD_REQUEST, CREATED } = StatusCodes;

const mediaDao = new MediaDao();

export async function parseFormData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const form = formidable({ multiples: false });

        const parseFormDataResult:any = await new Promise((resolve, reject) => {
            form.parse(req, (err: any, fields: any, file: any) => {
    
                if (err)
                    reject(err)
                else
                    resolve({ fields, file });
            });
        });
        req.body = {...parseFormDataResult.fields, ...parseFormDataResult.file};
        next();
    }
    catch(error) {
        next(error);
    }
}

export async function uploadImage(req: Request, res: Response): Promise<Response> {
    try {
        const result = await mediaDao.uploadImage(req.body);
        const resourceUrl: string = result.data.url;
        return res.setHeader('location', resourceUrl).status(CREATED).send(resourceUrl);
    }
    catch(error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}