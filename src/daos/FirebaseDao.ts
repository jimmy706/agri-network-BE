import { auth } from 'firebase-admin';
import FirebaseUser from '@entities/FireBaseUser';
import { firebaseAdminAuth, firebaseMessaging } from '@config/firebase';
import FirebaseNotificationMessageTopic from 'src/@types/express/FirebaseMessage';
import logger from '@shared/Logger';

export interface IFirebaseDao {
    importUsers: (users: [FirebaseUser]) => Promise<any>;
    verifyIdToken: (idToken: string) => Promise<auth.DecodedIdToken>;
    sendPushMessageToTopic: (pushNotificationMessage: FirebaseNotificationMessageTopic) => Promise<void>
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
            logger.err(error);
            throw error;
        }
    }

    public async verifyIdToken(idToken: string): Promise<auth.DecodedIdToken> {
        try {
            const decodedToken = await firebaseAdminAuth.verifyIdToken(idToken);

            return decodedToken;
        }
        catch(error){
            logger.err(error);
            throw error;
        }
    }

    public async createTokenFromUid(uid: string): Promise<string> {
        const result = await firebaseAdminAuth.createCustomToken(uid);
        return result        
    }

    public async sendPushMessageToTopic(pushNotificationMessage: FirebaseNotificationMessageTopic): Promise<void> {
        try {
            const sendNotificationResult = await firebaseMessaging.send(pushNotificationMessage);
            logger.info(sendNotificationResult);
        }
        catch(error) {
            logger.err(error);
            throw error;
        }
    }
}

export default FirebaseDao;