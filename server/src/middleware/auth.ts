import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";

export type SafeUser = { id: string; name: string | null; email: string; role: string };

declare global {
  namespace Express { interface Request { user?: SafeUser } }
}

function forbidden(res: Response, status: number, message: string) { return res.status(status).json({ error: message }); }

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return forbidden(res, 401, "Authentication required");
    const payload = jwt.verify(token, process.env.JWT_SECRET || "") as { sub?: string };
    if (!payload.sub) return forbidden(res, 401, "Invalid token");
    const user = await prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, name: true, email: true, role: true } });
    if (!user) return forbidden(res, 401, "User no longer exists");
    req.user = user;
    next();
  } catch { return forbidden(res, 401, "Invalid or expired token"); }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => req.user?.role === "VIEWER" ? forbidden(res, 403, "Administrator access required") : next());
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  return requireAuth(req, res, () => req.user?.role !== "SUPERADMIN" ? forbidden(res, 403, "Super administrator access required") : next());
}
