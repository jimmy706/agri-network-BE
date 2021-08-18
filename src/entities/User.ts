import { Schema, model } from 'mongoose';

export enum UserType {
    SUPPLIER = 1,
    PRODUCER = 2,
    BUYER = 3
};

export interface User {
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
    group: string;
    phoneNumber: string;
}

export const UserSchema = new Schema<User>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    avatar: { type: String, require: false },
    email: { type: String, require: true },
    group: { type: String, require: false },
    phoneNumber: { type: String, require: true }
});

const UserModel = model<User>('User', UserSchema);

export default UserModel;
