import { Schema, model } from 'mongoose';


export enum InterestTypes {
    GROUP = 'GROUP',
    PRODUCT_CATEGORY = 'PRODUCT_CATEGORY'
}

export interface Interest {
    source: string;
    target: string;
    type: InterestTypes
}

export const InterestSchema = new Schema<Interest>({
    source: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    target: {
        type: Schema.Types.ObjectId,
        require: true
    }, 

});

const InterestModel = model<Interest>('Interest', InterestSchema);

export default InterestModel;