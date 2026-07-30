"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// --- Websites ---

import { requireAdmin } from "@/lib/auth-utils";

export async function createWebsite(formData: FormData) {
  await requireAdmin();
  
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const clientId = formData.get("clientId") as string;
  const description = formData.get("description") as string;

  if (!name || !url || !clientId) {
    throw new Error("Name, URL, and Client are required");
  }

  await prisma.website.create({
    data: {
      name,
      url,
      clientId,
      description: description || null,
    },
  });

  revalidatePath("/websites");
  redirect("/websites");
}

export async function updateWebsite(id: string, formData: FormData) {
  await requireAdmin();
  
  const name = formData.get("name") as string;
  const url = formData.get("url") as string;
  const clientId = formData.get("clientId") as string;
  const description = formData.get("description") as string;

  if (!name || !url || !clientId) {
    throw new Error("Name, URL, and Client are required");
  }

  await prisma.website.update({
    where: { id },
    data: {
      name,
      url,
      clientId,
      description: description || null,
    },
  });

  revalidatePath("/websites");
  revalidatePath(`/websites/${id}`);
  redirect("/websites");
}

export async function deleteWebsite(id: string) {
  await requireAdmin();
  
  await prisma.website.delete({
    where: { id },
  });

  revalidatePath("/websites");
  redirect("/websites");
}

import { syncMonitorToKuma } from "@/lib/kuma";

export async function bulkImportWebsites(rows: { category?: string; url: string; notes?: string }[], createMonitors: boolean) {
  await requireAdmin();

  let importedCount = 0;

  for (const row of rows) {
    if (!row.url) continue;
    
    // Ensure URL has a protocol
    let finalUrl = row.url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = "https://" + finalUrl;
    }

    try {
      const parsedUrl = new URL(finalUrl);
      const domain = parsedUrl.hostname.replace(/^www\./i, "");

      // Upsert Client based on Domain name
      // Note: UPSERT requires a unique field. We don't have a unique field for companyName, 
      // so we use findFirst and create
      let client = await prisma.client.findFirst({
        where: { primaryDomain: domain }
      });

      if (!client) {
        client = await prisma.client.create({
          data: {
            companyName: domain,
            primaryDomain: domain
          }
        });
      }

      // Upsert Website
      let website = await prisma.website.findFirst({
        where: { url: finalUrl, clientId: client.id }
      });

      let descriptionParts = [];
      if (row.category) descriptionParts.push(`Category: ${row.category}`);
      if (row.notes) descriptionParts.push(`Notes: ${row.notes}`);
      const finalDescription = descriptionParts.length > 0 ? descriptionParts.join("\n") : undefined;

      if (!website) {
        website = await prisma.website.create({
          data: {
            name: domain,
            url: finalUrl,
            clientId: client.id,
            description: finalDescription
          }
        });
      }

      // Automatically create Monitor if requested
      if (createMonitors) {
        const monitorExists = await prisma.monitor.findFirst({
          where: { websiteId: website.id }
        });

        if (!monitorExists) {
          let kumaMonitorId: number | null = null;
          try {
            kumaMonitorId = await syncMonitorToKuma({
              name: domain,
              type: "http",
              url: finalUrl,
              intervalSeconds: 60,
              retryPolicy: 3
            });
            await new Promise(r => setTimeout(r, 200));
          } catch (kumaErr) {
            console.error(`Failed to sync monitor to Kuma for ${finalUrl}:`, kumaErr);
          }

          try {
            await prisma.monitor.create({
              data: {
                name: domain,
                url: finalUrl,
                websiteId: website.id,
                type: "http",
                intervalSeconds: 60,
                retryPolicy: 3,
                kumaMonitorId,
                status: "UP",
                isActive: true
              }
            });
          } catch (dbErr) {
            console.error(`Failed to create DB monitor record for ${finalUrl}:`, dbErr);
          }
        }
      }

      importedCount++;
    } catch (e) {
      console.error(`Error parsing row ${row.url}:`, e);
    }
  }

  revalidatePath("/clients");
  revalidatePath("/websites");
  revalidatePath("/monitors");
  revalidatePath("/");
  
  return importedCount;
}

export async function syncWebsitesToMonitors() {
  await requireAdmin();

  const websites = await prisma.website.findMany({
    include: { monitors: true }
  });

  let syncedCount = 0;

  for (const website of websites) {
    const existingMonitor = website.monitors[0];

    // Skip if already synced to Uptime Kuma
    if (existingMonitor && existingMonitor.kumaMonitorId !== null) {
      continue;
    }

    let kumaMonitorId: number | null = null;
    try {
      kumaMonitorId = await syncMonitorToKuma({
        name: website.name,
        type: "http",
        url: website.url,
        intervalSeconds: 60,
        retryPolicy: 3
      });
      await new Promise(r => setTimeout(r, 150));
    } catch (kumaErr) {
      console.error(`Failed to sync to Kuma for ${website.url}:`, kumaErr);
    }

    if (existingMonitor) {
      if (kumaMonitorId !== null) {
        await prisma.monitor.update({
          where: { id: existingMonitor.id },
          data: { kumaMonitorId }
        });
        syncedCount++;
      }
    } else {
      try {
        await prisma.monitor.create({
          data: {
            name: website.name,
            url: website.url,
            websiteId: website.id,
            type: "http",
            intervalSeconds: 60,
            retryPolicy: 3,
            kumaMonitorId,
            status: "UP",
            isActive: true
          }
        });
        syncedCount++;
      } catch (dbErr) {
        console.error(`Failed to create DB monitor for ${website.url}:`, dbErr);
      }
    }
  }

  revalidatePath("/clients");
  revalidatePath("/websites");
  revalidatePath("/monitors");
  revalidatePath("/");

  return syncedCount;
}
