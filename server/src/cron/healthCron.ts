import cron, { type ScheduledTask } from "node-cron";
import { cleanupOldPings } from "../services/healthChecker.js";
import { monitorRefreshJob } from "../services/monitorRefreshJob.js";

function expression(seconds: number) {
  if (seconds < 60) return `*/${Math.max(1, seconds)} * * * * *`;
  if (seconds % 60 === 0 && seconds / 60 <= 59) return `*/${seconds / 60} * * * *`;
  return `*/${Math.max(1, Math.floor(seconds / 60))} * * * *`;
}

export function startHealthCron(): ScheduledTask[] {
  const seconds = Number.parseInt(process.env.CRON_INTERVAL_SECONDS || "300", 10);
  const health = cron.schedule(expression(Number.isFinite(seconds) ? seconds : 300), () => {
    const refresh = monitorRefreshJob.start();
    if (!refresh.started) console.info("[CRON] Skipped scheduled health check because a refresh is already running");
  });
  const cleanup = cron.schedule("17 3 * * *", () => void cleanupOldPings().catch(error => console.error("[CRON] Cleanup failed", error)));
  return [health, cleanup];
}
