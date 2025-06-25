# Firebase Studio

This is a NextJS starter in Firebase Studio.

## ⚠️ IMPORTANT: Before You Run the App

This application uses Firebase for server-side features and requires a **Service Account Key** to run correctly. You must configure this key before starting the development server.

### Where to Get Your Firebase Service Account Key

1.  Open your web browser and go to the **Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Select your project, which is named **`work-news-hub`**.
3.  In the top-left corner, click the **gear icon** ⚙️ next to "Project Overview".
4.  From the menu, select **Project settings**.
5.  In the Project settings page, click on the **Service accounts** tab.
6.  Click the blue **"Generate new private key"** button. A warning will appear; click **"Generate key"** to confirm.
7.  A JSON file (e.g., `work-news-hub-firebase-adminsdk-....json`) will be downloaded to your computer. **This file contains your key.**

### How to Set the Environment Variable

1.  **Find the `.env.local` file:** This file should be in the root directory of your project. If it doesn't exist, create it.
2.  **Open the downloaded JSON file** and copy its **entire content**.
3.  **Open the `.env.local` file** in your editor.
4.  Paste the JSON content as the value for `FIREBASE_SERVICE_ACCOUNT_KEY`. The line must look exactly like this, with your key inside the single quotes:
    ```
    FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
    ```
5.  **Restart Your Server:** If the server is running, you must stop it (`Ctrl+C`) and restart it (`npm run dev`) for the changes to take effect.

If you don't do this, the app will show a `CRITICAL CONFIGURATION ERROR` and will not start. **This is a security feature, not a code bug.**

## 🚀 Getting Started

Once the key is configured, you can get started by taking a look at `src/app/page.tsx`.
