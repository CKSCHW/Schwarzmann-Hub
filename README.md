# Firebase Studio

This is a NextJS starter in Firebase Studio.

## ⚠️ IMPORTANT: Before You Run the App

This application uses Firebase for server-side features and requires a **Service Account Key** to run correctly. You must configure this key before starting the development server.

### Where to Get Your Firebase Service Account Key

1.  Go to the **Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Select your project: **`work-news-hub`**.
3.  Click the **gear icon** ⚙️ next to "Project Overview" -> **Project settings**.
4.  Go to the **Service accounts** tab.
5.  Click **"Generate new private key"**.

### How to Set the Environment Variable

1.  Find or create the `.env.local` file in the root directory of your project.
2.  Open the downloaded JSON file and copy its **entire content**.
3.  Paste the JSON content as the value for `FIREBASE_SERVICE_ACCOUNT_KEY` inside single quotes:
    ```
    FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
    ```
4.  **VAPID Keys:** For push notifications, you also need to generate and add `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` to this file. See `deployment-notes.md` for instructions.
5.  **Restart Your Server:** If it's running, stop it (`Ctrl+C`) and restart it (`npm run dev`).

Failure to do this will result in a `CRITICAL CONFIGURATION ERROR`.

---

## 📱 Testing Push Notifications Locally with `ngrok`

Push notifications require a secure context (**HTTPS**). Your local server runs on `http://localhost:3000`, which is not secure. To test on your phone, we use `ngrok` to create a secure, public tunnel to your local server.

### `ngrok` First-Time Setup (A one-time action per computer)

`ngrok` needs to be installed on your computer and linked to a free account.

**Step 1: Install `ngrok` (if you haven't already)**

If you are on Ubuntu (like in your terminal example), the easiest way is with `snap`:
```bash
sudo snap install ngrok
```
For other systems, follow the official instructions at [ngrok.com](https://ngrok.com/download). You do not need to install it via `npm`.

**Step 2: Connect Your Account**

This is the step that was causing the error. It's crucial to run this command **without `sudo`**.

1.  **Sign Up:** Go to [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup) and create a free account.
2.  **Get Your Authtoken:** Go to the "Your Authtoken" page: [https://dashboard.ngrok.com/get-started/your-authtoken](https://dashboard.ngrok.com/get-started/your-authtoken).
3.  **Copy the Command:** You will see a command that looks like this: `ngrok config add-authtoken <YOUR_PERSONAL_TOKEN>`. Copy this entire line.
4.  **Run the Command in Your Terminal (WITHOUT `sudo`!):**
    *   Open a new terminal window.
    *   Paste the command you copied and press Enter. **Do NOT use `sudo`**.

    ```bash
    # Run this command exactly as copied, without sudo at the beginning
    ngrok config add-authtoken <YOUR_PERSONAL_TOKEN>
    ```
    Running it with `sudo` saves the token for the `root` user, but you run the app as your own user (`developer`), which is why it previously failed. Running it without `sudo` saves it for the correct user.

This command saves your token to a configuration file in your user's home directory. You will not need to do this again on this machine.

### How to Use `ngrok` to Test Push Notifications

To test on your phone, you need **two terminal windows** running at the same time.

**Terminal 1: Start your app**
1.  Open a terminal in your project's root folder.
2.  Run the development server as usual:
    ```bash
    npm run dev
    ```
    *This makes your app available at `http://localhost:3000`.*

**Terminal 2: Start the secure tunnel**
1.  **Open a second, new terminal window.** Keep the first one running.
2.  Navigate to your project's root folder in this new terminal.
3.  Run the public tunnel command:
    ```bash
    npm run dev:public
    ```

`ngrok` will now display a public URL that looks like `https://<random-string>.ngrok-free.app`.

**Use this `https://...` URL** to open the app on your phone. Because this connection is secure (HTTPS), you will be able to test the entire push notification workflow.
