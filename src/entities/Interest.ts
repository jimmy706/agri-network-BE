import { Schema, model } from 'mongoose';


export interface Interest {
    source: String;
    target: String;
}

export const InterestSchema = new Schema<Interest>({
    source: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    target: {
        type: Schema.Types.ObjectId,
        ref: 'ProductCategory',
        require: true
    }, 
});

const InterestModel = model<Interest>('Interest', InterestSchema);

export default InterestModel;