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

No migration was applied in the Ofertas worktree for Package 1A or Package 3.

Recommended migration name:

```text
allow_gemini_multimodal_oferta_local_scan_jobs_provider
```

Integration order:

1. Merge the Ofertas runtime provider work that writes `gemini_multimodal`.
2. Apply the forward-only schema migration in the shared lifecycle/schema workstream.
3. Run the rollback-transaction verification in real QA.
4. Run Ofertas scan QA only after the provider insert succeeds.

Merge dependency:

```text
The schema migration must merge before any production traffic can create real Gemini scan jobs.
```

Deployment dependency:

```text
Deploy schema first, then deploy or enable the runtime path that persists gemini_multimodal.
```

Real QA dependency:

```text
QA must run against an environment with the updated provider constraint, Supabase service role configured, and Gemini runtime env vars configured.
```

## Proposed SQL

```sql
begin;

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

commit;
```

## Rollback SQL

Only use rollback before any real `gemini_multimodal` rows exist, or after coordinating a data migration away from that provider value.

```sql
begin;

alter table public.oferta_local_scan_jobs
  drop constraint if exists oferta_local_scan_jobs_provider_check;

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

Confirm there are no unexpected provider values:

```sql
select provider
from public.oferta_local_scan_jobs
where provider not in (
  'google_document_ai',
  'leonix_manual',
  'future_provider',
  'gemini_multimodal'
)
group by provider;
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

Transaction-safe negative test:

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
  'not_allowed_provider',
  'test',
  'pending'
from public.ofertas_locales
limit 1;

rollback;
```

Expected result: the insert fails on `oferta_local_scan_jobs_provider_check`.

## Expected Application Behavior

After the migration, `app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts` can create scan jobs with `provider = 'gemini_multimodal'` without a constraint violation. Historical rows keep their existing provider values. No provider renaming is required.

Required tests:

- Static audit: `scripts/ofertas-locales-package-1a-identity-audit.ts`
- Static audit: `scripts/verify-ofertas-cupones-single-ai-pipeline.mjs`
- Runtime QA: create an Ofertas scan job with a real source asset and verify the scan job row stores `gemini_multimodal`.
- Runtime QA: verify RLS behavior is unchanged by running existing owner/admin scan-job access checks.

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
