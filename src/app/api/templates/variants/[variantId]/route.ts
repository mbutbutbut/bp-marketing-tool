import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

interface FieldUpdate {
  fieldKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  color: string;
  align: string;
  maskColor: string;
  defaultValue: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { variantId } = await params;
  const body = await req.json();
  const { fields } = body as { fields: FieldUpdate[] };

  if (!Array.isArray(fields)) {
    return NextResponse.json(
      { error: "fields must be an array." },
      { status: 400 },
    );
  }

  const variant = await prisma.templateVariant.findUnique({
    where: { id: variantId },
  });

  if (!variant) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existingCanvasJson = variant.canvasJson as unknown as {
    backgroundImageUrl: string | null;
    backgroundFill: string | null;
    width: number;
    height: number;
    fields: FieldUpdate[];
  };

  const updatedCanvasJson = {
    ...existingCanvasJson,
    fields,
  };

  await prisma.templateVariant.update({
    where: { id: variantId },
    data: {
      canvasJson: updatedCanvasJson as unknown as Prisma.InputJsonValue,
    },
  });

  await Promise.all(
    fields.map((f) =>
      prisma.templateField.updateMany({
        where: { variantId, fieldKey: f.fieldKey },
        data: {
          fontFamily: f.fontFamily,
          fontSize: Math.round(f.fontSize),
          defaultValue: f.defaultValue,
        },
      }),
    ),
  );

  return NextResponse.json({ ok: true });
}
