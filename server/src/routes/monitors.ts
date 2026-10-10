import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncRoute } from "../lib/http.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { checkAllMonitors } from "../services/healthChecker.js";

export const monitorsRouter = Router();
const schema = z.object({ websiteId: z.string().min(1), name: z.string().trim().min(1), type: z.string().trim().min(1).default("HTTP"), url: z.url(), intervalSeconds: z.coerce.number().int().min(20).default(60), retryPolicy: z.coerce.number().int().min(0).max(10).default(3), isActive: z.boolean().default(true) });
monitorsRouter.get("/", requireAuth, asyncRoute(async (_req, res) => res.json(await prisma.monitor.findMany({ include: { website: { include: { client: { select: { companyName: true } } } } }, orderBy: { name: "asc" } }))));
monitorsRouter.post("/", requireAdmin, asyncRoute(async (req, res) => res.status(201).json(await prisma.monitor.create({ data: schema.parse(req.body) }))));
monitorsRouter.post("/refresh-all", requireAdmin, asyncRoute(async (_req, res) => res.json(await checkAllMonitors())));
monitorsRouter.get("/:id/pings", requireAuth, asyncRoute(async (req, res) => res.json(await prisma.monitorPing.findMany({ where: { monitorId: String(req.params.id) }, orderBy: { checkedAt: "desc" }, take: 50 }))));
monitorsRouter.get("/:id", requireAuth, asyncRoute(async (req, res) => res.json(await prisma.monitor.findUniqueOrThrow({ where: { id: String(req.params.id) }, include: { website: { include: { client: true } } } }))));
monitorsRouter.put("/:id", requireAdmin, asyncRoute(async (req, res) => res.json(await prisma.monitor.update({ where: { id: String(req.params.id) }, data: schema.parse(req.body) }))));
monitorsRouter.delete("/:id", requireAdmin, asyncRoute(async (req, res) => { await prisma.monitor.delete({ where: { id: String(req.params.id) } }); res.status(204).end(); }));
