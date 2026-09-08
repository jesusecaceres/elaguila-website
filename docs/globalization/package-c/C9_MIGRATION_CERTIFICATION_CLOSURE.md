# Package C — C9: Live Migration Certification Closure

**Closure date:** 2026-08-11
**Repo:** C:/projects/elaguila-website
**Branch:** integration/lifecycle-foundation-2026-07
**Parent (Build 4, C7+C8):** `7babda4b` (pushed, remotely verified)

## 1. Executive summary

C9 applied Build 4's frozen capacity-activation migration to an isolated, non-Production Supabase project ("Leonix Certification", ref `mvasgrdzmupsnuicwyjl`) and ran the live concurrency/lifecycle/idempotency/identity/permission matrix that Build 4 explicitly deferred. Production (`xuieateniufcrsfdomwl`, "Leonix Media") was never connected to, read from, or written to at any point. C9 found and fixed one genuine runtime defect in the frozen migration — a `text = uuid` type mismatch that would have broken every real activation in Production — then re-certified the corrected migration live, fully green across both categories, all four concurrency boundaries, and every lifecycle/identity/permission proof.

## 2. Certification environment

- **Project:** Leonix Certification, ref `mvasgrdzmupsnuicwyjl` — a dedicated, owner-provisioned Supabase project created specifically for this gate, distinct from the single real production project (`xuieateniufcrsfdomwl`, "Leonix Media") this repo otherwise exclusively targets.
- **Credentials:** loaded exclusively from `.env.certification.local` (git-ignored, never committed) via `C9_SUPABASE_URL`/`C9_SUPABASE_SERVICE_ROLE_KEY`/`C9_SUPABASE_PROJECT_REF`/`C9_SUPABASE_ANON_KEY`. The application's real `.env.local`/`NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` were never read by any C9 script.
- **Safety guards (mechanical, not procedural):** the harness (`scripts/certify-package-c-c9-capacity-rpcs.mjs`) hard-refuses to run if the certification URL/ref contains the known Production ref, if the certification URL equals `NEXT_PUBLIC_SUPABASE_URL`, or if the URL doesn't contain the declared ref — and requires an explicit `--i-understand-this-is-not-production` flag.
- **No DDL execution channel existed** for either the schema setup or the RPC migration (PostgREST doesn't expose arbitrary SQL, and no direct Postgres connection string was ever provisioned to this session) — both were applied by the project owner manually via the Supabase SQL Editor, with this session reading the exact file contents verbatim into chat for copy/paste, never executing SQL itself.

## 3. Certification schema reconstruction

Four tables were required: `autos_classifieds_listings`, `listing_package_entitlements`, `leonix_subscription_records` (all three fully reconstructable from their own gap-free, self-consistent migration chains in `supabase/migrations/`), and `public.listings`.

**`public.listings` has no `CREATE TABLE` anywhere in this repo's 105 tracked migrations** — the earliest migration touching it (`20250311000001_listings_price_drop.sql`, the second migration file in the repo's entire history) is already an `ALTER TABLE`, proving the table predates this repo's migration-tracking convention entirely. Reconstructing it from the migration history alone was not possible without guessing at the foundational column set, types, defaults, and constraints — an explicit stop condition this gate was told to honor rather than work around.

**Resolution:** the project owner supplied a literal, authoritative, READ-ONLY schema snapshot pulled directly from the real Production database (columns, types, defaults, NOT NULL flags, constraints, indexes, RLS policies, and trigger definitions) — schema metadata only, zero Production rows read, zero Production schema or data changed. `public.listings` was reconstructed **verbatim** from that snapshot in `scripts/c9-certification-schema-setup.sql`, not re-derived from application code or the (confirmed incomplete/drifted) migration history.

**Intentionally excluded, each with its own specific justification** (not a blanket omission):
- Four `public.listings` triggers (`listings_leonix_ad_id_biu`, three `listings_lifecycle_audit_*` variants, `trg_prevent_owner_change`, `trg_set_owner_id`) and their backing functions — none are load-bearing for `br_negocio_activate_listing`'s correctness: the RPC's `UPDATE` never touches `leonix_ad_id` or `owner_id`, the lifecycle-audit triggers are pure `AFTER`-trigger side-effect logging, and the owner-change guard's failure condition is structurally unreachable since the RPC's `SET` clause never includes `owner_id`. A concrete drift instance was also found and correctly deferred to the snapshot: the tracked migration (`20260506150000_leonix_ad_id_all_classifieds.sql`) implies a differently-named, INSERT-only trigger than what the live snapshot actually shows (renamed, INSERT-OR-UPDATE, with a `WHEN` guard) — direct proof the migration history for this table no longer matches reality, reinforcing that the snapshot (not the migration) was the right authority to trust.
- The equivalent `leonix_ad_id` auto-generation trigger/counter-table system on `autos_classifieds_listings` (whose function bodies ARE fully known from its own tracked migration, unlike `listings`') — skipped for the same reason: certification fixtures always supply `leonix_ad_id` explicitly.
- Foreign keys from `listing_package_entitlements`/`leonix_subscription_records` to `leonix_payment_records`, `leonix_placement_entitlements`, `leonix_promo_codes`, and `leonix_promo_code_redemptions` — all four referenced tables are outside C9's required set, all four FK columns are nullable, and no C9 fixture ever populates them.

**One additional certification-only fix was required:** the newly-created tables did not inherit `service_role`'s usual default privileges (a plain Postgres `permission denied for table` error on first live insert — not an RLS violation, which `service_role` bypasses entirely via its `BYPASSRLS` role attribute regardless). A single, narrowly-scoped `grant all on public.listings, public.autos_classifieds_listings, public.listing_package_entitlements, public.leonix_subscription_records to service_role;` resolved it — applied only to the certification project, not part of the frozen migration, not touching Production.

## 4. Genuine defect found and fixed: `text = uuid` type mismatch

The first live run failed every non-idempotent activation call with `42883 operator does not exist: text = uuid`. Root cause: `leonix_subscription_records.listing_id` and `listing_package_entitlements.listing_id` are both declared `text`, while `v_parent.id` (the record field populated from `autos_classifieds_listings.id`/`listings.id`, both `uuid`) was compared to them with no cast, in 4 places (2 lookups × 2 RPCs). `CREATE OR REPLACE FUNCTION` does not type-check embedded SQL inside a PL/pgSQL body until that branch actually executes — so this defect was structurally invisible to every check Build 4 ran (the SQL-contract verifier, the TS selftest, three rounds of architecture review), and would have broken **every real activation in Production** had the migration been applied there as authored.

**Evidence it was a real defect, not certification-schema noise:** the paths that never reach the buggy lookups worked correctly on the very first run — the idempotent already-active short-circuit (A6/B6) and the owner/parent-mismatch rejections (A12/B12), both of which return before the subscription/entitlement lookups. Only the paths that reach those two lookups failed, identically and consistently across both categories.

**Exact fix — 4 surgical casts, nothing else touched:** `listing_id = v_parent.id` → `listing_id = v_parent.id::text` in both RPCs' subscription lookup, and `e.listing_id = v_parent.id` → `e.listing_id = v_parent.id::text` in both RPCs' entitlement lookup. `br_inventory_parent_listing_id = v_parent.id` (line 271, a genuinely `uuid`-typed column) was correctly left uncast — confirmed via `git diff`, exactly 4 lines changed in the migration.

**Regression guard added** to `scripts/verify-c7-capacity-rpc-sql-contract.mjs`: asserts zero occurrences of the bare, uncast comparison remain (word-boundary-safe, so it doesn't false-positive on `br_inventory_parent_listing_id`) and exactly 2 cast occurrences exist per RPC. The verifier's own first version of this check had a real false positive (matched inside `br_inventory_parent_listing_id` before a negative lookbehind was added) — caught and fixed before trusting the check's own "all green" result.

## 5. Harness fixture-design correction (not an RPC defect)

The corrected migration's first full re-run still failed 6 Bienes tests and all 4 concurrency boundaries — this was a bug in the certification harness's own fixtures, not the RPC. The fixtures created every Bienes parent as already `status:'active'` immediately, then tried to activate an *additional* child under the unpacked base limit of 1. The RPC correctly rejected this: a non-packed Bienes negocio parent is, by the locked commercial model, already occupying its one included slot the moment it's active — there is no room for a child on top of it. B1/B3/B10/B11 (which specifically test "activate with room to spare at the base limit") and the BIENES-1/BIENES-4 concurrency boundary setups were redesigned to either target the parent's own first activation directly (matching the real first-payment flow, where the parent's activation *is* the base slot being filled) or to leave the parent un-activated so two child candidates could race for real headroom. Autos concurrency setups had the analogous off-by-one (the active parent itself is one of the 10/20 counted units, so "9 active + 2 candidates" was actually already 10 pre-existing, not 9) — corrected to 8/18 additional active children respectively.

## 6. Live certification results

**Autos A1–A13:** all pass — base limit 10 correctly derived (A1), boosted limit 20 correctly derived (A2), boost on one dealer proven not to leak to a sibling dealer (A3), idempotent duplicate activation (A6), grace/expired-grace-as-suspended/suspended/canceled all correctly denied with the exact expected `blocked_reason` (A7/A7b/A8/A9), first-payment with zero subscription rows permitted (A10), `pending` subscription state permitted (A11), wrong-owner and wrong-parent both rejected with `not_found_or_owner_mismatch` (A12), rejected target's prior state verified byte-identical before/after (A13).

**Bienes B1–B13:** all pass — same shape as Autos, adapted for the 1/4 base/pack limits and the parent-counts-as-a-unit correction above (B1–B3, B6–B13).

**Concurrency (25 iterations each, real `Promise.all` two-way races through `pg_advisory_xact_lock`, freshly-seeded fixtures per iteration):**
- Autos base (9 pre-existing + 2 racing candidates → cap 10): **25/25 clean**, final count never exceeded **10**.
- Autos boosted (19 pre-existing + 2 racing candidates → cap 20): **25/25 clean**, final count never exceeded **20**.
- Bienes base (0 pre-existing + 2 racing candidates → cap 1): **25/25 clean**, final count never exceeded **1**.
- Bienes packed (3 pre-existing + 2 racing candidates → cap 4): **25/25 clean**, final count never exceeded **4**.

In every iteration of every boundary: exactly one candidate activated, exactly one denied with `capacity_reached`, and a fresh re-count after both calls resolved matched the limit exactly — proving the advisory lock serializes correctly, not that the race merely got lucky once.

**Lifecycle:** pass (grace denies, expired grace treated as suspended, suspended denies, canceled denies — for both categories).

**Idempotency:** pass — a target activated once, then hit with two concurrent duplicate deliveries, both returned `activated=true, idempotent=true`; the group's active count was unchanged before vs. after.

**First-payment semantics:** pass — zero subscription rows still permits the first activation (A10/B10), matching the proven real webhook ordering (inventory activation runs before the subscription record is created in the same delivery); `pending` subscription state also permits activation (A11/B11).

**Identity isolation:** pass — cross-parent entitlement isolation (A3/B3), wrong-owner rejection, wrong-parent rejection (child physically linked to one dealer/agent, called with a different owner's identity — rejected without ever trusting the caller's claim), and rejected-target state preservation (A13/B13, byte-identical before/after).

**Real TS wrapper integration (C1/C2):** pass — the actual, unmodified `app/lib/listingPlans/capacityActivationRpc.ts` functions (`activateAutosDealerListingAtomic`, `activateBrNegocioListingAtomic`) were executed live against the certification project — not a reimplementation — via `node --conditions=react-server`, the standard Node flag that resolves the `server-only` package's no-op export instead of its unconditionally-throwing default export. This is the first time either wrapper function had ever actually executed; Build 4 only proved their source maps correctly by reading it.

**Negative sweep (C6):** pass — query ran clean, no evidence of any capacity-relevant row becoming active outside a logged RPC call during the run.

**C8 smoke:** pass — subscription state reads back correctly from a live row, `grant_source` reads back correctly, and a `comp`-sourced entitlement creates exactly one `listing_package_entitlements` row (the certification schema has no `leonix_payment_records`/`leonix_placement_entitlements` tables at all, since they're out of C9's scope — "zero fabricated payment/placement record" is true by construction here, not independently re-derived; the deeper application-level guarantee that `grantComplimentaryAccess`/`grantPartnerCourtesy` never call the payment/placement writers was already proven by source-text pin in Build 4's own Gate 8 closure).

**Permissions:** `service_role` executes both RPCs correctly (structured rows returned, not errors). `anon` and `authenticated` both received a live Postgres `42501 permission denied for function <name>` for both RPCs — the exact insufficient-privilege error class, not a generic auth failure or a "function not found" (which would indicate something else entirely). A temporary certification-only auth user was created to obtain a real `authenticated`-role JWT for that specific proof, then deleted immediately after. **`PUBLIC` revoked is reported as inferred, not directly queried** — no `information_schema`/raw-SQL channel was ever available to this session (no Management API token, no direct Postgres connection string), so there is no way to `SELECT` the grant catalog directly. The inference: the migration's only grant statement is `grant execute ... to service_role`; `anon` and `authenticated` have no other independent grant path in this schema; Postgres grants `EXECUTE` to `PUBLIC` by default on function creation. Their clean, uniform `42501` denial is only explainable by `PUBLIC`'s default `EXECUTE` having been successfully revoked — there is no other mechanism that would produce that exact error for both roles otherwise.

## 7. Cleanup

Every fixture-creating run's `finally` block deleted every row it created (fixture listings/autos rows by id, entitlements/subscriptions by id, synthetic `auth.users` by id) and re-queried the certification project directly afterward. Confirmed zero remaining fixture rows in all 4 tables and zero remaining auth users after every run in this gate, including the final permission-closeout run (which created one temporary `authenticated`-role user and confirmed its deletion).

## 8. Scope discipline

**Application source code: unchanged by C9.** Every fix this gate made lives in `supabase/migrations/20260810120000_autos_br_negocio_capacity_activation_rpc.sql` (the 4 casts), `scripts/verify-c7-capacity-rpc-sql-contract.mjs` (the regression guard), and the two new C9-only artifacts (`scripts/c9-certification-schema-setup.sql`, `scripts/certify-package-c-c9-capacity-rpcs.mjs`). No file under `app/` was touched.

**Production: never touched.** No migration was ever applied to `xuieateniufcrsfdomwl`. The one schema-snapshot read was read-only metadata, performed by the project owner outside this session's tool access, never by a C9 script. No C9 script's safety guards were ever bypassed.

## 9. READY FOR COACH CLOSEOUT REVIEW: YES

Migration applied to Production: **NO**. Application architecture changed: **NO**. C9 fixtures/auth users remaining anywhere: **0**.
