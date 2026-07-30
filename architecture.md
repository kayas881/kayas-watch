# kayas Watch Architecture & Database Schema

## 1. System Overview
kayas Watch is a SaaS-style internal web application designed for kayas Infosoft to monitor client websites, services, and APIs. It relies on Uptime Kuma as the core monitoring engine, while providing a custom, multi-tenant administrative dashboard, incident management, and reporting system.

## 2. Technology Stack
- **Framework**: Next.js (React) App Router for both UI and internal API routes.
- **Styling**: Tailwind CSS for rapid MVP development and clean dashboard UX.
- **Database**: PostgreSQL (managed via Prisma ORM).
- **Monitoring Engine**: Uptime Kuma (running in a separate container, source of truth).
- **Containerization**: Docker & Docker Compose (PostgreSQL, Uptime Kuma).

## 3. High-Level Architecture
1. **Next.js App**: A single monolithic codebase containing:
   - Administrative dashboard UI (Frontend).
   - API routes for auth, business logic, multi-tenancy, and database access.
   - Uptime Kuma integration layer (fetching/provisioning monitors).
   - Webhooks to receive status changes from Uptime Kuma.
2. **Uptime Kuma**: Acts strictly as a headless monitoring engine. It performs the actual HTTP, TCP, Ping, and DNS checks.
3. **PostgreSQL**: Stores users, clients, websites, monitors, incidents, and audit logs.

## 4. Database Schema (Prisma ORM notation)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(ADMIN)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  IncidentNotes IncidentNote[]
}

enum Role {
  SUPERADMIN
  ADMIN
  VIEWER
}

model Client {
  id             String    @id @default(uuid())
  companyName    String
  primaryDomain  String?
  contactPerson  String?
  contactEmail   String?
  supportSla     String?
  maintenancePlan String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  websites       Website[]
  statusPages    StatusPage[]
}

model Website {
  id          String   @id @default(uuid())
  clientId    String
  name        String
  url         String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  client      Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  monitors    Monitor[]
}

model Monitor {
  id              String   @id @default(uuid())
  websiteId       String
  kumaMonitorId   Int?     // References the ID in Uptime Kuma
  name            String
  type            MonitorType
  url             String
  intervalSeconds Int      @default(60)
  retryPolicy     Int      @default(3) // retries before marking down
  isActive        Boolean  @default(true)
  sslExpiryDays   Int?     // Days until SSL expires (if tracked)
  lastCheckTime   DateTime?
  status          MonitorStatus @default(UP)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  website         Website  @relation(fields: [websiteId], references: [id], onDelete: Cascade)
  incidents       Incident[]
}

enum MonitorType {
  HTTP
  PING
  PORT
  KEYWORD
  DNS
}

enum MonitorStatus {
  UP
  DOWN
  DEGRADED
  MAINTENANCE
  PAUSED
}

model Incident {
  id          String         @id @default(uuid())
  monitorId   String
  status      IncidentStatus @default(OPEN)
  severity    Severity       @default(HIGH)
  openedAt    DateTime       @default(now())
  resolvedAt  DateTime?
  summary     String?
  
  monitor     Monitor        @relation(fields: [monitorId], references: [id], onDelete: Cascade)
  notes       IncidentNote[]
  events      IncidentEvent[]
}

enum IncidentStatus {
  OPEN
  ACKNOWLEDGED
  RESOLVED
}

enum Severity {
  CRITICAL
  HIGH
  MEDIUM
  LOW
}

model IncidentNote {
  id         String   @id @default(uuid())
  incidentId String
  userId     String
  content    String
  createdAt  DateTime @default(now())
  
  incident   Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
  user       User     @relation(fields: [userId], references: [id])
}

model IncidentEvent {
  id         String   @id @default(uuid())
  incidentId String
  type       String   // e.g., "STATUS_CHANGE", "NOTIFICATION_SENT"
  details    Json?
  createdAt  DateTime @default(now())
  
  incident   Incident @relation(fields: [incidentId], references: [id], onDelete: Cascade)
}

model StatusPage {
  id          String   @id @default(uuid())
  clientId    String?  // Optional: if null, it's a global public status page
  slug        String   @unique
  title       String
  description String?
  isPublic    Boolean  @default(true)
  branding    Json?    // Stores custom logo/colors
  createdAt   DateTime @default(now())
  
  client      Client?  @relation(fields: [clientId], references: [id], onDelete: Cascade)
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  entity    String
  entityId  String?
  details   Json?
  createdAt DateTime @default(now())
}
```

## 5. Uptime Kuma Integration Strategy
- **Provisioning**: The Next.js API routes will create corresponding monitors in Uptime Kuma when created in the kayas Watch dashboard.
- **Syncing & Webhooks**: Uptime Kuma will be configured to send webhooks to Next.js (`/api/webhooks/kuma`) when monitor status changes.
- **Alert Noise Reduction**: The Next.js API will process the webhook, check the `retryPolicy`, and open an `Incident` only after repeated failures.

## 6. Implementation Steps
1. **Next.js Scaffold**: Setup Next.js, Tailwind, Prisma.
2. **Schema & Auth**: Prisma migrations and NextAuth/custom JWT boundary.
3. **Client & Monitor CRUD**: UI and API routes for Clients and Monitors.
4. **Integration Layer**: Uptime Kuma API sync and webhooks.
5. **Incidents**: Automate incidents upon webhook triggers.
