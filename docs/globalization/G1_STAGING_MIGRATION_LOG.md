# Gate G1 — Staging schema parity migration log

Date: 2026-08-26
Target: Staging Supabase (`cgeehvnfyrdoperdotdh`, "Leonix Media Staging") — confirmed by the
project owner to be the project Vercel Preview actually points at for this app, despite also
independently hosting an unrelated live product's schema (~85 `leo_*`/`business_*` tables, an AI
business-advisor platform). Production (`xuieateniufcrsfdomwl`) was never written to in this gate.

## What was found (read-only inventory, before any write)

- Production has 80 `public` schema tables covering the full marketplace: Servicios,
  Restaurantes, Comida Local, Ofertas Locales, Autos, Bienes Raíces, Rentas, Revenue OS, Community
  Trust, analytics, newsletter/leads, admin.
- Staging had 85 tables before this gate, none of them marketplace tables except two coincidental
  shared-ancestor tables: `listing_package_entitlements` and `admin_team_members` (identical early
  column sets, confirming Staging was cloned from an early Production snapshot before diverging
  into the unrelated Leo/business-advisor product).
- The repo's `supabase/migrations/` directory has 130 files. Supabase's own migration-history
  bookkeeping (`list_migrations`) under-reports what's actually applied to Production (some
  objects exist as real tables/functions with no corresponding tracked migration row) — table/
  function/constraint introspection (`information_schema`, `pg_constraint`, `pg_get_functiondef`)
  is the only reliable source of truth, not the migration-history table.

## Scope actually bootstrapped onto Staging

41 of the 130 repo migration files were identified as relevant to the G1.2 scope (Servicios,
Restaurantes, Comida Local, Revenue OS, Community Trust, draft/publish, analytics, payment test
paths) and applied in chronological order. Of those 41:

- **~37 applied verbatim** — self-contained, no dependency on a table outside the target
  Servicios/Restaurantes/Comida Local/Revenue-OS/Community-Trust/admin/analytics/newsletter set.
- **2 applied as scoped extracts, not verbatim**, because the original file bundles in-scope
  statements with statements touching tables that do not exist on Staging and were never in
  scope (`listings`, `empleos_public_listings`, `autos_classifieds_listings`,
  `viajes_staged_listings`, `saved_listings`, `user_liked_listings`):
  - `20260506150000_leonix_ad_id_all_classifieds.sql` → only the shared
    `leonix_ad_id_counters` table + `bump_leonix_ad_counter`/`leonix_allocate_formatted`
    functions + the Servicios/Restaurantes-specific pieces were applied.
  - `20260602120000_g2a_global_analytics_identity.sql` → only the `listing_analytics` portion
    was applied; the `saved_listings`/`user_liked_listings` portions were skipped.
- **1 migration intentionally skipped entirely**: `20260509120000_classifieds_republish_capability.sql`
  (republish/reordering is a secondary feature, not required for draft/publish/payment test
  paths, and it only touches out-of-scope tables for Servicios/Restaurantes anyway — no
  Comida Local statements exist in that file at all).

## Real drift found between the repo and live Production (not introduced by this gate)

Verified directly against Production via `pg_get_functiondef`/`pg_get_triggerdef` — Production's
live database does **not** exactly match what's checked into `supabase/migrations/`:

1. `bump_leonix_ad_counter`'s repo-file body (`set last_seq = public.leonix_ad_id_counters.last_seq + 1`)
   is invalid Postgres once the same INSERT statement aliases that table as `c` — confirmed by
   reproducing the exact error on Staging. Production's real live function correctly uses
   `set last_seq = c.last_seq + 1`. **The repo file, if ever re-applied fresh, would fail.**
   Staging was bootstrapped with the corrected, Production-matching version.
2. Production has **no `restaurantes_leonix_ad_id_bi` trigger at all** on
   `restaurantes_public_listings` — Restaurantes relies entirely on the app-layer
   `allocateNextRestauranteLeonixAdId()` RPC call before insert. The repo migration file adds a
   DB trigger that does not exist in Production. Staging was corrected to match Production (no
   trigger), not the stale repo file.
3. Production's real Servicios trigger is named `servicios_public_listings_leonix_ad_id_biu`
   (not `..._bi` as in the repo file), fires on `BEFORE INSERT OR UPDATE` with a `WHEN` guard
   (not just `BEFORE INSERT`), and its function body delegates to the shared
   `leonix_allocate_formatted()` RPC rather than reimplementing the counter-key logic inline.
   Staging was corrected to match this real, working Production definition.

**Recommendation**: someone with repo-write authority should reconcile
`supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql` against what's actually
live in Production (a new corrective migration, not editing the historical file), so the next
person who tries to replay repo migrations onto a fresh environment doesn't hit the same failure.

## Verification performed (real DB behavior, no fabricated rows)

All three Community Trust target types (`servicios_profile`, `restaurantes_listing`,
`comida_local_listing`) were exercised end-to-end on Staging inside a transaction that was
explicitly `ROLLBACK`'d — real rows were inserted, real triggers fired (confirmed
`servicios_leonix_ad_id` = `SERV-2026-000001`), the real `toggle_leonix_endorsement_vote` and
`get_leonix_endorsement_summary` RPCs were called using the pre-existing Staging QA account
(`qa-owner-temp@staging-test.leonixmedia.invalid`, already registered as `super_admin` in
`admin_team_members` — reused, not created), and confirmed real vote counts
(`professional=1`, `clean=1`, `cl_tasty_food=1`, each `voted=true`) before the transaction was
rolled back. Post-rollback row counts were verified at 0 across all four tables — nothing
persisted.

## Explicitly NOT done in this gate

- Production was never written to.
- No QA user was created (an existing one was found and reused).
- Ofertas Locales, Autos, Bienes Raíces, and Rentas schema was not bootstrapped onto Staging —
  out of G1.2's explicit scope. See `qaFixtureRegistry.ts` for the honest per-category status.
- The Comida Local Community Trust migration (`20260826120000_...`) is verified additive-safe
  and Staging-proven, but has not been applied to Production — that requires separate explicit
  authorization.
