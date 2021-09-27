import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';
import {PostTag} from "@entities/PostTag";
import {TagDao} from '@daos/TagDao';
const { OK } = StatusCodes;

const tagDao = new TagDao();

export async function getPostTag(req: Request, res: Response): Promise<Response>{

    const postTag: PostTag[] = await tagDao.getPostTag();
    return   res.status(OK).json(postTag);
   
}
