import { Schema, model } from 'mongoose';

export interface Group {
    name: String;
}

export const GroupSchema = new Schema<Group>({
    name: { type: String, require: true, unique: true },
});

const GroupModel = model<Group>('Group', GroupSchema);

export default GroupModel;