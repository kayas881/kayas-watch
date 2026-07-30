"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth-utils";

export async function createClient(formData: FormData) {
  await requireAdmin();
  
  const companyName = formData.get("companyName") as string;
  const primaryDomain = formData.get("primaryDomain") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const supportSla = formData.get("supportSla") as string;
  const maintenancePlan = formData.get("maintenancePlan") as string;

  if (!companyName) {
    throw new Error("Company Name is required");
  }

  await prisma.client.create({
    data: {
      companyName,
      primaryDomain: primaryDomain || null,
      contactPerson: contactPerson || null,
      contactEmail: contactEmail || null,
      supportSla: supportSla || null,
      maintenancePlan: maintenancePlan || null,
    },
  });

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClient(id: string, formData: FormData) {
  await requireAdmin();
  
  const companyName = formData.get("companyName") as string;
  const primaryDomain = formData.get("primaryDomain") as string;
  const contactPerson = formData.get("contactPerson") as string;
  const contactEmail = formData.get("contactEmail") as string;
  const supportSla = formData.get("supportSla") as string;
  const maintenancePlan = formData.get("maintenancePlan") as string;

  if (!companyName) {
    throw new Error("Company Name is required");
  }

  await prisma.client.update({
    where: { id },
    data: {
      companyName,
      primaryDomain: primaryDomain || null,
      contactPerson: contactPerson || null,
      contactEmail: contactEmail || null,
      supportSla: supportSla || null,
      maintenancePlan: maintenancePlan || null,
    },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect("/clients");
}

export async function deleteClient(id: string) {
  await requireAdmin();
  
  await prisma.client.delete({
    where: { id },
  });

  revalidatePath("/clients");
  redirect("/clients");
}
