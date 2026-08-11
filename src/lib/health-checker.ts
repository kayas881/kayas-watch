import { prisma } from "./prisma";
import { handleMonitorStatusChange } from "./incidents";

const SUSPICIOUS_KEYWORDS = [
  "casino", "gambling", "poker", "betting", "slot machine", 
  "jackpot", "roulette", "satta", "matka", "live casino", "xxx", "porn"
];

const SUSPICIOUS_TLDS = [
  ".xyz", ".top", ".buzz", ".click", ".loan", ".club", ".vip", ".win"
];

export async function checkSiteHealth(url: string): Promise<{ 
  status: "UP" | "DOWN" | "COMPROMISED"; 
  httpStatusCode?: number; 
  errorDetail?: string; 
  responseTimeMs?: number;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const originalUrlObj = new URL(url);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      redirect: "follow", // Let fetch follow redirects so we can check the final URL
      headers: { "User-Agent": "Saral-Watch-Checker/1.0" },
    });
    
    clearTimeout(tid);
    const responseTimeMs = Date.now() - startTime;

    // 1. Check for Redirect Hijack
    const finalUrlObj = new URL(res.url);
    if (finalUrlObj.hostname.replace(/^www\./, '') !== originalUrlObj.hostname.replace(/^www\./, '')) {
      // It redirected to a different domain. This might be a hack if the domain is completely different.
      // Let's refine it: only flag if it redirects to a completely different second-level domain.
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

    // Read the first 50KB of the body to check for keywords/scripts
    const text = await res.text();
    const snippet = text.substring(0, 50000).toLowerCase();

    // 2. Content Keyword Scanning
    for (const keyword of SUSPICIOUS_KEYWORDS) {
      if (snippet.includes(keyword)) {
        return {
          status: "COMPROMISED",
          httpStatusCode: res.status,
          errorDetail: `Suspicious content detected: Found keyword "${keyword}" in page body.`,
          responseTimeMs
        };
      }
    }

    // 3. Injected Script Detection
    const scriptSrcRegex = /<script[^>]+src=["']([^"']+)["']/gi;
    let match;
    while ((match = scriptSrcRegex.exec(snippet)) !== null) {
      const srcUrl = match[1];
      if (srcUrl.startsWith("http")) {
        try {
          const scriptUrlObj = new URL(srcUrl);
          const tld = "." + scriptUrlObj.hostname.split('.').pop();
          if (SUSPICIOUS_TLDS.includes(tld)) {
            return {
              status: "COMPROMISED",
              httpStatusCode: res.status,
              errorDetail: `Injected script detected: Found script loading from suspicious domain (${scriptUrlObj.hostname}).`,
              responseTimeMs
            };
          }
        } catch (e) {
          // ignore invalid URLs
        }
      }
    }

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

export async function checkAllMonitors() {
  const monitors = await prisma.monitor.findMany({ where: { isActive: true } });
  
  let checked = 0;
  let up = 0;
  let down = 0;
  let compromised = 0;

  await Promise.allSettled(
    monitors.map(async (m) => {
      const result = await checkSiteHealth(m.url);
      
      checked++;
      if (result.status === "UP") up++;
      else if (result.status === "DOWN") down++;
      else if (result.status === "COMPROMISED") compromised++;

      // Update monitor DB record with new status and response time
      // NOTE: status is updated inside checkAllMonitors because we removed the direct db update here, wait, no I update it here directly.
      await prisma.monitor.update({
        where: { id: m.id },
        data: {
          status: result.status,
          lastCheckTime: new Date(),
          responseTimeMs: result.responseTimeMs
        }
      });

      let summary = "";
      if (result.status === "COMPROMISED") {
        summary = `🚨 SECURITY: ${result.errorDetail}`;
      } else if (result.status === "DOWN") {
        summary = result.httpStatusCode === 0 ? result.errorDetail! : `HTTP ${result.httpStatusCode} — ${result.errorDetail}`;
      } else {
        summary = "UP";
      }

      await handleMonitorStatusChange(
        m.id,
        result.status,
        summary,
        result.httpStatusCode,
        result.errorDetail
      );
    })
  );

  return { checked, up, down, compromised };
}
