import { Schema, model } from 'mongoose';

type FollowUser = {
    displayName: string;
    avatar: string | null | undefined;
    id: string;
}

export interface Follow {
    owner: any;
    followings: FollowUser[];
    followers: FollowUser[];
}

const FollowUser = new Schema<FollowUser>({
    displayName: {
        type: String,
        require: true
    },
    avatar: {
        type: String 
    },
    id: {
        type: String,
        require: true
    }
});

export const FollowSchema = new Schema<Follow>({
    owner: {
        type: String,
        require: true
    },
    followings: [FollowUser],
    followers: [FollowUser] 
});

const FollowModel = model<Follow>('Follow', FollowSchema);

export default FollowModel;