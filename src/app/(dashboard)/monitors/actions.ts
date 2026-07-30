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

export async function refreshAllMonitorsHealth() {
  const monitors = await prisma.monitor.findMany({
    where: { isActive: true }
  });

  await Promise.allSettled(
    monitors.map(async (m) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(m.url, {
          method: "GET",
          signal: controller.signal,
          headers: { "User-Agent": "kayas-Watch-Checker/1.0" }
        });
        clearTimeout(timeoutId);

        const isUp = res.ok;
        const newStatus = isUp ? "UP" : "DOWN";
        const msg = isUp ? `HTTP ${res.status} OK` : `HTTP ${res.status} Error`;

        await handleMonitorStatusChange(m.kumaMonitorId || m.id, newStatus, msg);
      } catch (err: any) {
        const msg = err.message || "Connection timeout / failed";
        await handleMonitorStatusChange(m.kumaMonitorId || m.id, "DOWN", msg);
      }
    })
  );

  revalidatePath("/monitors");
  revalidatePath("/websites");
  revalidatePath("/incidents");
  revalidatePath("/");
  return monitors.length;
}
