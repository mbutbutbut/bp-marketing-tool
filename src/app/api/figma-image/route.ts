import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

function isAllowedImageHost(hostname: string): boolean {
  return (
    hostname.endsWith(".figma.com") || hostname.endsWith("amazonaws.com")
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:" || !isAllowedImageHost(parsed.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
