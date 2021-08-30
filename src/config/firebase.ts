import admin from 'firebase-admin';

const defaultPatthCredentialPath = 'firebase-admin-cre.json';


const serviceAccount = process.env.MY_GOOGLE_APPLICATION_CREDENTIAL_PATH || defaultPatthCredentialPath;
const firebaseAdminApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


export const firebaseAdminAuth = firebaseAdminApp.auth();