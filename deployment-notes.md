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

**THIS IS THE MOST IMPORTANT STEP.** If this is not done perfectly, you will see the `CRITICAL CONFIGURATION ERROR`. The application is designed to stop if the key is wrong.

Your application needs the Firebase credentials to run.

**A. Create the `.env.local` file:**

In your project directory (`/var/www/my-app`), create the environment file:

```bash
# Create and open the file with the nano text editor
nano .env.local
```

**B. Paste the Key:**

Now, you must paste your **entire** Firebase Service Account Key into this file.

1.  Open the JSON key file you downloaded from Firebase on your local computer.
2.  Select **all** the text in that file (`Ctrl+A` or `Cmd+A`).
3.  Copy it (`Ctrl+C` or `Cmd+C`).
4.  Go to your server's terminal where `nano` is open.
5.  Paste the content. **Be careful:** In some terminals, you may need to right-click to paste, or use `Shift+Insert`.
6.  The result should look EXACTLY like this, but with your own project details. It must be on a **single line**:

```
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "your-project-id", "private_key_id": "...", "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n", "client_email": "...", "client_id": "...", "auth_uri": "...", "token_uri": "...", "auth_provider_x509_cert_url": "...", "client_x509_cert_url": "..."}'
```

**C. Save and Exit:**

- Press `Ctrl+X` to exit.
- Press `Y` to confirm you want to save.
- Press `Enter` to save the file with the name `.env.local`.

---

#### ❗ **TROUBLESHOOTING THIS STEP** ❗

If you still see the `CRITICAL CONFIGURATION ERROR` after starting the app, it means one of these things is wrong:

*   **Incomplete Copy:** You did not copy the *entire* JSON object. It must start with `{` and end with `}`.
*   **Extra Characters:** You accidentally added extra characters or line breaks when pasting. The `FIREBASE_SERVICE_ACCOUNT_KEY=` part must be followed immediately by a single quote `'`, then the JSON, then another single quote `'`. There should be no characters before or after.
*   **Wrong Key:** You may have copied a different JSON file, not the service account key. The key **must** contain `"type": "service_account"` and a `"project_id"`.

---

### 5. Start the Application with PM2

PM2 will run your app in the background and ensure it restarts automatically if it crashes.

```bash
# Start the app using the 'npm start' script from package.json
pm2 start npm --name "my-app" -- start
```

Your app is now running, but it's only listening on `localhost:3000`. The final step is to configure Nginx to make it accessible to the public.

### 6. Configure Nginx as a Reverse Proxy

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
# Create a link from 'sites-available' to 'sites-enabled'
sudo ln -s /etc/nginx/sites-available/my-app /etc/nginx/sites-enabled/

# Test the Nginx configuration for errors
sudo nginx -t

# If the test is successful, restart Nginx to apply the changes
sudo systemctl restart nginx
```

Your application should now be live! You can manage it using commands like `pm2 list`, `pm2 stop my-app`, and `pm2 logs my-app`.
