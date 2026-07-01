# Stripe Revenue OS Schema and Entitlement Contract 01

Gate: `STRIPE-REVENUE-OS-SCHEMA-AND-ENTITLEMENT-CONTRACT-01`  
Date: 2026-06-30  
Scope: additive Supabase schema contract, read-model helpers, and documentation only. No Stripe Checkout, no webhooks, no live payments, no `.env` edits, no public UI redesign.

## 1. Executive Summary

This gate implements the first Revenue OS **data contract** after the blueprint gate passed. Leonix monetization remains a category/listing/placement entitlement system: Stripe proves payment, promo codes prove discount/attribution, and entitlements decide placement. The repo already had foundational tables (`listing_package_entitlements`, `leonix_promo_codes`, `leonix_payment_records`) from earlier gates; live Supabase proof showed some tables missing live or needing alignment.

This gate adds:

- One additive migration: `20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql`
- New tables: `leonix_promo_code_redemptions`, `leonix_placement_entitlements`
- Safe column alignment on existing payment, promo, and package entitlement tables
- Pure read-model helpers under `app/lib/listingPlans/`
- Verifier and contract documentation for future Checkout/webhook gates

DO NOT implement Stripe Checkout in this gate. DO NOT add webhook routes. DO NOT create live payments.

## 2. Current Repo Contract Audit

| Artifact | Classification | Evidence | Gate action |
|---|---:|---|---|
| `listing_package_entitlements` | EXISTS / LIVE READ PROVEN | Migrations `20260521120000`, admin generator, live proof row count 1 | Add Revenue OS linkage columns only |
| `leonix_promo_codes` | EXISTS IN REPO / NEEDS LIVE PROOF | Migration `20260522120000`, admin promo workspace | Add Revenue OS contract columns; keep legacy `code_type` |
| `leonix_payment_records` | EXISTS IN REPO / NEEDS LIVE PROOF | Migration `20260526120000`, payment tracker admin | Add Revenue OS contract columns; `payment_status` maps to contract `status` |
| `leonix_promo_code_redemptions` | MISSING | Backing matrix gap | **CREATE** in this gate |
| `leonix_placement_entitlements` | MISSING | Blueprint placement model | **CREATE** in this gate |
| `admin_audit_log` | EXISTS LIVE | Live mutation proof | Document future audit actions only; do not recreate |
| Package pricing helpers | PARTIAL | `packagePricingRules.ts` print tiers | Add `revenuePricingMatrix.ts` for V1 SKU matrix |
| Placement ranking helpers | PARTIAL | `listingPackageEntitlementPlacement.ts`, Servicios overlay | Add `placementEntitlements.ts` for Revenue OS tier/surface contract |
| Stripe Checkout routes | PARTIAL / OUT OF SCOPE | Autos/BR category routes exist | Not modified in this gate |

## 3. Migration Summary

File: `supabase/migrations/20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql`

Safe patterns only:

- `CREATE TABLE IF NOT EXISTS`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- Conditional FK adds via `DO $$ ... IF NOT EXISTS`
- RLS enabled on new tables; no public write policies
- No `DROP`, `DELETE`, `TRUNCATE`, or column drops

## 4. Payment Records Contract

Table: `leonix_payment_records` (base from `20260526120000`)

**Contract mapping (existing → Revenue OS):**

| Contract field | DB column | Notes |
|---|---|---|
| `status` | `payment_status` | Financial proof; do not use alone for placement |
| `payment_source` | `source` | `stripe_checkout`, `stripe_webhook`, `admin_manual`, etc. |
| `amount_cents` | `amount_cents` (new) + `amount_total_cents` / `amount_paid_cents` | New column for simplified contract; legacy amount columns retained |
| Stripe session | `stripe_checkout_session_id` | Unique idempotency target |
| Package SKU | `package_key` (new) | Complements `package_tier` |
| Placement link | `placement_entitlement_id` (new) | Set by webhook fulfillment gate |

**New columns added:** `owner_user_id`, `leonix_ad_id`, `package_key`, `placement_tier`, `billing_mode`, `amount_cents`, `contract_source`, `promo_redemption_id`, `placement_entitlement_id`

## 5. Promo Codes Contract

Table: `leonix_promo_codes` (base from `20260522120000`)

Legacy admin fields (`code_type`, `status`, `redemption_count`) remain for existing Admin UI. Revenue OS contract adds:

- `label`, `description`, `promo_type`
- `percent_off`, `amount_off_cents`, `currency`
- `category_scope`, `package_scope`, `placement_scope` (text arrays)
- `per_customer_limit`, `is_active`

Conceptual `promo_type` values: `percent_off`, `amount_off`, `free_comp`, `print_client`, `staff_comp`, `newsletter`, `sales_rep`, `manual`

Promo codes alone do not grant placement; fulfillment creates entitlements.

## 6. Promo Redemptions Contract

Table: `leonix_promo_code_redemptions` (**new**)

Purpose: durable per-redemption audit trail and Checkout/webhook idempotency.

Key fields: `promo_code_id`, `owner_user_id`, `email`, `listing_id`, `leonix_ad_id`, `category`, `package_key`, `placement_tier`, `stripe_checkout_session_id`, `payment_record_id`, `status`, `discount_cents`, `redeemed_at`

Status values: `pending`, `validated`, `redeemed`, `failed`, `cancelled`, `expired`

Unique partial index on `(promo_code_id, stripe_checkout_session_id)` when session id present.

## 7. Placement Entitlements Contract

Table: `leonix_placement_entitlements` (**new**)

Source of truth for public/admin placement ranking inputs.

**Placement tiers:** `partner_premium`, `print_full_page`, `print_half_page`, `print_quarter_page`, `website_business`, `paid_private`, `free`, `affiliate`

**Placement sources:** `stripe_paid`, `included_with_print`, `promo_code`, `admin_comp`, `affiliate`, `free`, `manual_contract`

**Surfaces:** `home`, `clasificados`, `negocios`, `category_landing`, `category_results`, `dashboard`, `admin`

**Status:** `active`, `scheduled`, `expired`, `cancelled`, `comped`

Ranking inputs: `manual_priority`, `rotation_weight`, contract dates, `included_with_print`, links to payment/promo records.

## 8. Package Entitlements Alignment

Table: `listing_package_entitlements` (existing)

Added nullable linkage columns:

- `placement_entitlement_id`
- `payment_record_id`
- `promo_code_id`
- `promo_redemption_id`
- `package_key`
- `billing_mode`

Existing columns retained: `package_tier`, `category`, `starts_at`, `ends_at`, `status`, `metadata`, `placement_scope`, `benefits`

Package entitlements remain the print-to-digital grant record; placement entitlements hold surface/ranking truth for Revenue OS.

## 9. Print Client / Manual Comp Contract

Print/magazine partners receive digital placement through:

1. Admin manual comp → `leonix_placement_entitlements` with `placement_source = included_with_print` or `admin_comp`
2. Optional `leonix_promo_codes.promo_type = print_client`
3. Optional `listing_package_entitlements` row with `included_with_print` metadata
4. **No** fake `payment_status = paid` without cleared payment record

`print_contract_id` on placement entitlements stores external contract reference.

## 10. Stripe Metadata Contract

Future Checkout sessions should carry metadata from `buildStripeCheckoutMetadataPayload()` in `revenueEntitlements.ts`:

- `leonix_category`, `leonix_package_key`, `leonix_billing_mode`
- Optional: `leonix_payment_record_id`, `leonix_owner_user_id`, `leonix_listing_id`, `leonix_ad_id`, `leonix_placement_tier`, `leonix_promo_code_id`, `leonix_promo_redemption_id`, `leonix_package_entitlement_id`, `leonix_sales_rep_id`

Webhook fulfillment gate must write payment record, redemption, package/placement entitlements, and audit log from this metadata.

**Empleos two pipelines (aligned gate `STRIPE-REVENUE-OS-PACKAGE-KEY-ALIGNMENT-01`):**

| Pipeline | `package_key` | Stripe Checkout |
|---|---|---|
| Publicar empleo (regular job post) | `empleos_job_post_paid` | Yes — $24.99 / 30 days |
| Publicar feria de empleos (job fair) | `empleos_job_fair_free` | No — always free |

Legacy keys `empleos_job_30d` and `empleos_job_fair` are deprecated and must not appear in new payment records or Checkout metadata.

## 11. Admin OS Readiness

| Surface | Status | Notes |
|---|---|---|
| Payment tracker | PARTIAL | Reads `leonix_payment_records`; new columns available after migration applied live |
| Promo codes workspace | PARTIAL | Legacy fields; Revenue OS scopes available after migration |
| Package entitlements | REAL | Generator/attach/revoke; new FK columns for linkage |
| Placement entitlements | PLANNED | Table exists after migration; Admin UI is a future gate |
| Promo redemptions | PLANNED | Table exists after migration; Admin viewer is a future gate |
| Read-model helpers | REAL | Pure helpers for labels/badges/metadata |

Admin status labels: use `resolveAdminRevenueStatusLabels()` with `REAL` / `PARTIAL` / `NEEDS LIVE PROOF`.

## 12. Owner Dashboard Readiness

Owner dashboards should show listing-level state via `resolveOwnerDashboardBadges()`:

- Paid / payment pending / failed
- Placement tier
- Comped / included with print
- Promo applied
- Package key
- Expiration

No account-plan leakage from `profiles.membership_tier`. Dashboard UI wiring is a future gate.

## 13. Category Landing / Results Sorting Readiness

Sorting contract (pure skeleton in `placementEntitlements.ts`):

1. Category + surface eligibility (`placementCategoryMatches`, `isSurfaceEligible`)
2. Active entitlement with date/status proof
3. Placement tier rank
4. Manual priority → rotation weight → verified → republish → relevance

Servicios/Restaurantes continue using existing entitlement overlay until category gates wire `leonix_placement_entitlements`.

Rule enforced: **no unrelated category placement**.

## 14. Security / RLS Notes

**NEEDS SECURITY REVIEW before public/client exposure.**

- New tables: RLS enabled, no anon/authenticated policies (service role / server-only pattern matches existing revenue tables)
- Public users must not write payment records or placement entitlements
- Promo validation must happen server-side in Checkout gate
- Stripe webhooks must use service role path only
- Do not add permissive public write policies in this gate

## 15. Audit Log Plan

Do not modify `admin_audit_log`. Future gates should write these action types:

| Action | Trigger |
|---|---|
| `payment_created` | Checkout session / manual record created |
| `payment_completed` | Webhook `checkout.session.completed` / paid status |
| `payment_failed` | Failed intent / session expired |
| `promo_redeemed` | Redemption row finalized |
| `entitlement_activated` | Package entitlement active |
| `placement_created` | Placement entitlement created |
| `placement_expired` | Placement past `ends_at` or cancelled |
| `manual_comp_created` | Admin comp without payment |
| `print_client_entitlement_created` | Print contract digital inclusion |

## 16. Supabase Live Proof Plan

After migration applied to production:

1. Confirm `leonix_promo_code_redemptions` exists (`SELECT 1 LIMIT 0`)
2. Confirm `leonix_placement_entitlements` exists
3. Confirm new columns on `leonix_payment_records`, `leonix_promo_codes`, `listing_package_entitlements`
4. Insert/read test via service role in a dedicated proof gate (non-destructive)
5. Verify Admin payment tracker and promo workspace still load (legacy columns intact)

## 17. Future Implementation Gates

1. **STRIPE-REVENUE-OS-CHECKOUT-SESSION-01** — Create Checkout sessions using metadata contract
2. **STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01** — Idempotent payment/redemption/entitlement writes
3. **STRIPE-REVENUE-OS-PROMO-VALIDATION-API-01** — Server-side promo eligibility API
4. **STRIPE-REVENUE-OS-ADMIN-PLACEMENT-UI-01** — Admin placement entitlement manager
5. **STRIPE-REVENUE-OS-LIVE-SUPABASE-PROOF-01** — Apply migration live and prove reads/writes
6. **STRIPE-REVENUE-OS-CATEGORY-SORTING-WIRE-01** — Wire category results to placement entitlements

## 18. Open Owner Decisions

See `REVENUE_PRICING_UNRESOLVED_OWNER_DECISIONS` in `revenuePricingMatrix.ts`:

- Autos/Bienes Raices inventory add-on final pricing
- Restaurantes/Servicios offers add-on $99/mo lock
- Viajes business monthly lock
- Rentas V1 negocio split
- Clases/Comunidad/Mascotas duration windows
- Job fair event proof model

## 19. Manual QA Checklist

- [ ] Migration file contains no destructive SQL
- [ ] `npm run verify:stripe-revenue-os-schema-and-entitlement-contract-01` passes
- [ ] Blueprint verifier still passes
- [ ] Helpers have no Stripe import, no `process.env`, no DB mutation
- [ ] `npm run build` passes
- [ ] Unrelated dirty files (Empleos work) untouched
- [ ] Apply migration to Supabase staging/production in separate deploy step
- [ ] Admin payment tracker loads after migration (no breaking column renames)

## 20. Final Recommendation

Apply migration `20260630120000_stripe_revenue_os_schema_and_entitlement_contract_01.sql` to Supabase, then proceed to Checkout session gate. Keep legacy admin columns operational; use new Revenue OS columns and helpers as the contract layer for webhook fulfillment and placement truth. Do not enable live Stripe charges until idempotency and live proof gates pass.
