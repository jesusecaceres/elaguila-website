# Stripe Revenue OS Live Supabase Proof 01

Gate: `STRIPE-REVENUE-OS-LIVE-SUPABASE-PROOF-01`  
Date: 2026-07-01  
Project: Leonix Media (`xuieateniufcrsfdomwl`)  
Scope: live Supabase apply/proof for Revenue OS schema contract. No Stripe Checkout, no webhooks, no live payments, no `.env` edits, no client/listing damage.

## 1. Executive Summary

Live Supabase MCP access succeeded against the Leonix Media project. Before this gate, Revenue OS tables (`leonix_promo_codes`, `leonix_payment_records`, `leonix_promo_code_redemptions`, `leonix_placement_entitlements`) were **missing live** despite existing in repo migrations. `listing_package_entitlements` and `admin_audit_log` existed live.

This gate safely applied three live migrations via Supabase MCP `apply_migration`:

1. `leonix_promo_codes` (base)
2. `leonix_payment_records` (base)
3. `stripe_revenue_os_schema_and_entitlement_contract_01` (Revenue OS contract alignment)

All six required tables now exist live with expected columns, RLS enabled, and **no public write policies**. Safe test rows were inserted: inactive promo code, cancelled admin-only placement entitlement, and audit log proof row. No real payments, client listings, staff accounts, or production entitlements were mutated.

## 2. Repo Baseline

| Check | Result |
|---|---|
| `git status --short` | Clean (no dirty files) |
| `git diff --name-only` | Empty |
| `git diff --cached --name-only` | Empty |
| Unrelated dirty files | None |
| Staged files | None |
| This gate files (new) | `docs/stripe-revenue-os-live-supabase-proof-01.md`, `scripts/verify-stripe-revenue-os-live-supabase-proof-01.mjs`, `package.json` (verifier script only) |

## 3. Migration Safety Inspection

Inspected: `supabase/migrations/20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql`

| Safety check | Result |
|---|---|
| Additive only | PASS |
| `CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` | PASS |
| No `DROP TABLE` | PASS |
| No `DELETE FROM` | PASS |
| No `TRUNCATE` | PASS |
| No `ALTER TABLE ... DROP` | PASS |
| No destructive rewrite | PASS |
| No public write policies | PASS |
| No secrets in migration | PASS |

## 4. Live Migration / Apply Result

| Migration applied live | MCP result | Notes |
|---|---|---|
| `leonix_promo_codes` | SUCCESS | Base table created live |
| `leonix_payment_records` | SUCCESS | Base table created live |
| `stripe_revenue_os_schema_and_entitlement_contract_01` | SUCCESS | Redemptions, placement entitlements, alignment columns |

Live migration history now includes versions `20260701015854`, `20260701015910`, `20260701015922` (MCP-assigned timestamps).

**LIVE APPLY AVAILABLE:** TRUE — applied successfully via Supabase MCP.

Repo migration files were not modified. Live apply used the same SQL contract as the repo migration plus prerequisite base migrations that were never applied live previously.

## 5. Live Table Proof

| Table | Exists | Count query | Result |
|---|---:|---:|---|
| `public.leonix_payment_records` | TRUE | 0 rows | PASS |
| `public.leonix_promo_codes` | TRUE | 1 row (test) | PASS |
| `public.leonix_promo_code_redemptions` | TRUE | 0 rows | PASS |
| `public.leonix_placement_entitlements` | TRUE | 1 row (test) | PASS |
| `public.listing_package_entitlements` | TRUE | 1 row (pre-existing) | PASS |
| `public.admin_audit_log` | TRUE | 376 rows (includes proof row) | PASS |

No public write proof was attempted.

## 6. Required Column Proof

### A. `leonix_payment_records`

| Required column | Live status | Notes |
|---|---|---|
| id | PASS | |
| owner_user_id | PASS | Added by contract migration |
| listing_id | PASS | |
| leonix_ad_id | PASS | |
| category | PASS | |
| package_key | PASS | |
| placement_tier | PASS | |
| billing_mode | PASS | |
| amount_cents | PASS | |
| currency | PASS | |
| status | PASS (mapped) | Column name live: `payment_status` |
| payment_source | PASS (mapped) | Column name live: `source` |
| contract_source | PASS | |
| stripe_checkout_session_id | PASS | Unique index present |
| stripe_payment_intent_id | PASS | |
| stripe_customer_id | PASS | |
| stripe_subscription_id | PASS | |
| promo_code_id | PASS | |
| promo_redemption_id | PASS | |
| entitlement_id | PASS (mapped) | Column name live: `package_entitlement_id` |
| placement_entitlement_id | PASS | |
| metadata | PASS | |
| created_at | PASS | |
| updated_at | PASS | |

### B. `leonix_promo_codes`

| Required column | Live status | Notes |
|---|---|---|
| id | PASS | |
| code | PASS | Unique constraint `leonix_promo_codes_code_unique` |
| label | PASS | |
| description | PASS | |
| promo_type | PASS | |
| percent_off | PASS | |
| amount_off_cents | PASS | |
| currency | PASS | |
| category_scope | PASS | |
| package_scope | PASS | |
| placement_scope | PASS | |
| starts_at | PASS | |
| expires_at | PASS (mapped) | Column name live: `ends_at` |
| max_redemptions | PASS | |
| per_customer_limit | PASS | |
| sales_rep_id | PASS | |
| created_by | PASS | |
| is_active | PASS | |
| metadata | PASS | |
| created_at | PASS | |
| updated_at | PASS | |

### C. `leonix_promo_code_redemptions`

All required columns **PASS** live (full match).

### D. `leonix_placement_entitlements`

All required columns **PASS** live (full match).

### E. `listing_package_entitlements` alignment

| Column | Live status |
|---|---|
| placement_entitlement_id | PASS |
| payment_record_id | PASS |
| promo_code_id | PASS |
| promo_redemption_id | PASS |
| package_key | PASS |
| category | PASS |
| billing_mode | PASS |
| starts_at | PASS |
| ends_at | PASS |
| status | PASS |
| metadata | PASS |

## 7. Safe Test Row Proof

| Test row | ID | Status | Notes |
|---|---|---|---|
| Promo `REVOS_TEST_DO_NOT_USE` | `f3ff3de0-f5fe-4034-97b8-1b17aac70e8a` | INSERT + UPDATE PASS | `is_active=false`, `status=draft`, `promo_type=manual` |
| Placement entitlement | `c2aef8e1-d9ac-465a-82ff-6c5433a829a5` | INSERT PASS | `category=servicios`, `placement_tier=free`, `status=cancelled`, `surfaces={admin}` only |
| Audit log | `19cc5be7-4914-4dfd-b792-67488fcf0049` | INSERT PASS | `action=revenue_os_live_proof_test` |

**Not created:** payment records, Stripe sessions, active public placement, client listing mutations.

Test rows left in place (inactive/cancelled). Admin can filter by code `REVOS_TEST_DO_NOT_USE`, business name `Revenue OS Test Only`, or audit action `revenue_os_live_proof_test`.

## 8. RLS / Security Proof

| Table | RLS enabled | Public write policies |
|---|---|---|
| `leonix_payment_records` | TRUE | NONE |
| `leonix_promo_codes` | TRUE | NONE |
| `leonix_promo_code_redemptions` | TRUE | NONE |
| `leonix_placement_entitlements` | TRUE | NONE |
| `listing_package_entitlements` | TRUE | NONE |

**Server/admin-only expectation:** TRUE — all Revenue OS writes require service role / server-side paths.

**NEEDS SECURITY REVIEW:** Before any anon/authenticated client reads of payment/placement data.

**Checkout/webhook path:** Service role required for payment record creation, redemption finalization, and entitlement activation.

## 9. Admin Audit Log Proof

| Check | Result |
|---|---|
| Table exists live | PASS |
| Required columns (`action`, `target_type`, `target_id`, `meta`) | PASS |
| Safe insert `revenue_os_live_proof_test` | PASS |
| Row id | `19cc5be7-4914-4dfd-b792-67488fcf0049` |

Compatible with future Revenue OS audit actions documented in schema contract gate.

## 10. Admin / Dashboard Readiness

Helper files verified present in repo:

- `app/lib/listingPlans/revenuePricingMatrix.ts`
- `app/lib/listingPlans/placementEntitlements.ts`
- `app/lib/listingPlans/promoCodeRules.ts`
- `app/lib/listingPlans/revenueEntitlements.ts`

| Helper constraint | Result |
|---|---|
| No Stripe import | PASS |
| No `process.env` reads | PASS |
| No database mutation | PASS |

Live DB now backs Admin payment tracker and promo workspace reads once UI routes query these tables. Placement/redemption Admin UI remains a future gate.

## 11. Empleos Two-Pipeline Proof

Empleos monetization has **two distinct pipelines** (owner rule):

| Pipeline | Package key (owner target) | Price | Stripe | Promo |
|---|---|---:|---|---|
| Regular job post | `empleos_job_post_paid` | $24.99 / 30d | Yes | Yes |
| Job fair | `empleos_job_fair_free` | Free | No | No |

**Current helper state (`revenuePricingMatrix.ts`):** uses legacy keys `empleos_job_30d` and `empleos_job_fair` with correct pricing intent ($24.99 paid vs free fair). **NEEDS OWNER ALIGNMENT GATE** to rename keys to `empleos_job_post_paid` and `empleos_job_fair_free` without breaking publish flows.

**Live proof:** No Empleos payment or placement rows were created. Empleos listings table exists live separately; not mutated.

## 12. Blockers

| Blocker | Severity | Notes |
|---|---|---|
| Empleos package key rename in helpers | LOW | Documented; future small gate |
| Admin UI not yet wired to placement/redemption tables | MEDIUM | Expected; Checkout gate first |
| No payment rows live | NONE | By design until Checkout gate |

No blockers prevent committing this proof gate documentation.

## 13. Manual Cleanup / Manual SQL Notes

Optional admin cleanup (not required):

```sql
-- Find test promo
SELECT id, code, is_active, status FROM public.leonix_promo_codes WHERE code = 'REVOS_TEST_DO_NOT_USE';

-- Find test placement
SELECT id, business_name, status FROM public.leonix_placement_entitlements WHERE business_name = 'Revenue OS Test Only';

-- Find audit proof row
SELECT id, action, target_id FROM public.admin_audit_log WHERE action = 'revenue_os_live_proof_test';
```

Do not delete production entitlements or payment rows. Test rows are inactive/cancelled and harmless.

## 14. Next Recommended Revenue OS Gate

**`STRIPE-REVENUE-OS-CHECKOUT-SESSION-01`** — create Checkout sessions using `buildStripeCheckoutMetadataPayload()`, writing pending `leonix_payment_records` and optional promo redemption rows server-side only after sandbox env validation.

## 15. Final Recommendation

Live Supabase is now **ready for Revenue OS money-write gates**. Schema contract tables and columns are proven live. Safe test inserts confirm write path works via service role. Proceed to Checkout session gate in sandbox; do not enable live charges until webhook idempotency gate passes.
