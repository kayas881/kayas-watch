"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdmin, requireSuperAdmin, getCurrentUser } from "@/lib/auth-utils";

export async function createUser(formData: FormData) {
  // Only Admins can invite/create users
  const currentUser = await requireAdmin();
  
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string; // "VIEWER" | "ADMIN"

  if (!email || !password || !name) {
    throw new Error("All fields are required.");
  }

  // Regular Admins can only create VIEWERS. Super Admins can create ADMINS or VIEWERS.
  if (role === "ADMIN" && currentUser.role !== "SUPERADMIN") {
    throw new Error("Only Super Admins can create new Admins.");
  }
  if (role === "SUPERADMIN") {
    throw new Error("Cannot create Super Admins via the dashboard.");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("A user with that email already exists.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "VIEWER",
    },
  });

  revalidatePath("/settings");
}

export async function updateUserRole(userId: string, newRole: string) {
  const currentUser = await requireSuperAdmin(); // Only super admins can change roles

  if (userId === currentUser.id) {
    throw new Error("You cannot change your own role.");
  }

  if (newRole !== "ADMIN" && newRole !== "VIEWER") {
    throw new Error("Invalid role.");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  });

  revalidatePath("/settings");
}

export async function deleteUser(userId: string) {
  const currentUser = await requireAdmin();

  if (userId === currentUser.id) {
    throw new Error("You cannot delete your own account.");
  }

  const userToDelete = await prisma.user.findUnique({ where: { id: userId } });
  if (!userToDelete) throw new Error("User not found.");

  // Regular admins cannot delete other admins or superadmins
  if (currentUser.role !== "SUPERADMIN" && userToDelete.role !== "VIEWER") {
    throw new Error("You can only delete Viewer accounts.");
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/settings");
}
