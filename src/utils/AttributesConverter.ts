import Attribute from "@entities/Attribute";

export default class AttributeConverter {
    attributes: Attribute[];

    public constructor(attributes: Attribute[]) {
        this.attributes = attributes;
    }

    public toMap(): Map<string, string> {
        const result = new Map<string, string>();
        this.attributes.forEach(attr => {
            if (!result.has(attr.name)) {
                result.set(attr.name, attr.value);
            }
        })

        return result;
    }

    public static hasAttributesNeededForProductRecommendation(attributes: Map<string, string>): boolean {
        return attributes.has('name')
            && attributes.has('category')
            && attributes.has('priceFrom')
            && attributes.has('priceTo')
    }
}