
import { initializeApp, getApps, getApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies, headers } from 'next/headers';
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
    });
  } catch (e: any) {
    // This will catch JSON parsing errors and initialization errors
    throw new Error(`CRITICAL: Failed to parse or initialize Firebase Admin SDK. Please ensure the FIREBASE_SERVICE_ACCOUNT_KEY is a valid, unmodified JSON key. Error: ${e.message}`);
  }
}

const adminApp = getApp();
export const adminDb = getFirestore(adminApp);
export const adminAuth = getAuth(adminApp);

// Helper function to get the current user on the server side
export async function getCurrentUser(): Promise<SimpleUser | null> {
  headers(); // This forces the function to be dynamic
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('__session');

  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(sessionCookie.value, true);
    
    // Fetch additional profile data from Firestore
    const userDocRef = adminDb.collection('users').doc(decodedIdToken.uid);
    const userDoc = await userDocRef.get();
    const profileData = userDoc.exists ? userDoc.data() : {};

    // Create a plain, serializable user object from the token claims.
    // This avoids passing complex, server-only objects to components.
    const user: SimpleUser = {
      uid: decodedIdToken.uid,
      email: decodedIdToken.email,
      displayName: decodedIdToken.name,
      photoURL: decodedIdToken.picture,
      isAdmin: decodedIdToken.role === 'admin',
      groups: decodedIdToken.groups || [],
      // Add data from firestore
      firstName: profileData?.firstName,
      lastName: profileData?.lastName,
      title: profileData?.title,
    };
    return user;

  } catch (error) {
    // Catches verification errors, cookie parsing errors, etc.
    // This is not a critical server error, just a failed auth attempt.
    return null;
  }
}
