# Saral Watch

Saral Watch is a self-hosted website-monitoring dashboard. It lets a team organise clients and websites, run HTTP availability checks, review response times and incidents, and manage access for administrators and viewers.

The application is built with React, Express, and MySQL. One Node.js process serves both the dashboard and the API, and also runs the scheduled monitor checks.

## What it does

- Manage clients, their websites, and HTTP monitors.
- Show the current status of each active monitor: `UP`, `DOWN`, `DEGRADED`, or `COMPROMISED`.
- Record response time, HTTP status, and a recent check history.
- Detect common availability, certificate, redirect, and suspicious-content issues.
- Let Super Admins, Admins, and Viewers access the dashboard at appropriate permission levels.

Check history is retained for seven days. The built-in scheduler checks every active monitor on one global interval; the default is every five minutes.

> The project does not currently send email, SMS, WhatsApp, Slack, or Telegram alerts. It is a dashboard-based monitoring tool.

## Requirements

For local development:

- Node.js 20 or newer
- MySQL 8 or newer

For a small production installation, use an Ubuntu 22.04/24.04 server with at least 1 CPU, 2 GB RAM, and 25 GB storage. A 1 GB server can work for light usage, but add 2 GB of swap and expect installs and manual refreshes to be slower.

For a public production deployment, also install:

- Nginx
- PM2
- A domain name or subdomain for HTTPS

## Project layout

```text
client/                 React + Vite dashboard
server/                 Express API, scheduler, Prisma schema, and seed script
server/prisma/          MySQL schema and initial-user seed
server/public/          Generated dashboard build; created by npm run build
.env.example            Environment-variable template
```

## Quick start for local development

### 1. Clone and install

```bash
git clone https://github.com/kayas881/kayas-watch.git
cd kayas-watch
npm ci
```

Use `npm install` instead of `npm ci` only when you are intentionally changing dependencies.

### 2. Create a MySQL database

Open MySQL as an administrator and run the following. Replace the example password with a strong, unique password.

```sql
CREATE DATABASE saral_watch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'saral_watch'@'localhost' IDENTIFIED BY 'replace-this-with-a-strong-password';
GRANT ALL PRIVILEGES ON saral_watch.* TO 'saral_watch'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Create the server environment file

Copy the template to `server/.env`:

```bash
cp .env.example server/.env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example server/.env
```

Set the values in `server/.env`:

```env
DATABASE_URL="mysql://saral_watch:YOUR_DATABASE_PASSWORD@127.0.0.1:3306/saral_watch?connection_limit=10"
JWT_SECRET="GENERATE_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG"
PORT=4000
CLIENT_URL="http://localhost:5173"
CRON_INTERVAL_SECONDS=300
```

Generate a safe JWT secret on Linux/macOS with:

```bash
openssl rand -hex 32
```

If the database password contains characters such as `@`, `:`, `/`, or `?`, URL-encode it before placing it in `DATABASE_URL`.

### 4. Create tables and the initial account

```bash
npm --workspace server run db:push
npm run seed
```

The first run creates this bootstrap account:

```text
Email:    admin@saralwatch.com
Password: admin123
```

Sign in immediately, create a new Super Admin from **Settings**, sign in using the new account, and delete the bootstrap account. Do not leave the bootstrap credentials active on an internet-accessible installation.

> Run `npm run seed` only for a new installation. Do not run it as part of ordinary updates: if the bootstrap account was deleted, the seed command can create it again.

### 5. Start development mode

```bash
npm run dev
```

Open `http://localhost:5173`. The React development server runs on port `5173` and proxies API requests to the Express server on port `4000`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API and React development server together. |
| `npm run typecheck` | Check TypeScript without creating a production build. |
| `npm test` | Run server and client tests. |
| `npm run build` | Build the API and dashboard for production. |
| `npm start` | Run the built production server. |
| `npm --workspace server run db:push` | Apply the current Prisma schema to MySQL. |
| `npm run seed` | Create the bootstrap administrator on a new database only. |

## Production deployment on Ubuntu

This guide assumes a fresh Ubuntu 22.04 or 24.04 server and a deployment user with `sudo` access.

### 1. Prepare the server

Install system dependencies:

```bash
sudo apt update
sudo apt install -y curl ca-certificates git mysql-server nginx certbot python3-certbot-nginx
```

Install Node.js 20:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

On a 1 GB server, add swap before installing dependencies or building:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile swap swap defaults 0 0' | sudo tee -a /etc/fstab
```

### 2. Create the production database

```bash
sudo mysql
```

Then run:

```sql
CREATE DATABASE saral_watch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'saral_watch'@'localhost' IDENTIFIED BY 'replace-this-with-a-strong-password';
GRANT ALL PRIVILEGES ON saral_watch.* TO 'saral_watch'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Download and configure the project

```bash
git clone https://github.com/kayas881/kayas-watch.git
cd kayas-watch
npm ci --no-audit --no-fund
cp .env.example server/.env
```

Edit `server/.env` with your database password and a fresh JWT secret. For a domain deployment, set `CLIENT_URL` to the final public address, for example:

```env
CLIENT_URL="https://monitor.example.com"
```

For a temporary server-IP deployment, `CLIENT_URL` may remain the local development value because the dashboard and API are served from the same origin. Update it before moving to a domain.

### 4. Initialise and build

```bash
npm --workspace server run db:push
npm run seed
npm run build
```

The client build is written to `server/public`, and Express serves it alongside the API.

### 5. Run the application with PM2

Install PM2 once:

```bash
sudo npm install -g pm2
```

Start the application from the `server` directory. This detail matters: `dotenv` reads `server/.env` from the current working directory.

```bash
cd server
pm2 start dist/src/index.js --name saral-watch --time
pm2 save
pm2 startup
```

`pm2 startup` prints one additional command beginning with `sudo`. Run that exact command, then save the process list again:

```bash
pm2 save
```

Check that the service is healthy:

```bash
pm2 status
curl -fsS http://127.0.0.1:4000/api/health
```

Expected response:

```json
{"status":"ok"}
```

### 6. Put Nginx in front of the app

Create `/etc/nginx/sites-available/saral-watch` and replace `monitor.example.com` with your domain:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name monitor.example.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        # A full monitor refresh can take longer than Nginx's 60-second default.
        proxy_connect_timeout 15s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        send_timeout 600s;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site, validate Nginx, and reload it:

```bash
sudo ln -s /etc/nginx/sites-available/saral-watch /etc/nginx/sites-enabled/saral-watch
sudo unlink /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

For a temporary IP-only test, use `server_name _;` in the configuration and open `http://YOUR_SERVER_IP`. IP-only access cannot use a normal trusted HTTPS certificate, so do not use it for sensitive production activity.

### 7. Point a domain to the server and enable HTTPS

At your DNS provider, create an `A` record:

| Field | Value |
| --- | --- |
| Type | `A` |
| Host | `monitor` |
| Value | Your server's public static IP |
| TTL | `300` or Auto |

After DNS has propagated, request the certificate:

```bash
sudo certbot --nginx -d monitor.example.com
```

Certbot configures HTTPS and renews the certificate automatically.

## Google Cloud notes

For a Compute Engine deployment:

1. Reserve the external address as a **static IP** before adding it to DNS.
2. Add a network tag such as `saral-watch` to the VM.
3. Create an inbound firewall rule for TCP ports `80` and `443` targeting that tag.
4. Do **not** expose ports `4000` or `3306` to the internet. Nginx communicates with the Node app locally, and MySQL remains local to the VM.

If UFW is enabled on Ubuntu, permit Nginx too:

```bash
sudo ufw allow 'Nginx Full'
```

## Backups

The seven-day check-history cleanup is not a database backup. Back up MySQL before every update and schedule an off-server daily backup for production.

To make a manual compressed backup:

```bash
sudo install -d -m 700 /var/backups/saral-watch
sudo sh -c 'mysqldump -u saral_watch -p saral_watch | gzip > /var/backups/saral-watch/saral_watch-$(date +%F).sql.gz'
```

Store a copy outside the application server. To restore a backup, stop the app first and use:

```bash
gunzip -c saral_watch-YYYY-MM-DD.sql.gz | mysql -u saral_watch -p saral_watch
```

## Updating an existing installation

1. Make a database backup.
2. In the project directory, download the latest source and install dependencies.
3. Apply a schema update only when the release includes a schema change.
4. Build and restart the PM2 process.

```bash
git pull
npm ci --no-audit --no-fund
npm --workspace server run db:push
npm run build
cd server
pm2 restart saral-watch --update-env
```

Do not run `npm run seed` as part of normal updates.

## Monitoring behaviour

- `CRON_INTERVAL_SECONDS` controls the global schedule for all active monitors. `300` means every five minutes.
- Manual **Refresh status** runs every active monitor immediately. It can take one or more minutes when there are many websites or slow targets.
- Each HTTP request has an eight-second timeout and can retry according to the monitor's retry policy.
- The monitor checks from the location of this server. A website blocked by a bot-protection or browser-verification page can be reported as degraded even if it opens in an interactive browser.
- The dashboard keeps the latest 50 check results per monitor visible in the monitor detail page; database retention is seven days.

## Troubleshooting

### The app does not start

Check the PM2 logs:

```bash
pm2 logs saral-watch --lines 50
```

If it reports a missing `JWT_SECRET` or database variable, ensure PM2 was started from the `server` directory and that `server/.env` exists.

### The health endpoint fails

```bash
curl -fsS http://127.0.0.1:4000/api/health
pm2 status
sudo systemctl status mysql nginx --no-pager
```

### The public site does not load

Verify the Nginx configuration, server firewall, cloud firewall rule, and DNS record:

```bash
sudo nginx -t
sudo systemctl status nginx --no-pager
```

Only ports `80` and `443` should be public. Port `4000` must stay private.

### Refresh status returns HTTP 504

This means the reverse proxy stopped waiting before a complete monitor refresh finished. Use the Nginx timeout settings shown above, then reload Nginx:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### The server runs out of memory

Use a server with at least 2 GB RAM. On a 1 GB instance, add swap as shown in the production guide and avoid running installs, builds, and manual refreshes at the same time.

## Security checklist

- Keep `server/.env` private; it contains database and JWT credentials.
- Use a unique database password and a JWT secret of at least 32 characters.
- Replace the bootstrap administrator immediately after first login.
- Use HTTPS and a real domain for production.
- Do not expose MySQL (`3306`) or the Node port (`4000`) publicly.
- Take encrypted, off-server database backups.
- Keep the operating system, Node.js, and dependencies updated deliberately and test updates before applying them to production.
