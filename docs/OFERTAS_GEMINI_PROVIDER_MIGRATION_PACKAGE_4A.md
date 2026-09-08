# Ofertas Gemini Provider Migration Package 4A

## Scope

This package creates a forward-only migration file only. It does not apply the migration, connect to a database, change RLS, modify application runtime, or deploy Gemini.

## Repository Schema Proof

Relevant migrations:

- `supabase/migrations/20260606120000_create_oferta_local_ai_scan_items.sql`
- `supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql`

Both define `public.oferta_local_scan_jobs.provider` as:

```sql
provider text not null default 'google_document_ai'
  check (provider in ('google_document_ai', 'leonix_manual', 'future_provider'))
```

The inline check produces the expected constraint name:

```text
oferta_local_scan_jobs_provider_check
```

No later repository migration adds `gemini_multimodal`.

## Forward Migration

Created migration:

```text
supabase/migrations/20260731214500_allow_gemini_multimodal_oferta_local_scan_jobs_provider.sql
```

Behavior:

- Drops only `oferta_local_scan_jobs_provider_check`.
- Recreates it with `google_document_ai`, `leonix_manual`, `future_provider`, and `gemini_multimodal`.
- Keeps `provider` as `text not null`.
- Keeps default `google_document_ai`.
- Does not update rows.
- Does not change RLS, indexes, foreign keys, or table columns.

## Rollback SQL

Rollback precondition: there must be no rows using `provider = 'gemini_multimodal'`. If such rows exist, rollback must be blocked or coordinated with a data migration.

Precheck:

```sql
select count(*) as gemini_multimodal_rows
from public.oferta_local_scan_jobs
where provider = 'gemini_multimodal';
```

Rollback:

```sql
begin;

alter table public.oferta_local_scan_jobs
  drop constraint oferta_local_scan_jobs_provider_check;

alter table public.oferta_local_scan_jobs
  add constraint oferta_local_scan_jobs_provider_check
  check (provider in (
    'google_document_ai',
    'leonix_manual',
    'future_provider'
  ));

commit;
```

## Verification SQL

Active constraint:

```sql
select
  c.conname,
  pg_get_constraintdef(c.oid) as definition
from pg_constraint c
join pg_class t on t.oid = c.conrelid
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'oferta_local_scan_jobs'
  and c.conname = 'oferta_local_scan_jobs_provider_check';
```

Provider distribution:

```sql
select provider, count(*)
from public.oferta_local_scan_jobs
group by provider
order by provider;
```

Transaction-safe insert test for QA only:

```sql
begin;

insert into public.oferta_local_scan_jobs (
  oferta_local_id,
  owner_id,
  provider,
  normalizer_provider,
  status
)
select
  id,
  owner_id,
  'gemini_multimodal',
  'gemini',
  'pending'
from public.ofertas_locales
limit 1
returning id, provider;

rollback;
```

## Deployment Order

1. Merge the migration package.
2. Apply the provider-compatibility database migration in local/staging before any runtime writes `gemini_multimodal`.
3. Verify the constraint definition.
4. Verify provider distribution.
5. Run the transaction-safe insert test in staging QA.
6. Deploy or enable runtime that writes `gemini_multimodal`.
7. Run real Ofertas flyer scan QA in staging and confirm successful scan-job persistence.
8. Proceed to controlled production rollout only after staging passes, preserving the same database-before-runtime order.
9. Preserve the rollback guard: the original constraint cannot be restored while any row uses `gemini_multimodal`; rollback must be blocked or coordinated with a data migration.

Production runtime must not persist Gemini scan jobs before this migration is applied.
