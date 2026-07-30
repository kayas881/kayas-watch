import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/lib/auth";
import { z } from "zod";

const createClientSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  primaryDomain: z.string().optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
});

export const GET = withAuth(async () => {
  try {
    const clients = await prisma.client.findMany({
      include: { websites: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(clients);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request) => {
  try {
    const body = await req.json();
    const parsed = createClientSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: parsed.data,
    });
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
});
