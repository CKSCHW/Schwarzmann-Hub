// scripts/set-admin-claim.js

// This script sets a custom user claim on a Firebase user, granting them admin privileges.
// To run:
// 1. Make sure you have your FIREBASE_SERVICE_ACCOUNT_KEY in a .env.local file at the root.
// 2. Run the script with the user's email as an argument:
//    npm run set-admin -- user.email@example.com

// Load environment variables from .env.local
require('dotenv').config({ path: './.env.local' });

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (!serviceAccountString) {
  console.error('ERROR: FIREBASE_SERVICE_ACCOUNT_KEY is not set in your .env.local file.');
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(serviceAccountString);
  initializeApp({
    credential: cert(serviceAccount),
  });
} catch (error) {
  console.error('ERROR: Failed to parse or initialize Firebase Admin SDK.');
  console.error("Please ensure FIREBASE_SERVICE_ACCOUNT_KEY in .env.local is a valid, unmodified JSON key.");
  console.error('Original Error:', error.message);
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address as an argument.');
  console.error('Usage: npm run set-admin -- <user-email>');
  process.exit(1);
}

const adminAuth = getAuth();

(async () => {
  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });
    console.log(`Success! Custom claim { role: 'admin' } set for user: ${email}`);
    console.log('The user will see their new role the next time they log in or their token refreshes.');
    process.exit(0);
  } catch (error) {
    console.error(`Error setting custom claim for ${email}:`, error.message);
    process.exit(1);
  }
})();
