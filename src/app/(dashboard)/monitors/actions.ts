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

  const statusRegex = /monitor_status\{[^}]*monitor_url="([^"]+)"[^}]*\}\s+(\d+)/g;
  const rtRegex     = /monitor_response_time\{[^}]*monitor_url="([^"]+)"[^}]*\}\s+([\d.-]+)/g;

  let m;
  while ((m = statusRegex.exec(raw)) !== null) {
    const url   = m[1];
    const value = parseInt(m[2], 10);
    result.set(url, { status: value === 1 ? "UP" : "DOWN", responseTime: -1 });
  }
  while ((m = rtRegex.exec(raw)) !== null) {
    const url      = m[1];
    const existing = result.get(url);
    if (existing) existing.responseTime = parseFloat(m[2]);
  }
  return result;
}

/**
 * For a URL that Kuma says is DOWN, do a real HTTP probe to get the exact error code.
 * Returns { httpStatusCode, errorDetail }.
 */
async function probeDownSite(url: string): Promise<{ httpStatusCode: number; errorDetail: string }> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 15000); // 15s — generous for slow servers
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Saral-Watch-Checker/1.0" },
    });
    clearTimeout(tid);

    const statusText = res.statusText || httpStatusLabel(res.status);
    return {
      httpStatusCode: res.status,
      errorDetail: `HTTP ${res.status} ${statusText}`,
    };
  } catch (err: any) {
    const isTimeout = err.name === "AbortError";
    const isCert    = err.message?.includes("certificate") || err.message?.includes("SSL");
    const isDns     = err.message?.includes("ENOTFOUND") || err.message?.includes("getaddrinfo");
    const isRefused = err.message?.includes("ECONNREFUSED");

    const detail = isTimeout  ? "Connection timed out — server not responding"
                 : isCert     ? "SSL/TLS certificate error"
                 : isDns      ? "DNS resolution failed — domain not found"
                 : isRefused  ? "Connection refused by server"
                 : (err.message || "Network failure");

    return { httpStatusCode: 0, errorDetail: detail };
  }
}

function httpStatusLabel(code: number): string {
  const labels: Record<number, string> = {
    400: "Bad Request", 401: "Unauthorized", 403: "Forbidden",
    404: "Not Found", 405: "Method Not Allowed", 408: "Request Timeout",
    429: "Too Many Requests", 500: "Internal Server Error",
    501: "Not Implemented", 502: "Bad Gateway", 503: "Service Unavailable",
    504: "Gateway Timeout", 508: "Loop Detected", 509: "Bandwidth Limit Exceeded",
    520: "Unknown Error", 521: "Web Server Is Down", 522: "Connection Timed Out",
    524: "A Timeout Occurred",
  };
  return labels[code] || "Server Error";
}

export async function refreshAllMonitorsHealth() {
  const kumaUrl      = process.env.UPTIME_KUMA_URL;
  const kumaUser     = process.env.UPTIME_KUMA_USER;
  const kumaPassword = process.env.UPTIME_KUMA_PASSWORD;

  if (!kumaUrl || !kumaUser || !kumaPassword) {
    throw new Error("Uptime Kuma env vars not configured");
  }

  // Step 1: Get Kuma's cloud-verified statuses (fast, authoritative)
  const metricsRes = await fetch(`${kumaUrl}/metrics`, {
    headers: {
      Authorization: "Basic " + Buffer.from(`${kumaUser}:${kumaPassword}`).toString("base64"),
    },
    cache: "no-store",
  });

  if (!metricsRes.ok) {
    throw new Error(`Kuma metrics endpoint returned ${metricsRes.status}`);
  }

  const kumaStatuses = parseKumaMetrics(await metricsRes.text());

  // Step 2: Load all active monitors from our DB
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });

  const normalize = (u: string) => u.replace(/\/$/, "").toLowerCase();

  const findKumaEntry = (url: string) =>
    kumaStatuses.get(url) ??
    kumaStatuses.get(url.replace(/\/$/, "") + "/") ??
    [...kumaStatuses.entries()].find(([k]) => normalize(k) === normalize(url))?.[1];

  // Step 3: For DOWN sites only, probe directly to get real HTTP code
  //         (only ~10 sites — fast and targeted)
  const downMonitors = monitors.filter((m) => {
    const entry = findKumaEntry(m.url);
    return entry?.status === "DOWN";
  });

  const probeResults = new Map<string, { httpStatusCode: number; errorDetail: string }>();
  await Promise.allSettled(
    downMonitors.map(async (m) => {
      const result = await probeDownSite(m.url);
      probeResults.set(m.url, result);
    })
  );

  // Step 4: Sync all monitors using Kuma status + real error detail for DOWN ones
  let synced = 0;
  await Promise.allSettled(
    monitors.map(async (m) => {
      const kumaEntry = findKumaEntry(m.url);
      if (!kumaEntry) return; // not in Kuma yet

      const { status } = kumaEntry;

      let httpStatusCode: number | undefined;
      let errorDetail: string | undefined;
      let summary: string;

      if (status === "DOWN") {
        const probe = probeResults.get(m.url);
        httpStatusCode = probe?.httpStatusCode;
        errorDetail    = probe?.errorDetail;
        summary        = probe
          ? (probe.httpStatusCode === 0
              ? probe.errorDetail
              : `HTTP ${probe.httpStatusCode} — ${probe.errorDetail}`)
          : "Kuma: DOWN";
      } else {
        summary = "Kuma: UP";
      }

      await handleMonitorStatusChange(
        m.kumaMonitorId ?? m.id,
        status,
        summary,
        status === "DOWN" ? httpStatusCode : undefined,
        status === "DOWN" ? errorDetail : undefined
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



