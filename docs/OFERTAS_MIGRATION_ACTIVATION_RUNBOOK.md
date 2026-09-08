# Ofertas Migration Activation Runbook

This is a future controlled staging/prodcedure. Package 9 did not execute SQL, apply migrations, connect to Supabase, or verify database state.

## Pre-Activation

1. Confirm backup and restore capability for the target project.
2. Confirm the exact Supabase project and environment; staging first, never production first.
3. Confirm current migration history and no unexpected schema drift.
4. Keep runtime deployment paused while schema is in transition.
5. Keep worker routes disabled.
6. Confirm Stripe webhook is disabled or points only to the intended staging runtime.
7. Confirm Gemini runtime is not yet writing new provider values.
8. Confirm staging does not use production credentials.
9. Confirm historical migrations have not been edited.

## Migration Application

Apply one migration at a time in this order:

1. `20260616130000_ofertas_locales_ai_production_bootstrap.sql`
2. `20260731222500_ofertas_locales_30_day_public_term.sql`
3. `20260731235500_ofertas_locales_commercial_activation_identity.sql`
4. `20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql`
5. `20260801013000_ofertas_locales_ai_scan_review_publication.sql`
6. `20260801023000_ofertas_locales_renewal_operations_lifecycle.sql`

After each migration, verify migration history, expected objects, constraints, indexes, RLS, policies, and functions. Stop on any discrepancy. Do not continue to later migrations if a predecessor is missing or partially applied.

## Read-Only Schema Verification SQL

The future operator may run only metadata `SELECT` checks such as:

```sql
select version, name, inserted_at from supabase_migrations.schema_migrations order by version;
select table_name from information_schema.tables where table_schema = 'public' and table_name like 'ofertas_local%';
select column_name, data_type, is_nullable from information_schema.columns where table_schema = 'public' and table_name in ('ofertas_locales','oferta_local_items','ofertas_local_renewal_attempts','ofertas_local_public_terms','ofertas_local_notification_events') order by table_name, ordinal_position;
select conname, contype from pg_constraint where conrelid::regclass::text like 'public.ofertas%';
select indexname from pg_indexes where schemaname = 'public' and tablename like 'ofertas_local%';
select policyname, tablename, cmd from pg_policies where schemaname = 'public' and tablename like 'ofertas_local%';
select proname, prosecdef from pg_proc where proname in ('activate_oferta_local_reviewed_source','activate_due_oferta_local_renewal');
```

No `INSERT`, `UPDATE`, `DELETE`, `ALTER`, `DROP`, migration application, or secret inspection belongs in verification SQL.

## Post-Migration

Run the read-only schema verification, deploy staging runtime, verify the readiness endpoint, then enable one subsystem at a time. Do not enable workers before schema verification. Do not enable Gemini before provider constraint verification. Do not enable Stripe webhook before product metadata verification.

## Rollback

Prefer pausing runtime/workers and restoring from backup for migration failure involving customer data, constraints, or RPC behavior. Some schema additions are forward-compatible but not safely reversible after data is written. Historical migrations must not be edited because doing so destroys migration-history truth and makes staging/production drift unverifiable.
