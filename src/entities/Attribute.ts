import { Schema } from 'mongoose';


export default interface Attribute {
    name: string;
    value: string;
}

export const AttributeSchema = new Schema<Attribute> ({
    name: {
        type: String,
        require: true
    },
    value: {
        type: String,
        require: true
    }
});