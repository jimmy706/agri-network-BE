import { Schema, model } from 'mongoose';
import { SimpleUser } from './User';


export interface Follow {
    owner: any;
    followings: SimpleUser[];
    followers: SimpleUser[];
}

const FollowUserSchema = new Schema<SimpleUser>({
    displayName: {
        type: String,
        require: true
    },
    avatar: {
        type: String 
    },
    userId: {
        type: String,
        require: true
    }
});

export const FollowSchema = new Schema<Follow>({
    owner: {
        type: String,
        require: true
    },
    followings: [FollowUserSchema],
    followers: [FollowUserSchema] 
});

const FollowModel = model<Follow>('Follow', FollowSchema);

export default FollowModel;