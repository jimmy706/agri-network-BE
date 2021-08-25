import logger from '@shared/Logger';
import { auth } from 'firebase-admin';
import FirebaseUser from 'src/@types/express/FireBaseUser';
import { firebaseAdminAuth } from '../config/firebase';


export interface IFirebaseDao {
    importUsers: (users: [FirebaseUser]) => Promise<any>;
    verifyIdToken: (idToken: string) => Promise<auth.DecodedIdToken>;
}

class FirebaseDao implements IFirebaseDao {
    public async importUsers(users: [FirebaseUser]) {
        try {
            const result = await firebaseAdminAuth.importUsers(users, {
                hash: {
                    algorithm: 'BCRYPT',
                }
            });
            return result;
        }
        catch (error) {
            throw new Error(error);
        }
    }

    public async verifyIdToken(idToken: string): Promise<auth.DecodedIdToken> {
        try {
            const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);

            return decodedToken;
        }
        catch(error){
            throw new Error(error);
        }
    }

}

export default FirebaseDao;