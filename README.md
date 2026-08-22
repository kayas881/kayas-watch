# 🚀 Kayas Watch — Uptime Monitoring & Security Incident Management

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-316192?logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A production-ready uptime monitoring and security incident management platform for Saral Infosoft. Monitor website health, detect outages and security compromises in real-time, and manage incidents with your team.

---

## ✨ Key Features

### 🛡️ **Two-Phase Health Detection**
- **Phase 1:** Quick HTTP health checks with redirect hijacking detection (8s timeout)
- **Phase 2:** Deep content analysis for malicious keywords and injected scripts (5s timeout)
- Comprehensive error categorization (DNS, SSL/TLS, timeouts, connection refused, etc.)

### 📊 **Real-Time Monitoring Dashboard**
- Live outage tracking with downtime duration
- Client health overview and uptime metrics
- Incident summary with HTTP status codes
- Recently resolved incidents (last 24 hours)
- System status at a glance

### 🚨 **Automated Incident Management**
- Auto-create incidents on site DOWN or COMPROMISED status
- Incident severity tracking (CRITICAL, HIGH, MEDIUM, LOW)
- Incident lifecycle: OPEN → ACKNOWLEDGED → RESOLVED
- Team collaboration through timestamped incident notes
- Automatic resolution when sites come back UP

### 👥 **Multi-Client Support**
- Organize websites by client company
- Client health summaries (most affected clients ranked first)
- Per-client contact information and SLA tracking
- Hierarchical structure: Client → Website → Monitor

### 🔧 **Monitor Configuration**
- Customizable check intervals (default: 60 seconds)
- Retry policy configuration
- Multiple monitor types (HTTP, PING, PORT - extensible)
- Enable/disable monitors without deletion
- Real-time response time tracking

### 📁 **Bulk Import**
- Excel/CSV bulk import for websites
- Mass-create monitors in seconds
- Validation on import

### 🔐 **Security & Access Control**
- NextAuth.js with JWT sessions
- Role-based access (ADMIN, VIEWER, SUPERADMIN)
- Bcryptjs password hashing
- Protected API endpoints with bearer token auth
- Server-side authorization checks

---

## 🏗️ Architecture

### Tech Stack
```
Frontend:     Next.js 16 + React 19 + TailwindCSS 4
Backend:      Next.js API Routes + Server Actions
Database:     PostgreSQL + Prisma ORM
Auth:         NextAuth.js 4 + JWT + Credentials Provider
UI:           Lucide React Icons + Tailwind Merge
Utilities:    date-fns, zod, xlsx, bcryptjs
```

### Database Schema

**Core Models:**
- **User** — System users with roles (ADMIN/VIEWER/SUPERADMIN)
- **Client** — Customer companies (companyName, domain, contact info, SLA)
- **Website** — Client's web properties (name, URL, description)
- **Monitor** — Health checks for websites (type, interval, retry policy, status)
- **Incident** — Outages/compromises triggered by monitor status changes
- **IncidentNote** — Team collaboration on incidents (timestamped, user-attributed)

---

## 🔍 Health Check System

### Phase 1: Quick Health Check (8s timeout)
```
GET request → Follow redirects → Check HTTP status
             ↓
    Detect redirect hijacking
             ↓
    Return: UP / DOWN / COMPROMISED
```

**Detects:**
- HTTP errors (4xx, 5xx)
- DNS failures
- SSL/TLS certificate errors
- Connection timeouts
- Connection refused/reset
- **Redirect hijacking** (site redirects to external domain)

### Phase 2: Deep Content Scan (5s timeout)
*Runs only on UP sites*

```
Download HTML (first 50KB) → Strip scripts/styles/comments
             ↓
    Scan for malicious keywords (requires 3+ matches)
             ↓
    Scan for injected scripts (suspicious TLDs)
             ↓
    Return: COMPROMISED / NOT_COMPROMISED
```

**Malicious Keywords:** casino, gambling, poker, betting, jackpot, xxx, porn, matka, satta, etc.

**Suspicious TLDs:** .xyz, .top, .buzz, .click, .loan, .club, .vip, .win

### Batch Processing
- Phase 1: 10 monitors per batch (quick checks)
- Phase 2: 5 monitors per batch (slower HTML downloads)
- Prevents overwhelming connection pools
- Graceful error handling with `Promise.allSettled()`

---

## 📋 Project Structure

```
kayas-watch/
├── src/
│   ├── app/
│   │   ├── (dashboard)/           # Protected routes
│   │   │   ├── page.tsx           # Main dashboard
│   │   │   ├── layout.tsx         # Dashboard layout
│   │   │   ├── clients/           # Client CRUD
│   │   │   ├── websites/          # Website CRUD
│   │   │   ├── monitors/          # Monitor CRUD
│   │   │   ├── incidents/         # Incident management
│   │   │   └── settings/          # User management
│   │   ├── api/
│   │   │   ├── auth/              # NextAuth
│   │   │   ├── cron/health-check  # Health check webhook
│   │   │   └── test-health/       # Manual trigger
│   │   ├── login/                 # Login page
│   │   └── layout.tsx             # Root layout
│   ├── lib/
│   │   ├── auth.ts                # NextAuth config
│   │   ├── health-checker.ts      # Health check logic
│   │   └── incidents.ts           # Incident management
│   └── components/                # React components
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # DB migrations
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ and npm 11+
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kayas881/kayas-watch.git
   cd kayas-watch
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/kayas_watch"
   
   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   
   # Cron Job Authentication
   CRON_SECRET="your-cron-secret-token"
   ```

4. **Set up the database**
   ```bash
   npm run build
   ```
   This will:
   - Generate Prisma client
   - Push schema to database
   - Create all tables

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open [http://localhost:3000/login](http://localhost:3000/login)
   - Create your first admin user

---

## 📸 Screenshots & UI Tour

### Dashboard Overview
Real-time health metrics and active incidents at a glance.

**Features:**
- Total clients and monitors
- System uptime percentage
- Live outages panel with downtime duration
- Recently resolved incidents
- Client health rankings
- Manual refresh button

*To capture: Navigate to dashboard after login and take a full screenshot*

---

### Clients Management
Manage customer companies with contact information.

**Features:**
- Create/edit/delete clients
- Track primary domain and contact details
- Support SLA and maintenance plan notes
- View associated websites

*To capture: Navigate to `/clients` and show list, then detail view*

---

### Websites & Monitors
Organize websites by client and configure health checks.

**Features:**
- Group websites by client
- Create monitors for each website
- Configure check interval and retry policy
- Bulk import websites from Excel
- View monitor status and response times

*To capture: Navigate to `/websites`, show list and monitor creation form*

---

### Incidents & Alerts
Track and manage outages with team collaboration.

**Features:**
- View active and resolved incidents
- Track incident timeline with error details
- Add team notes with timestamps
- Update incident status (OPEN/ACKNOWLEDGED/RESOLVED)
- Automatic resolution when site comes back UP

*To capture: Navigate to `/incidents`, show list and detail view*

---

### User Management
Manage team members and their roles.

**Features:**
- Create new users
- Assign roles (ADMIN/VIEWER)
- Delete users

*To capture: Navigate to `/settings` and show user list and creation form*

---

> 📸 **To add screenshots:** 
> 1. Run `npm run dev`
> 2. Navigate to each page
> 3. Take screenshots at 1920x1080 resolution
> 4. Save to `docs/screenshots/` with naming: `01-dashboard.png`, `02-clients.png`, etc.

---

## 🔧 Configuration

### Health Check Interval
Default: 60 seconds per monitor

Edit monitor → Set "Check Interval (seconds)"

### Retry Policy
Default: 3 retries before marking DOWN

Edit monitor → Set "Retry Policy"

### Monitor Types
- `HTTP` — Full HTTP health checks (current)
- `PING` — ICMP ping (infrastructure ready)
- `PORT` — TCP port checks (infrastructure ready)

### Cron Job Setup
Set up external cron to call `/api/cron/health-check`:

**Using cron-job.org:**
1. Go to [cron-job.org](https://cron-job.org)
2. Create new job:
   - URL: `https://yourdomain.com/api/cron/health-check`
   - Method: GET
   - Header: `Authorization: Bearer YOUR_CRON_SECRET`
   - Schedule: Every minute

**Using GitHub Actions:**
```yaml
name: Kayas Health Check
on:
  schedule:
    - cron: '* * * * *'  # Every minute
jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://yourdomain.com/api/cron/health-check
```

---

## 🔐 Authentication & Authorization

### User Roles

| Role | Permissions |
|------|-------------|
| **ADMIN** | Full access: Create/edit/delete everything |
| **VIEWER** | Read-only: View dashboard and incidents |
| **SUPERADMIN** | Reserved for future features |

### Login Flow
1. Navigate to `/login`
2. Enter email and password
3. Credentials verified against database (bcryptjs)
4. JWT session created
5. Redirect to dashboard

---

## 📊 Data Models

### Monitor Status
- `UP` — Site responding normally (HTTP 2xx/3xx)
- `DOWN` — Site unreachable or HTTP error (4xx/5xx)
- `COMPROMISED` — Malicious content or redirect hijacking
- `DEGRADED` — Slow response times
- `PAUSED` — Manually disabled

### Incident Severity
- `CRITICAL` — Security compromise
- `HIGH` — Service down
- `MEDIUM` — Intermittent issues
- `LOW` — Minor problems

### Incident Status
- `OPEN` — Currently occurring
- `ACKNOWLEDGED` — Team aware and working
- `RESOLVED` — Issue fixed

---

## 🧪 Testing & Debugging

### Manual Health Check
From dashboard: Click "Refresh Status" button (top-right)

Or via curl:
```bash
curl http://localhost:3000/api/test-health
```

### Viewing Logs
Check browser console for health check logs:
```
Created new incident: inc_abc123
Resolved incident: inc_def456
```

### Database Inspection
```sql
-- See all monitors
SELECT id, name, url, status, "lastCheckTime", "responseTimeMs"
FROM "Monitor" ORDER BY "lastCheckTime" DESC;

-- See active incidents
SELECT i.id, i.severity, i.status, i."errorDetail", i."openedAt"
FROM "Incident" i
WHERE i.status IN ('OPEN', 'ACKNOWLEDGED');
```

---

## 🚢 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Create project on [Vercel](https://vercel.com)
3. Set environment variables
4. Deploy automatically

### Docker
```bash
docker build -t kayas-watch .
docker-compose up
```

### Self-Hosted
1. Install Node.js and PostgreSQL
2. `git clone` repository
3. `npm install && npm run build`
4. `npm start`
5. Set up reverse proxy (nginx/Apache) with HTTPS

---

## 📈 Performance Considerations

### Health Checks
- Current: ~100 monitors per cron cycle
- Timeout: 60 seconds (Vercel limit)
- Batch sizes prevent connection pool exhaustion

### Database
- Primary keys on all models
- Unique constraints on email
- Foreign keys with cascade delete

### Dashboard
- Force-dynamic rendering (always fresh data)
- Parallel Prisma queries
- Client health aggregation at runtime

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Health check slow | Check DB connectivity, network to monitored URLs, Vercel logs |
| Incidents not created | Verify cron running, check CRON_SECRET, ensure PostgreSQL accessible |
| Login fails | Clear cookies, check NEXTAUTH_SECRET, verify users in DB |
| Monitor status not updating | Click refresh button, check network to URL, verify isActive=true |

---

## 📚 API Endpoints

### Public
- `GET /api/auth/callback/:provider` — OAuth callback
- `POST /api/auth/signin` — Sign in
- `POST /api/auth/signout` — Sign out

### Protected (JWT)
- `GET /api/test-health` — Manual health check
- `GET /api/cron/health-check` — Cron (requires CRON_SECRET)

### Server Actions
All CRUD with role-based authorization via `requireAdmin()`

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.2.10 | React framework |
| react | 19.2.4 | UI library |
| @prisma/client | 6.19.3 | Database ORM |
| next-auth | 4.24.14 | Authentication |
| bcryptjs | 3.0.3 | Password hashing |
| tailwindcss | 4.0 | CSS framework |
| lucide-react | 1.23.0 | Icons |
| date-fns | 4.4.0 | Date utilities |
| xlsx | 0.18.5 | Excel parsing |

---

## 🎯 Roadmap

- [ ] Public status pages for clients
- [ ] Email/SMS notifications
- [ ] Incident analytics & trending
- [ ] Response time degradation detection
- [ ] Slack/Discord/PagerDuty webhooks
- [ ] Multi-region monitoring
- [ ] Custom health check scripts
- [ ] Real-time WebSocket updates
- [ ] Team escalation policies
- [ ] REST/GraphQL API

---

## 📄 License

MIT License - See [LICENSE](LICENSE) for details

---

## 👥 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to branch
5. Open a Pull Request

---

## 🤝 Support

- 📋 [GitHub Issues](https://github.com/kayas881/kayas-watch/issues)
- 💬 [Discussions](https://github.com/kayas881/kayas-watch/discussions)
- 📖 [Docs](docs/)

---

## 🏢 About

**Kayas Watch** is built by Saral Infosoft for enterprise uptime monitoring and security incident management.

**Made with ❤️ for reliable web services**

---

*Last Updated: August 2026 | Version: 0.1.0*
