import ProvinceModel, { Province } from "@entities/Province";

export class ProvinceDao {
    async getAll(): Promise<Province[]> {
        const result = ProvinceModel.find().select({"name": 1, "areaCode": 1, "_id": 0, });
        
        return result;
    }
}