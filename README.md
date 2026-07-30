# kayas Watch

Internal web application to monitor client websites and services, built for kayas Infosoft. 
Backed by [Uptime Kuma](https://github.com/louislam/uptime-kuma) as the monitoring engine.

## Prerequisites
- Node.js 18+
- Docker & Docker Compose

## Local Development Setup

1. **Start Infrastructure Services**
   ```bash
   docker-compose up -d
   ```
   This will spin up PostgreSQL (port `5432`) and Uptime Kuma (port `3001`).

2. **Setup Environment Variables**
   Create a `.env` file in the root based on `.env.example` (or just set the following defaults):
   ```env
   DATABASE_URL="postgresql://kayas:kayas_password@localhost:5432/kayas_watch?schema=public"
   NEXTAUTH_SECRET="your-super-secret-jwt-key"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Uptime Kuma instance configuration
   UPTIME_KUMA_URL="http://localhost:3001"
   UPTIME_KUMA_USER="admin"
   UPTIME_KUMA_PASSWORD="admin_password"
   
   # Seed Credentials
   ADMIN_EMAIL="admin@kayasadmin.com"
   ADMIN_PASSWORD="kayasadmin2026"
   ```
   *Note: Ensure you setup Uptime Kuma's initial user/password manually on `http://localhost:3001` matching the `UPTIME_KUMA_USER` and `UPTIME_KUMA_PASSWORD` before attempting to create monitors.*

3. **Install Dependencies & Migrate DB**
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```

4. **Run the Database Seed (Important!)**
   To log into the dashboard, you must seed the initial Admin user.
   ```bash
   npm run db:seed
   ```
   *(Wait, we configured `prisma: { seed: "tsx prisma/seed.ts" }` so the command is `npx prisma db seed`)*
   ```bash
   npx prisma db seed
   ```
   This command creates:
   - SuperAdmin (`admin@kayasadmin.com` / `kayasadmin2026`)
   - A mock Client ("Acme Corp")
   - A mock Website for Acme Corp

5. **Start the Next.js Server**
   ```bash
   npm run dev
   ```
   Go to `http://localhost:3000` to interact with the API / Dashboard.

## Architecture & Integration
- **Next.js API**: `/api/monitors` provisions monitors over Uptime Kuma's Socket API natively.
- **Uptime Kuma Webhooks**: Monitor events hit `/api/webhooks/kuma` automatically via a programmatically injected Webhook Notification in Uptime Kuma.
- **Incidents**: Database automation opens/resolves incidents based on webhook states natively.
