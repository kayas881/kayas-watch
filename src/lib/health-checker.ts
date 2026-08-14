import { prisma } from "./prisma";
import { handleMonitorStatusChange } from "./incidents";

const SUSPICIOUS_KEYWORDS = [
  "casino", "gambling", "poker", "betting", "slot machine", 
  "jackpot", "roulette", "satta", "matka", "live casino", "xxx", "porn"
];

const SUSPICIOUS_TLDS = [
  ".xyz", ".top", ".buzz", ".click", ".loan", ".club", ".vip", ".win"
];

/**
 * Phase 1: Quick health check — just verify the site responds.
 * Uses a HEAD-then-GET strategy with a short timeout.
 */
export async function checkSiteHealth(url: string): Promise<{ 
  status: "UP" | "DOWN" | "COMPROMISED"; 
  httpStatusCode?: number; 
  errorDetail?: string; 
  responseTimeMs?: number;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 8000); // 8s timeout — generous for slow Indian hosting

    const originalUrlObj = new URL(url);

    // GET request — many cheap hosting providers don't support HEAD properly
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Saral-Watch-Checker/1.0)" },
    });
    
    clearTimeout(tid);
    const responseTimeMs = Date.now() - startTime;

    // 1. Check for Redirect Hijack
    const finalUrlObj = new URL(res.url);
    if (finalUrlObj.hostname.replace(/^www\./, '') !== originalUrlObj.hostname.replace(/^www\./, '')) {
      const originalParts = originalUrlObj.hostname.split('.');
      const finalParts = finalUrlObj.hostname.split('.');
      const originalDomain = originalParts.length > 2 ? originalParts.slice(-2).join('.') : originalParts.join('.');
      const finalDomain = finalParts.length > 2 ? finalParts.slice(-2).join('.') : finalParts.join('.');
      
      if (originalDomain !== finalDomain) {
        return {
          status: "COMPROMISED",
          httpStatusCode: res.status,
          errorDetail: `Redirect hijack: Site redirects to an external domain (${finalUrlObj.hostname})`,
          responseTimeMs
        };
      }
    }

    if (!res.ok) {
      return {
        status: "DOWN",
        httpStatusCode: res.status,
        errorDetail: `HTTP ${res.status} ${res.statusText || httpStatusLabel(res.status)}`,
        responseTimeMs
      };
    }

    // Site is reachable — mark UP for now.
    // Content scanning runs separately (Phase 2) so it doesn't slow down the main check.
    return { status: "UP", httpStatusCode: res.status, responseTimeMs };

  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const cause = err.cause;
    const causeMsg = cause?.message || cause?.code || "";
    const combined = `${err.message || ""} ${causeMsg}`.toLowerCase();

    const isTimeout = err.name === "AbortError" || combined.includes("etimedout") || combined.includes("timed out");
    const isCert = combined.includes("certificate") || combined.includes("ssl") || combined.includes("self_signed") || combined.includes("tls") || combined.includes("cert_");
    const isDns = combined.includes("enotfound") || combined.includes("getaddrinfo") || combined.includes("nodename") || combined.includes("name or service");
    const isRefused = combined.includes("econnrefused") || combined.includes("connection refused");
    const isReset = combined.includes("econnreset") || combined.includes("connection reset");

    let detail = "Server unreachable — no response";
    if (isTimeout) detail = "Connection timed out — server not responding";
    else if (isCert) detail = "SSL/TLS certificate error — certificate invalid or expired";
    else if (isDns) detail = "DNS resolution failed — domain not found or unreachable";
    else if (isRefused) detail = "Connection refused — server is actively rejecting requests";
    else if (isReset) detail = "Connection reset by remote server";
    else if (causeMsg) detail = causeMsg;
    else if (err.message && err.message !== "fetch failed") detail = err.message;

    return { status: "DOWN", httpStatusCode: 0, errorDetail: detail, responseTimeMs };
  }
}

/**
 * Phase 2: Deep content scan for hack detection.
 * Only called on sites that are UP — downloads a small chunk of HTML.
 */
async function deepScanForCompromise(url: string): Promise<{
  isCompromised: boolean;
  detail?: string;
}> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Saral-Watch-Checker/1.0)" },
    });
    clearTimeout(tid);

    if (!res.ok) return { isCompromised: false };

    const text = await res.text();
    const rawSnippet = text.substring(0, 50000).toLowerCase();

    // Strip out <script>...</script> and <style>...</style> blocks before scanning
    // These often contain false positive keywords in minified code, analytics, theme files
    const cleanedSnippet = rawSnippet
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "");

    // Keyword scanning — require 3+ DIFFERENT keyword matches to flag as compromised
    // A single match is almost always a false positive (e.g., word in an ad tag or template)
    const foundKeywords: string[] = [];
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      // Use word boundary matching to avoid partial matches
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, "i");
      if (regex.test(cleanedSnippet)) {
        foundKeywords.push(keyword);
      }
    }

    if (foundKeywords.length >= 3) {
      return {
        isCompromised: true,
        detail: `Suspicious content detected: Found keywords [${foundKeywords.join(", ")}] in page body.`
      };
    }

    // Injected script detection
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = scriptSrcRegex.exec(rawSnippet)) !== null) {
      const srcUrl = match[1];
      if (srcUrl.startsWith("http")) {
        try {
          const scriptUrlObj = new URL(srcUrl);
          const tld = "." + scriptUrlObj.hostname.split('.').pop();
          if (SUSPICIOUS_TLDS.includes(tld)) {
            return {
              isCompromised: true,
              detail: `Injected script detected: Found script loading from suspicious domain (${scriptUrlObj.hostname}).`
            };
          }
        } catch (e) {
          // ignore invalid URLs
        }
      }
    }

    return { isCompromised: false };
  } catch {
    // If the deep scan fails, don't flag — the site might just be slow
    return { isCompromised: false };
  }
}

export function httpStatusLabel(code: number): string {
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

/**
 * Process monitors in batches to avoid overwhelming Vercel's connection pool.
 */
async function processBatch<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.allSettled(batch.map(fn));
  }
}

export async function checkAllMonitors() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  
  let checked = 0;
  let up = 0;
  let down = 0;
  let compromised = 0;

  // Track which monitors passed Phase 1 (UP) for content scanning
  const upMonitors: { id: string; url: string }[] = [];

  // Phase 1: Quick health check in batches of 10
  await processBatch(monitors, 10, async (m) => {
    const result = await checkSiteHealth(m.url);
    
    checked++;

    // Update monitor DB record
    await prisma.monitor.update({
      where: { id: m.id },
      data: {
        status: result.status,
        lastCheckTime: new Date(),
        responseTimeMs: result.responseTimeMs
      }
    });

    if (result.status === "UP") {
      up++;
      upMonitors.push({ id: m.id, url: m.url });
    } else if (result.status === "COMPROMISED") {
      compromised++;
      await handleMonitorStatusChange(
        m.id,
        "COMPROMISED",
        `🚨 SECURITY: ${result.errorDetail}`,
        result.httpStatusCode,
        result.errorDetail
      );
    } else {
      down++;
      const summary = result.httpStatusCode === 0 
        ? result.errorDetail! 
        : `HTTP ${result.httpStatusCode} — ${result.errorDetail}`;
      await handleMonitorStatusChange(
        m.id,
        "DOWN",
        summary,
        result.httpStatusCode,
        result.errorDetail
      );
    }
  });

  // Phase 2: Deep content scan on UP sites (batches of 5 — these download HTML)
  await processBatch(upMonitors, 5, async (m) => {
    const scan = await deepScanForCompromise(m.url);
    if (scan.isCompromised) {
      // Downgrade from UP to COMPROMISED
      up--;
      compromised++;
      await prisma.monitor.update({
        where: { id: m.id },
        data: { status: "COMPROMISED" }
      });
      await handleMonitorStatusChange(
        m.id,
        "COMPROMISED",
        `🚨 SECURITY: ${scan.detail}`,
        undefined,
        scan.detail
      );
    } else {
      // Resolve any existing incidents since site is UP and clean
      await handleMonitorStatusChange(m.id, "UP", "UP");
    }
  });

  return { checked, up, down, compromised };
}
