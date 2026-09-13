import { prisma } from "./prisma";
import type { MonitorHealthStatus } from "./health-checker";

export async function handleMonitorStatusChange(
  monitorId: string,
  status: MonitorHealthStatus,
  summary: string,
  httpStatusCode?: number,
  errorDetail?: string
) {
  const monitor = await prisma.monitor.findUnique({ where: { id: monitorId } });

  if (!monitor) {
    console.warn(`No local monitor found for ID ${monitorId}`);
    return;
  }

  // Update monitor status is now handled in health-checker.ts, but we can do it here just in case.
  // Actually, health-checker does it. Let's still do it to be safe if called from elsewhere.
  await prisma.monitor.update({
    where: { id: monitor.id },
    data: {
      status,
      lastCheckTime: new Date()
    }
  });

  const existingIncident = await prisma.incident.findFirst({
    where: {
      monitorId: monitor.id,
      status: { in: ["OPEN", "ACKNOWLEDGED"] }
    }
  });

  if (status === "DOWN" || status === "DEGRADED" || status === "COMPROMISED") {
    const severity = status === "COMPROMISED" ? "CRITICAL" : status === "DOWN" ? "HIGH" : "MEDIUM";
    
    if (!existingIncident) {
      const newIncident = await prisma.incident.create({
        data: {
          monitorId: monitor.id,
          status: "OPEN",
          severity,
          summary,
          httpStatusCode: httpStatusCode ?? null,
          errorDetail: errorDetail ?? null,
        }
      });
      console.log(`Created new incident: ${newIncident.id}`);
    } else {
      // Update error detail on existing open incident so it stays current
      // Upgrade severity to CRITICAL if it became compromised
      await prisma.incident.update({
        where: { id: existingIncident.id },
        data: {
          severity: existingIncident.severity === "CRITICAL" ? "CRITICAL" : severity,
          summary,
          httpStatusCode: httpStatusCode ?? existingIncident.httpStatusCode,
          errorDetail: errorDetail ?? existingIncident.errorDetail,
        }
      });
    }
  } else if (status === "UP") {
    if (existingIncident) {
      await prisma.incident.update({
        where: { id: existingIncident.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          summary: `${existingIncident.summary} — RESOLVED: ${summary}`
        }
      });
      console.log(`Resolved incident: ${existingIncident.id}`);
    }
  }
}
