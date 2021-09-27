import { auth } from 'firebase-admin';
import FirebaseUser from '@entities/FireBaseUser';
import { firebaseAdminAuth, firebaseMessaging } from '@config/firebase';
import logger from '@shared/Logger';
import { FirebsaeMessage } from 'src/@types/express/FirebaseMessage';

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

    public async sendPushMessageToTopic(topic: string, messageData: FirebsaeMessage): Promise<void> {
        try {
            const sendNotificationResult = await firebaseMessaging.sendToTopic(topic, {
                data: messageData
            })
            logger.info(sendNotificationResult);
        }
        catch(error) {
            logger.err(error);
            throw error;
        }
    }
}

export default FirebaseDao;