"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { 
  syncMonitorToKuma, 
  editMonitorInKuma, 
  deleteMonitorInKuma, 
  pauseMonitorInKuma, 
  resumeMonitorInKuma 
} from "@/lib/kuma";

import { requireAdmin } from "@/lib/auth-utils";

// --- Monitors ---

export async function createMonitor(formData: FormData) {
  await requireAdmin();
  
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const websiteId = formData.get("websiteId") as string;
  const type = formData.get("type") as string;
  const intervalSeconds = parseInt(formData.get("intervalSeconds") as string, 10) || 60;
  const retryPolicy = parseInt(formData.get("retryPolicy") as string, 10) || 3;

  if (!name || !url || !websiteId || !type) {
    throw new Error("Name, URL, Website, and Type are required");
  }

  // 1. Create in Uptime Kuma first to get the kumaMonitorId
  let kumaMonitorId: number;
  try {
    kumaMonitorId = await syncMonitorToKuma({
      name,
      type,
      url,
      intervalSeconds,
      retryPolicy,
    });
  } catch (err: any) {
    console.error("Failed to create monitor in Kuma:", err);
    throw new Error(err.message || "Failed to communicate with Uptime Kuma.");
  }

  // 2. Create in PostgreSQL
  await prisma.monitor.create({
    data: {
      name,
      url,
      websiteId,
      type,
      intervalSeconds,
      retryPolicy,
      kumaMonitorId,
      status: "UP", // Default assumption until first ping
      isActive: true,
    },
  });

  revalidatePath("/monitors");
  redirect("/monitors");
}

export async function updateMonitor(id: string, formData: FormData) {
  await requireAdmin();
  
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const websiteId = formData.get("websiteId") as string;
  const type = formData.get("type") as string;
  const intervalSeconds = parseInt(formData.get("intervalSeconds") as string, 10) || 60;
  const retryPolicy = parseInt(formData.get("retryPolicy") as string, 10) || 3;
  const isActive = formData.get("isActive") === "on";

  if (!name || !url || !websiteId || !type) {
    throw new Error("Name, URL, Website, and Type are required");
  }

  const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
  if (!existingMonitor) throw new Error("Monitor not found");

  // 1. Update in Uptime Kuma
  try {
    if (existingMonitor.kumaMonitorId) {
      await editMonitorInKuma(existingMonitor.kumaMonitorId, {
        name,
        type,
        url,
        intervalSeconds,
        retryPolicy,
      });

      if (isActive && !existingMonitor.isActive) {
        await resumeMonitorInKuma(existingMonitor.kumaMonitorId);
      } else if (!isActive && existingMonitor.isActive) {
        await pauseMonitorInKuma(existingMonitor.kumaMonitorId);
      }
    }
  } catch (err: any) {
    console.error("Failed to update monitor in Kuma:", err);
    throw new Error(err.message || "Failed to communicate with Uptime Kuma.");
  }

  // 2. Update in PostgreSQL
  await prisma.monitor.update({
    where: { id },
    data: {
      name,
      url,
      websiteId,
      type,
      intervalSeconds,
      retryPolicy,
      isActive,
    },
  });

  revalidatePath("/monitors");
  revalidatePath(`/monitors/${id}`);
  redirect("/monitors");
}

export async function deleteMonitor(id: string) {
  await requireAdmin();
  
  const existingMonitor = await prisma.monitor.findUnique({ where: { id } });
  if (!existingMonitor) throw new Error("Monitor not found");

  // 1. Delete in Uptime Kuma
  try {
    if (existingMonitor.kumaMonitorId) {
      await deleteMonitorInKuma(existingMonitor.kumaMonitorId);
    }
  } catch (err: any) {
    console.error("Failed to delete monitor in Kuma:", err);
    throw new Error(err.message || "Failed to communicate with Uptime Kuma.");
  }

  // 2. Delete in PostgreSQL
  await prisma.monitor.delete({
    where: { id },
  });

  revalidatePath("/monitors");
  redirect("/monitors");
}

import { handleMonitorStatusChange } from "@/lib/incidents";

/**
 * Parse Uptime Kuma's Prometheus /metrics endpoint.
 * Returns a map of URL → { status: "UP"|"DOWN", responseTime: number }
 */
function parseKumaMetrics(raw: string): Map<string, { status: "UP" | "DOWN"; responseTime: number }> {
  const result = new Map<string, { status: "UP" | "DOWN"; responseTime: number }>();

  // Regex to extract monitor_status lines:
  // monitor_status{...,monitor_url="<url>",...} <value>
  const statusRegex = /monitor_status\{[^}]*monitor_url="([^"]+)"[^}]*\}\s+(\d+)/g;
  const rtRegex     = /monitor_response_time\{[^}]*monitor_url="([^"]+)"[^}]*\}\s+([\d.-]+)/g;

  let m;
  // First pass: statuses
  while ((m = statusRegex.exec(raw)) !== null) {
    const url    = m[1];
    const value  = parseInt(m[2], 10);
    const status = value === 1 ? "UP" : "DOWN";
    result.set(url, { status, responseTime: -1 });
  }
  // Second pass: response times (merge into same map)
  while ((m = rtRegex.exec(raw)) !== null) {
    const url = m[1];
    const rt  = parseFloat(m[2]);
    const existing = result.get(url);
    if (existing) existing.responseTime = rt;
  }

  return result;
}

export async function refreshAllMonitorsHealth() {
  const kumaUrl      = process.env.UPTIME_KUMA_URL;
  const kumaUser     = process.env.UPTIME_KUMA_USER;
  const kumaPassword = process.env.UPTIME_KUMA_PASSWORD;

  if (!kumaUrl || !kumaUser || !kumaPassword) {
    throw new Error("Uptime Kuma env vars not configured");
  }

  // Fetch live statuses from Kuma's Prometheus metrics (runs on Render, checks from cloud)
  const metricsRes = await fetch(`${kumaUrl}/metrics`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${kumaUser}:${kumaPassword}`).toString("base64"),
    },
    // Force fresh fetch, no Next.js cache
    cache: "no-store",
  });

  if (!metricsRes.ok) {
    throw new Error(`Kuma metrics endpoint returned ${metricsRes.status}`);
  }

  const metricsText = await metricsRes.text();
  const kumaStatuses = parseKumaMetrics(metricsText);

  // Load all active monitors from our DB
  const monitors = await prisma.monitor.findMany({
    where: { isActive: true },
  });

  let synced = 0;
  await Promise.allSettled(
    monitors.map(async (m) => {
      // Match by normalized URL (trailing slash insensitive)
      const normalize = (u: string) => u.replace(/\/$/, "").toLowerCase();
      const kumaEntry =
        kumaStatuses.get(m.url) ??
        kumaStatuses.get(m.url.replace(/\/$/, "") + "/") ??
        [...kumaStatuses.entries()].find(([k]) => normalize(k) === normalize(m.url))?.[1];

      if (!kumaEntry) {
        // Monitor not found in Kuma metrics — skip
        return;
      }

      const { status, responseTime } = kumaEntry;
      const summary = status === "UP"
        ? `Kuma: UP (${responseTime > 0 ? responseTime + "ms" : "checked"})`
        : `Kuma: DOWN (${responseTime === -1 ? "no response" : responseTime + "ms"})`;
      const errorDetail = status === "DOWN"
        ? (responseTime === -1
            ? "No response from server (Uptime Kuma: DOWN)"
            : `Server error — response time: ${responseTime}ms`)
        : undefined;

      await handleMonitorStatusChange(
        m.kumaMonitorId ?? m.id,
        status,
        summary,
        status === "DOWN" ? (responseTime === -1 ? 0 : undefined) : undefined,
        errorDetail
      );
      synced++;
    })
  );

  revalidatePath("/monitors");
  revalidatePath("/websites");
  revalidatePath("/incidents");
  revalidatePath("/");
  return synced;
}

