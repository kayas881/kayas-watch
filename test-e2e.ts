import fs from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== kayas Watch E2E Verification ===");

  // 1. Show seeded admin record
  const admin = await prisma.user.findUnique({ where: { email: "admin@kayasadmin.com" } });
  console.log("1. Seeded Admin Record (Excluding password hash):");
  console.log({ id: admin?.id, email: admin?.email, name: admin?.name, role: admin?.role });

  // 2. Authenticate
  console.log("\n2. Authenticating via NextAuth API...");
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.get("set-cookie") || "";

  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": csrfCookies,
    },
    body: new URLSearchParams({
      email: "admin@kayasadmin.com",
      password: process.env.ADMIN_PASSWORD || "",
      csrfToken: csrfData.csrfToken,
      json: "true"
    }),
    redirect: "manual"
  });

  const loginResData = await loginRes.json().catch(() => null);
  console.log("Login Response Status:", loginRes.status, "Body:", loginResData);

  const setCookieHeaders = loginRes.headers.getSetCookie();
  console.log("Set-Cookie Headers:", setCookieHeaders);

  let sessionCookieStr = "";
  if (setCookieHeaders) {
    const sessionCookie = setCookieHeaders.find(c => c.startsWith("next-auth.session-token="));
    if (sessionCookie) {
      sessionCookieStr = sessionCookie.split(';')[0];
    }
  }

  const allCookies = `${csrfCookies.split(';')[0]}; ${sessionCookieStr}`;
  console.log("Cookies sent to session:", allCookies);

  const sessionCheck = await fetch("http://localhost:3000/api/auth/session", {
    headers: { "Cookie": allCookies }
  });
  const session = await sessionCheck.json();
  console.log("Session obtained:", session?.user?.email ? "SUCCESS" : "FAILED");

  // 3. Create Monitor
  console.log("\n3. Creating a Monitor through our backend...");
  const website = await prisma.website.findUnique({ where: { id: "550e8400-e29b-41d4-a716-446655440001" } });

  if (!website) {
    console.error("Website not found in DB! Seed may have failed.");
    process.exit(1);
  }

  const monitorPayload = {
    websiteId: website.id,
    name: "E2E Test Monitor",
    type: "HTTP",
    url: "http://host.docker.internal:3000/api/test-health",
    intervalSeconds: 20, // Kuma minimum is 20s usually
    retryPolicy: 1
  };

  const createRes = await fetch("http://localhost:3000/api/monitors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": allCookies
    },
    body: JSON.stringify(monitorPayload)
  });

  const monitorData = await createRes.json();
  if (createRes.status !== 201) {
    console.error("Monitor creation failed:", JSON.stringify(monitorData, null, 2));
    process.exit(1);
  }
  console.log("Monitor Created in DB and Kuma:", monitorData);

  // 4. Trigger DOWN event
  console.log("\n4. Triggering DOWN event (writing .test-down file)...");
  fs.writeFileSync(".test-down", "down");

  console.log("Waiting up to 45 seconds for Kuma to detect DOWN and send webhook...");
  let incident = null;
  for (let i = 0; i < 20; i++) {
    await delay(3000);
    incident = await prisma.incident.findFirst({
      where: { monitorId: monitorData.id, status: "OPEN" },
      orderBy: { openedAt: "desc" }
    });
    if (incident) break;
    process.stdout.write(".");
  }

  if (incident) {
    console.log(`\n✅ Incident created in PostgreSQL! ID: ${incident.id}, Status: ${incident.status}, Summary: ${incident.summary}`);
  } else {
    console.log("\n❌ Timeout waiting for DOWN incident.");
  }

  // 5. Trigger RECOVERY
  console.log("\n5. Triggering RECOVERY (removing .test-down file)...");
  fs.unlinkSync(".test-down");

  console.log("Waiting up to 45 seconds for Kuma to detect UP and resolve incident...");
  for (let i = 0; i < 20; i++) {
    await delay(3000);
    const resolvedIncident = await prisma.incident.findFirst({
      where: { id: incident?.id }
    });
    if (resolvedIncident?.status === "RESOLVED") {
      console.log(`\n✅ Incident RESOLVED! ID: ${resolvedIncident.id}, Status: ${resolvedIncident.status}, ResolvedAt: ${resolvedIncident.resolvedAt}`);
      break;
    }
    process.stdout.write(".");
  }

  console.log("\n=== E2E Verification Complete ===");
}

main().catch(console.error).finally(() => prisma.$disconnect());
