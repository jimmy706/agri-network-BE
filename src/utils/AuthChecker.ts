import ResponseError from "@entities/ResponseError";
import { User, UserType } from "@entities/User";
import { Request } from "express";
import StatusCodes from 'http-status-codes';

const { UNAUTHORIZED, FORBIDDEN } = StatusCodes;

export default class AuthChecker {
    private static INSTANCE: AuthChecker;

    public static getInstance(): AuthChecker {
        if (!this.INSTANCE) {
            this.INSTANCE = new AuthChecker();
        }
        return this.INSTANCE;
    }

    public getCurrentLoginUser(req: Request): User {
        if (req.params.authUser) {
            const authUser = JSON.parse(req.params.authUser) as User;
            return authUser;
        }
        throw new ResponseError("", UNAUTHORIZED);
    }

    public rolesAllowed(roles: UserType[], currentUser: User): void {
        if (!roles.includes(currentUser.type)) {
            throw new ResponseError("", FORBIDDEN);
        }
    }
}