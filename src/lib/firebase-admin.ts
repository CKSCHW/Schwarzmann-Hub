
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { cookies } from 'next/headers';
import type { SimpleUser } from '@/types';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Check if Firebase app is already initialized
if (getApps().length === 0) {
  if (!serviceAccountString) {
    throw new Error('CRITICAL: The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The application cannot start.');
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: 'work-news-hub.appspot.com',
    });
  } catch (e: any) {
    // This will catch JSON parsing errors and initialization errors
    throw new Error(`CRITICAL: Failed to parse or initialize Firebase Admin SDK. Please ensure the FIREBASE_SERVICE_ACCOUNT_KEY is a valid, unmodified JSON key. Error: ${e.message}`);
  }
}

const adminApp = getApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);
export const adminStorage = getStorage(adminApp);

// Helper function to get the current user on the server side
export async function getCurrentUser(): Promise<SimpleUser | null> {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('__session');

  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    
    // Create a plain, serializable user object from the token claims.
    // This avoids passing complex, server-only objects to components.
    const user: SimpleUser = {
      uid: decodedIdToken.uid,
      email: decodedIdToken.email,
      displayName: decodedIdToken.name,
      photoURL: decodedIdToken.picture,
      isAdmin: decodedIdToken.role === 'admin',
      groups: decodedIdToken.groups || [],
    };
    return user;

  } catch (error) {
    // Catches verification errors, cookie parsing errors, etc.
    // This is not a critical server error, just a failed auth attempt.
    return null;
  }
}
