import PostDao, { DEFAULT_LIMIT_POST } from "@daos/PostDao";
import { Post } from "@entities/Post";
import { Comment } from "@entities/PostComment";
import { User } from "@entities/User";
import logger from "@shared/Logger";
import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';
import SuccessMessages from "@constant/success";


interface AddNewPostRequest extends Request {
    body: Post
}

const { BAD_REQUEST, CREATED, UNAUTHORIZED, OK, NOT_FOUND } = StatusCodes;


const postDao = new PostDao();


export async function add(req: AddNewPostRequest, res: Response): Promise<Response> {
    if (req.params.authUser) {
        const authUser = JSON.parse(req.params.authUser);

        try {
            const post = req.body;
            post.postedBy = authUser._id;
            const newPost = await postDao.add(post);

            return res.status(CREATED).json(newPost);
        }
        catch (error) {
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function getByUser(req: Request, res: Response): Promise<Response> {
    const { owner } = req.params;
    const authUser: User = JSON.parse(req.params.authUser);

    let page = 1;
    let limit = DEFAULT_LIMIT_POST;
    if (req.query.page && req.query.limit) {
        page = typeof req.query.page == 'string' ? Number.parseInt(req.query.page) : 1;
        limit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit) : DEFAULT_LIMIT_POST;
    }

    try {
        const result = await postDao.getPostFromUser(owner, page, limit);
        const resultCopy: any = JSON.parse(JSON.stringify(result));
        const mapCountLikeAndReaction = await Promise.all(result.docs.map(p => {
            return postDao.getPostCommentsCountAndInteractsCount(authUser._id, p.id);
        }));
        resultCopy.docs = resultCopy.docs.map((p: Post, i: number) => {
            return { ...p, ...mapCountLikeAndReaction[i] };
        });
        return res.status(OK).json(resultCopy);
    }
    catch (error) {
        logger.err(error);
        return res.status(BAD_REQUEST).json(error);
    }
}

export async function get(req: Request, res: Response): Promise<Response> {
    let page = 1;
    let limit = DEFAULT_LIMIT_POST;
    if (req.params.authUser) {
        const authUser: User = JSON.parse(req.params.authUser);
        if (req.query.page && req.query.limit) {
            page = typeof req.query.page == 'string' ? Number.parseInt(req.query.page) : 1;
            limit = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit) : DEFAULT_LIMIT_POST;
        }
        try {
            const result = await postDao.getPosts(authUser._id, page, limit);
            const resultCopy: any = JSON.parse(JSON.stringify(result));
            const mapCountLikeAndReaction = await Promise.all(result.docs.map(p => {
                return postDao.getPostCommentsCountAndInteractsCount(authUser._id, p.id);
            }));

            resultCopy.docs = resultCopy.docs.map((p: Post, i: number) => {
                return { ...p, ...mapCountLikeAndReaction[i] };
            });
            return res.status(OK).json(resultCopy);
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function getCountOfCommentsAndReactions(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser: User = JSON.parse(req.params.authUser);
            const result = await postDao.getPostCommentsCountAndInteractsCount(authUser._id, id);

            return res.status(OK).json(result);
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function remove(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser: User = JSON.parse(req.params.authUser);

            await postDao.remove(id, authUser._id);
            return res.status(OK).json(SuccessMessages.POST_DELETED);
        }
        catch (error) {
            logger.err(error);
            return res.status(NOT_FOUND).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function getById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        const authUser: User = JSON.parse(req.params.authUser);

        try {
            const result = await postDao.getById(id, authUser._id);
            return res.status(OK).json(result);
        }
        catch (error) {
            logger.err(error);
            return res.status(NOT_FOUND).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function like(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser: User = JSON.parse(req.params.authUser);

            await postDao.like(id, authUser._id);
            return res.status(OK).json();
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function unlike(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        try {
            const authUser: User = JSON.parse(req.params.authUser);

            await postDao.unlike(id, authUser._id);
            return res.status(OK).json();
        }
        catch (error) {
            logger.err(error);
            return res.status(BAD_REQUEST).json(error);
        }
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}

export async function addComment(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;
    if (req.params.authUser) {
        const authUser: User = JSON.parse(req.params.authUser);
        const { content } = req.body;
        const comment: Comment = {
            content,
            owner: authUser._id
        };
        const result = await postDao.addComment(id, comment);

        return res.status(OK).json(result);
    }
    else {
        return res.status(UNAUTHORIZED).json();
    }
}



