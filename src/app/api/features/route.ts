import { NextResponse } from "next/server";
import { getServerFeatureFlags } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getServerFeatureFlags(), {
    headers: { "Cache-Control": "no-store" },
  });
}
