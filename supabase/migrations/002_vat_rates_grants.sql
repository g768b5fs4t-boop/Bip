-- Compléments multi-tenant : taux TVA + grants RLS pour le rôle authenticated

alter table companies
  add column if not exists vat_rates numeric[] not null default array[5.5, 10, 20]::numeric[];

grant usage on schema public to authenticated;
grant select, insert, update, delete on table companies to authenticated;
grant select, insert, update, delete on table suppliers to authenticated;
grant select, insert, update, delete on table products to authenticated;
grant select, insert, update, delete on table clients to authenticated;
grant select, insert, update, delete on table quotes to authenticated;
