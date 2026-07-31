# Ofertas Gemini Provider Schema Coordination

## Current Runtime Provider

The Ofertas AI scan runtime persists the scan job provider as:

```text
gemini_multimodal
```

Runtime evidence:

- `app/lib/ofertas-locales/ofertasLocalesGeminiConfig.ts`
- `app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts`

## Current Database Allowed Values

The current database provider check allows only:

- `google_document_ai`
- `leonix_manual`
- `future_provider`

Migration evidence:

- `supabase/migrations/20260606120000_create_oferta_local_ai_scan_items.sql`
- `supabase/migrations/20260616130000_ofertas_locales_ai_production_bootstrap.sql`

## Table and Constraint

Table:

```text
public.oferta_local_scan_jobs
```

Column:

```text
provider
```

Expected generated constraint name:

```text
oferta_local_scan_jobs_provider_check
```

The existing migrations define an inline column check, so PostgreSQL should generate the constraint name above unless it was manually renamed in an environment.

## Recommended Coordinated Fix

Globalization/Lifecycle should create a new forward-only migration that:

- Adds `gemini_multimodal` to the allowed provider constraint.
- Preserves all existing allowed provider values.
- Does not rename existing provider rows.
- Does not rewrite old migrations.
- Leaves RLS unchanged.
- Verifies the deployed constraint name before applying the replacement.

No migration was applied in the Ofertas worktree for Package 1A.

## Proposed SQL

```sql
alter table public.oferta_local_scan_jobs
  drop constraint if exists oferta_local_scan_jobs_provider_check;

alter table public.oferta_local_scan_jobs
  add constraint oferta_local_scan_jobs_provider_check
  check (provider in (
    'google_document_ai',
    'leonix_manual',
    'future_provider',
    'gemini_multimodal'
  ));
```

## Verification SQL

Inspect the active constraint:

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

Confirm existing values remain valid:

```sql
select provider, count(*)
from public.oferta_local_scan_jobs
group by provider
order by provider;
```

Safely test `gemini_multimodal` in a non-production environment or inside a rollback transaction:

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

If the environment has no `ofertas_locales` parent row, seed a disposable non-production parent first or use an existing non-production parent. Do not run this insert in production outside a rollback-controlled verification.

## Ownership and Dependency

Required owner:

```text
Globalization/Lifecycle workstream
```

Required dependency:

```text
This schema change must land before real Gemini scan QA.
```

Package 1A statement:

```text
No schema migration was applied.
No database write was performed.
```
