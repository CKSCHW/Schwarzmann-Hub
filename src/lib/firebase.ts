
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// WICHTIG: Ersetzen Sie dies durch Ihre eigene Firebase-Projektkonfiguration.
// Sie erhalten diese aus der Firebase-Konsole für Ihre Web-App.
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

// Wichtiger Hinweis zum Server-Setup:
// Für die serverseitige Logik (wie das Erstellen von Artikeln im Admin-Bereich)
// habe ich das Firebase Admin SDK in `src/lib/firebase-admin.ts` eingerichtet.
// Sie MÜSSEN eine Umgebungsvariable namens `FIREBASE_SERVICE_ACCOUNT_KEY` mit dem
// Inhalt Ihrer Service-Account-JSON-Datei erstellen, damit dies funktioniert.
// Sie finden dies in Ihren Firebase-Projekteinstellungen -> Service-Konten.
