import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function seedUsers() {
  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@boulderparc.com";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "change-me-owner";
  const editorEmail = process.env.SEED_EDITOR_EMAIL ?? "editor@boulderparc.com";
  const editorPassword =
    process.env.SEED_EDITOR_PASSWORD ?? "change-me-editor";

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

  return { ownerEmail, editorEmail };
}
