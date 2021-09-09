import { Schema, model } from 'mongoose';

export interface Reaction {
    owner: string
}

export const ReactionSchema = new Schema<Reaction> ({
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        require: true
    }
});

export interface PostReaction {
    post: string,
    reactions: Reaction[]
}

export const PostReactionSchema = new Schema<PostReaction>({
    post: {
        type: Schema.Types.ObjectId,
        ref: 'Post',
        require: true
    },
    reactions: [ReactionSchema]
});

const PostReactionModel = model<PostReaction>('PostReaction', PostReactionSchema);

export default PostReactionModel;