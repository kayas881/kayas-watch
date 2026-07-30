"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

import { requireAdmin } from "@/lib/auth-utils";

export async function updateIncidentStatus(incidentId: string, status: string) {
  const user = await requireAdmin();
  const userId = user.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const validStatuses = ["OPEN", "ACKNOWLEDGED", "RESOLVED"];
  if (!validStatuses.includes(status)) {
    throw new Error("Invalid status");
  }

  const updateData: any = { status };
  
  if (status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  } else {
    updateData.resolvedAt = null;
  }

  await prisma.incident.update({
    where: { id: incidentId },
    data: updateData,
  });

  // Automatically add a system note about the status change
  await prisma.incidentNote.create({
    data: {
      incidentId,
      userId,
      content: `Status changed to ${status}`,
    },
  });

  revalidatePath("/incidents");
  revalidatePath(`/incidents/${incidentId}`);
}

export async function addIncidentNote(incidentId: string, formData: FormData) {
  const user = await requireAdmin();
  const userId = user.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const content = formData.get("content") as string;
  if (!content || content.trim() === "") {
    throw new Error("Note content cannot be empty");
  }

  await prisma.incidentNote.create({
    data: {
      incidentId,
      userId,
      content: content.trim(),
    },
  });

  revalidatePath(`/incidents/${incidentId}`);
}
