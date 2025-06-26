
# How to Deploy Your Next.js App on Ubuntu

Excellent! Now that Nginx is running correctly, here is a complete guide to deploy your application. This process uses **PM2** to keep your app running and **Nginx** as a reverse proxy to handle web traffic.

### 1. Prepare Your Server (If Not Already Done)

You need `nvm` (for Node.js) and `pm2`. If you followed the previous guides, you should have these. If not, run:

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install --lts

# Install PM2 Process Manager
npm install pm2 -g
```

### 2. Get Your Application Code (Using an SSH Key)

To securely connect to GitHub from your server, you must use an SSH key. GitHub no longer allows password authentication from the command line.

**A. Generate an SSH Key on Your Server**

If you don't already have one, create a new SSH key.

```bash
# Run this command. When it asks for a file to save the key, just press Enter.
# When it asks for a passphrase, press Enter to leave it empty for easier deployment.
ssh-keygen -t ed25519 -C "your-email@example.com"
```

**B. Add Your SSH Key to GitHub**

You now need to tell GitHub about your server's key.

1.  **View your new public key:**
    ```bash
    cat ~/.ssh/id_ed25519.pub
    ```
2.  **Copy the entire output.** It starts with `ssh-ed25519` and ends with your email.
3.  **Go to GitHub:**
    *   Log in to your GitHub account.
    *   Click your profile picture in the top-right and go to **Settings**.
    *   In the left sidebar, click **SSH and GPG keys**.
    *   Click the **New SSH key** button.
    *   Give it a **Title** (e.g., "My App Server").
    *   Paste your copied key into the **Key** field.
    *   Click **Add SSH key**.

**C. Clone Your Repository**

Now you can use the SSH URL to clone your project.

1.  **Get the SSH URL:** On your GitHub repository page (`https://github.com/CKSCHW/Schwarzmann-Hub`), click the green "Code" button, and make sure you select the **SSH** tab. The URL will be `git@github.com:CKSCHW/Schwarzmann-Hub.git`.
2.  **Clone it on the server:**
    ```bash
    # Create the directory for your apps if it doesn't exist
    sudo mkdir -p /var/www
    # Take ownership of the directory so you don't need sudo for git
    sudo chown $USER:$USER /var/www
    cd /var/www

    # Clone your repository using the SSH URL (NO SUDO NEEDED)
    git clone git@github.com:CKSCHW/Schwarzmann-Hub.git my-app
    cd my-app
    ```
This will download all your project files into a new folder named `my-app` inside `/var/www`. Running `git clone` without `sudo` ensures that Git uses the SSH key located in your user's home directory.

### 3. Install Dependencies and Build

Inside your project directory (`/var/www/my-app`), install the required packages and build the app for production.

```bash
# Install project dependencies
npm install

# Build the Next.js application
npm run build
```

### 4. Set Up Environment Variables

**THIS IS THE MOST IMPORTANT AND MOST COMMON POINT OF FAILURE. PLEASE READ VERY CAREFULLY.**

If this step is not done *perfectly*, you will see errors.

#### 4.1 Firebase Service Account Key

If this step is not done *perfectly*, you will see the `CRITICAL CONFIGURATION ERROR`. The application is designed to stop if the key is wrong.

1.  Open your web browser and go to the **Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Select your project, which is named **`work-news-hub`**.
3.  In the top-left corner, click the **gear icon** ⚙️ next to "Project Overview".
4.  From the menu, select **Project settings**.
5.  In the Project settings page, click on the **Service accounts** tab.
6.  Click the blue **"Generate new private key"** button. A warning will appear; click **"Generate key"** to confirm.
7.  A JSON file (e.g., `work-news-hub-firebase-adminsdk-....json`) will be downloaded to your computer. **This file contains your key.**

#### 4.2 VAPID Keys for Push Notifications (REQUIRED!)

Push notifications require a set of secure keys called VAPID keys.

1.  **Generate Keys:** In your project directory on the server (`/var/www/my-app`), run this new command:
    ```bash
    npm run generate-vapid-keys
    ```
2.  **Copy the Output:** It will produce a Public Key and a Private Key. Copy both of them.

#### 4.3 Create and Edit the `.env.local` file

In your project directory on the server (`/var/www/my-app`), create or open the environment file using the `nano` text editor:

```bash
# Make sure you are in your project folder: /var/www/my-app
nano .env.local
```

Now, add your Firebase Key and your VAPID keys to this file. The file should contain these three lines, each on its own line:

```
# 1. Firebase Service Account Key (paste the full JSON content inside single quotes)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'

# 2. VAPID Public Key
NEXT_PUBLIC_VAPID_PUBLIC_KEY=PASTE_YOUR_PUBLIC_KEY_HERE

# 3. VAPID Private Key
VAPID_PRIVATE_KEY=PASTE_YOUR_PRIVATE_KEY_HERE
```

**Instructions for Pasting the Firebase Key:**

1.  On your **local computer**, open the `.json` key file you downloaded from Firebase.
2.  Select **ALL** the text (`Ctrl+A` or `Cmd+A`).
3.  Copy the text (`Ctrl+C` or `Cmd+C`).
4.  Go back to your **server's terminal** where `nano` is open.
5.  On the `FIREBASE_SERVICE_ACCOUNT_KEY` line, after the equals sign `=`, type a single quote `'`, then right-click to paste the key, and finally type another single quote `'` at the end. The key must be on a single, unbroken line.

#### 4.4 Save and Exit `nano`

- Press `Ctrl+X` to exit `nano`.
- Press `Y` to confirm you want to save.
- Press `Enter` to save the file.

---

### 5. Start the Application with PM2

PM2 will run your app in the background and ensure it restarts automatically.

```bash
# Stop the old process if it's running, then restart it
pm2 restart my-app

# If it's the first time, use this command instead:
# pm2 start npm --name "my-app" -- start
```

Your app is now running, but it's only listening on `localhost:3000`. The final step is to configure Nginx to make it accessible to the public.

### 6. Configure Nginx (Initial Setup)

This will direct public traffic from port 80 to your running application.

**A. Create an Nginx Configuration File:**

```bash
sudo nano /etc/nginx/sites-available/my-app
```

**B. Paste in the following configuration.** Replace `your_domain.com` with your server's domain or IP address.

```nginx
server {
    listen 80;
    server_name your_domain.com; # Or your server's IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Save and close the file (`Ctrl+X`, `Y`, `Enter`).

**C. Enable the new configuration and restart Nginx:**

```bash
# Create a link from 'sites-available' to 'sites-enabled' (if not already done)
sudo ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/

# Test the Nginx configuration for errors
sudo nginx -t

# If the test is successful, restart Nginx to apply the changes
sudo systemctl restart nginx
```

### 7. Secure Your Site with HTTPS (Let's Encrypt) - CRITICAL FOR PUSH NOTIFICATIONS

Push notifications and modern web features **require a secure (HTTPS) connection**. Your server is currently running on HTTP, which is why the notification button is not appearing. You can get a free SSL certificate from Let's Encrypt.

**A. Install Certbot**

Certbot is a tool that automates setting up SSL certificates.

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

**B. Obtain and Install the Certificate**

Run this command, replacing `your_domain.com` with your actual domain name. This must be a real domain pointing to your server's IP address. **This will not work with a bare IP address.**

```bash
# Make sure to replace your_domain.com with your domain
sudo certbot --nginx -d your_domain.com
```

Certbot will ask you a few questions:
-   Enter your email address (for renewal notices).
-   Agree to the Terms of Service.
-   Choose whether to share your email with the Electronic Frontier Foundation (optional).
-   It will then detect your Nginx configuration for `your_domain.com` and ask if you want to redirect HTTP traffic to HTTPS. **Choose option 2 (Redirect)**. This is the recommended and most secure option.

Certbot will automatically update your `/etc/nginx/sites-available/my-app` file and restart Nginx to apply the changes.

**C. Verify Automatic Renewal**

Certbot automatically sets up a timer to renew your certificate before it expires. You can test that this works:

```bash
sudo certbot renew --dry-run
```

If it completes without errors, you are all set. Your site is now accessible via `https://your_domain.com`, and push notifications will be supported.

### 8. Creating Users and Admins

Your application uses Firebase Authentication. Users are not created in the code but in the Firebase console.

#### A. Create a Standard User Account

1.  Go to the **Firebase Console**: [https://console.firebase.google.com/](https://console.firebase.google.com/)
2.  Select your project (`work-news-hub`).
3.  In the left menu, go to **Build > Authentication**.
4.  Click the **Users** tab, then click the blue **"Add user"** button.
5.  Enter an email and a password (must be at least 6 characters).
6.  Click **"Add user"**.

This user can now log into your application but will not have admin access.

#### B. Promote a User to an Admin

To grant a user admin privileges, you need to set a "custom claim" on their account. This is a secure way to assign roles. I've added a helper script to make this easy.

1.  **Ensure you are in your project directory** on your server (`/var/www/my-app`).
2.  **Make sure your `.env.local` file is present and correct.** This script needs it to connect to your Firebase project.
3.  **Run the following command**, replacing `user-email@example.com` with the email of the user you just created:
    ```bash
    npm run set-admin -- user-email@example.com
    ```
4.  You should see a success message. The next time this user logs in, they will have access to the Admin Dashboard.
