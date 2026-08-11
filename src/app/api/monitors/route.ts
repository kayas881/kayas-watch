import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { z } from "zod";

const createMonitorSchema = z.object({
  websiteId: z.string(),
  name: z.string().min(1, "Name is required"),
  type: z.enum(["HTTP", "PING", "PORT", "KEYWORD", "DNS"]),
  url: z.string().url(),
  intervalSeconds: z.number().min(20).default(60),
  retryPolicy: z.number().min(0).default(3),
});

export const GET = withAuth(async () => {
  try {
    const monitors = await prisma.monitor.findMany({
      include: { website: true, incidents: { where: { status: "OPEN" } } },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(monitors);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch monitors" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const parsed = createMonitorSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    // Verify website exists and belongs to a client
    const website = await prisma.website.findUnique({
      where: { id: parsed.data.websiteId }
    });

    if (!website) {
      return NextResponse.json({ error: "Website not found" }, { status: 404 });
    }

    // Create in local DB directly (Vercel cron will health check it soon)
    const monitor = await prisma.monitor.create({
      data: {
        websiteId: parsed.data.websiteId,
        name: parsed.data.name,
        type: parsed.data.type,
        url: parsed.data.url,
        intervalSeconds: parsed.data.intervalSeconds,
        retryPolicy: parsed.data.retryPolicy,
        status: "UP"
      },
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create monitor" }, { status: 500 });
  }
});
