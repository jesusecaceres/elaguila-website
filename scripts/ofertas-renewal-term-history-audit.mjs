import { assertContains, pass, read } from "./ofertas-package-8-audit-utils.mjs";

const migration = read("supabase/migrations/20260801023000_ofertas_locales_renewal_operations_lifecycle.sql");

assertContains(migration, "create table if not exists public.ofertas_local_public_terms", "immutable term history table");
assertContains(migration, "activation_source", "activation provenance");
assertContains(migration, "paid_renewal", "paid renewal term source");
assertContains(migration, "partner_courtesy_renewal", "courtesy renewal term source");
assertContains(migration, "create unique index if not exists ofertas_public_terms_renewal_once_idx", "one term per renewal");
assertContains(migration, "expires_at > starts_at", "positive term duration");
assertContains(migration, "No legacy backfill", "legacy no-backfill truth");
assertContains(migration, "enable row level security", "RLS enabled");

pass("ofertas-renewal-term-history-audit");
