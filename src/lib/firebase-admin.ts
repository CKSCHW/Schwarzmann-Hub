
import * as admin from 'firebase-admin';
import { getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { cookies } from 'next/headers';

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

// Check if the environment variable is missing or still has the placeholder value.
if (!serviceAccountString || serviceAccountString === 'PASTE_YOUR_FIREBASE_SERVICE_ACCOUNT_KEY_JSON_HERE') {
  throw new Error(`CRITICAL CONFIGURATION ERROR: The FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set in your .env.local file.

  Please follow these steps:
  1. Open the .env.local file in the root of your project.
  2. Go to your Firebase project console > Project Settings > Service Accounts.
  3. Click "Generate new private key" to download a JSON file.
  4. Copy the ENTIRE content of that JSON file.
  5. Paste it as the value for FIREBASE_SERVICE_ACCOUNT_KEY. For example:
     FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
  
  After adding the key, you must RESTART your development server.`);
}

if (getApps().length === 0) {
    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountString);

        // This check ensures the parsed object has the necessary properties.
        if (serviceAccount.type !== 'service_account' || !serviceAccount.project_id) {
            // Force the error by nullifying the object if it's invalid.
            serviceAccount = null; 
        }
    } catch (e) {
        // If JSON parsing fails, it's an invalid key.
        serviceAccount = null;
    }

    // This single, comprehensive check will now catch any issue with the key.
    if (!serviceAccount) {
        throw new Error(`CRITICAL CONFIGURATION ERROR: The Firebase service account key in .env.local is invalid. It is either not valid JSON or is missing required fields like 'type' and 'project_id'.

This is not a code bug. The application is correctly stopping to prevent a crash. You MUST fix your .env.local file.

Please follow these steps carefully:
1. Go to your Firebase project console > Project Settings > Service Accounts.
2. Click "Generate new private key" to download a new, complete key file.
3. Open the downloaded file and copy the ENTIRE JSON content.
4. Paste it into your .env.local file.
5. Restart your development server.
`);
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
