import PostModel, { Post } from "@entities/Post";
import PostCommentModel, { Comment } from "@entities/PostComment";
import PostReactionModel from "@entities/PostReaction";
import { SimpleUser } from "@entities/User";
import { PaginateOptions, PaginateResult } from "mongoose";
import ErrorMessages from "src/constant/errors";
import UserDao from "./UserDao";

export const DEFAULT_LIMIT_POST = 6;

const userDao = new UserDao();

export default class PostDao {
    public async add(post: Post): Promise<Post> {
        const newPost = new PostModel(post);
        const savedPost = await newPost.save();

        const postReaction = new PostReactionModel({post: savedPost.id});
        await postReaction.save();

        const postComment = new PostCommentModel({post: savedPost.id});
        await postComment.save();
        
        return savedPost;
    }

    public async getById(postId: string, userId: string): Promise<any> {
        const post = await PostModel.findById(postId).orFail(new Error(ErrorMessages.POST_NOT_FOUND));

        const postReactions = await PostReactionModel.findOne({post: postId}).select({
            'reactions': 1,
            '_id': 0
        }).orFail(new Error(ErrorMessages.NOT_FOUND));
        
        const postComments = await PostCommentModel.findOne({post: postId}).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isLiked = postReactions.reactions.findIndex(r => r.owner == userId) > -1;

        return {
            post,
            reactionCount: postReactions.reactions.length,
            comments: postComments.comments,
            isLiked
        };
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
        const postReacts = await PostReactionModel.findOne({post: postId}).orFail(new Error(ErrorMessages.NOT_FOUND));
        const isLiked = postReacts.reactions.findIndex(r => r.owner == userId) > -1;
        if (!isLiked) {
            postReacts.reactions.push({owner: userId});
            await postReacts.save();
        }
        else {
            throw ErrorMessages.ACTION_DISMISS
        }
    }

    public async unlike(postId: string, userId: string): Promise<void> {
        const postReacts = await PostReactionModel.findOne({post: postId}).orFail(new Error(ErrorMessages.NOT_FOUND));

        const isLiked = postReacts.reactions.findIndex(r => r.owner == userId) > -1;

        if (isLiked) {
            postReacts.reactions = postReacts.reactions.filter(r => r.owner != userId);
            await postReacts.save();
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
            sort: { createdDate: 'desc' },
            populate: { path: 'postedBy', select: 'firstName lastName avatar' },
        }

        const posts: PaginateResult<Post> = await new Promise((resolve, reject) => {
            PostModel.paginate({ postedBy: userId }, paginateOptions, function (error, result) {
                if (error)
                    reject(error);
                else
                    resolve(result);
            });
        });

        return posts;
    }

    public async getPostCommentsCountAndInteractsCount(userId: string, postId: string): Promise<any> {

        const postComments = await PostCommentModel.findOne({post: postId}).orFail(new Error(ErrorMessages.NOT_FOUND));
        const postReactions = await PostReactionModel.findOne({post: postId}).orFail(new Error(ErrorMessages.NOT_FOUND));

        const result = {
            countComments: postComments.comments.length,
            countReactions: postReactions.reactions.length,
            isLiked: postReactions.reactions.findIndex(r => r.owner == userId) > -1
        };

        return result;   
    }

    public async getPosts(userId: string, page: number = 1, limit: number = DEFAULT_LIMIT_POST): Promise<PaginateResult<Post>> {
        const paginateOptions: PaginateOptions = {
            page,
            limit,
            select: 'lastModified format images _id content postedBy',
            sort: { createdDate: 'desc' },
            populate: { path: 'postedBy', select: 'firstName lastName avatar' },
        }

        const followers: SimpleUser[] = await userDao.getFollowers(userId);
        const followerIdsSet: Set<string> = new Set(followers.map(u => u.userId));
        followerIdsSet.add(userId);

        const followerIds: string[] = Array.from(followerIdsSet);

        const posts:PaginateResult<Post> = await new Promise((resolve, reject) => {
            PostModel.paginate({ postedBy: { 
                $in: followerIds
            } }, paginateOptions, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            })
        });

        return posts;
    }

    public async addComment(postId: string, comment: Comment): Promise<void> {
        await PostCommentModel.updateOne({post: postId}, {
            $push: { comments: comment }
        });
    }
}