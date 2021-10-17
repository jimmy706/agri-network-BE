import { Schema, model } from 'mongoose';
import Attribute, { AttributeSchema } from './Attribute';


export enum Topics {
    PRODUCT_REQUEST = 'Nhu cầu mua hàng'
}

export interface Interest {
    user: string;
    topic: Topics;
    createdDate: Date;
    attrinutes: Attribute[]
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
    attrinutes: [AttributeSchema]
});

const InterestModel = model<Interest>('Interest', InterestSchema);

export default InterestModel;