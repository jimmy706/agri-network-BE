import { Schema, model } from 'mongoose';

export interface FriendRequest {
    from: string;
    to: string;
    message: string;
    createdDate: Date;
}

export const FriendRequestSchema = new Schema<FriendRequest>({
    from: {
        type: Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    to: {
        type: Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    message: {
        type: String
    },
    createdDate: {
        type: Date,
        require: true
    }
});

const FriendRequestModel = model<FriendRequest>('FriendRequest', FriendRequestSchema);

export default FriendRequestModel;