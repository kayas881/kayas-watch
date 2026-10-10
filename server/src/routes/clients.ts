import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncRoute } from "../lib/http.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const clientsRouter = Router();
const nullable = z.string().trim().optional().nullable().transform(v => v || null);
const schema = z.object({ companyName: z.string().trim().min(1), primaryDomain: nullable, contactPerson: nullable, contactEmail: z.union([z.email(), z.literal(""), z.null()]).optional().transform(v => v || null), supportSla: nullable, maintenancePlan: nullable });

clientsRouter.get("/", requireAuth, asyncRoute(async (_req, res) => res.json(await prisma.client.findMany({ include: { _count: { select: { websites: true } } }, orderBy: { companyName: "asc" } }))));
clientsRouter.post("/", requireAdmin, asyncRoute(async (req, res) => res.status(201).json(await prisma.client.create({ data: schema.parse(req.body) }))));
clientsRouter.get("/:id", requireAuth, asyncRoute(async (req, res) => res.json(await prisma.client.findUniqueOrThrow({ where: { id: String(req.params.id) }, include: { websites: { include: { monitors: true } } } }))));
clientsRouter.put("/:id", requireAdmin, asyncRoute(async (req, res) => res.json(await prisma.client.update({ where: { id: String(req.params.id) }, data: schema.parse(req.body) }))));
clientsRouter.delete("/:id", requireAdmin, asyncRoute(async (req, res) => { await prisma.client.delete({ where: { id: String(req.params.id) } }); res.status(204).end(); }));
