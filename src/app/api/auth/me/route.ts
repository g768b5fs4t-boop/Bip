import { NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewer = await resolveViewer(request);
  if (!viewer) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      user: { email: viewer.email, name: viewer.name },
      source: viewer.source,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
