import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncRoute } from "../lib/http.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

export const websitesRouter = Router();
const schema = z.object({ name: z.string().trim().min(1), url: z.url(), clientId: z.string().min(1), description: z.string().optional().nullable().transform(v => v || null) });
const normalizeUrl = (value: string) => /^https?:\/\//i.test(value.trim()) ? value.trim() : `https://${value.trim()}`;

websitesRouter.get("/", requireAuth, asyncRoute(async (_req, res) => res.json(await prisma.website.findMany({ include: { client: { select: { id: true, companyName: true } }, monitors: { select: { id: true, status: true, isActive: true, responseTimeMs: true, lastCheckTime: true } }, _count: { select: { monitors: true } } }, orderBy: { name: "asc" } }))));
websitesRouter.post("/", requireAdmin, asyncRoute(async (req, res) => res.status(201).json(await prisma.website.create({ data: schema.parse(req.body) }))));
websitesRouter.post("/bulk-import", requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({ rows: z.array(z.object({ category: z.string().optional(), url: z.string().min(1), notes: z.string().optional() })), createMonitors: z.boolean().default(true) }).parse(req.body);
  let importedCount = 0; const errors: { url: string; error: string }[] = [];
  const importedUrls = new Set<string>();
  for (const row of input.rows) {
    try {
      const url = normalizeUrl(row.url); const domain = new URL(url).hostname.replace(/^www\./i, "");
      if (importedUrls.has(url)) continue;
      importedUrls.add(url);
      let client = await prisma.client.findFirst({ where: { primaryDomain: domain } });
      client ??= await prisma.client.create({ data: { companyName: domain, primaryDomain: domain } });
      let website = await prisma.website.findFirst({ where: { clientId: client.id, url } });
      website ??= await prisma.website.create({ data: { clientId: client.id, name: domain, url, description: [row.category && `Category: ${row.category}`, row.notes && `Notes: ${row.notes}`].filter(Boolean).join("\n") || null } });
      if (input.createMonitors && !await prisma.monitor.findFirst({ where: { websiteId: website.id } })) await prisma.monitor.create({ data: { websiteId: website.id, name: domain, url } });
      importedCount++;
    } catch (error) { errors.push({ url: row.url, error: error instanceof Error ? error.message : "Invalid row" }); }
  }
  res.json({ importedCount, errors });
}));
websitesRouter.post("/sync-monitors", requireAdmin, asyncRoute(async (_req, res) => {
  const websites = await prisma.website.findMany({ where: { monitors: { none: {} } } });
  await prisma.monitor.createMany({ data: websites.map(w => ({ websiteId: w.id, name: w.name, url: w.url })) });
  res.json({ syncedCount: websites.length });
}));
websitesRouter.get("/:id", requireAuth, asyncRoute(async (req, res) => res.json(await prisma.website.findUniqueOrThrow({ where: { id: String(req.params.id) }, include: { client: true, monitors: true } }))));
websitesRouter.put("/:id", requireAdmin, asyncRoute(async (req, res) => res.json(await prisma.website.update({ where: { id: String(req.params.id) }, data: schema.parse(req.body) }))));
websitesRouter.delete("/:id", requireAdmin, asyncRoute(async (req, res) => { await prisma.website.delete({ where: { id: String(req.params.id) } }); res.status(204).end(); }));
