import { UptimeKumaClient } from "@ruslanpdf/uptime-kuma-api";
import dotenv from "dotenv";

dotenv.config();

async function main() {
  const url = process.env.UPTIME_KUMA_URL || "http://localhost:3001";
  const username = process.env.UPTIME_KUMA_USER || "admin";
  const password = process.env.UPTIME_KUMA_PASSWORD || "admin_password";
  
  console.log(`Connecting to ${url} as ${username}...`);
  const client = new UptimeKumaClient({ url });
  
  await client.connect();
  console.log("Connected to Socket.io");
  
  try {
    const loginRes = await client.login({ username, password });
    console.log("Login Success!");
    
    // Test getting notifications
    const notifications = await client.getNotifications();
    console.log("Notifications:", notifications.length);
  } catch (err: any) {
    console.error("Login Error:", err.message);
  } finally {
    client.disconnect();
  }
}

main();
