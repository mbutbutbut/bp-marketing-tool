import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const source = await prisma.template.findUnique({
    where: { id },
    include: { variants: true, fields: true },
  });

  if (!source) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const copy = await prisma.template.create({
    data: {
      name: `${source.name} (copy)`,
      eventType: source.eventType,
      status: "DRAFT",
      baseFigmaFileKey: source.baseFigmaFileKey,
      baseFigmaNodeId: source.baseFigmaNodeId,
      createdById: session.user.id,
    },
  });

  const variantIdMap = new Map<string, string>();

  for (const variant of source.variants) {
    const newVariant = await prisma.templateVariant.create({
      data: {
        templateId: copy.id,
        outputType: variant.outputType,
        label: variant.label,
        widthPx: variant.widthPx,
        heightPx: variant.heightPx,
        dpi: variant.dpi,
        canvasJson: variant.canvasJson as unknown as Prisma.InputJsonValue,
      },
    });
    variantIdMap.set(variant.id, newVariant.id);
  }

  if (source.fields.length > 0) {
    await prisma.templateField.createMany({
      data: source.fields.map((f) => ({
        templateId: copy.id,
        variantId: f.variantId ? (variantIdMap.get(f.variantId) ?? null) : null,
        fieldKey: f.fieldKey,
        label: f.label,
        type: f.type,
        isEditable: f.isEditable,
        defaultValue: f.defaultValue,
        fontFamily: f.fontFamily,
        fontSize: f.fontSize,
        maxLength: f.maxLength,
      })),
    });
  }

  return NextResponse.json({ templateId: copy.id });
}
