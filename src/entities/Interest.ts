import { Schema, model, PaginateModel, Document } from 'mongoose';
import Attribute, { AttributeSchema } from './Attribute';
const mongoosePaginate = require('mongoose-paginate-v2');

export enum Topics {
    PRODUCT_REQUEST = 'Nhu cầu mua hàng'
}

export interface Interest extends Document {
    user: string;
    topic: Topics;
    createdDate: Date;
    attributes: Attribute[]
}

export const InterestSchema = new Schema<Interest>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    topic: {
        type: String,
        require: true,
        default: Topics.PRODUCT_REQUEST,
        enum: [
            Topics.PRODUCT_REQUEST
        ]
    }, 
    createdDate: {
        type: Date,
        require: true,
        default: new Date()
    },
    attributes: [AttributeSchema]
});
InterestSchema.plugin(mongoosePaginate);

interface InterestModelInf<T extends Document> extends PaginateModel<T> {};

const InterestModel = model<Interest>('Interest', InterestSchema) as InterestModelInf<Interest>;

export default InterestModel;