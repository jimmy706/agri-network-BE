import { Schema, model } from 'mongoose';

export interface Friend {
    owner: string;
    friends: string[];
}

export const FriendSchema = new Schema<Friend>({
    owner: {
        type: String,
        require: true,
        unique: true
    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }]
});

const FriendModel = model<Friend>('Friend', FriendSchema);

export default FriendModel;