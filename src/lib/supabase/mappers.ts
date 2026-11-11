import type {
  Client,
  Company,
  Product,
  Quote,
  QuoteLine,
  QuoteStatus,
  Supplier,
  Unit,
} from "@/lib/types";

export type DbCompany = {
  id: string;
  owner_user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  siret: string | null;
  logo_url: string | null;
  payment_terms: string | null;
  hourly_rate_ht: number | string;
  travel_fee_ht: number | string;
  default_margin_percent: number | string;
  default_vat_rate: number | string;
  vat_rates: number[] | string[] | null;
  legal_mentions: string | null;
  quote_validity_days: number;
};

export type DbSupplier = {
  id: string;
  company_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
};

export type DbProduct = {
  id: string;
  company_id: string;
  supplier_id: string | null;
  reference: string;
  designation: string;
  unit: string;
  purchase_price_ht: number | string;
  margin_percent: number | string | null;
  sale_price_ht: number | string | null;
  updated_at: string;
};

export type DbClient = {
  id: string;
  company_id: string;
  name: string;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
};

export type DbQuote = {
  id: string;
  company_id: string;
  client_id: string;
  number: string;
  status: string;
  valid_until: string | null;
  notes: string | null;
  lines: unknown;
  created_at: string;
  updated_at: string;
};

function num(value: number | string | null | undefined, fallback = 0): number {
  if (value == null || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapCompany(row: DbCompany): Company {
  const rates = Array.isArray(row.vat_rates)
    ? row.vat_rates.map((r) => num(r)).filter((r) => r > 0)
    : [5.5, 10, 20];
  return {
    id: row.id,
    name: row.name,
    address: row.address ?? "",
    city: row.city ?? "",
    postalCode: row.postal_code ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    siret: row.siret ?? "",
    logoUrl: row.logo_url ?? undefined,
    paymentTerms: row.payment_terms ?? "",
    hourlyRateHt: num(row.hourly_rate_ht, 55),
    travelFeeHt: num(row.travel_fee_ht, 45),
    defaultMarginPercent: num(row.default_margin_percent, 35),
    vatRates: rates.length ? rates : [5.5, 10, 20],
    defaultVatRate: num(row.default_vat_rate, 20),
    legalMentions: row.legal_mentions ?? "",
    quoteValidityDays: row.quote_validity_days ?? 30,
  };
}

export function companyToDb(patch: Partial<Company>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.address !== undefined) out.address = patch.address;
  if (patch.city !== undefined) out.city = patch.city;
  if (patch.postalCode !== undefined) out.postal_code = patch.postalCode;
  if (patch.phone !== undefined) out.phone = patch.phone;
  if (patch.email !== undefined) out.email = patch.email;
  if (patch.siret !== undefined) out.siret = patch.siret;
  if (patch.logoUrl !== undefined) out.logo_url = patch.logoUrl;
  if (patch.paymentTerms !== undefined) out.payment_terms = patch.paymentTerms;
  if (patch.hourlyRateHt !== undefined) out.hourly_rate_ht = patch.hourlyRateHt;
  if (patch.travelFeeHt !== undefined) out.travel_fee_ht = patch.travelFeeHt;
  if (patch.defaultMarginPercent !== undefined) {
    out.default_margin_percent = patch.defaultMarginPercent;
  }
  if (patch.defaultVatRate !== undefined) out.default_vat_rate = patch.defaultVatRate;
  if (patch.vatRates !== undefined) out.vat_rates = patch.vatRates;
  if (patch.legalMentions !== undefined) out.legal_mentions = patch.legalMentions;
  if (patch.quoteValidityDays !== undefined) {
    out.quote_validity_days = patch.quoteValidityDays;
  }
  out.updated_at = new Date().toISOString();
  return out;
}

export function mapSupplier(row: DbSupplier): Supplier {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

export function mapProduct(row: DbProduct): Product {
  return {
    id: row.id,
    companyId: row.company_id,
    supplierId: row.supplier_id ?? "",
    reference: row.reference,
    designation: row.designation,
    unit: (row.unit as Unit) || "u",
    purchasePriceHt: num(row.purchase_price_ht),
    marginPercent:
      row.margin_percent == null ? null : num(row.margin_percent),
    salePriceHt: row.sale_price_ht == null ? null : num(row.sale_price_ht),
    updatedAt: row.updated_at,
  };
}

export function mapClient(row: DbClient): Client {
  return {
    id: row.id,
    companyId: row.company_id,
    name: row.name,
    address: row.address ?? undefined,
    city: row.city ?? undefined,
    postalCode: row.postal_code ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  };
}

function mapLines(raw: unknown): QuoteLine[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((line, index) => {
    const l = line as Partial<QuoteLine>;
    return {
      id: l.id || `line_${index}`,
      type: l.type || "divers",
      reference: l.reference,
      designation: l.designation || "",
      quantity: num(l.quantity, 1),
      unit: (l.unit as Unit) || "u",
      unitPriceHt: num(l.unitPriceHt),
      vatRate: num(l.vatRate, 20),
      productId: l.productId,
    };
  });
}

export function mapQuote(row: DbQuote): Quote {
  return {
    id: row.id,
    number: row.number,
    companyId: row.company_id,
    clientId: row.client_id,
    status: (row.status as QuoteStatus) || "brouillon",
    createdAt: row.created_at,
    validUntil: row.valid_until || row.created_at.slice(0, 10),
    lines: mapLines(row.lines),
    notes: row.notes ?? undefined,
  };
}

export function quoteToDb(quote: Quote, companyId: string): Record<string, unknown> {
  return {
    id: quote.id,
    company_id: companyId,
    client_id: quote.clientId,
    number: quote.number,
    status: quote.status,
    valid_until: quote.validUntil || null,
    notes: quote.notes ?? null,
    lines: quote.lines,
    created_at: quote.createdAt,
    updated_at: new Date().toISOString(),
  };
}

export function productToDb(
  product: Omit<Product, "companyId"> & { companyId?: string },
  companyId: string,
): Record<string, unknown> {
  return {
    id: product.id,
    company_id: companyId,
    supplier_id: product.supplierId || null,
    reference: product.reference,
    designation: product.designation,
    unit: product.unit,
    purchase_price_ht: product.purchasePriceHt,
    margin_percent: product.marginPercent,
    sale_price_ht: product.salePriceHt,
    updated_at: product.updatedAt || new Date().toISOString(),
  };
}

export function clientToDb(
  client: Omit<Client, "companyId"> & { companyId?: string },
  companyId: string,
): Record<string, unknown> {
  return {
    id: client.id,
    company_id: companyId,
    name: client.name,
    address: client.address ?? null,
    city: client.city ?? null,
    postal_code: client.postalCode ?? null,
    phone: client.phone ?? null,
    email: client.email ?? null,
    notes: client.notes ?? null,
    created_at: client.createdAt || new Date().toISOString(),
  };
}

export function supplierToDb(
  supplier: Omit<Supplier, "companyId"> & { companyId?: string },
  companyId: string,
): Record<string, unknown> {
  return {
    id: supplier.id,
    company_id: companyId,
    name: supplier.name,
    email: supplier.email ?? null,
    phone: supplier.phone ?? null,
    notes: supplier.notes ?? null,
    created_at: supplier.createdAt || new Date().toISOString(),
  };
}
