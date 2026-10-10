import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncRoute, ApiError } from "../lib/http.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();
const limiter = rateLimit({ windowMs: 15 * 60_000, limit: 5, standardHeaders: "draft-7", legacyHeaders: false, message: { error: "Too many login attempts. Try again in 15 minutes." } });

authRouter.post("/login", limiter, asyncRoute(async (req, res) => {
  const input = z.object({ email: z.email(), password: z.string().min(1) }).parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user || !await bcrypt.compare(input.password, user.password)) throw new ApiError(401, "Invalid email or password");
  const token = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET!, { expiresIn: "12h", issuer: "saral-watch" });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

authRouter.get("/me", requireAuth, (req, res) => res.json({ user: req.user }));
