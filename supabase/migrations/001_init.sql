-- DevisRapide IA — schéma multi-entreprises + RLS
-- À appliquer dans le SQL Editor Supabase (projet gratuit possible).

create extension if not exists "pgcrypto";

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null unique,
  name text not null,
  address text default '',
  city text default '',
  postal_code text default '',
  phone text default '',
  email text default '',
  siret text default '',
  logo_url text,
  payment_terms text default '',
  hourly_rate_ht numeric(12,2) not null default 55,
  travel_fee_ht numeric(12,2) not null default 45,
  default_margin_percent numeric(8,2) not null default 35,
  default_vat_rate numeric(5,2) not null default 20,
  legal_mentions text default '',
  quote_validity_days int not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete set null,
  reference text not null,
  designation text not null,
  unit text not null default 'u',
  purchase_price_ht numeric(12,2) not null default 0,
  margin_percent numeric(8,2),
  sale_price_ht numeric(12,2),
  updated_at timestamptz not null default now(),
  unique (company_id, reference)
);

create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  address text,
  city text,
  postal_code text,
  phone text,
  email text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  client_id uuid not null references clients(id) on delete restrict,
  number text not null,
  status text not null default 'brouillon'
    check (status in ('brouillon','valide','envoye','accepte','refuse','archive')),
  valid_until date,
  notes text,
  lines jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, number)
);

create index if not exists products_company_ref_idx on products (company_id, reference);
create index if not exists quotes_company_status_idx on quotes (company_id, status);

alter table companies enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table clients enable row level security;
alter table quotes enable row level security;

create or replace function public.current_company_id()
returns uuid
language sql
stable
as $$
  select id from companies where owner_user_id = auth.uid() limit 1
$$;

create policy companies_owner on companies
  for all using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy suppliers_tenant on suppliers
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy products_tenant on products
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy clients_tenant on clients
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());

create policy quotes_tenant on quotes
  for all using (company_id = public.current_company_id())
  with check (company_id = public.current_company_id());
