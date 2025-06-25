import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Ihre Firebase-Projektkonfiguration.
const firebaseConfig = {
  apiKey: "AIzaSyB8VMf5MRf09i-dKed2IHQeMuP32SOVkJk",
  authDomain: "work-news-hub.firebaseapp.com",
  projectId: "work-news-hub",
  storageBucket: "work-news-hub.appspot.com",
  messagingSenderId: "573960381626",
  appId: "1:573960381626:web:1dde02c6f518392bb74e83"
};

// Firebase initialisieren
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);


// =================================================================================
// NÄCHSTER SCHRITT: SERVER-SETUP (ADMIN SDK)
// =================================================================================
// Die Konfiguration für serverseitige Aktionen (z.B. im Admin-Bereich)
// befindet sich in `src/lib/firebase-admin.ts`.
//
// Dafür benötigen Sie einen Service Account Key aus den Firebase-Projekteinstellungen.
// Der Inhalt dieser JSON-Datei muss als Umgebungsvariable (Secret) mit dem
// Namen `FIREBASE_SERVICE_ACCOUNT_KEY` hinterlegt werden.
// =================================================================================
