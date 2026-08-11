import { NextResponse } from "next/server";
import { checkAllMonitors } from "@/lib/health-checker";

export const maxDuration = 60; // Allow up to 60s for Hobby plan, though it should finish much faster

export async function GET(req: Request) {
  try {
    // Basic authentication for the cron job using a secret token
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const results = await checkAllMonitors();
    
    return NextResponse.json({
      success: true,
      message: "Health check completed",
      data: results
    });
    
  } catch (error: any) {
    console.error("Health check cron error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
