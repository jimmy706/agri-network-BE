
import { Schema, model } from 'mongoose';


export class Province {
    name: string;
    areaCode: number;

    constructor(name:string, areaCode: number) {
        this.name = name;
        this.areaCode = areaCode;
    }
}

export const ProvinceSchema = new Schema<Province>({
    name: {
        type: String,
        require: true,
        unique: true
    },
    areaCode: {
        type: Number,
        require: true,
        unique: true
    }
});

const ProvinceModel = model<Province>('Province', ProvinceSchema);

export default ProvinceModel;