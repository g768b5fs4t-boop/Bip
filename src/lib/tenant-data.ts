import type { Client, Company, Product, Quote, Supplier } from "@/lib/types";
import { getSupabaseForUser } from "@/lib/supabase/admin";
import {
  clientToDb,
  companyToDb,
  mapClient,
  mapCompany,
  mapProduct,
  mapQuote,
  mapSupplier,
  productToDb,
  quoteToDb,
  supplierToDb,
  type DbClient,
  type DbCompany,
  type DbProduct,
  type DbQuote,
  type DbSupplier,
} from "@/lib/supabase/mappers";

export type TenantBootstrap = {
  company: Company;
  suppliers: Supplier[];
  products: Product[];
  clients: Client[];
  quotes: Quote[];
};

export async function loadTenantBootstrap(
  accessToken: string,
  companyId: string,
): Promise<TenantBootstrap | { error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { error: "supabase_unavailable" };

  const [companyRes, suppliersRes, productsRes, clientsRes, quotesRes] =
    await Promise.all([
      client.from("companies").select("*").eq("id", companyId).maybeSingle(),
      client.from("suppliers").select("*").eq("company_id", companyId),
      client.from("products").select("*").eq("company_id", companyId),
      client.from("clients").select("*").eq("company_id", companyId),
      client
        .from("quotes")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
    ]);

  if (companyRes.error || !companyRes.data) {
    return { error: "company_not_found" };
  }

  return {
    company: mapCompany(companyRes.data as DbCompany),
    suppliers: ((suppliersRes.data || []) as DbSupplier[]).map(mapSupplier),
    products: ((productsRes.data || []) as DbProduct[]).map(mapProduct),
    clients: ((clientsRes.data || []) as DbClient[]).map(mapClient),
    quotes: ((quotesRes.data || []) as DbQuote[]).map(mapQuote),
  };
}

export async function persistCompany(
  accessToken: string,
  companyId: string,
  patch: Partial<Company>,
): Promise<{ ok: true; company: Company } | { ok: false; error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { ok: false, error: "supabase_unavailable" };
  const { data, error } = await client
    .from("companies")
    .update(companyToDb(patch))
    .eq("id", companyId)
    .select("*")
    .maybeSingle();
  if (error || !data) return { ok: false, error: "persist_failed" };
  return { ok: true, company: mapCompany(data as DbCompany) };
}

export async function persistSupplier(
  accessToken: string,
  companyId: string,
  supplier: Supplier,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { ok: false, error: "supabase_unavailable" };
  const row = supplierToDb(supplier, companyId);
  const { error } = await client.from("suppliers").upsert(row);
  return error ? { ok: false, error: "persist_failed" } : { ok: true };
}

export async function persistClient(
  accessToken: string,
  companyId: string,
  clientRow: Client,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { ok: false, error: "supabase_unavailable" };
  const row = clientToDb(clientRow, companyId);
  const { error } = await client.from("clients").upsert(row);
  return error ? { ok: false, error: "persist_failed" } : { ok: true };
}

export async function persistProduct(
  accessToken: string,
  companyId: string,
  product: Product,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { ok: false, error: "supabase_unavailable" };
  const row = productToDb(product, companyId);
  const { error } = await client.from("products").upsert(row);
  return error ? { ok: false, error: "persist_failed" } : { ok: true };
}

export async function persistProductsBulk(
  accessToken: string,
  companyId: string,
  products: Product[],
): Promise<{ ok: true; count: number } | { ok: false; error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { ok: false, error: "supabase_unavailable" };
  const rows = products.map((p) => productToDb(p, companyId));
  const { error } = await client.from("products").upsert(rows);
  return error
    ? { ok: false, error: "persist_failed" }
    : { ok: true, count: products.length };
}

export async function persistQuote(
  accessToken: string,
  companyId: string,
  quote: Quote,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const client = getSupabaseForUser(accessToken);
  if (!client) return { ok: false, error: "supabase_unavailable" };
  if (quote.companyId !== companyId) {
    return { ok: false, error: "tenant_mismatch" };
  }
  const row = quoteToDb(quote, companyId);
  const { error } = await client.from("quotes").upsert(row);
  return error ? { ok: false, error: "persist_failed" } : { ok: true };
}
