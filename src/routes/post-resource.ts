import PostDao from "@daos/PostDao";
import { Post } from "@entities/Post";
import { Request, Response } from 'express';
import StatusCodes from 'http-status-codes';

interface AddNewPostRequest extends Request {
    body: Post
}

const { BAD_REQUEST, CREATED, UNAUTHORIZED } = StatusCodes;


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