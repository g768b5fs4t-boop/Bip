import { NextRequest, NextResponse } from "next/server";
import { buildQuotePdf } from "@/lib/pdf-quote";
import type { Client, Company, Quote, QuoteTotals } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      company: Company;
      client: Client;
      quote: Quote;
      totals: QuoteTotals;
    };

    if (!body?.company || !body?.client || !body?.quote || !body?.totals) {
      return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
    }

    const pdf = await buildQuotePdf(body);
    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${body.quote.number}.pdf"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Échec génération PDF" },
      { status: 500 },
    );
  }
}
