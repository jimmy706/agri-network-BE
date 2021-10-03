import { Schema, model } from 'mongoose';
import { Location, LocationSchema } from './Location';

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
    district: string;
    ward: string;
    phoneNumber: string;
    type: UserType;
    _id: string;
    isFollowed?: boolean;
    isFriend?: boolean;
    location: Location
}

export interface RecommendUser extends User {
    pendingFriendRequest: boolean;
}

export type SimpleUser = {
    displayName: string;
    avatar: string | null | undefined;
    userId: string;
}

export const UserSchema = new Schema<User>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String, require: false },
    email: { type: String, require: true, unique: true },
    province: { type: String, require: true },
    district: { type: String, require: true, default: "" },
    ward: { type: String, require: true, default: "" },
    phoneNumber: { type: String, require: true },
    type: {
        type: String, enum: [
            UserType.PRODUCER,
            UserType.BUYER,
            UserType.SUPPLIER
        ], require: true, default: UserType.PRODUCER
    },
    location: LocationSchema
});

const UserModel = model<User>('User', UserSchema);

export default UserModel;
