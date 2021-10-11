import { Schema, model } from 'mongoose';


export interface Interest {
    user: string;
    topic: string;
    viewDate: Date;
}

export const InterestSchema = new Schema<Interest>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    },
    topic: {
        type: String,
        require: true
    }, 
    viewDate: {
        type: Date,
        require: true,
        default: new Date()
    }
});

const InterestModel = model<Interest>('Interest', InterestSchema);

export default InterestModel;