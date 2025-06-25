
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// This function checks the service account key and returns a specific error message if invalid.
function getInitializationError(): string | null {
    // 1. Check if the key is missing or is the placeholder value.
    if (!serviceAccountString || serviceAccountString.includes('PASTE_YOUR_FIREBASE_SERVICE_ACCOUNT_KEY')) {
        return `The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set in your .env.local file.`;
    }

    try {
        const serviceAccount = JSON.parse(serviceAccountString);

        // 2. Check if the parsed key has the required fields.
        if (serviceAccount.type !== 'service_account' || !serviceAccount.project_id || !serviceAccount.private_key) {
            return `The Firebase service account key in .env.local is invalid. It seems to be missing required fields like 'type', 'project_id', or 'private_key'. This usually means you have copied an incomplete or incorrect JSON object.`;
        }
        
        // 3. If everything is fine, initialize the app if it hasn't been already.
        if (getApps().length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
        }
        return null; // Success!
    } catch (e) {
        // 4. Catch errors from JSON.parse(), which means the key is malformed.
        return `The Firebase service account key in .env.local is not valid JSON. Please ensure you have copied the entire, unmodified key file.`;
    }
}

const initializationError = getInitializationError();

// If there was any error, throw a single, comprehensive error message.
if (initializationError) {
    throw new Error(`
================================================================================
CRITICAL CONFIGURATION ERROR
================================================================================
${initializationError}

This is not a code bug. The application is correctly stopping to prevent a crash.
You MUST fix the value in your .env.local file.

Please follow these steps carefully:
1.  Go to your Firebase project console > Project Settings > Service Accounts.
2.  Click "Generate new private key" to download a new, complete key file.
3.  Open the downloaded file and copy the ENTIRE JSON content.
4.  Paste it into your .env.local file.
5.  You MUST RESTART your development server for the changes to take effect.
================================================================================
`);
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
