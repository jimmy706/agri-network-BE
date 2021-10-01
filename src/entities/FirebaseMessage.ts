export enum FirebaseMessageTypes {
    DEFAULT = "DEFAULT",
    FRIEND_REQUEST = "FRIEND_REQUEST",
    POST_ACTION = "POST_ACTION"
}

export type FirebsaeMessage = {
    title: string,
    message: string,
    fromUser: string,
    toUser: string,
    type: FirebaseMessageTypes,
}