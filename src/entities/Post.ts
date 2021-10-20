import { Document, model, PaginateModel, Schema } from 'mongoose';
import Attribute, { AttributeSchema } from './Attribute';

const mongoosePaginate = require('mongoose-paginate-v2');

export enum PostFormat {
    REGULAR = 'REGULAR',
    SELL = 'SELL',
    PLAN = 'PLAN',
    INTEREST_REQUEST = 'INTEREST_REQUEST'
}

export interface Post extends Document {
    content: string;
    postedBy: string;
    createdDate: Date;
    lastModified: Date;
    format: PostFormat;
    ref?: string;
    images: string[];
    tags: string[];
    attributes?: Attribute[];
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
            PostFormat.SELL,
            PostFormat.INTEREST_REQUEST
        ]
    },
    ref: {
        require: false,
        type: String
    },
    attributes: {
        type: [AttributeSchema],
        require: false
    },
    images: [String],
    tags: [String]
});

PostSchema.plugin(mongoosePaginate);

interface PostModelInf<T extends Document> extends PaginateModel<T> { }

const PostModel = model<Post>('Post', PostSchema) as PostModelInf<Post>;

export default PostModel;