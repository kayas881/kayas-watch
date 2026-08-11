"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { checkAllMonitors } from "@/lib/health-checker";

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

  // 1. Create in PostgreSQL
  await prisma.monitor.create({
    data: {
      name,
      url,
      websiteId,
      type,
      intervalSeconds,
      retryPolicy,
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

  // 1. Update in PostgreSQL
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

  // 1. Delete in PostgreSQL
  await prisma.monitor.delete({
    where: { id },
  });

  revalidatePath("/monitors");
  redirect("/monitors");
}

export async function refreshAllMonitorsHealth() {
  await requireAdmin();
  
  // Call the new native health checker
  const results = await checkAllMonitors();

  revalidatePath("/monitors");
  revalidatePath("/websites");
  revalidatePath("/incidents");
  revalidatePath("/");
  
  return results.checked;
}
