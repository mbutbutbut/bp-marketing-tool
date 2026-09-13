import "dotenv/config";
import { prisma } from "@/lib/prisma";
import { seedUsers } from "@/lib/seed-users";

/**
 * Seeds a self-contained fixture template for e2e tests — no Figma API
 * call required, so CI doesn't depend on external network access or a
 * Figma token. Background is a flat fill (not an image) to keep the
 * smoke test independent of image-hosting/CORS behavior; the dedicated
 * background-image regression test below covers that separately.
 */
export async function seedFixtureTemplate() {
  const { ownerEmail } = await seedUsers();
  const owner = await prisma.user.findUniqueOrThrow({
    where: { email: ownerEmail },
  });

  await prisma.template.deleteMany({ where: { name: "E2E Fixture Poster" } });

  const canvasJson = {
    backgroundImageUrl: null,
    backgroundFill: "#f4f4f5",
    width: 1080,
    height: 1080,
    fields: [
      {
        fieldKey: "event_title",
        x: 100,
        y: 100,
        width: 800,
        height: 120,
        fontFamily: "Inter",
        fontSize: 64,
        color: "#111111",
        align: "left",
        maskColor: "#ffb347",
        defaultValue: "Trivia Night",
      },
      {
        fieldKey: "event_date",
        x: 100,
        y: 260,
        width: 500,
        height: 60,
        fontFamily: "Inter",
        fontSize: 32,
        color: "#111111",
        align: "left",
        maskColor: "#f4f4f5",
        defaultValue: "Friday, October 3",
      },
    ],
  };

  const template = await prisma.template.create({
    data: {
      name: "E2E Fixture Poster",
      status: "PUBLISHED",
      createdById: owner.id,
      variants: {
        create: {
          outputType: "IG_POST",
          label: "Instagram Post (1:1)",
          widthPx: canvasJson.width,
          heightPx: canvasJson.height,
          dpi: 72,
          canvasJson,
        },
      },
    },
    include: { variants: true },
  });

  const variant = template.variants[0];

  await prisma.templateField.createMany({
    data: canvasJson.fields.map((f) => ({
      templateId: template.id,
      variantId: variant.id,
      fieldKey: f.fieldKey,
      label: f.fieldKey === "event_title" ? "Event Title" : "Event Date",
      isEditable: true,
      defaultValue: f.defaultValue,
      fontFamily: f.fontFamily,
      fontSize: f.fontSize,
    })),
  });

  return { template, variant };
}

// Runnable directly via `tsx tests/e2e/fixtures/seed.ts` — Playwright's own
// TS transform can't load Prisma's ESM-native generated client, so this
// fixture is seeded as a separate step before `playwright test` runs
// rather than through Playwright's globalSetup.
if (require.main === module) {
  seedFixtureTemplate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
