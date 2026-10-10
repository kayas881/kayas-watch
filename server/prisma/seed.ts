import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@saralwatch.com" },
    // Never reset credentials when setup/seed is run again on an existing install.
    update: {},
    create: { name: "Super Admin", email: "admin@saralwatch.com", password, role: "SUPERADMIN" },
  });
  console.log("Seeded admin@saralwatch.com / admin123");
}

main().finally(() => prisma.$disconnect());
