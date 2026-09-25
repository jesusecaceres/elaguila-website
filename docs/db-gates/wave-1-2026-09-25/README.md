# Leonix DB Security Gate — Wave 1 (prepared 2026-09-25, NOT APPLIED)

Target: **Leonix Media `xuieateniufcrsfdomwl` only.** Not Staging (`cgeehvnfyrdoperdotdh`), not Certification
(`mvasgrdzmupsnuicwyjl`). Nothing here has been executed. Apply only after PM approval, one step at a time, in order.
Each migration file is one transaction with pre-guards and post-assertions: if any assertion fails, nothing commits.

| # | File | Kind | Change on Leonix Media | Risk |
|---|---|---|---|---|
| 1 | `supabase/migrations/20260925120000_revoke_capacity_rpc_client_execute.sql` | migration | revoke EXECUTE on `autos_dealer_activate_listing` / `br_negocio_activate_listing` from PUBLIC/anon/authenticated; service_role keeps it | LOW — every caller uses the service-role client |
| 2 | `supabase/migrations/20260925120100_listing_lifecycle_reminder_events_lockdown.sql` | migration | enable RLS; revoke all client privileges; service_role keeps DML | LOW — 0 rows, no client reader |
| 3 | `supabase/migrations/20260827180000_leonix_newsletter_unsubscribe.sql` (existing, unchanged) | migration | adds `unsubscribed_at` (the other two columns already exist) + a redundant non-unique token index | LOW — additive |
| 4 | `supabase/reviewed-seeds/category-status/20260925_servicios_site_category_config_live.sql` | reviewed seed (data) | Servicios row `staged` → `live` | LOW — Admin label only |

Not in Wave 1: `20260924190000` (Autos BASE capacity), listings owner-authority guard, Ofertas address privacy,
Comida Google/Yelp, saved-search categories, digital-contact, LEO, free Viajes/Cupones, `20260903150000`,
Staging/Certification resets.

## Pre-flight (read-only) — run before step 1 and keep the output

```sql
select p.proname, array_to_string(p.proacl, ' ') acl,
       has_function_privilege('anon', p.oid, 'EXECUTE') anon_exec,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') auth_exec,
       has_function_privilege('service_role', p.oid, 'EXECUTE') svc_exec,
       md5(pg_get_functiondef(p.oid)) body_md5
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('autos_dealer_activate_listing', 'br_negocio_activate_listing');
-- expected 2026-09-25: anon_exec=true, auth_exec=true, svc_exec=true (both)

select relrowsecurity, array_to_string(relacl, ' ') acl,
       (select count(*) from public.listing_lifecycle_reminder_events) rows_
from pg_class where oid = 'public.listing_lifecycle_reminder_events'::regclass;
-- expected: false, anon/authenticated/service_role=arwdDxtm, 0

select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'leonix_newsletter_subscribers'
  and column_name in ('unsubscribe_token', 'unsubscribe_token_expires_at', 'unsubscribed_at');
-- expected: unsubscribe_token, unsubscribe_token_expires_at (no unsubscribed_at)

select * from public.site_category_config where slug = 'servicios';
-- expected: operational_status='staged', notes='Puede seguir en transición según producto.', sort_order=40
```

## Apply (only after PM approval)

1. Steps 1–3 are schema migrations: apply each file's exact contents (e.g. Supabase MCP `apply_migration` with the
   file's name, or the SQL editor) — **one file per call**, in order, and stop on any error.
2. Step 4 is a reviewed seed: execute the file contents once (SQL editor / `execute_sql`). Never `apply_migration`,
   never `supabase db push`.

## Post-verification (read-only)

```sql
-- after 1: both rows anon_exec=false, auth_exec=false, svc_exec=true, body_md5 UNCHANGED from pre-flight
-- after 2: relrowsecurity=true; has_table_privilege('anon'|'authenticated', ..., 'SELECT') = false
select has_table_privilege('anon', 'public.listing_lifecycle_reminder_events', 'SELECT') anon_sel,
       has_table_privilege('authenticated', 'public.listing_lifecycle_reminder_events', 'INSERT') auth_ins,
       has_table_privilege('service_role', 'public.listing_lifecycle_reminder_events', 'INSERT') svc_ins;
-- expected false, false, true
-- after 3: the column list above also returns unsubscribed_at
-- after 4: servicios operational_status='live', visibility/sort_order/highlight/notes unchanged
```

Then re-run the Supabase security advisor: `rls_disabled_in_public` must be gone, and both capacity RPCs must no
longer appear under `anon_security_definer_function_executable` / `authenticated_security_definer_function_executable`.

App smoke after apply (Preview): Admin → Categories shows Servicios LIVE; an Autos dealer / BR Negocio paid
activation (webhook path, service role) still activates; newsletter unsubscribe link returns "unsubscribed".

## Rollback (emergency only — each re-opens what the step closed)

- `rollback_20260925120000_revoke_capacity_rpc_client_execute.sql`
- `rollback_20260925120100_listing_lifecycle_reminder_events_lockdown.sql`
- `rollback_20260827180000_leonix_newsletter_unsubscribe.sql`
- `rollback_servicios_site_category_config_live.sql`

## Source cleanup flagged (not done)

`supabase/migrations/20260903150000_fix_parent_inventory_capacity_counting.sql` redefines both capacity RPCs with the
dealer/agent parent EXCLUDED from the count — contradicting the owner rule (TOTAL, parent counts). It is **not**
applied on Leonix Media (live BR function counts the parent) but **is** applied on Staging, and it sits in the fresh
replay path: `20260924190000` later fixes Autos, but nothing later restores `br_negocio_activate_listing`, so a fresh
database built from source would get parent-excluding Bienes capacity.
Recommendation: **do not delete or rename** (Staging's migration history references it; deleting desyncs history).
Keep it with an explicit OBSOLETE header marker, and add a later forward migration that re-creates
`br_negocio_activate_listing` with parent-counting semantics identical to the live Leonix Media body — so fresh
replays converge on production truth. Both need PM approval.
