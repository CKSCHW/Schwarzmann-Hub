# Firebase Studio

This is a NextJS starter in Firebase Studio.

## ⚠️ IMPORTANT: Before You Run the App

This application uses Firebase for server-side features and requires a **Service Account Key** to run correctly. You must configure this key before starting the development server.

1.  **Find the `.env.local` file:** This file is in the root directory of your project.

2.  **Get your Firebase Key:**
    *   Go to your Firebase project console.
    *   Navigate to **Project Settings** > **Service Accounts**.
    *   Click the **"Generate new private key"** button to download a JSON file.

3.  **Set the Environment Variable:**
    *   Open the downloaded JSON file and copy its **entire content**.
    *   Open the `.env.local` file in your editor.
    *   Paste the JSON content as the value for `FIREBASE_SERVICE_ACCOUNT_KEY`. It should look like this:
        ```
        FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
        ```

4.  **Restart Your Server:** If the server is running, you must stop it and restart it for the changes to take effect.

If you don't do this, the app will show a `CRITICAL CONFIGURATION ERROR` and will not start. **This is a security feature, not a code bug.**

## 🚀 Getting Started

Once the key is configured, you can get started by taking a look at `src/app/page.tsx`.
