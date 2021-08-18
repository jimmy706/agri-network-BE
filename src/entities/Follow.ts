import { Schema, model } from 'mongoose';

export interface Follow {
    owner: string;
    following: string[];
    follower: string[];
}

export const FollowSchema = new Schema<Follow>({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    following: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
    follower: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'User'
        }]
    },
});

const FollowModel = model<Follow>('Follow', FollowSchema);

export default FollowModel;