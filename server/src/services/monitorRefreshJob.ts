import { checkAllMonitors } from "./healthChecker.js";

export interface MonitorRefreshResult {
  checked: number;
  up: number;
  down: number;
  degraded: number;
  compromised: number;
}

export interface MonitorRefreshStatus {
  status: "idle" | "running" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  result: MonitorRefreshResult | null;
}

type RefreshRunner = () => Promise<MonitorRefreshResult>;

const idleStatus = (): MonitorRefreshStatus => ({ status: "idle", startedAt: null, completedAt: null, result: null });

/** Keeps one refresh job per application process so requests return immediately. */
export function createMonitorRefreshJob(run: RefreshRunner) {
  let running: Promise<void> | null = null;
  let status = idleStatus();

  function getStatus(): MonitorRefreshStatus {
    return status;
  }

  function start() {
    if (running) return { started: false, status: getStatus() };

    const startedAt = new Date().toISOString();
    status = { status: "running", startedAt, completedAt: null, result: null };
    running = run()
      .then(result => {
        status = { status: "completed", startedAt, completedAt: new Date().toISOString(), result };
      })
      .catch(error => {
        console.error("[MONITOR REFRESH] Health check failed", error);
        status = { status: "failed", startedAt, completedAt: new Date().toISOString(), result: null };
      })
      .finally(() => {
        running = null;
      });

    return { started: true, status: getStatus() };
  }

  return { getStatus, start };
}

export const monitorRefreshJob = createMonitorRefreshJob(checkAllMonitors);
