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
5.  **VAPID Keys:** For push notifications, you also need to generate and add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to this file. See `deployment-notes.md` for instructions.
6.  **Restart Your Server:** If the server is running, you must stop it (`Ctrl+C`) and restart it (`npm run dev`) for the changes to take effect.

If you don't do this, the app will show a `CRITICAL CONFIGURATION ERROR` and will not start. **This is a security feature, not a code bug.**

## 🚀 Getting Started

Once the key is configured, you can get started by taking a look at `src/app/page.tsx`.

## 📱 Testing Push Notifications Locally

Push notifications require a secure context (**HTTPS**). To test this locally from other devices (like your phone), we use `ngrok` to create a secure, public tunnel to your local server.

### First-Time Setup for `ngrok` (One-Time Only)

`ngrok` requires a free account and an "authtoken" to work. This is a quick, one-time setup.

1.  **Sign Up:** Go to the `ngrok` dashboard and create a free account: [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup)
2.  **Get Your Authtoken:** After signing up, go to the "Your Authtoken" section of the dashboard: [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken)
3.  **Copy the `ngrok config add-authtoken ...` command** provided on that page. It will look like this: `ngrok config add-authtoken <YOUR_TOKEN>`
4.  **Run the command** in your terminal. This saves your token to a local configuration file, so you only have to do this once per machine.

### How to Use It

1.  **Start the development server** in your first terminal window, as usual:
    ```bash
    npm run dev
    ```
    This makes your app available on your local machine at `http://localhost:3000`.

2.  **Start the secure tunnel** in a **second, separate terminal window**:
    ```bash
    npm run dev:public
    ```

3.  `ngrok` will give you a public URL that looks something like `https://random-string.ngrok-free.app`.

4.  **Use this `https://...` URL** to open the app on your phone or in any browser. Because this connection is secure, you will be able to test the entire push notification workflow, including subscribing and receiving test notifications.
