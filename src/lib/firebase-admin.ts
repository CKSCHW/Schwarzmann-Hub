import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

// This is the "service account" file you get from Firebase > Project Settings > Service accounts
// It's a JSON file with credentials.
// IMPORTANT: Store this securely. For this project, we'll use an environment variable.
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : null;

if (!getApps().length) {
  if (!serviceAccount) {
    throw new Error('Firebase service account credentials are not set in the environment variable FIREBASE_SERVICE_ACCOUNT_KEY.');
  }
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();


// Helper function to get the current user on the server side
export async function getCurrentUser() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) {
    return null;
  }
  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const user = await adminAuth.getUser(decodedIdToken.uid);
    return { ...user, customClaims: decodedIdToken };
  } catch (error) {
    console.error('Error verifying session cookie:', error);
    return null;
  }
}
