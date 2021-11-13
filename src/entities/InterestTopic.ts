import { User } from "./User";

export default interface InterestTopic {
    name: string;
    user: User;
    createdDate: Date;
    distance?:number;
}