import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || "admin@kayasadmin.com";
  const plainPassword = process.env.ADMIN_PASSWORD || "change_me_in_env";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "kayas Admin",
      password: hashedPassword,
      role: "SUPERADMIN",
    },
  });

  console.log(`✅ Admin user seeded/verified: ${admin.email}`);

  // Seed a demo client so we can test the flow immediately
  const clientId = "550e8400-e29b-41d4-a716-446655440000";
  const client = await prisma.client.upsert({
    where: { id: clientId },
    update: {},
    create: {
      id: clientId,
      companyName: "Acme Corp (Demo)",
      primaryDomain: "acme.example.com",
    },
  });

  console.log(`✅ Demo Client seeded/verified: ${client.companyName}`);

  const websiteId = "550e8400-e29b-41d4-a716-446655440001";
  const website = await prisma.website.upsert({
    where: { id: websiteId },
    update: {},
    create: {
      id: websiteId,
      clientId: client.id,
      name: "Acme Production Web",
      url: "https://acme.example.com",
    },
  });

  console.log(`✅ Demo Website seeded/verified: ${website.name}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
