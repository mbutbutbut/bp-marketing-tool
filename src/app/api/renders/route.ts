import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { templateId, variantId, format } = body as {
    templateId?: string;
    variantId?: string;
    format?: string;
  };

  if (!templateId || !variantId || !["PNG", "JPG"].includes(format ?? "")) {
    return NextResponse.json({ error: "Invalid render log." }, { status: 400 });
  }

  await prisma.render.create({
    data: {
      templateId,
      variantId,
      createdById: session.user.id,
      contentJson: {},
      format: format as Prisma.RenderCreateInput["format"],
    },
  });

  return NextResponse.json({ ok: true });
}
