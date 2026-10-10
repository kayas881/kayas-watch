import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it, vi } from "vitest";

const findUser = vi.hoisted(() => vi.fn());
vi.mock("../lib/prisma.js", () => ({ prisma: { user: { findUnique: findUser } } }));

import { requireAdmin, requireAuth, requireSuperAdmin } from "./auth.js";

const secret = "test-jwt-secret-that-is-at-least-32-characters";

function context(role: string) {
  const token = jwt.sign({ sub: "user-1", role }, secret);
  const req = { headers: { authorization: `Bearer ${token}` } } as Request;
  const res = { status: vi.fn(), json: vi.fn() } as unknown as Response;
  vi.mocked(res.status).mockReturnValue(res);
  vi.mocked(res.json).mockReturnValue(res);
  const next = vi.fn() as NextFunction;
  findUser.mockResolvedValue({ id: "user-1", name: "User", email: "user@example.com", role });
  return { req, res, next };
}

describe("authentication and roles", () => {
  beforeEach(() => { vi.clearAllMocks(); process.env.JWT_SECRET = secret; });

  it("authenticates a valid bearer token", async () => {
    const { req, res, next } = context("VIEWER");
    await requireAuth(req, res, next);
    expect(next).toHaveBeenCalledOnce();
    expect(req.user?.email).toBe("user@example.com");
  });

  it("prevents viewers from using administrator routes", async () => {
    const { req, res, next } = context("VIEWER");
    await requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("allows admins and reserves super-admin routes for SUPERADMIN", async () => {
    const admin = context("ADMIN");
    await requireAdmin(admin.req, admin.res, admin.next);
    expect(admin.next).toHaveBeenCalledOnce();

    const denied = context("ADMIN");
    await requireSuperAdmin(denied.req, denied.res, denied.next);
    expect(denied.res.status).toHaveBeenCalledWith(403);

    const superAdmin = context("SUPERADMIN");
    await requireSuperAdmin(superAdmin.req, superAdmin.res, superAdmin.next);
    expect(superAdmin.next).toHaveBeenCalledOnce();
  });
});
