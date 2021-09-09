import { Document, model, PaginateModel, Schema } from 'mongoose';

const mongoosePaginate = require('mongoose-paginate-v2');

export enum PostFormat {
    REGULAR = 'REGULAR',
    SELL= 'SELL',
    PLAN = 'PLAN'
}

export interface Post extends Document{
    content: string;
    postedBy: string;
    createdDate: Date;
    lastModified: Date;
    format: PostFormat;
    ref: any;
    images: string[];
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
    createdDate: {
        require: true,
        type: Date,
        default: new Date()
    },
    lastModified: {
        require: true,
        default: new Date(),
        type: Date
    },
    format: {
        require: true,
        default: PostFormat.REGULAR,
        type: String,
        enum: [
            PostFormat.REGULAR,
            PostFormat.PLAN,
            PostFormat.SELL
        ]
    },
    ref: {
        require: false,
        type: Schema.Types.Mixed
    },
    images: [String]
});

PostSchema.plugin(mongoosePaginate);

interface PostModelInf<T extends Document> extends PaginateModel<T> {}

const PostModel = model<Post>('Post', PostSchema) as PostModelInf<Post>;

export default PostModel;