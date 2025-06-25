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

### 2. Get Your Application Code

Clone your project from your Git repository onto the server. A common location is `/var/www`.

```bash
# Create the directory and set permissions
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www

# Clone your repository (replace with your actual URL)
git clone https://your-repository-url.com/project.git my-app
cd my-app
```

### 3. Install Dependencies and Build

Inside your project directory (`/var/www/my-app`), install the required packages and build the app for production.

```bash
# Install project dependencies
npm install

# Build the Next.js application
npm run build
```

### 4. Set Up Environment Variables

Your app needs the Firebase credentials to run. Create a `.env.local` file in your project directory.

```bash
# Create and open the file with nano text editor
nano .env.local
```

Paste your complete Firebase Service Account Key into this file. It must be a single line.

```
FIREBASE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
```

Save the file by pressing `Ctrl+X`, then `Y`, then `Enter`.

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
