import { NextRequest, NextResponse } from "next/server";
import { seedUsers } from "@/lib/seed-users";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.AUTH_SECRET}`;

  if (!process.env.AUTH_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ownerEmail, editorEmail } = await seedUsers();

  return NextResponse.json({ ownerEmail, editorEmail });
}
