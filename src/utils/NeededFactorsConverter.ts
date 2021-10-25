import { Needed } from "@entities/PlanDetail";
import Attribute from '@entities/Attribute';

export default class NeededFactorsConverter {
    neededFactor: Needed;

    constructor(neededFactor: Needed) {
        this.neededFactor = neededFactor;
    }

    public toAttributes(): Attribute[] {
        const attributes: Attribute[] = [];
        attributes.push({
            name: 'name',
            value: this.neededFactor.name
        });
        attributes.push({
            name: 'category',
            value: this.neededFactor.categories[0] || ''
        });
        if (this.isPriceRangeValid(this.neededFactor.priceRange)) {
            attributes.push({
                name: 'priceFrom',
                value: String(this.neededFactor.priceRange[0])
            });
            attributes.push({
                name: 'priceTo',
                value: String(this.neededFactor.priceRange[1])
            })
        }

        return attributes;
    }

    private isPriceRangeValid(priceRange: number[]) {
        if (!priceRange) {
            return false;
        }
        if (priceRange.length != 2) {
            return false;
        }
        return priceRange[0] < priceRange[1];
    }
}