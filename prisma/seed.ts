import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@boulderparc.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-owner";
  const editorEmail = process.env.SEED_EDITOR_EMAIL ?? "editor@boulderparc.com";
  const editorPassword = process.env.SEED_EDITOR_PASSWORD ?? "change-me-editor";

  await prisma.user.upsert({
    where: { email: ownerEmail },
    update: {},
    create: {
      name: "Boulder Parc Owner",
      email: ownerEmail,
      passwordHash: await bcrypt.hash(ownerPassword, 10),
      role: "OWNER",
    },
  });

  await prisma.user.upsert({
    where: { email: editorEmail },
    update: {},
    create: {
      name: "Marketing Manager",
      email: editorEmail,
      passwordHash: await bcrypt.hash(editorPassword, 10),
      role: "EDITOR",
    },
  });

  console.log(`Seeded owner (${ownerEmail}) and editor (${editorEmail}).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
