import { NextResponse } from "next/server";
import { parseKumaWebhook } from "@/lib/kuma";
import { handleMonitorStatusChange } from "@/lib/incidents";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const parsed = parseKumaWebhook(payload);

    if (parsed.kumaMonitorId && parsed.status) {
      await handleMonitorStatusChange(parsed.kumaMonitorId, parsed.status as "UP" | "DOWN", parsed.msg || "");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
