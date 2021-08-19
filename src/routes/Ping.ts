import StatusCodes from 'http-status-codes';
import { Request, Response } from 'express';

const { OK } = StatusCodes;

export async function ping(req: Request, res: Response) {
    return res.status((OK)).json({
        message: "Success!!"
    });
}