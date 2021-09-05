import PostModel, { Post } from "@entities/Post";
import UserModel from "@entities/User";
import { PaginateOptions, PaginateResult } from "mongoose";
import ErrorMessages from "src/constant/errors";
import mongoose from 'mongoose';

export const DEFAULT_LIMIT_POST = 6;

export default class PostDao {
    public async add(post: Post): Promise<Post> {
        const newPost = new PostModel(post);
        const savedPost = await newPost.save();

        return savedPost;
    }

    public async getById(postId: string): Promise<Post> {
        const post = await PostModel.findById(postId).orFail(new Error(ErrorMessages.POST_NOT_FOUND));

        return post;
    }

    public async remove(postId: string): Promise<void> {
        await PostModel.findByIdAndRemove(postId).orFail(new Error(ErrorMessages.POST_NOT_FOUND));
    }

    public async update(post: Post, postId: string): Promise<Post> {
        const result = await PostModel.findByIdAndUpdate(postId, {
            content: post.content,
            images: post.images,
            ref: post.ref,
            format: post.format
        }).orFail(new Error(ErrorMessages.POST_NOT_FOUND));

        return result;
    }

    public async like(postId: string, userId: string): Promise<void> {
        const post = await PostModel.findById(postId).orFail(new Error(ErrorMessages.POST_NOT_FOUND));
        const user = await UserModel.findById(userId).orFail(new Error(ErrorMessages.USER_NOT_FOUND));

        const isLiked = post.reactions.findIndex(r => r.userId == userId) > -1;
        if (!isLiked) {
            post.reactions.push({
                displayName: `${user.firstName} ${user.lastName}`,
                userId: user._id,
                avatar: user.avatar
            });
            await post.save();
        }
        else {
            throw ErrorMessages.ACTION_DISMISS
        }
    }

    public async unlike(postId: string, userId: string): Promise<void> {
        const post = await PostModel.findById(postId).orFail(new Error(ErrorMessages.POST_NOT_FOUND));

        const isLiked = post.reactions.findIndex(r => r.userId == userId) > -1;

        if (isLiked) {
            post.reactions = post.reactions.filter(r => r.userId != userId);
            await post.save();
        }
        else {
            throw ErrorMessages.ACTION_DISMISS
        }
    }

    public async getPostFromUser(userId: string, page: number = 1, limit: number = DEFAULT_LIMIT_POST): Promise<PaginateResult<Post>> {
        const paginateOptions: PaginateOptions = {
            page, 
            limit,
            select: 'lastModified format images _id content postedBy',
            sort: {createdDate: 'desc'},
            populate: {path: 'postedBy', select: 'firstName lastName avatar'},           
        }

        const posts: PaginateResult<Post> = await new Promise((resolve, reject) => {
            PostModel.paginate({postedBy: userId}, paginateOptions,function(error, result) {
                if(error)
                    reject(error);
                else
                    resolve(result);
            });
        });

        return posts;
    }

    public async getPostCommentsCountAndInteractsCount(postId: string): Promise<any> {
        console.log(postId);
        const result = await PostModel.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(postId) }
            },
            {
                $project: {
                    numberOfReactions: {$size: "$reactions"},
                    numberOfComments: {$size: "$comments"}
                }
            }
        ]);

        return result;
    }
}