import Attribute from "@entities/Attribute";

export default class AttributeConverter {
    attributes: Attribute[];

    public constructor(attributes: Attribute[]) {
        this.attributes = attributes;
    }

    public toMap(): Map<string, string> {
        const result = new Map<string, string>();
        this.attributes.forEach(attr => {
            result.set(attr.name, attr.value);
        })

        return result;
    }
}