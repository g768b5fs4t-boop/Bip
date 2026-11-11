import { NextResponse } from "next/server";
import { resolveViewer } from "@/lib/auth-server";
import { getServerFeatureFlags } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const viewer = await resolveViewer(request);
  if (!viewer) {
    return NextResponse.json(
      { authenticated: false, features: getServerFeatureFlags() },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }
  return NextResponse.json(
    {
      authenticated: true,
      user: {
        email: viewer.email,
        name: viewer.name,
        id: viewer.userId ?? null,
      },
      companyId: viewer.companyId ?? null,
      source: viewer.source,
      features: getServerFeatureFlags(),
      cloud: viewer.source === "supabase",
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
