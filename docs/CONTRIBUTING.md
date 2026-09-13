# Contributing to Kayas Watch

Thank you for your interest in contributing to Kayas Watch! This document provides guidelines and instructions for contributing to the project.

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Coding Standards](#coding-standards)
8. [Architecture](#architecture)

---

## Code of Conduct

Be respectful, inclusive, and constructive. We're building a tool to help businesses maintain reliability.

---

## Getting Started

### Fork & Clone
```bash
# Fork on GitHub, then:
git clone https://github.com/YOUR-USERNAME/kayas-watch.git
cd kayas-watch
git remote add upstream https://github.com/kayas881/kayas-watch.git
```

### Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

Use kebab-case branch names:
- `feature/email-notifications`
- `fix/redirect-detection-bug`
- `docs/api-endpoints`

---

## Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
```

Configure the variables (see [.env.example](.env.example))

### 3. Database Setup
```bash
npm run build
```

### 4. Start Dev Server
```bash
npm run dev
```

### 5. Verify It Works
- Visit [http://localhost:3000/login](http://localhost:3000/login)
- Create an account
- Navigate to dashboard

---

## Making Changes

### Understanding the Codebase

**Key Directories:**
```
src/
├── app/
│   ├── (dashboard)/    # Protected pages
│   ├── api/            # API routes
│   └── login/          # Public login
├── lib/
│   ├── health-checker.ts      # Core health check logic
│   ├── incidents.ts           # Incident management
│   └── auth.ts                # Authentication
└── components/         # React components
```

**Key Files to Know:**
- `lib/health-checker.ts` — Two-phase health check system
- `lib/incidents.ts` — Incident creation/resolution logic
- `app/(dashboard)/page.tsx` — Dashboard UI
- `prisma/schema.prisma` — Database schema

### Common Tasks

#### Add a New Monitor Type (e.g., PING)

1. **Update Schema** (`prisma/schema.prisma`):
```typescript
model Monitor {
  type  String  @default("HTTP")  // Add PING, PORT options
  // ...
}
```

2. **Update Health Checker** (`src/lib/health-checker.ts`):
```typescript
export async function checkSiteHealth(url: string, type: string) {
  if (type === 'PING') {
    return await checkPing(url);
  } else if (type === 'PORT') {
    return await checkPort(url);
  }
  // Default HTTP
  return await checkHttp(url);
}

async function checkPing(url: string) {
  // Implement ping logic
  return { status: "UP", responseTimeMs: 45 };
}
```

3. **Update UI** (`app/(dashboard)/monitors/MonitorForm.tsx`):
```typescript
<select name="type">
  <option value="HTTP">HTTP</option>
  <option value="PING">PING</option>
  <option value="PORT">PORT</option>
</select>
```

4. **Test** — Verify new type works end-to-end

---

#### Add Email Notifications

1. **Install Email Library**:
```bash
npm install nodemailer
```

2. **Add to Environment** (`.env.local`):
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="app-password"
```

3. **Create Email Service** (`src/lib/email.ts`):
```typescript
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  }
});

export async function sendIncidentEmail(to: string, subject: string, html: string) {
  return await transporter.sendMail({
    from: process.env.SMTP_USER,
    to,
    subject,
    html
  });
}
```

4. **Call from Incident Handler** (`src/lib/incidents.ts`):
```typescript
import { sendIncidentEmail } from './email';

export async function handleMonitorStatusChange(...) {
  // ... existing logic ...
  
  if (status === 'DOWN') {
    await sendIncidentEmail(
      adminEmail,
      `Alert: ${monitor.name} is DOWN`,
      `<p>${monitor.name} stopped responding at ${new Date().toISOString()}</p>`
    );
  }
}
```

5. **Test** — Trigger a health check and verify email is sent

---

#### Add Slack Integration

1. **Install Slack SDK**:
```bash
npm install @slack/web-api
```

2. **Add Environment Variable**:
```env
SLACK_BOT_TOKEN="xoxb-your-token"
SLACK_CHANNEL_ID="C123456789"
```

3. **Create Slack Service** (`src/lib/slack.ts`):
```typescript
import { WebClient } from '@slack/web-api';

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlackAlert(message: string) {
  return await slack.chat.postMessage({
    channel: process.env.SLACK_CHANNEL_ID,
    text: message
  });
}
```

4. **Integrate** (`src/lib/incidents.ts`):
```typescript
import { sendSlackAlert } from './slack';

// In handleMonitorStatusChange:
if (status === 'DOWN') {
  await sendSlackAlert(`🚨 ${monitor.name} is DOWN - ${errorDetail}`);
}
```

---

### Modifying Database Schema

1. **Update** `prisma/schema.prisma`
2. **Create Migration**:
```bash
npx prisma migrate dev --name add_my_field
```
3. **Test** — Verify data persists correctly

---

## Testing

### Manual Testing
1. Create test clients/websites in UI
2. Manually trigger health checks
3. Verify incidents are created/resolved
4. Check database state directly:
```bash
psql $DATABASE_URL
SELECT * FROM "Monitor";
SELECT * FROM "Incident";
```

### Testing Health Checks
```bash
# Manual trigger
curl http://localhost:3000/api/test-health

# Should return:
# {
#   "success": true,
#   "data": { "checked": N, "up": N, "down": N, "compromised": N }
# }
```

### Testing Cron Endpoint
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  http://localhost:3000/api/cron/health-check
```

---

## Submitting Changes

### Before Submitting

1. **Run Linter** (if applicable):
```bash
npm run lint
```

2. **Test Your Changes**:
   - Verify feature works as intended
   - Test error cases
   - Check database state

3. **Update Docs** if applicable:
   - README.md (if user-facing)
   - docs/API.md (if API changes)
   - docs/GETTING_STARTED.md (if setup changes)

### Create Pull Request

1. **Push Branch**:
```bash
git push origin feature/your-feature-name
```

2. **Open PR on GitHub**:
   - Clear title: "Add email notifications"
   - Description of what changed and why
   - Reference any related issues: "Fixes #123"

3. **PR Template**:
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement

## Testing
How was this tested?

## Screenshots (if UI changes)
[Add screenshots if applicable]

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No breaking changes
- [ ] Tested locally
```

### Code Review

- Respond to review comments professionally
- Make requested changes
- Request re-review once complete
- Maintainers will merge when approved

---

## Coding Standards

### TypeScript
- Use strict type checking
- Avoid `any` — use specific types
- Type function parameters and returns

```typescript
// Good
function createIncident(
  monitorId: string, 
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
): Promise<Incident> {
  // ...
}

// Avoid
function createIncident(monitorId: any, severity: any): any {
  // ...
}
```

### React Components
- Use functional components
- Use TypeScript interfaces for props
- Keep components focused and single-responsibility

```typescript
interface MonitorCardProps {
  monitor: Monitor;
  onRefresh: () => Promise<void>;
}

export function MonitorCard({ monitor, onRefresh }: MonitorCardProps) {
  // Component logic
}
```

### Error Handling
- Always handle Promise rejections
- Provide meaningful error messages
- Log errors for debugging

```typescript
try {
  await checkSiteHealth(url);
} catch (err: any) {
  console.error(`Health check failed for ${url}:`, err.message);
  throw new Error(`Failed to check ${url}: ${err.message}`);
}
```

### Server Actions
- Use async/await (not callbacks)
- Call `requireAdmin()` for protected operations
- Revalidate cache after mutations
- Redirect after successful operations

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth-utils';

export async function deleteMonitor(id: string) {
  await requireAdmin();  // Protect endpoint
  
  await prisma.monitor.delete({ where: { id } });
  
  revalidatePath('/monitors');  // Clear cache
  redirect('/monitors');  // Navigate
}
```

### Database Operations
- Use Prisma for all queries (no raw SQL)
- Include relations when needed
- Use `select` to only fetch needed fields

```typescript
// Good
const monitor = await prisma.monitor.findUnique({
  where: { id },
  include: { website: { include: { client: true } } }
});

// Also good (only needed fields)
const monitors = await prisma.monitor.findMany({
  where: { isActive: true },
  select: { id: true, name: true, status: true }
});
```

---

## Architecture

### Adding a New Page

1. **Create Route**:
```
src/app/(dashboard)/my-feature/page.tsx
```

2. **Create Form Component** (if needed):
```
src/app/(dashboard)/my-feature/MyFeatureForm.tsx
```

3. **Create Server Action**:
```
src/app/(dashboard)/my-feature/actions.ts
```

4. **Create Database Model** (if needed):
```
// In prisma/schema.prisma
model MyFeature {
  id        String   @id @default(uuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

5. **Run Migration**:
```bash
npx prisma migrate dev --name add_my_feature
```

6. **Add to Sidebar**:
```
src/components/Sidebar.tsx
```

### Health Check Flow

```
Cron calls /api/cron/health-check
  ↓
checkAllMonitors() reads active monitors
  ↓
Phase 1: checkSiteHealth() on all (batch size 10)
  ↓
handleMonitorStatusChange() updates DB + creates incidents
  ↓
Phase 2: deepScanForCompromise() on UP sites (batch size 5)
  ↓
handleMonitorStatusChange() handles compromised sites
  ↓
Return summary stats
```

### Incident Lifecycle

```
Monitor status changes to DOWN/COMPROMISED
  ↓
handleMonitorStatusChange() called
  ↓
Create new incident (if none open)
  OR
Update existing incident
  ↓
Monitor status changes to UP
  ↓
Find open incident
  ↓
Update status to RESOLVED, set resolvedAt
```

---

## Questions?

- 📖 [API Documentation](./API.md)
- 📝 [Getting Started Guide](./GETTING_STARTED.md)
- 📋 [Architecture Doc](./architecture.md)
- 🐛 Open an [Issue](https://github.com/kayas881/kayas-watch/issues)

---

**Happy contributing! 🚀**
