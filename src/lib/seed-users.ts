import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Reads an env var with a fallback, treating an empty string the same as
 * "unset". Vercel can auto-sync `.env.example` variable NAMES with empty
 * values, so `??` (which only falls back on null/undefined) previously let
 * an empty string through and created a user with `email: ""`.
 */
export function resolveSeedEnv(value: string | undefined, fallback: string) {
  return value || fallback;
}

export async function seedUsers() {
  const ownerEmail = resolveSeedEnv(
    process.env.SEED_OWNER_EMAIL,
    "owner@boulderparc.com",
  );
  const ownerPassword = resolveSeedEnv(
    process.env.SEED_OWNER_PASSWORD,
    "change-me-owner",
  );
  const editorEmail = resolveSeedEnv(
    process.env.SEED_EDITOR_EMAIL,
    "editor@boulderparc.com",
  );
  const editorPassword = resolveSeedEnv(
    process.env.SEED_EDITOR_PASSWORD,
    "change-me-editor",
  );

  // Clean up any user created by an earlier bug where empty env vars
  // (rather than missing ones) bypassed the fallback defaults above.
  await prisma.user.deleteMany({ where: { email: "" } });

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
