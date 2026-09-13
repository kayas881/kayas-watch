# Getting Started with Kayas Watch

This guide will walk you through setting up and using Kayas Watch for the first time.

## Table of Contents
1. [Installation](#installation)
2. [Initial Setup](#initial-setup)
3. [Creating Your First Monitor](#creating-your-first-monitor)
4. [Setting Up Cron Jobs](#setting-up-cron-jobs)
5. [User Management](#user-management)
6. [Troubleshooting](#troubleshooting)

---

## Installation

### Step 1: Prerequisites Check
Ensure you have installed:
- **Node.js 20+**: Check with `node --version`
- **npm 11+**: Check with `npm --version`
- **PostgreSQL 12+**: Check with `psql --version`

### Step 2: Clone Repository
```bash
git clone https://github.com/kayas881/kayas-watch.git
cd kayas-watch
```

### Step 3: Install Dependencies
```bash
npm install
```

This will install all required packages from `package.json`.

### Step 4: Environment Setup
```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your settings
```

**Required variables to configure:**
```env
DATABASE_URL="postgresql://user:password@localhost:5432/kayas_watch"
NEXTAUTH_SECRET="random-string-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"
CRON_SECRET="your-cron-token"
```

> **Tip:** Generate NEXTAUTH_SECRET with:
> ```bash
> openssl rand -base64 32
> ```

---

## Initial Setup

### Step 1: Database Setup
Initialize the database schema:
```bash
npm run build
```

This command will:
1. Generate Prisma client
2. Connect to PostgreSQL
3. Create all tables (User, Client, Website, Monitor, Incident, IncidentNote)
4. Set up relationships and constraints

> **Expected output:**
> ```
> ✔ Introspected 10 models
> ✔ Generated Prisma Client
> ✔ Pushed schema successfully
> ```

### Step 2: Start Development Server
```bash
npm run dev
```

You should see:
```
> next dev
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 3: Access the Application
1. Open your browser
2. Navigate to [http://localhost:3000/login](http://localhost:3000/login)
3. You'll be on the login page

### Step 4: Create Admin User

**Method A: Using the UI** (Recommended)
1. On the login page, look for "Create Account" or "Sign Up" link (if available)
2. Enter your details:
   - Email: `admin@yourdomain.com`
   - Password: `strong-password-here`
3. Click "Register" or "Create Account"

**Method B: Using Database Seed** (Alternative)
1. Create `prisma/seed.ts` if not exists
2. Run: `npx prisma db seed`
3. Default credentials: See `.env.local` or `ADMIN_EMAIL`/`ADMIN_PASSWORD`

### Step 5: Login
1. Use your admin credentials
2. You'll see the dashboard (empty initially)
3. Proceed to [Creating Your First Monitor](#creating-your-first-monitor)

---

## Creating Your First Monitor

### Step 1: Create a Client
1. Navigate to **Clients** (left sidebar)
2. Click **"New Client"** button
3. Fill in details:
   - **Company Name**: "Acme Corp" (example)
   - **Primary Domain**: "acme.com" (optional)
   - **Contact Person**: "John Doe"
   - **Contact Email**: "john@acme.com"
   - **Support SLA**: "99.9% uptime"
4. Click **"Save"**

### Step 2: Create a Website
1. Navigate to **Websites**
2. Click **"New Website"** button
3. Fill in details:
   - **Name**: "Acme Main Site"
   - **Client**: Select "Acme Corp"
   - **URL**: "https://acme.com"
   - **Description**: "Main corporate website"
4. Click **"Save"**

### Step 3: Create a Monitor
1. Navigate to **Monitors**
2. Click **"New Monitor"** button
3. Fill in details:
   - **Name**: "Acme HTTPS Check"
   - **Website**: Select "Acme Main Site"
   - **URL**: "https://acme.com"
   - **Type**: "HTTP" (default)
   - **Check Interval (seconds)**: 60
   - **Retry Policy**: 3
4. Click **"Save"**

### Step 4: Verify Monitor Status
1. Go to **Dashboard**
2. You should see:
   - Total Clients: 1
   - Total Monitors: 1
   - Sites Up: 1 (if acme.com is online)
   - Overall Uptime: 100%

### Step 5: Test Manual Health Check
1. Click the **"Refresh Status"** button (top-right)
2. System will check all monitors immediately
3. You'll see updated status and response time

---

## Setting Up Cron Jobs

The health check system requires periodic execution. Choose one method:

### Option 1: cron-job.org (Free & Easy)

1. Go to [cron-job.org](https://cron-job.org)
2. Create a free account
3. Click **"Cronjobs"** → **"Create cronjob"**
4. Configure:
   - **URL**: `https://your-domain.com/api/cron/health-check`
   - **HTTP Method**: GET
   - **Execution Interval**: Every minute
   - **HTTP Headers**: Add custom header
     - Name: `Authorization`
     - Value: `Bearer YOUR_CRON_SECRET`
5. Click **"Create"**

> Your monitors will now be checked every minute!

### Option 2: GitHub Actions

1. Create `.github/workflows/kayas-health-check.yml`:
```yaml
name: Kayas Health Check
on:
  schedule:
    - cron: '* * * * *'  # Every minute
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger health check
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/health-check
```

2. In GitHub repo settings:
   - Add secret: `CRON_SECRET` = your secret from `.env.local`

### Option 3: AWS Lambda

1. Create Lambda function with Node.js runtime:
```javascript
import https from 'https';

export async function handler(event) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'your-domain.com',
      path: '/api/cron/health-check',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`
      }
    };

    https.request(options, (res) => {
      resolve({ statusCode: res.statusCode });
    }).end();
  });
}
```

2. Add environment variable: `CRON_SECRET`
3. Set CloudWatch Events to trigger every minute

---

## User Management

### Creating Additional Users

1. Navigate to **Settings** (left sidebar)
2. Click **"Create New User"**
3. Fill in:
   - **Email**: `user@yourdomain.com`
   - **Password**: Temporary password (they should change it)
   - **Role**: 
     - `ADMIN` = Full access
     - `VIEWER` = Read-only
4. Click **"Create"**

### User Roles Explained

| Role | Can Create/Edit/Delete | Can View Dashboard | Can View Incidents |
|------|------------------------|--------------------|--------------------|
| ADMIN | ✅ Yes | ✅ Yes | ✅ Yes |
| VIEWER | ❌ No | ✅ Yes | ✅ Yes |

---

## Monitoring Incidents

### When a Site Goes Down

1. **Automatic Detection:**
   - Health check detects site is DOWN
   - Incident automatically created

2. **Dashboard Notification:**
   - "Live Outages" panel appears
   - Shows downtime duration (e.g., "Down 15m")

3. **Incident Details:**
   - Click "View Incident →" button
   - See error details (HTTP status, timeout, DNS error, etc.)

4. **Team Collaboration:**
   - Click "Add Note" at bottom
   - Write update (e.g., "Contacted hosting provider")
   - Note saved with timestamp and your username

5. **Status Updates:**
   - Change status: OPEN → ACKNOWLEDGED → RESOLVED
   - When site comes back UP, incident auto-resolves

### Viewing Incident History

1. Navigate to **Incidents**
2. See all:
   - **Open Incidents** (red) — Current issues
   - **Acknowledged** (yellow) — Being worked on
   - **Resolved** (green) — Fixed issues from last 24h

---

## Bulk Import Websites

For importing multiple websites at once:

### Step 1: Prepare Excel File
Create file `websites.xlsx` with columns:
```
| Name              | URL                    | ClientId | Description        |
|-------------------|------------------------|----------|--------------------|
| Main Website      | https://example.com    | acme     | Primary site       |
| Blog              | https://blog.example   | acme     | Company blog       |
| Admin Panel       | https://admin.example  | acme     | Internal tool      |
```

### Step 2: Import
1. Navigate to **Websites**
2. Click **"Import from Excel"** button
3. Select your file
4. Click **"Import"**
5. System creates all websites with monitors

---

## Troubleshooting

### Issue: Login Page Shows, But I Can't Create Account

**Solution:**
- You may need to create the first admin user via database seed
- Run: `npx prisma db seed`
- Check `.env.local` for `ADMIN_EMAIL` and `ADMIN_PASSWORD`

### Issue: Dashboard Shows 0 Monitors After Creation

**Solution:**
1. Verify database is connected: `psql $DATABASE_URL`
2. Check monitors were saved: `SELECT * FROM "Monitor";`
3. If empty, manually check form submission for errors

### Issue: Health Check Not Running

**Solution:**
1. Verify cron job is set up (see [Setting Up Cron Jobs](#setting-up-cron-jobs))
2. Test manually: Click "Refresh Status" button
3. Check console logs for errors

### Issue: Incidents Not Creating

**Solution:**
1. Ensure monitor is marked `isActive: true`
2. Verify database connection: `npm run build`
3. Try manual refresh: Click "Refresh Status" button
4. Check browser console (F12) for errors

### Issue: PostgreSQL Connection Error

**Solution:**
1. Verify PostgreSQL is running: `psql --version`
2. Check DATABASE_URL in `.env.local`:
   ```bash
   psql $DATABASE_URL
   ```
3. If connection fails, update password and retry

---

## Next Steps

Congratulations! Your Kayas Watch instance is now running. 

**Recommended next steps:**
1. ✅ Create multiple clients and websites
2. ✅ Set up cron job for automated monitoring
3. ✅ Create team user accounts
4. ✅ Test an incident (curl a bad URL to trigger DOWN status)
5. ✅ Deploy to production (Vercel, Docker, or self-hosted)

**Helpful links:**
- 📖 [README](../README.md) — Full documentation
- 🐛 [Issues](https://github.com/kayas881/kayas-watch/issues) — Report bugs
- 💬 [Discussions](https://github.com/kayas881/kayas-watch/discussions) — Ask questions

---

**Happy monitoring! 🚀**
