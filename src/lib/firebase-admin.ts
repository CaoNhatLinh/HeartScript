import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getDatabase } from 'firebase-admin/database';
import { getAuth } from 'firebase-admin/auth';

const firebaseAdminConfig = {
    credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
};

export function getAdminApp() {
    if (getApps().length === 0) {
        return initializeApp(firebaseAdminConfig);
    }
    return getApp();
}

export const adminDb = getFirestore(getAdminApp());
export const adminRtdb = getDatabase(getAdminApp());
export const adminAuth = getAuth(getAdminApp());
