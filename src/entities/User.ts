import { Schema, model } from 'mongoose';

export enum UserType {
    SUPPLIER = "Nhà cung cấp",
    PRODUCER = "Hộ sản xuất",
    BUYER = "Người thu mua"
};

export interface User {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    province: string;
    phoneNumber: string;
    type: UserType;
    _id: string;
}

export const UserSchema = new Schema<User>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String, require: false },
    email: { type: String, require: true, unique: true },
    province: { type: String, require: true },
    phoneNumber: { type: String, require: true },
    type: {
        type: String, enum: [
            UserType.PRODUCER,
            UserType.BUYER,
            UserType.SUPPLIER
        ], require: true, default: UserType.PRODUCER
    },
});

const UserModel = model<User>('User', UserSchema);

export default UserModel;
