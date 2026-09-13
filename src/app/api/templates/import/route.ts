import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseFigmaUrl,
  importFigmaFrame,
  getFigmaFrameImageUrl,
  FigmaImportError,
} from "@/lib/figma";

function slugify(name: string, index: number): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return base || `field_${index}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "FIGMA_ACCESS_TOKEN is not configured on the server." },
      { status: 500 },
    );
  }

  const body = await req.json();
  const { name, figmaUrl } = body as { name?: string; figmaUrl?: string };

  if (!name || !figmaUrl) {
    return NextResponse.json(
      { error: "Both a template name and a Figma URL are required." },
      { status: 400 },
    );
  }

  try {
    const { fileKey, nodeId } = parseFigmaUrl(figmaUrl);
    if (!nodeId) {
      return NextResponse.json(
        {
          error:
            "That link doesn't point at a specific frame. In Figma, select the frame and use \"Copy link to selection.\"",
        },
        { status: 400 },
      );
    }

    const frame = await importFigmaFrame(fileKey, nodeId, token);
    const backgroundImageUrl = await getFigmaFrameImageUrl(
      fileKey,
      nodeId,
      token,
    );

    const canvasJson = {
      backgroundImageUrl,
      backgroundFill: frame.backgroundFill,
      width: frame.width,
      height: frame.height,
      fields: frame.textFields.map((f, i) => ({
        fieldKey: slugify(f.name, i),
        figmaNodeId: f.figmaNodeId,
        x: f.x,
        y: f.y,
        width: f.width,
        height: f.height,
        fontFamily: f.fontFamily,
        fontSize: f.fontSize,
        color: f.color,
        align: f.align,
        maskColor: frame.backgroundFill ?? "#ffffff",
        defaultValue: f.characters,
      })),
    };

    const template = await prisma.template.create({
      data: {
        name,
        status: "DRAFT",
        baseFigmaFileKey: fileKey,
        baseFigmaNodeId: nodeId,
        createdById: session.user.id,
        variants: {
          create: {
            outputType: "CUSTOM",
            label: `${frame.width}×${frame.height} (as designed)`,
            widthPx: frame.width,
            heightPx: frame.height,
            canvasJson,
          },
        },
      },
      include: { variants: true },
    });

    const variant = template.variants[0];

    if (canvasJson.fields.length > 0) {
      await prisma.templateField.createMany({
        data: canvasJson.fields.map((f, i) => ({
          templateId: template.id,
          variantId: variant.id,
          fieldKey: f.fieldKey,
          label: frame.textFields[i].name,
          type: "text",
          defaultValue: f.defaultValue,
          fontFamily: f.fontFamily,
          fontSize: f.fontSize,
        })),
      });
    }

    return NextResponse.json({ templateId: template.id });
  } catch (err) {
    if (err instanceof FigmaImportError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Something went wrong importing that frame." },
      { status: 500 },
    );
  }
}
