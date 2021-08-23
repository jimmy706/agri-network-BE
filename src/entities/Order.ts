import { Schema, model } from 'mongoose';



export interface OrderDetail {
    quantity: Number;
    product:  {
        name: string;
        thumbnail: string;
        price: number;
    };
}

export interface Order {
    createdDate: Date;
    buyer: string;
    orderDetails: OrderDetail[]
}

export const OrderSchema = new Schema<Order>({
    createdDate: {
        type: Date,
        default: new Date(),
        require: true
    },
    buyer: {
        type: Schema.Types.ObjectId,
        require: true,
        ref: 'User'
    },
    orderDetails: [
        {
            quantity: Number,
            product:  {
                name: String,
                thumbnail: String,
                price: Number,
            }
        }
    ]
});

const OrderModel = model<Order>('Order', OrderSchema);
export default OrderModel;