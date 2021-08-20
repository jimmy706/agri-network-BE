import logger from '@shared/Logger';
import FirebaseUser from 'src/@types/express/FireBaseUser';
import { firebaseAdminAuth } from '../config/firebase';


export interface IFirebaseDao {
    importUsers: (users: [FirebaseUser]) => Promise<any>
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

}

export default FirebaseDao;