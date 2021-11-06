import ErrorMessages from "@constant/errors";
import PostModel, { Post } from "@entities/Post";
import PostCommentModel, { Comment } from "@entities/PostComment";
import PostReactionModel from "@entities/PostReaction";
import { User } from "@entities/User";
import { PaginateOptions, PaginateResult } from "mongoose";
import UserDao, { MAX_FRIENDS } from "./UserDao";


export const DEFAULT_LIMIT_POST = 6;

const userDao = new UserDao();

export default class PostDao {
    public async add(post: Post): Promise<Post> {
        const newPost = new PostModel(post);
        newPost.createdDate = new Date();
        const savedPost = await newPost.save();

        const postReaction = new PostReactionModel({ post: savedPost.id });
        await postReaction.save();

        const postComment = new PostCommentModel({ post: savedPost.id });
        await postComment.save();

        return savedPost;
    }

    public async getById(postId: string, userId: string): Promise<any> {
        const post: Post = await PostModel.findById(postId)
            .populate({ path: 'postedBy', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.POST_NOT_FOUND));

        const postReactions = await PostReactionModel.findOne({ post: postId })
            .select({
                'reactions': 1,
                '_id': 0
            })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        const postComments = await PostCommentModel
            .findOne({ post: postId })
            .populate({ path: 'comments.owner', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        const isLiked = postReactions.reactions.findIndex(r => r.owner == userId) > -1;

        return {
            isLiked,
            numberOfReactions: postReactions.reactions.length,
            numberOfComments: postComments.comments.length,
            comments: postComments.comments,
            ...post.toObject()
        };
    }

    public async remove(postId: string, userId: string): Promise<void> {
        const post: Post = await PostModel.findById(postId).orFail(new Error(ErrorMessages.NOT_FOUND));

        if (post.postedBy == userId) {            
            await PostCommentModel.findOneAndDelete({ post: postId }).orFail(new Error(ErrorMessages.NOT_FOUND));
            await PostReactionModel.deleteOne({ post: postId }).orFail(new Error(ErrorMessages.NOT_FOUND));
            await post.remove();
        }
        else {
            throw new Error(ErrorMessages.PERMISSTION_DENIED);
        }

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
        const postReacts = await PostReactionModel.findOne({ post: postId }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const isLiked = postReacts.reactions.findIndex(r => r.owner == userId) > -1;
        if (!isLiked) {
            postReacts.reactions.push({ owner: userId });
            await postReacts.save();
        }
        else {
            throw ErrorMessages.ACTION_DISMISS
        }
    }

    public async unlike(postId: string, userId: string): Promise<void> {
        const postReacts = await PostReactionModel.findOne({ post: postId }).orFail(new Error(ErrorMessages.NOT_FOUND));

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
            select: 'lastModified format images _id content postedBy tags attributes',
            sort: { createdDate: 'desc' },
            populate: { path: 'postedBy', select: 'firstName lastName avatar ' },
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

        const postComments = await PostCommentModel.findOne({ post: postId }).orFail(new Error(ErrorMessages.NOT_FOUND));
        const postReactions = await PostReactionModel.findOne({ post: postId }).orFail(new Error(ErrorMessages.NOT_FOUND));

        const result = {
            numberOfComments: postComments.comments.length,
            numberOfReactions: postReactions.reactions.length,
            isLiked: postReactions.reactions.findIndex(r => r.owner == userId) > -1
        };

        return result;
    }

    public async getPosts(userId: string, page: number = 1, limit: number = DEFAULT_LIMIT_POST): Promise<PaginateResult<Post>> {
        const paginateOptions: PaginateOptions = {
            page,
            limit,
            select: 'lastModified format images _id content postedBy tags attributes ref',
            sort: { createdDate: 'desc' },
            populate: { path: 'postedBy', select: 'firstName lastName avatar ' },
        }

        const followers: User[] = await userDao.getFollowings(userId, 1, MAX_FRIENDS);
        const followerIdsSet: Set<string> = new Set(followers.map(u => u._id));
        followerIdsSet.add(userId);

        const followerIds: string[] = Array.from(followerIdsSet);
        const posts: PaginateResult<Post> = await new Promise((resolve, reject) => {
            PostModel.paginate({
                postedBy: {
                    $in: followerIds
                },
                isPublic: true
            }, paginateOptions, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            })
        });

        return posts;
    }

    public async addComment(postId: string, comment: Comment): Promise<Comment> {
        const postComment = await PostCommentModel.findOne({ post: postId })
            .orFail(new Error(ErrorMessages.POST_NOT_FOUND));

        postComment.comments.push(comment);
        await postComment.save();

        const response = await PostCommentModel
            .findOne({ post: postId })
            .populate({ path: 'comments.owner', select: 'firstName lastName avatar' })
            .orFail(new Error(ErrorMessages.NOT_FOUND));

        const lastIndex = response.comments.length - 1;
        return response.comments[lastIndex];
    }


}
