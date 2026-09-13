import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fieldId: string }> },
) {
  const session = await auth();
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fieldId } = await params;
  const body = await req.json();
  const { isEditable } = body as { isEditable?: boolean };

  if (typeof isEditable !== "boolean") {
    return NextResponse.json(
      { error: "isEditable must be a boolean." },
      { status: 400 },
    );
  }

  const field = await prisma.templateField.findUnique({
    where: { id: fieldId },
  });

  if (!field) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await prisma.templateField.update({
    where: { id: fieldId },
    data: { isEditable },
  });

  return NextResponse.json({ field: updated });
}
