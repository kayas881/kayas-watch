import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMonitor: vi.fn(),
  createPing: vi.fn(),
  updatePing: vi.fn(),
  deleteMany: vi.fn(),
}));

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    monitor: { findMany: db.findMany, update: db.updateMonitor },
    monitorPing: { create: db.createPing, update: db.updatePing, deleteMany: db.deleteMany },
    $transaction: (operations: Promise<unknown>[]) => Promise.all(operations),
  },
}));

import { checkAllMonitors, cleanupOldPings } from "./healthChecker.js";

describe("health-check persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.findMany.mockResolvedValue([{ id: "monitor-1", url: "data:text/html,<html><body>Healthy</body></html>", retryPolicy: 1 }]);
    db.updateMonitor.mockResolvedValue({ id: "monitor-1" });
    db.createPing.mockResolvedValue({ id: "ping-1" });
    db.updatePing.mockResolvedValue({ id: "ping-1" });
    db.deleteMany.mockResolvedValue({ count: 2 });
  });

  it("updates the monitor and records exactly one ping per check", async () => {
    await expect(checkAllMonitors()).resolves.toMatchObject({ checked: 1, up: 1 });
    expect(db.updateMonitor).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "monitor-1" }, data: expect.objectContaining({ status: "UP" }) }));
    expect(db.createPing).toHaveBeenCalledTimes(1);
    expect(db.createPing).toHaveBeenCalledWith({ data: expect.objectContaining({ monitorId: "monitor-1", status: "UP", httpStatusCode: 200 }) });
  });

  it("deletes ping history older than seven days", async () => {
    await cleanupOldPings();
    const cutoff = db.deleteMany.mock.calls[0][0].where.checkedAt.lt as Date;
    expect(cutoff).toBeInstanceOf(Date);
    expect(Date.now() - cutoff.getTime()).toBeGreaterThanOrEqual(7 * 86_400_000 - 1000);
  });
});
