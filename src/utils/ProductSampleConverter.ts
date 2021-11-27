import { Product } from "@entities/product/Product";
import { SampleProduct } from "@entities/product/SampleProduct";

class ProductSampleConverter {
    productSample: SampleProduct;

    constructor(productSample: SampleProduct) {
        this.productSample = productSample;
    }

    public toProduct(ownerId: string): Product {
        const product: any = {
            name: this.productSample.name,
            price: 0,
            categories: this.productSample.categories,
            quantity: this.productSample.quantity,
            quantityType: this.productSample.quantityType,
            owner: ownerId,
            thumbnails: this.productSample.thumbnails,
            isBroadCasted: true
        }

        return product;
    }
}