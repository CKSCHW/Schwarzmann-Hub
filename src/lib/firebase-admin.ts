
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Check if the environment variable is missing or still has the placeholder value.
if (!serviceAccountString || serviceAccountString === 'PASTE_YOUR_FIREBASE_SERVICE_ACCOUNT_KEY_JSON_HERE') {
  throw new Error(`The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set correctly in your .env.local file.
  
  Please follow these steps:
  1. Open the .env.local file.
  2. Go to your Firebase project console > Project Settings > Service Accounts.
  3. Click "Generate new private key" to download a JSON file.
  4. Copy the ENTIRE content of that JSON file.
  5. Paste it as the value for FIREBASE_SERVICE_ACCOUNT_KEY. For example:
     FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
  
  After adding the key, you must RESTART your development server.`);
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(serviceAccountString);
} catch (e) {
  console.error("Error parsing FIREBASE_SERVICE_ACCOUNT_KEY:", e);
  throw new Error(`Failed to parse the FIREBASE_SERVICE_ACCOUNT_KEY.
  It looks like it is set in .env.local, but it is not valid JSON.
  Please make sure you have copied the entire contents of the service account file correctly and that there are no syntax errors.
  Then, restart the development server.`);
}

if (!getApps().length) {
    if (!serviceAccount || !serviceAccount.project_id || serviceAccount.type !== 'service_account') {
        throw new Error(`The Firebase service account credentials in .env.local seem to be parsed but are invalid.
    The JSON object is missing the required 'project_id' field or the 'type' is not 'service_account'.
    This usually means you have copied the wrong value.
    Please ensure you have downloaded a NEW service account key from your Firebase project settings and copied the ENTIRE JSON object.
    Then, restart the development server.`);
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
