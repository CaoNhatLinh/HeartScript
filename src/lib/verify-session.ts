import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ALLOWED_EMAILS, FIREBASE_PROJECT_ID } from './constants';

export async function verifySessionToken(token: string | undefined) {
    if (!token) return null;
    try {
        const appName = 'heartscript-token-verifier';
        const app = getApps().find(current => current.name === appName)
            ?? initializeApp({ projectId: FIREBASE_PROJECT_ID }, appName);
        const user = await getAuth(app).verifyIdToken(token);
        return user.email_verified && user.email && ALLOWED_EMAILS.includes(user.email) ? user : null;
    } catch {
        return null;
    }
}
