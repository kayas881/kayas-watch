import type { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function asyncRoute(handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => void handler(req, res, next).catch(next);
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) return res.status(400).json({ error: "Validation failed", details: error.issues });
  if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return res.status(409).json({ error: "A record with this value already exists" });
    if (error.code === "P2025") return res.status(404).json({ error: "Record not found" });
  }
  console.error(error);
  return res.status(500).json({ error: "Internal server error" });
}
