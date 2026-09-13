import "dotenv/config";
import { seedUsers } from "../src/lib/seed-users";
import { prisma } from "../src/lib/prisma";

seedUsers()
  .then(({ ownerEmail, editorEmail }) => {
    console.log(`Seeded owner (${ownerEmail}) and editor (${editorEmail}).`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
