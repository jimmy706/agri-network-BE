import PostModel, { Post } from "@entities/Post";
import UserModel from "@entities/User";
import ErrorMessages from "src/constant/errors";

export default class PostDao {
    public async add(post: Post): Promise<Post> {
        const newPost = new PostModel(post);
        const savedPost = await newPost.save();

        return savedPost;
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

    public async getPostFromUser(userId: string): Promise<Post[]> {
        const posts = await PostModel.find({ postedBy: userId });

        return posts;
    }
}