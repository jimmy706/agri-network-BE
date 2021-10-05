import { Location } from "@entities/Location";

export default class LocationHandler {
    private static INSTANCE: LocationHandler;

    private constructor() {

    }

    public static getInstance(): LocationHandler {
        if(!this.INSTANCE) {
            this.INSTANCE = new LocationHandler();
        }

        return this.INSTANCE;
    }

    /**
     * Get distance between 2 locations
     * @param from the location start
     * @param to the location end
     * @returns the distance between 2 lat,lng point in km
     */
    public getDistance(from: Location, to: Location): number {
        let distance = 0;
        let radius = 6371; // Radius of the earth in km
        let dLat = this.deg2rad(to.lat - from.lat);
        let dLon = this.deg2rad(to.lng - from.lng);
        let a =
            Math.pow(Math.sin(dLat / 2), 2) +
            Math.cos(this.deg2rad(from.lat)) * Math.cos(this.deg2rad(to.lat)) *
            Math.pow(Math.sin(dLon / 2), 2);

        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = radius * c; // Distance in km
        return distance;
    }

    public isLocationValid(location: Location): boolean {
        if(location) {
            const lat = location.lat;
            const lng = location.lng;

            return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
        }
        return false;
    }

    private deg2rad(deg: number) {
        return deg * (Math.PI / 180)
    }
}