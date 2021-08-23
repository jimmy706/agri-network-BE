import { Schema, model } from 'mongoose';

export interface UserComment {
    displayName: string;
    avatar: string;
}

export interface Comment {
    owner: UserComment;
    content: string;
}

export const CommentSchema = new Schema<Comment>({
    owner: {
        displayName: String,
        avatar: String
    },
    content: {
        type: String,
        require: true
    }
});

const CommentModel = model<Comment>('Comment', CommentSchema);

export default CommentModel;