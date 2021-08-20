 export default interface FirebaseUser {
    uid: string;
    displayName: string;
    email: string;
    photoURL?:string;
    passwordHash: Buffer;
    phoneNumber: string;

}

