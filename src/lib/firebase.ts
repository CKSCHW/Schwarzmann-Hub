import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// =================================================================================
// WICHTIGER SCHRITT: HIER IHRE FIREBASE-KONFIGURATION EINFÜGEN
// =================================================================================
// 1. Erstellen Sie ein Projekt unter https://console.firebase.google.com/
// 2. Fügen Sie eine "Web-App" (</>) zu Ihrem Projekt hinzu.
// 3. Firebase wird Ihnen ein `firebaseConfig`-Objekt anzeigen.
// 4. Kopieren Sie die Werte aus diesem Objekt und ersetzen Sie die
//    unten stehenden Platzhalter ("YOUR_API_KEY", etc.).
// =================================================================================
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
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