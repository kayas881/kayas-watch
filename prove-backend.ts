import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log("=== Starting Backend E2E Proof ===");

  // 1. Ensure test endpoint is UP
  if (fs.existsSync(".test-down")) {
    fs.unlinkSync(".test-down");
  }

  // 2. Fetch the admin session via Next.js API
  console.log("\n1. Authenticating...");
  const csrfRes = await fetch("http://localhost:3000/api/auth/csrf");
  const csrfData = await csrfRes.json();
  const csrfToken = csrfData.csrfToken;
  let cookieHeader = csrfRes.headers.getSetCookie();

  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": cookieHeader.join('; ')
    },
    body: new URLSearchParams({
      csrfToken: csrfToken,
      email: "admin@kayasadmin.com",
      password: process.env.ADMIN_PASSWORD || "",
      json: "true"
    })
  });

  const loginCookies = loginRes.headers.getSetCookie();
  const sessionToken = loginCookies.find(c => c.includes("next-auth.session-token"));
  if (!sessionToken) throw new Error("Authentication failed");

  console.log("-> Authenticated as admin");

  // 3. Clear existing monitors to avoid confusion
  await prisma.incident.deleteMany({});
  await prisma.monitor.deleteMany({});
  console.log("\n2. Cleared DB monitors and incidents");

  // Get a website ID from DB
  const website = await prisma.website.findFirst();
  if (!website) throw new Error("No website found in DB");

  // 4. Create a Monitor
  console.log("\n3. Creating Monitor pointing to /api/test-health...");
  const createRes = await fetch("http://localhost:3000/api/monitors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": sessionToken
    },
    body: JSON.stringify({
      websiteId: website.id,
      type: "HTTP",
      name: "Prove Backend E2E Monitor",
      url: "http://host.docker.internal:3000/api/test-health",
      intervalSeconds: 20
    })
  });

  if (!createRes.ok) {
    throw new Error(`Failed to create monitor: ${await createRes.text()}`);
  }
  const monitor = await createRes.json();
  console.log("-> Monitor Created:", monitor.id, "Kuma ID:", monitor.kumaMonitorId);

  // 5. Trigger DOWN
  console.log("\n4. Forcing DOWN event (.test-down)...");
  fs.writeFileSync(".test-down", "down");

  console.log("   Waiting for Uptime Kuma to detect DOWN and send Webhook (up to 60s)...");

  let incidentFound = false;
  let openIncidentId: string | undefined = undefined;
  for (let i = 0; i < 20; i++) {
    await delay(5000);
    const incident = await prisma.incident.findFirst({
      where: { monitorId: monitor.id, status: "OPEN" }
    });
    if (incident) {
      incidentFound = true;
      openIncidentId = incident.id;
      console.log(`-> SUCCESS! Incident created via webhook: ${incident.id}`);
      break;
    }
    process.stdout.write(".");
  }

  if (!incidentFound) {
    console.log("\n-> FAILED: No incident created. Check webhook_payloads.log to see if payload structure matches our parser.");
    return;
  }

  // 6. Trigger UP
  console.log("\n5. Forcing UP event (removing .test-down)...");
  fs.unlinkSync(".test-down");

  console.log("   Waiting for Uptime Kuma to detect UP and resolve Incident (up to 60s)...");
  let resolved = false;
  for (let i = 0; i < 20; i++) {
    await delay(5000);
    const incident = await prisma.incident.findUnique({
      where: { id: openIncidentId }
    });
    if (incident?.status === "RESOLVED") {
      resolved = true;
      console.log(`-> SUCCESS! Incident marked as RESOLVED via webhook: ${incident.id}`);
      break;
    }
    process.stdout.write(".");
  }

  if (!resolved) {
    console.log("\n-> FAILED: Incident not resolved.");
  } else {
    console.log("\n=== ALL BACKEND WORKFLOWS PROVEN END-TO-END ===");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
