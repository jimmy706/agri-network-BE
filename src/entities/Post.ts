import { model, Schema } from 'mongoose';
import { Comment, CommentSchema } from './Comment';

export enum PostFormat {
    REGULAR = 'REGULAR',
    SELL= 'SELL',
    PLAN = 'PLAN'
}

export interface Post {
    content: string;
    postedBy: string;
    reactions: string[];
    lastModified: Date;
    format: PostFormat;
    ref: any;
    comments: Comment[]
}

export const PostSchema = new Schema<Post>({
    content: {
        type: String,
        require: true,
    },
    postedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    reactions: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    lastModified: {
        require: true,
        default: new Date(),
        type: Date
    },
    format: {
        require: true,
        default: PostFormat.REGULAR,
    },
    ref: {
        require: false,
        type: Schema.Types.Mixed
    },
    comments: [CommentSchema]
});

const PostModel = model<Post>('Post', PostSchema);

export default PostModel;