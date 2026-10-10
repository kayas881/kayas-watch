import { prisma } from "../lib/prisma.js";

const KEYWORDS = ["casino", "gambling", "poker", "betting", "slot machine", "jackpot", "roulette", "satta", "matka", "live casino", "xxx", "porn"];
const TLDS = [".xyz", ".top", ".buzz", ".click", ".loan", ".club", ".vip", ".win"];
const CHALLENGES = ["checking your browser before accessing", "verify you are human", "performing security verification", "please complete the security check", "just a moment...", "enable javascript and cookies to continue"];
const RETRYABLE = new Set([408, 429, 500, 501, 502, 503, 504, 505, 506, 507, 508, 509, 510, 511, 512, 513, 514, 515, 516, 517, 518, 519, 520, 521, 522, 523, 524, 525]);
const UA = "Mozilla/5.0 (compatible; Saral-Watch-Checker/1.0)";

export type HealthStatus = "UP" | "DOWN" | "DEGRADED" | "COMPROMISED";
export interface HealthResult { status: HealthStatus; httpStatusCode?: number; errorDetail?: string; responseTimeMs?: number }
type FetchError = Error & { code?: string; cause?: { code?: string; message?: string } };

function normalizedHostname(host: string) { return host.toLowerCase().replace(/^www\./, ""); }
function certificateDetail(error: FetchError) {
  const text = `${error.code || ""} ${error.cause?.code || ""} ${error.message || ""} ${error.cause?.message || ""}`.toLowerCase();
  if (/cert_has_expired|cert_expired|certificate has expired/.test(text)) return "HTTPS certificate expired — browsers will show a security warning.";
  if (/cert_not_yet_valid|certificate is not yet valid/.test(text)) return "HTTPS certificate is not valid yet — browsers will show a security warning.";
  if (/altname|hostname mismatch/.test(text)) return "HTTPS certificate hostname mismatch — the certificate does not match this domain.";
  if (/self_signed|self-signed/.test(text)) return "HTTPS certificate is self-signed and is not trusted by browsers.";
  if (/unable_to_verify|unable to verify|unknown ca/.test(text)) return "HTTPS certificate chain cannot be verified by browsers.";
  return null;
}

export function hasBrowserVerificationChallenge(html: string) { const lower = html.toLowerCase(); return CHALLENGES.some(p => lower.includes(p)); }

export async function checkSiteHealth(url: string): Promise<HealthResult> {
  const started = Date.now();
  try {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;
    try { response = await fetch(url, { method: "GET", signal: controller.signal, redirect: "follow", cache: "no-store", headers: { "User-Agent": UA } }); }
    finally { clearTimeout(timeout); }
    const responseTimeMs = Date.now() - started;
    const original = new URL(url), final = new URL(response.url);
    if (normalizedHostname(original.hostname) !== normalizedHostname(final.hostname)) return { status: "COMPROMISED", httpStatusCode: response.status, responseTimeMs, errorDetail: `Redirect hijack: Site redirects to an external domain (${final.hostname})` };
    if (!response.ok) return { status: "DOWN", httpStatusCode: response.status, responseTimeMs, errorDetail: `HTTP ${response.status} ${response.statusText || "Unexpected response"}` };
    return { status: "UP", httpStatusCode: response.status, responseTimeMs };
  } catch (unknown) {
    const error = unknown as FetchError, responseTimeMs = Date.now() - started;
    const cert = certificateDetail(error); if (cert) return { status: "DEGRADED", errorDetail: cert, responseTimeMs };
    const cause = error.cause?.message || error.cause?.code || ""; const combined = `${error.message || ""} ${cause}`.toLowerCase();
    let detail = "Server unreachable — no response";
    if (error.name === "AbortError" || /etimedout|timeout|timed out/.test(combined)) detail = "Connection timed out — server not responding";
    else if (/tls|ssl/.test(combined)) detail = "TLS handshake failed — secure connection could not be established";
    else if (/enotfound|getaddrinfo|nodename|name or service/.test(combined)) detail = "DNS resolution failed — domain not found or unreachable";
    else if (/econnrefused|connection refused/.test(combined)) detail = "Connection refused — server is actively rejecting requests";
    else if (/econnreset|connection reset/.test(combined)) detail = "Connection reset by remote server";
    else if (cause) detail = cause;
    else if (error.message && error.message !== "fetch failed") detail = error.message;
    return { status: "DOWN", httpStatusCode: 0, errorDetail: detail, responseTimeMs };
  }
}

async function readFirstBytes(response: Response, limit: number) {
  if (!response.body) return (await response.text()).slice(0, limit);
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (received < limit) {
      const { done, value } = await reader.read();
      if (done) break;
      const remaining = limit - received;
      const chunk = value.byteLength > remaining ? value.slice(0, remaining) : value;
      chunks.push(chunk);
      received += chunk.byteLength;
      if (value.byteLength > remaining) break;
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

export async function deepScanForCompromise(url: string) {
  try {
    const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 5000);
    let response: Response; try { response = await fetch(url, { signal: controller.signal, redirect: "follow", headers: { "User-Agent": UA } }); } finally { clearTimeout(timeout); }
    if (!response.ok) return {};
    const raw = (await readFirstBytes(response, 50_000)).toLowerCase();
    if (hasBrowserVerificationChallenge(raw)) return { status: "DEGRADED" as const, detail: "Browser verification challenge detected — automated checks may be blocked even though the site loads in a browser." };
    const clean = raw.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "").replace(/<!--[\s\S]*?-->/g, "");
    const found = KEYWORDS.filter(keyword => new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(clean));
    if (found.length >= 3) return { status: "COMPROMISED" as const, detail: `Suspicious content detected: Found keywords [${found.join(", ")}] in page body.` };
    for (const match of raw.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) if (match[1].startsWith("http")) {
      try { const host = new URL(match[1]).hostname; if (TLDS.some(tld => host.endsWith(tld))) return { status: "COMPROMISED" as const, detail: `Injected script detected: Found script loading from suspicious domain (${host}).` }; } catch { /* invalid script URL */ }
    }
    return {};
  } catch { return {}; }
}

async function batched<T>(items: T[], size: number, fn: (item: T) => Promise<void>) { for (let i = 0; i < items.length; i += size) await Promise.allSettled(items.slice(i, i + size).map(fn)); }
async function withRetry(url: string, retryPolicy: number) { let result = await checkSiteHealth(url); if (retryPolicy > 0 && result.status === "DOWN" && (result.httpStatusCode === 0 || (result.httpStatusCode !== undefined && RETRYABLE.has(result.httpStatusCode)))) { await new Promise(resolve => setTimeout(resolve, 500)); result = await checkSiteHealth(url); } return result; }

export async function checkAllMonitors() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  const totals = { checked: 0, up: 0, down: 0, degraded: 0, compromised: 0 };
  const up: { id: string; url: string; pingId: string }[] = [];
  await batched(monitors, 10, async monitor => {
    const result = await withRetry(monitor.url, monitor.retryPolicy); totals.checked++;
    if (result.status === "UP") totals.up++;
    else if (result.status === "DOWN") totals.down++; else if (result.status === "DEGRADED") totals.degraded++; else totals.compromised++;
    const [, ping] = await prisma.$transaction([
      prisma.monitor.update({ where: { id: monitor.id }, data: { status: result.status, responseTimeMs: result.responseTimeMs, lastCheckTime: new Date() } }),
      prisma.monitorPing.create({ data: { monitorId: monitor.id, status: result.status, responseTimeMs: result.responseTimeMs, httpStatusCode: result.httpStatusCode, errorDetail: result.errorDetail } }),
    ]);
    if (result.status === "UP") up.push({ id: monitor.id, url: monitor.url, pingId: ping.id });
  });
  await batched(up, 5, async monitor => {
    const scan = await deepScanForCompromise(monitor.url); if (!scan.status) return;
    totals.up--; scan.status === "DEGRADED" ? totals.degraded++ : totals.compromised++;
    await prisma.$transaction([
      prisma.monitor.update({ where: { id: monitor.id }, data: { status: scan.status } }),
      prisma.monitorPing.update({ where: { id: monitor.pingId }, data: { status: scan.status, errorDetail: scan.detail } }),
    ]);
  });
  return totals;
}

export async function cleanupOldPings() { return prisma.monitorPing.deleteMany({ where: { checkedAt: { lt: new Date(Date.now() - 7 * 86_400_000) } } }); }
