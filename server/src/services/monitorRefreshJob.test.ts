import { describe, expect, it } from "vitest";
import { createMonitorRefreshJob } from "./monitorRefreshJob.js";

describe("monitor refresh job", () => {
  it("runs only one refresh at a time and records the completed result", async () => {
    let resolveRun!: (value: { checked: number; up: number; down: number; degraded: number; compromised: number }) => void;
    let calls = 0;
    const job = createMonitorRefreshJob(() => {
      calls++;
      return new Promise(resolve => { resolveRun = resolve; });
    });

    expect(job.start()).toMatchObject({ started: true, status: { status: "running" } });
    expect(job.start()).toMatchObject({ started: false, status: { status: "running" } });
    expect(calls).toBe(1);

    resolveRun({ checked: 2, up: 2, down: 0, degraded: 0, compromised: 0 });
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(job.getStatus()).toMatchObject({
      status: "completed",
      result: { checked: 2, up: 2, down: 0, degraded: 0, compromised: 0 },
    });
  });

  it("reports a failed job without leaving the job locked", async () => {
    const job = createMonitorRefreshJob(async () => { throw new Error("target unavailable"); });

    job.start();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(job.getStatus()).toMatchObject({ status: "failed", result: null });
    expect(job.start()).toMatchObject({ started: true, status: { status: "running" } });
  });
});
