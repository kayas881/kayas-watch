import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncRoute } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.get("/", requireAuth, asyncRoute(async (_req, res) => {
  const [totalClients, totalMonitors, grouped, affected, clients] = await Promise.all([
    prisma.client.count(), prisma.monitor.count(), prisma.monitor.groupBy({ by: ["status"], _count: true }),
    prisma.monitor.findMany({ where: { status: { in: ["DOWN", "DEGRADED", "COMPROMISED"] } }, include: { website: { include: { client: { select: { companyName: true } } } }, pings: { orderBy: { checkedAt: "desc" }, take: 1 } }, orderBy: { lastCheckTime: "desc" } }),
    prisma.client.findMany({ include: { websites: { include: { monitors: { select: { status: true } } } } }, orderBy: { companyName: "asc" } }),
  ]);
  const count = (status: string) => grouped.find(g => g.status === status)?._count || 0;
  const sitesUp = count("UP"), sitesDown = count("DOWN"), sitesDegraded = count("DEGRADED"), sitesCompromised = count("COMPROMISED");
  res.json({ totalClients, totalMonitors, sitesUp, sitesDown, sitesDegraded, sitesCompromised, uptimePercent: totalMonitors ? Math.round(sitesUp / totalMonitors * 100) : 100, downMonitors: affected, clientHealth: clients.map(c => { const monitors = c.websites.flatMap(w => w.monitors); const down = monitors.filter(m => m.status !== "UP" && m.status !== "PAUSED").length; return { id: c.id, name: c.companyName, total: monitors.length, down, up: monitors.length - down }; }).sort((a, b) => b.down - a.down) });
}));
