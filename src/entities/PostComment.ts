import { Schema, model } from 'mongoose';

export interface Comment {
    owner: string,
    content: string
}

export interface PostComment {
    post: string;
    comments: Comment[]
}

const CommentSchema = new Schema<Comment> ({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    content: {
        type: String,
        require: true
    }
});

export const PostCommentSchema = new Schema<PostComment>({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        require: true
    },
    comments: [CommentSchema]
});

const PostCommentModel = model<PostComment>('PostComment', PostCommentSchema);

export default PostCommentModel;