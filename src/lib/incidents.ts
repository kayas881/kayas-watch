import { prisma } from "./prisma";

export async function handleMonitorStatusChange(monitorIdOrKumaId: string | number, status: "UP" | "DOWN", summary: string) {
  let monitor;
  if (typeof monitorIdOrKumaId === "number") {
    monitor = await prisma.monitor.findFirst({ where: { kumaMonitorId: monitorIdOrKumaId } });
  } else {
    monitor = await prisma.monitor.findUnique({ where: { id: String(monitorIdOrKumaId) } });
  }

  if (!monitor) {
    console.warn(`No local monitor found for ID ${monitorIdOrKumaId}`);
    return;
  }

  // Update monitor status
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

  if (status === "DOWN") {
    if (!existingIncident) {
      const newIncident = await prisma.incident.create({
        data: {
          monitorId: monitor.id,
          status: "OPEN",
          severity: "HIGH",
          summary,
        }
      });
      console.log(`Created new incident: ${newIncident.id}`);
      
      // TODO: triggerNotifications(newIncident); (Deferred)
    }
  } else if (status === "UP") {
    if (existingIncident) {
      await prisma.incident.update({
        where: { id: existingIncident.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          summary: `${existingIncident.summary} - RESOLVED: ${summary}`
        }
      });
      console.log(`Resolved incident: ${existingIncident.id}`);
    }
  }
}
