import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { ApiError, asyncRoute } from "../lib/http.js";
import { requireAdmin, requireSuperAdmin } from "../middleware/auth.js";

export const usersRouter = Router();
const select = { id: true, name: true, email: true, role: true, createdAt: true } as const;
usersRouter.get("/", requireAdmin, asyncRoute(async (_req, res) => res.json(await prisma.user.findMany({ select, orderBy: { createdAt: "asc" } }))));
usersRouter.post("/", requireAdmin, asyncRoute(async (req, res) => {
  const input = z.object({ name: z.string().trim().min(1), email: z.email(), password: z.string().min(8), role: z.enum(["SUPERADMIN", "ADMIN", "VIEWER"]) }).parse(req.body);
  if (input.role === "SUPERADMIN" && req.user?.role !== "SUPERADMIN") throw new ApiError(403, "Only super administrators can create that role");
  res.status(201).json(await prisma.user.create({ data: { ...input, email: input.email.toLowerCase(), password: await bcrypt.hash(input.password, 12) }, select }));
}));
usersRouter.patch("/:id/role", requireSuperAdmin, asyncRoute(async (req, res) => {
  const { role } = z.object({ role: z.enum(["SUPERADMIN", "ADMIN", "VIEWER"]) }).parse(req.body);
  if (req.params.id === req.user?.id && role !== "SUPERADMIN") throw new ApiError(400, "You cannot demote your own account");
  res.json(await prisma.user.update({ where: { id: String(req.params.id) }, data: { role }, select }));
}));
usersRouter.delete("/:id", requireAdmin, asyncRoute(async (req, res) => {
  if (req.params.id === req.user?.id) throw new ApiError(400, "You cannot delete your own account");
  const target = await prisma.user.findUniqueOrThrow({ where: { id: String(req.params.id) } });
  if (target.role !== "VIEWER" && req.user?.role !== "SUPERADMIN") throw new ApiError(403, "Only super administrators can delete administrators");
  await prisma.user.delete({ where: { id: target.id } }); res.status(204).end();
}));
