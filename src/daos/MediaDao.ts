import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';
export interface UploadMediaParams {
    key: string;
    image: any;
    name?:string;
}

export interface UploadMediaSuccessResponse {
    data: {
        id: string;
        title: string;
        url: string;
        medium: {
            url: string;
        }
    };
    success: boolean;
    status: number;
}

const UPLOAD_MEDIA_URL = process.env.UPLOAD_MEDIA_URL || `https://api.imgbb.com/1/upload`;

export default class MediaDao {
    public async uploadImage(params: UploadMediaParams):Promise<UploadMediaSuccessResponse> {
        const form = new FormData();
        form.append('key',params.key);
        form.append('image', fs.createReadStream(params.image.path));
        const result: any = await axios.post(UPLOAD_MEDIA_URL, form, {
            headers: {
                ...form.getHeaders()
            }
        });
        return result.data;
    }
}