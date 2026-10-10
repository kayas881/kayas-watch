# Saral Watch

Self-hosted website monitoring for Saral Infosoft. One Express process provides the REST API, runs scheduled checks, and serves the built React application.

## Requirements and setup

Install Node.js 20+ and MySQL 8, then create the database:

```sql
CREATE DATABASE saral_watch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'saral'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON saral_watch.* TO 'saral'@'localhost';
FLUSH PRIVILEGES;
```

Copy `.env.example` to `server/.env`, update `DATABASE_URL`, and set a random `JWT_SECRET` of at least 32 characters. Run `bash setup.sh` on Linux/macOS or `setup.bat` on Windows, followed by:

```bash
npm start
```

The app is available at `http://localhost:4000`. Initial login: `admin@saralwatch.com` / `admin123`.

## Development

```bash
npm install
npm run dev
```

Use `npm run typecheck` and `npm run build` before deployment. If the schema changes later, run `npm --workspace server run db:push` before restarting. `CRON_INTERVAL_SECONDS` controls the scheduler (default 300 seconds); ping history older than seven days is cleaned nightly.

Run the automated health-checker, persistence, RBAC, and frontend smoke tests with:

```bash
npm test
```

For continuous production operation:

```bash
npm install -g pm2
pm2 start server/dist/src/index.js --name saral-watch
pm2 save
pm2 startup
```
