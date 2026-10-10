import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { asyncRoute } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.get("/", requireAuth, asyncRoute(async (_req, res) => {
  const since = new Date(Date.now() - 7 * 86_400_000);
  const [totalClients, monitors, affected, clients, pings] = await Promise.all([
    prisma.client.count(),
    prisma.monitor.findMany({ select: { status: true, isActive: true } }),
    prisma.monitor.findMany({ where: { isActive: true, status: { in: ["DOWN", "DEGRADED", "COMPROMISED"] } }, include: { website: { include: { client: { select: { companyName: true } } } }, pings: { orderBy: { checkedAt: "desc" }, take: 1 } }, orderBy: { lastCheckTime: "desc" } }),
    prisma.client.findMany({ include: { websites: { include: { monitors: { select: { status: true, isActive: true } } } } }, orderBy: { companyName: "asc" } }),
    prisma.monitorPing.findMany({ where: { checkedAt: { gte: since }, responseTimeMs: { not: null } }, select: { checkedAt: true, responseTimeMs: true }, orderBy: { checkedAt: "asc" } }),
  ]);
  const active = monitors.filter(m => m.isActive);
  const count = (status: string) => active.filter(m => m.status === status).length;
  const sitesUp = count("UP"), sitesDown = count("DOWN"), sitesDegraded = count("DEGRADED"), sitesCompromised = count("COMPROMISED"), paused = monitors.length - active.length;
  const byDay = new Map<string, { total: number; count: number }>();
  for (const ping of pings) {
    const day = ping.checkedAt.toISOString().slice(0, 10);
    const current = byDay.get(day) || { total: 0, count: 0 };
    current.total += ping.responseTimeMs || 0; current.count += 1; byDay.set(day, current);
  }
  const responseTrend = [...byDay].map(([date, value]) => ({ date, averageResponseTimeMs: Math.round(value.total / value.count), samples: value.count }));
  res.json({
    totalClients, totalMonitors: monitors.length, activeMonitors: active.length, paused, sitesUp, sitesDown, sitesDegraded, sitesCompromised,
    uptimePercent: active.length ? Math.round(sitesUp / active.length * 100) : 100,
    statusDistribution: [
      { status: "UP", count: sitesUp }, { status: "DOWN", count: sitesDown }, { status: "DEGRADED", count: sitesDegraded }, { status: "COMPROMISED", count: sitesCompromised }, { status: "PAUSED", count: paused },
    ],
    responseTrend,
    downMonitors: affected,
    clientHealth: clients.map(c => {
      const clientMonitors = c.websites.flatMap(w => w.monitors); const activeMonitors = clientMonitors.filter(m => m.isActive);
      const down = activeMonitors.filter(m => m.status !== "UP").length;
      return { id: c.id, name: c.companyName, total: clientMonitors.length, active: activeMonitors.length, down, up: activeMonitors.length - down, paused: clientMonitors.length - activeMonitors.length };
    }).sort((a, b) => b.down - a.down || a.name.localeCompare(b.name)),
  });
}));
