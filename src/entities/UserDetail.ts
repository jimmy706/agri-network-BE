import { User } from "./User";

export default interface UserDetail extends User {
    numberOfFollowers: number,
    numberOfFollowings: number
}

