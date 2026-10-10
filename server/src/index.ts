import "dotenv/config";
import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import { prisma } from "./lib/prisma.js";
import { errorHandler } from "./lib/http.js";
import { authRouter } from "./routes/auth.js";
import { clientsRouter } from "./routes/clients.js";
import { websitesRouter } from "./routes/websites.js";
import { monitorsRouter } from "./routes/monitors.js";
import { usersRouter } from "./routes/users.js";
import { dashboardRouter } from "./routes/dashboard.js";
import { startHealthCron } from "./cron/healthCron.js";

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error("JWT_SECRET must be configured with at least 32 characters");
const app = express();
app.disable("x-powered-by");
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/clients", clientsRouter);
app.use("/api/websites", websitesRouter);
app.use("/api/monitors", monitorsRouter);
app.use("/api/users", usersRouter);
app.use("/api", (_req, res) => res.status(404).json({ error: "API route not found" }));
app.use(errorHandler);

const here = path.dirname(fileURLToPath(import.meta.url));
const adjacentPublic = path.resolve(here, "../public");
const publicDir = existsSync(adjacentPublic) ? adjacentPublic : path.resolve(here, "../../public");
app.use(express.static(publicDir));
app.get("/{*path}", (_req, res) => res.sendFile(path.join(publicDir, "index.html")));

const tasks = startHealthCron();
const server = app.listen(Number(process.env.PORT || 4000), () => console.log(`Saral Watch running on http://localhost:${process.env.PORT || 4000}`));
let stopping = false;
async function shutdown(signal: string) { if (stopping) return; stopping = true; console.log(`${signal}: shutting down`); tasks.forEach(task => task.stop()); server.close(async () => { await prisma.$disconnect(); process.exit(0); }); setTimeout(() => process.exit(1), 10_000).unref(); }
process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
