export type SpreadsheetLibrary = typeof import("xlsx");

export type ImportWebsiteRow = { url: string; category: string; notes: string };
export type WebsiteMonitor = { isActive: boolean; status: string; responseTimeMs?: number | null; lastCheckTime?: string | null };
export type WebsiteExportRecord = {
  name: string;
  url: string;
  description?: string | null;
  client: { companyName: string };
  monitors: WebsiteMonitor[];
  _count: { monitors: number };
};

export const importTemplateRows: ImportWebsiteRow[] = [
  { url: "https://example.com", category: "Example business category", notes: "Example row — replace this website before importing." },
  { url: "https://example.org", category: "Another example category", notes: "Optional notes about this website." },
];

export function parseImportRows(raw: Record<string, unknown>[]): ImportWebsiteRow[] {
  return raw.map(row => {
    const entries = Object.entries(row);
    const get = (names: string[]) => entries.find(([key]) => names.some(name => key.toLowerCase().includes(name)))?.[1];
    return {
      url: String(get(["url", "website", "domain"]) || "").trim(),
      category: String(get(["category", "client", "nature of business", "business"]) || "").trim(),
      notes: String(get(["note", "description", "comment", "__empty"]) || "").trim(),
    };
  }).filter(row => row.url);
}

export function websiteStatus(website: Pick<WebsiteExportRecord, "monitors">) {
  const active = website.monitors.filter(monitor => monitor.isActive);
  if (!active.length) return "PAUSED";
  if (active.some(monitor => monitor.status === "COMPROMISED")) return "COMPROMISED";
  if (active.some(monitor => monitor.status === "DOWN")) return "DOWN";
  if (active.some(monitor => monitor.status === "DEGRADED")) return "DEGRADED";
  return "UP";
}

export function latestWebsiteMonitor(website: Pick<WebsiteExportRecord, "monitors">) {
  return [...website.monitors].filter(monitor => monitor.lastCheckTime).sort((a, b) => new Date(b.lastCheckTime || 0).getTime() - new Date(a.lastCheckTime || 0).getTime())[0];
}

export function createImportTemplateWorkbook(XLSX: SpreadsheetLibrary) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(importTemplateRows, { header: ["url", "category", "notes"] });
  XLSX.utils.sheet_add_aoa(worksheet, [["URL", "Category", "Notes"]], { origin: "A1" });
  worksheet["!cols"] = [{ wch: 32 }, { wch: 30 }, { wch: 58 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Websites");
  return workbook;
}

export function createWebsiteExportWorkbook(XLSX: SpreadsheetLibrary, websites: WebsiteExportRecord[]) {
  const rows = websites.map(website => {
    const latest = latestWebsiteMonitor(website);
    const activeMonitorCount = website.monitors.filter(monitor => monitor.isActive).length;
    return {
      "Website Name": website.name,
      URL: website.url,
      Client: website.client.companyName,
      Description: website.description || "",
      Status: websiteStatus(website),
      "Response Time (ms)": latest?.responseTimeMs ?? "",
      "Last Checked": latest?.lastCheckTime ? new Date(latest.lastCheckTime).toISOString() : "",
      "Monitor Count": website._count.monitors,
      "Active Monitor Count": activeMonitorCount,
    };
  });
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: ["Website Name", "URL", "Client", "Description", "Status", "Response Time (ms)", "Last Checked", "Monitor Count", "Active Monitor Count"] });
  worksheet["!cols"] = [{ wch: 28 }, { wch: 42 }, { wch: 28 }, { wch: 42 }, { wch: 14 }, { wch: 20 }, { wch: 26 }, { wch: 16 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(workbook, worksheet, "Websites");
  return workbook;
}
