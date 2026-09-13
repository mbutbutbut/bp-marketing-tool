import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { imageDataUrl, widthPx, heightPx, dpi, templateId, variantId } =
    body as {
      imageDataUrl?: string;
      widthPx?: number;
      heightPx?: number;
      dpi?: number;
      templateId?: string;
      variantId?: string;
    };

  if (!imageDataUrl || !widthPx || !heightPx) {
    return NextResponse.json(
      { error: "imageDataUrl, widthPx, and heightPx are required." },
      { status: 400 },
    );
  }

  const effectiveDpi = dpi && dpi > 0 ? dpi : 72;
  const pointsPerPx = 72 / effectiveDpi;

  const base64 = imageDataUrl.split(",")[1] ?? imageDataUrl;
  const imageBytes = Buffer.from(base64, "base64");

  const pdfDoc = await PDFDocument.create();
  const png = await pdfDoc.embedPng(imageBytes);

  const pageWidth = widthPx * pointsPerPx;
  const pageHeight = heightPx * pointsPerPx;
  const page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawImage(png, { x: 0, y: 0, width: pageWidth, height: pageHeight });

  const pdfBytes = await pdfDoc.save();

  if (templateId && variantId) {
    try {
      await prisma.render.create({
        data: {
          templateId,
          variantId,
          createdById: session.user.id,
          contentJson: {},
          format: "PDF",
        },
      });
    } catch {
      // History logging is best-effort — never block the export on it.
    }
  }

  return new NextResponse(new Uint8Array(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="export.pdf"',
    },
  });
}
