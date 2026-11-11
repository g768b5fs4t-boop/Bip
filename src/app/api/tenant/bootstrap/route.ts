import { NextResponse } from "next/server";
import { requireTenant, resolveViewer } from "@/lib/auth-server";
import { loadTenantBootstrap } from "@/lib/tenant-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const tenant = await requireTenant(request);
  if (!tenant) {
    const viewer = await resolveViewer(request);
    if (viewer?.source === "local-sim" || viewer?.source === "cursor") {
      return NextResponse.json({
        cloud: false,
        notice: "Données locales (pas de sync Supabase pour cette session).",
      });
    }
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const data = await loadTenantBootstrap(tenant.accessToken, tenant.companyId);
  if ("error" in data) {
    return NextResponse.json(
      { error: "Impossible de charger vos données." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    cloud: true,
    ...data,
  });
}
