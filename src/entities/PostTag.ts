import { Schema, model } from 'mongoose';

export class PostTag {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
}

export const PostTagSchema = new Schema<PostTag>({
    name: {
        type: String,
        unique: true,
        require: true
    }
    
});

const PostTagModel = model<PostTag>('PostTag', PostTagSchema);
export default PostTagModel;
