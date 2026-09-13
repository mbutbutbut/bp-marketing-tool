import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OUTPUT_PRESETS } from "@/lib/output-sizes";
import { computeCanvasScale, scaleField } from "@/lib/scale-canvas";
import type { Prisma } from "@/generated/prisma/client";

interface CanvasField {
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

interface CanvasJson {
  backgroundImageUrl: string | null;
  backgroundFill: string | null;
  width: number;
  height: number;
  fields: CanvasField[];
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: templateId } = await params;
  const body = await req.json();
  const {
    outputType,
    label: customLabel,
    widthPx: customWidthPx,
    heightPx: customHeightPx,
    sourceVariantId,
  } = body as {
    outputType: string;
    label?: string;
    widthPx?: number;
    heightPx?: number;
    sourceVariantId?: string;
  };

  const preset = OUTPUT_PRESETS[outputType];
  const widthPx = preset?.widthPx ?? customWidthPx;
  const heightPx = preset?.heightPx ?? customHeightPx;
  const dpi = preset?.dpi ?? 72;

  if (!outputType || !widthPx || !heightPx) {
    return NextResponse.json(
      { error: "An output type and both width and height are required." },
      { status: 400 },
    );
  }

  const template = await prisma.template.findUnique({
    where: { id: templateId },
    include: { variants: true, fields: true },
  });

  if (!template) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const source = sourceVariantId
    ? template.variants.find((v) => v.id === sourceVariantId)
    : template.variants[0];

  if (!source) {
    return NextResponse.json(
      { error: "This template has no existing size to base a new one on." },
      { status: 400 },
    );
  }

  const sourceCanvas = source.canvasJson as unknown as CanvasJson;
  const scale = computeCanvasScale(
    sourceCanvas.width,
    sourceCanvas.height,
    widthPx,
    heightPx,
  );
  const { fontScale } = scale;

  const newFields: CanvasField[] = sourceCanvas.fields.map((f) =>
    scaleField(f, scale),
  );

  const newCanvasJson: CanvasJson = {
    ...sourceCanvas,
    width: widthPx,
    height: heightPx,
    fields: newFields,
  };

  const variant = await prisma.templateVariant.create({
    data: {
      templateId,
      outputType: outputType as Prisma.TemplateVariantCreateInput["outputType"],
      label: customLabel || preset?.label || `${widthPx}×${heightPx}`,
      widthPx,
      heightPx,
      dpi,
      canvasJson: newCanvasJson as unknown as Prisma.InputJsonValue,
    },
  });

  const sourceFields = template.fields.filter(
    (f) => f.variantId === source.id,
  );

  if (sourceFields.length > 0) {
    await prisma.templateField.createMany({
      data: sourceFields.map((f) => ({
        templateId,
        variantId: variant.id,
        fieldKey: f.fieldKey,
        label: f.label,
        type: f.type,
        isEditable: f.isEditable,
        defaultValue: f.defaultValue,
        fontFamily: f.fontFamily,
        fontSize: f.fontSize ? Math.round(f.fontSize * fontScale) : f.fontSize,
        maxLength: f.maxLength,
      })),
    });
  }

  return NextResponse.json({ variantId: variant.id });
}
