import { model, Schema } from 'mongoose';
import { User } from './User';


export interface Follow {
    owner: string;
    followings: string[];
    followers: string[];
}

export type FollowResponse = {
    owner: string;
    followings: User[],
    followers: User[]
};

export const FollowSchema = new Schema<Follow>({
    owner: {
        type: String,
        require: true,
        unique: true
    },
    followings: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true
    }],
    followers: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        unique: true
    }] 
});

const FollowModel = model<Follow>('Follow', FollowSchema);

export default FollowModel;