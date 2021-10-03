import { Schema } from "mongoose";

export class Location{
    lat: number;
    lng: number;

    constructor(lat: number, lng: number) {
        this.lat = lat;
        this.lng = lng;
    }
}

export const LocationSchema = new Schema<Location>({
    lat: {
        type: Number,
        require: true,
        default: -1,
    },
    lng: {
        type: Number,
        require: true,
        default: -1
    }
});