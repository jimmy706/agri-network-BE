import { Schema, model } from 'mongoose';

export interface Group {
    name: String;
    groupCode: number;
}

export const GroupSchema = new Schema<Group>({
    name: { type: String, require: true, unique: true },
    groupCode: { type: String, require: true, unique: true }
});

const GroupModel = model<Group>('Group', GroupSchema);

export default GroupModel;