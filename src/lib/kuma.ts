import { UptimeKumaClient, MonitorType, Monitor } from "@ruslanpdf/uptime-kuma-api";

const url = process.env.UPTIME_KUMA_URL || "http://localhost:3001";
const username = process.env.UPTIME_KUMA_USER || "admin";
const password = process.env.UPTIME_KUMA_PASSWORD || "admin";

async function getClient() {
  const client = new UptimeKumaClient({ url });
  await client.connect();
  await client.login({ username, password });
  return client;
}

export async function setupWebhookNotification(client: UptimeKumaClient, webhookUrl: string): Promise<number | undefined> {
  try {
    const notifications = await client.getNotifications();
    const existing = notifications.find(n => {
      try {
        const config = JSON.parse(n.config as string);
        return config.type === 'webhook';
      } catch {
        return false;
      }
    });

    if (existing && existing.id) {
      return existing.id;
    }
  } catch (err) {
    console.warn("Could not fetch notifications from Uptime Kuma:", err);
  }
  return undefined;
}

export async function syncMonitorToKuma(monitorData: { name: string, type: string, url: string, intervalSeconds: number, retryPolicy: number }): Promise<number> {
  const client = await getClient();
  try {
    const webhookUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/kuma` : "http://host.docker.internal:3000/api/webhooks/kuma";
    const notificationId = await setupWebhookNotification(client, webhookUrl);

    const newMonitor: Monitor = {
      name: monitorData.name,
      type: monitorData.type.toLowerCase() as MonitorType,
      url: monitorData.url,
      interval: monitorData.intervalSeconds,
      retryInterval: monitorData.intervalSeconds,
      maxretries: monitorData.retryPolicy,
      notificationIDList: notificationId ? [notificationId] : [],
    };
    const res = await client.addMonitor(newMonitor);
    if (!res.id) throw new Error("No monitor ID returned from Kuma");
    return res.id;
  } finally {
    client.disconnect();
  }
}

export async function editMonitorInKuma(kumaMonitorId: number, monitorData: { name: string, type: string, url: string, intervalSeconds: number, retryPolicy: number }) {
  const client = await getClient();
  try {
    const updatedMonitor: Partial<Monitor> = {
      name: monitorData.name,
      type: monitorData.type.toLowerCase() as MonitorType,
      url: monitorData.url,
      interval: monitorData.intervalSeconds,
      retryInterval: monitorData.intervalSeconds,
      maxretries: monitorData.retryPolicy,
    };
    await client.editMonitor(kumaMonitorId, updatedMonitor);
  } finally {
    client.disconnect();
  }
}

export async function deleteMonitorInKuma(kumaMonitorId: number) {
  const client = await getClient();
  try {
    await client.deleteMonitor(kumaMonitorId);
  } finally {
    client.disconnect();
  }
}

export async function pauseMonitorInKuma(kumaMonitorId: number) {
  const client = await getClient();
  try {
    await client.pauseMonitor(kumaMonitorId);
  } finally {
    client.disconnect();
  }
}

export async function resumeMonitorInKuma(kumaMonitorId: number) {
  const client = await getClient();
  try {
    await client.resumeMonitor(kumaMonitorId);
  } finally {
    client.disconnect();
  }
}

export function parseKumaWebhook(payload: any) {
  return {
    kumaMonitorId: payload.monitor?.id,
    status: payload.heartbeat?.status === 1 ? "UP" : "DOWN",
    msg: payload.heartbeat?.msg,
    time: payload.heartbeat?.time,
  };
}

// --- Status Pages ---

export async function getStatusPagesFromKuma() {
  const client = await getClient();
  try {
    return await client.getStatusPages();
  } finally {
    client.disconnect();
  }
}

export async function getStatusPageFromKuma(slug: string) {
  const client = await getClient();
  try {
    return await client.getStatusPage(slug);
  } finally {
    client.disconnect();
  }
}

export async function addStatusPageInKuma(title: string, slug: string) {
  const client = await getClient();
  try {
    return await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Request timeout: addStatusPage")), 5000);
      (client as any).socket.emit("addStatusPage", title, slug, (response: any) => {
        clearTimeout(timeout);
        if (response && response.ok) {
          resolve(response);
        } else {
          reject(new Error(response?.msg || "Failed to add status page"));
        }
      });
    });
  } finally {
    client.disconnect();
  }
}

export async function saveStatusPageInKuma(slug: string, statusPageData: any) {
  const client = await getClient();
  try {
    return await client.saveStatusPage(slug, statusPageData);
  } finally {
    client.disconnect();
  }
}

export async function deleteStatusPageInKuma(slug: string) {
  const client = await getClient();
  try {
    await client.deleteStatusPage(slug);
  } finally {
    client.disconnect();
  }
}
