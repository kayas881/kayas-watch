# API Documentation

Complete reference for Kayas Watch API endpoints and server actions.

---

## Authentication

### JWT Session
Protected endpoints require a valid JWT session. Session is created via:
```bash
POST /api/auth/signin
{
  "email": "user@example.com",
  "password": "password"
}
```

### Bearer Token (Cron)
Health check endpoint requires Bearer token:
```bash
GET /api/cron/health-check
Authorization: Bearer YOUR_CRON_SECRET
```

---

## Health Check Endpoints

### Manual Health Check
Trigger a one-off health check of all active monitors.

```
GET /api/test-health
Authorization: (JWT Session)
```

**Response:**
```json
{
  "success": true,
  "message": "Health check completed",
  "data": {
    "checked": 5,
    "up": 4,
    "down": 1,
    "compromised": 0
  }
}
```

**Status Codes:**
- `200` — Health check completed
- `401` — Unauthorized (invalid or missing session)
- `500` — Internal server error

---

### Cron Health Check
Called by external cron service. Checks all active monitors and creates/updates incidents.

```
GET /api/cron/health-check
Authorization: Bearer YOUR_CRON_SECRET
```

**Query Parameters:**
- None

**Response:**
```json
{
  "success": true,
  "message": "Health check completed",
  "data": {
    "checked": 25,
    "up": 24,
    "down": 1,
    "compromised": 0
  }
}
```

**Error Responses:**
```json
{
  "error": "Unauthorized"
}
// 401 if CRON_SECRET doesn't match
```

**Max Duration:** 60 seconds (Vercel limit)

---

## Server Actions (CRUD Operations)

All CRUD operations use Next.js server actions. These require valid JWT session and ADMIN role (via `requireAdmin()`).

### Client Operations

#### Create Client
```typescript
import { createClient } from '@/app/(dashboard)/clients/actions';

const formData = new FormData();
formData.append('companyName', 'Acme Corp');
formData.append('primaryDomain', 'acme.com');
formData.append('contactPerson', 'John Doe');
formData.append('contactEmail', 'john@acme.com');
formData.append('supportSla', '99.9% uptime');
formData.append('maintenancePlan', 'Standard');

await createClient(formData);
```

**Required Fields:**
- `companyName` (string)

**Optional Fields:**
- `primaryDomain`
- `contactPerson`
- `contactEmail`
- `supportSla`
- `maintenancePlan`

**Returns:** Redirects to `/clients`

**Throws:** Error if not ADMIN

---

#### Update Client
```typescript
import { updateClient } from '@/app/(dashboard)/clients/actions';

const formData = new FormData();
formData.append('companyName', 'Acme Corp Updated');
// ... other fields

await updateClient(clientId, formData);
```

**Returns:** Redirects to `/clients`

---

#### Delete Client
```typescript
import { deleteClient } from '@/app/(dashboard)/clients/actions';

await deleteClient(clientId);
```

**Cascade:** Deletes all associated websites and monitors

**Returns:** Redirects to `/clients`

---

### Website Operations

#### Create Website
```typescript
import { createWebsite } from '@/app/(dashboard)/websites/actions';

const formData = new FormData();
formData.append('name', 'Main Website');
formData.append('url', 'https://acme.com');
formData.append('clientId', 'client-uuid-here');
formData.append('description', 'Main corporate website');

await createWebsite(formData);
```

**Required Fields:**
- `name` (string)
- `url` (string, must be valid URL)
- `clientId` (UUID, must exist)

**Optional Fields:**
- `description`

**Returns:** Redirects to `/websites`

---

#### Update Website
```typescript
import { updateWebsite } from '@/app/(dashboard)/websites/actions';

await updateWebsite(websiteId, formData);
```

---

#### Delete Website
```typescript
import { deleteWebsite } from '@/app/(dashboard)/websites/actions';

await deleteWebsite(websiteId);
```

**Cascade:** Deletes all associated monitors and incidents

---

### Monitor Operations

#### Create Monitor
```typescript
import { createMonitor } from '@/app/(dashboard)/monitors/actions';

const formData = new FormData();
formData.append('name', 'HTTPS Health Check');
formData.append('url', 'https://acme.com');
formData.append('websiteId', 'website-uuid');
formData.append('type', 'HTTP');
formData.append('intervalSeconds', '60');
formData.append('retryPolicy', '3');

await createMonitor(formData);
```

**Required Fields:**
- `name` (string)
- `url` (string)
- `websiteId` (UUID)
- `type` (string: "HTTP", "PING", "PORT")

**Optional Fields:**
- `intervalSeconds` (default: 60)
- `retryPolicy` (default: 3)

**Returns:** Redirects to `/monitors`

---

#### Update Monitor
```typescript
import { updateMonitor } from '@/app/(dashboard)/monitors/actions';

const formData = new FormData();
formData.append('name', 'Updated Name');
formData.append('url', 'https://acme.com');
formData.append('websiteId', 'website-uuid');
formData.append('type', 'HTTP');
formData.append('intervalSeconds', '120');
formData.append('retryPolicy', '5');
formData.append('isActive', 'on');  // checkbox

await updateMonitor(monitorId, formData);
```

---

#### Delete Monitor
```typescript
import { deleteMonitor } from '@/app/(dashboard)/monitors/actions';

await deleteMonitor(monitorId);
```

---

#### Toggle Monitor Status
```typescript
import { toggleMonitorStatus } from '@/app/(dashboard)/monitors/actions';

await toggleMonitorStatus(monitorId);
```

Toggles `isActive` between true/false.

---

### Incident Operations

#### Update Incident
```typescript
import { updateIncident } from '@/app/(dashboard)/incidents/actions';

const formData = new FormData();
formData.append('status', 'ACKNOWLEDGED');  // OPEN, ACKNOWLEDGED, RESOLVED
formData.append('severity', 'HIGH');        // LOW, MEDIUM, HIGH, CRITICAL

await updateIncident(incidentId, formData);
```

---

#### Add Incident Note
```typescript
import { addIncidentNote } from '@/app/(dashboard)/incidents/actions';

const formData = new FormData();
formData.append('content', 'Contacted hosting provider, investigating...');

await addIncidentNote(incidentId, formData);
```

**Required Fields:**
- `content` (string, min 1 char)

**Automatic Fields:**
- `userId` — from current session
- `createdAt` — server timestamp

---

### User Operations

#### Create User
```typescript
import { createUser } from '@/app/(dashboard)/settings/actions';

const formData = new FormData();
formData.append('email', 'newuser@example.com');
formData.append('password', 'initial-password');
formData.append('name', 'New User');
formData.append('role', 'ADMIN');  // ADMIN, VIEWER

await createUser(formData);
```

**Required Fields:**
- `email` (must be unique)
- `password` (will be hashed with bcryptjs)
- `role` (ADMIN or VIEWER)

**Optional Fields:**
- `name`

**Returns:** Redirects to `/settings`

**Note:** User should change password on first login

---

#### Delete User
```typescript
import { deleteUser } from '@/app/(dashboard)/settings/actions';

await deleteUser(userId);
```

**Cascade:** Deletes all incident notes created by user

---

## Error Handling

### Common Errors

**401 Unauthorized**
```json
{
  "error": "Unauthorized"
}
```
- Missing JWT session
- CRON_SECRET doesn't match
- Session expired

**403 Forbidden**
```json
{
  "error": "Forbidden"
}
```
- User is VIEWER, tried to modify data
- Called `requireAdmin()` as non-admin

**400 Bad Request**
```
Error: [Field Name] is required
```
- Missing required form field
- Invalid form data

**500 Internal Server Error**
```json
{
  "error": "Internal Server Error"
}
```
- Database connection error
- Unexpected exception

---

## Database Queries (for reference)

### Get User Session
```typescript
import { getSession } from '@/lib/auth';

const session = await getSession();
console.log(session.user.email);  // User's email
console.log(session.user.id);     // User's UUID
```

### Get All Active Monitors
```typescript
import { prisma } from '@/lib/prisma';

const monitors = await prisma.monitor.findMany({
  where: { isActive: true },
  include: { website: { include: { client: true } } }
});
```

### Get Open Incidents
```typescript
const incidents = await prisma.incident.findMany({
  where: { status: { in: ['OPEN', 'ACKNOWLEDGED'] } },
  include: { monitor: true, notes: { include: { user: true } } },
  orderBy: { openedAt: 'asc' }
});
```

### Get Client Health
```typescript
const clients = await prisma.client.findMany({
  include: {
    websites: {
      include: {
        monitors: { select: { status: true } }
      }
    }
  }
});

clients.forEach(client => {
  const monitors = client.websites.flatMap(w => w.monitors);
  const down = monitors.filter(m => m.status !== 'UP').length;
  console.log(`${client.companyName}: ${down}/${monitors.length} down`);
});
```

---

## Rate Limiting

Currently no rate limiting implemented. In production, consider:

```typescript
// Example: Add rate limiting middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100                    // 100 requests per window
});
```

---

## Webhooks (Future)

Planned webhook endpoints for third-party integrations:
- `POST /api/webhooks/slack` — Send incidents to Slack
- `POST /api/webhooks/discord` — Send incidents to Discord
- `POST /api/webhooks/pagerduty` — Create PagerDuty incidents

---

## Performance Tips

1. **Batch Requests:** Use Promise.all() for multiple creates
2. **Pagination:** Add `take` and `skip` for large queries
3. **Select Fields:** Only query needed fields
4. **Indexes:** Database has indexes on:
   - `User.email`
   - `Monitor.isActive`
   - `Incident.status`

---

## Example: Complete Workflow

```typescript
// 1. Create client
const clientData = new FormData();
clientData.append('companyName', 'Tech Startup Inc');
clientData.append('contactEmail', 'ops@techstartup.com');
await createClient(clientData);

// 2. Create website
const websiteData = new FormData();
websiteData.append('name', 'Main API');
websiteData.append('url', 'https://api.techstartup.com');
websiteData.append('clientId', 'client-id-from-db');
await createWebsite(websiteData);

// 3. Create monitor
const monitorData = new FormData();
monitorData.append('name', 'API Health Check');
monitorData.append('url', 'https://api.techstartup.com/health');
monitorData.append('websiteId', 'website-id-from-db');
monitorData.append('type', 'HTTP');
monitorData.append('intervalSeconds', '60');
await createMonitor(monitorData);

// 4. Manual health check (triggers from dashboard)
await fetch('/api/test-health', {
  method: 'GET'
});

// 5. If monitor is DOWN, incident created automatically
// 6. Add team note
const noteData = new FormData();
noteData.append('content', 'Investigating database connection issue');
await addIncidentNote('incident-id', noteData);

// 7. Update incident status
const updateData = new FormData();
updateData.append('status', 'ACKNOWLEDGED');
await updateIncident('incident-id', updateData);
```

---

**Last Updated:** August 2026
**Version:** 0.1.0
