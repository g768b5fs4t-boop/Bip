import type { Client, Company, Product, Quote, Supplier } from "@/lib/types";

export type PersistEntity =
  | "company"
  | "supplier"
  | "client"
  | "product"
  | "products"
  | "quote";

export async function persistEntity(
  body:
    | { entity: "company"; data: Partial<Company> }
    | { entity: "supplier"; data: Supplier }
    | { entity: "client"; data: Client }
    | { entity: "product"; data: Product }
    | { entity: "products"; data: Product[] }
    | { entity: "quote"; data: Quote },
): Promise<boolean> {
  try {
    const res = await fetch("/api/tenant/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteEntity(
  entity: "supplier" | "client" | "product" | "quote",
  id: string,
): Promise<boolean> {
  try {
    const res = await fetch("/api/tenant/persist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity, action: "delete", id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function newEntityId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
