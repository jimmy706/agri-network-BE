import PostTagModel, {PostTag} from "@entities/PostTag";

export class TagDao{

  async getPostTag(): Promise<PostTag[]>{
        const result = await PostTagModel.find().sort({"name":1});
        return result
    }
}
