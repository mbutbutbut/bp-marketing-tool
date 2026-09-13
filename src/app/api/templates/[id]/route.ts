import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status } = body as { status?: string };

  if (!status || !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
    return NextResponse.json(
      { error: "status must be DRAFT, PUBLISHED, or ARCHIVED." },
      { status: 400 },
    );
  }

  const template = await prisma.template.update({
    where: { id },
    data: { status: status as Prisma.TemplateUpdateInput["status"] },
  });

  return NextResponse.json({ status: template.status });
}
