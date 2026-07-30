"use server";

import { revalidatePath } from "next/cache";
import { addStatusPageInKuma, deleteStatusPageInKuma } from "@/lib/kuma";

import { requireAdmin } from "@/lib/auth-utils";

export async function createStatusPage(formData: FormData) {
  await requireAdmin();
  
  const title = formData.get("title") as string;
  const slug = formData.get("slug") as string;

  if (!title || !slug) {
    throw new Error("Title and Slug are required.");
  }

  try {
    // 1. Create the base status page in Kuma
    await addStatusPageInKuma(title, slug);

    // Description editing will be handled directly in Uptime Kuma for now 
    // due to wrapper incompatibilities with the latest Kuma API.
  } catch (err: any) {
    console.error("Failed to create status page in Kuma:", err);
    throw new Error(err.message || "Failed to create status page.");
  }

  revalidatePath("/status-pages");
}

export async function deleteStatusPage(slug: string) {
  await requireAdmin();
  
  if (!slug) throw new Error("Slug is required.");

  try {
    await deleteStatusPageInKuma(slug);
  } catch (err: any) {
    console.error("Failed to delete status page in Kuma:", err);
    throw new Error(err.message || "Failed to delete status page.");
  }

  revalidatePath("/status-pages");
}
