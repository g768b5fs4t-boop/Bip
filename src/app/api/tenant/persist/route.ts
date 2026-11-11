import { NextRequest, NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth-server";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import type { Client, Company, Product, Quote, Supplier } from "@/lib/types";
import {
  persistClient,
  persistCompany,
  persistProduct,
  persistProductsBulk,
  persistQuote,
  persistSupplier,
} from "@/lib/tenant-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PersistBody =
  | { entity: "company"; data: Partial<Company> }
  | { entity: "supplier"; data: Supplier }
  | { entity: "client"; data: Client }
  | { entity: "product"; data: Product }
  | { entity: "products"; data: Product[] }
  | { entity: "quote"; data: Quote };

export async function POST(req: NextRequest) {
  const tenant = await requireTenant(req);
  if (!tenant) {
    return NextResponse.json(
      { error: "Session cloud requise pour synchroniser." },
      { status: 401 },
    );
  }

  const ip = clientIp(req.headers);
  if (!rateLimit(`persist:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  let body: PersistBody;
  try {
    body = (await req.json()) as PersistBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { accessToken, companyId } = tenant;

  switch (body.entity) {
    case "company": {
      const res = await persistCompany(accessToken, companyId, body.data);
      if (!res.ok) {
        return NextResponse.json({ error: "Échec enregistrement" }, { status: 500 });
      }
      return NextResponse.json({ ok: true, company: res.company });
    }
    case "supplier": {
      if (body.data.companyId && body.data.companyId !== companyId) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const res = await persistSupplier(accessToken, companyId, {
        ...body.data,
        companyId,
      });
      return res.ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "Échec enregistrement" }, { status: 500 });
    }
    case "client": {
      if (body.data.companyId && body.data.companyId !== companyId) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const res = await persistClient(accessToken, companyId, {
        ...body.data,
        companyId,
      });
      return res.ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "Échec enregistrement" }, { status: 500 });
    }
    case "product": {
      if (body.data.companyId && body.data.companyId !== companyId) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const res = await persistProduct(accessToken, companyId, {
        ...body.data,
        companyId,
      });
      return res.ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "Échec enregistrement" }, { status: 500 });
    }
    case "products": {
      const rows = body.data.map((p) => ({ ...p, companyId }));
      const res = await persistProductsBulk(accessToken, companyId, rows);
      return res.ok
        ? NextResponse.json({ ok: true, count: res.count })
        : NextResponse.json({ error: "Échec enregistrement" }, { status: 500 });
    }
    case "quote": {
      if (body.data.companyId && body.data.companyId !== companyId) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      const res = await persistQuote(accessToken, companyId, {
        ...body.data,
        companyId,
      });
      return res.ok
        ? NextResponse.json({ ok: true })
        : NextResponse.json({ error: "Échec enregistrement" }, { status: 500 });
    }
    default:
      return NextResponse.json({ error: "Entité inconnue" }, { status: 400 });
  }
}
