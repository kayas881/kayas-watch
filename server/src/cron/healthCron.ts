import cron, { type ScheduledTask } from "node-cron";
import { checkAllMonitors, cleanupOldPings } from "../services/healthChecker.js";

function expression(seconds: number) {
  if (seconds < 60) return `*/${Math.max(1, seconds)} * * * * *`;
  if (seconds % 60 === 0 && seconds / 60 <= 59) return `*/${seconds / 60} * * * *`;
  return `*/${Math.max(1, Math.floor(seconds / 60))} * * * *`;
}

export function startHealthCron(): ScheduledTask[] {
  const seconds = Number.parseInt(process.env.CRON_INTERVAL_SECONDS || "300", 10);
  const health = cron.schedule(expression(Number.isFinite(seconds) ? seconds : 300), () => void checkAllMonitors().catch(error => console.error("[CRON] Health check failed", error)));
  const cleanup = cron.schedule("17 3 * * *", () => void cleanupOldPings().catch(error => console.error("[CRON] Cleanup failed", error)));
  return [health, cleanup];
}
