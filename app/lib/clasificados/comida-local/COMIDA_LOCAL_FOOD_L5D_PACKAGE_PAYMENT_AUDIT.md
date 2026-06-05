# Gate FOOD-L5D — Comida Local Package Model + Payment Readiness

## Gate type

BUILD-REQUIRED

## 1. Gate title

Gate FOOD-L5D — Comida Local Package Model + Payment Readiness

## 2. Preflight status

Worktree included prior FOOD-L7B admin files (RELATED_ALLOWED). No unrelated blocking dirty files outside Comida Local + admin integration.

## 3. Prior gate decisions used

| Source | Decision |
|--------|----------|
| FOOD-L5A | Basic $99 / Plus $149; package_tier `basic` \| `plus`; payment deferred |
| FOOD-L5B | `payment_status = not_required_for_l5b`; publish succeeds without Stripe |
| FOOD-L5C | Basic gallery max 2; main photo required |
| FOOD-L6/L7A/L7B | Dashboard/admin show real `package_tier` + `payment_status` |

## 4. Files inspected (read-only)

- `app/lib/clasificados/autos/stripeAutosConfig.ts` — env-backed Stripe Price IDs pattern
- `app/api/clasificados/autos/checkout/route.ts` — checkout reference (not copied)
- `app/lib/listingPlans/packagePricingRules.ts` — shared entitlement vocabulary
- FOOD-L5A through L7B Comida Local audits
- `comidaLocalPublishValidation.ts`, `comidaLocalImageValidation.ts`
- Dashboard/admin mappers

## 5. Files changed

- `comidaLocalPackages.ts` (new)
- `comidaLocalPaymentStatus.ts` (new)
- `comidaLocalPublishValidation.ts` — tier-aware limits
- `comidaLocalImageValidation.ts` — tier-aware gallery cap
- `comidaLocalConstants.ts` — gallery max from package config
- `comidaLocalPublicListingMapper.ts` — payment status via helper
- `mapComidaLocalDashboardListing.ts` — package/payment labels
- `mapComidaLocalAdminListing.ts` — package/payment labels
- `COMIDA_LOCAL_FOOD_L5D_PACKAGE_PAYMENT_AUDIT.md`
- `scripts/comida-local-food-l5d-package-payment-audit.ts`
- `package.json` — audit script

## 6. Existing payment/package pattern findings

| Pattern | Finding |
|---------|---------|
| Autos | Env vars `STRIPE_PRICE_AUTOS_*`; checkout route + webhook activation |
| Servicios | Print/digital entitlements; Stripe deferred on public path |
| Comida Local | **No** `STRIPE_COMIDA_LOCAL_*` env in repo; **no** checkout route |
| L5B publish | Code-only waiver `not_required_for_l5b`; `status=published` |
| Packages | **Code-only** config in this gate (not Stripe-backed yet) |

**Checkout decision:** **Deferred** — no approved live Price IDs; follow Autos fail-closed env pattern in a future gate.

**Required env (proposed, not wired):**

- `STRIPE_COMIDA_LOCAL_BASIC_PRICE_ID`
- `STRIPE_COMIDA_LOCAL_PLUS_PRICE_ID`

**Future routes (document only):**

- `app/api/clasificados/comida-local/checkout/route.ts`
- Webhook extension to set `payment_status=paid` (Model A from L5A)

## 7. Package config result

`comidaLocalPackages.ts` defines Basic ($99 / 9900¢) and Plus ($149 / 14900¢) with limits, labels, helpers `getComidaLocalPackageByTier`, `getComidaLocalPackageLabel`, `getComidaLocalPackageLimits`, `isValidComidaLocalPackageTier`.

`durationDays: null` — L5A noted 60-day TBD; no repo-wide classified duration standard confirmed.

## 8. Package limits result

| Tier | Gallery | Socials | Logo | Location URL | Featured |
|------|---------|---------|------|--------------|----------|
| Basic | 2 | 3 | yes | yes | no (planned) |
| Plus | 5 | 3 | yes | yes | no (planned) |

Publish normalization slices gallery by tier; validation enforces gallery/social/logo limits.

## 9. Publish validation/package result

- `parseComidaLocalPublishRequest` validates `packageTier` via `isValidComidaLocalPackageTier`
- `normalizeComidaLocalDraftForPublish(draft, packageTier)` applies limits
- `validateComidaLocalPublishPayload(draft, packageTier)` enforces gallery/social/logo rules
- Existing dev publish flow unchanged; still writes `not_required_for_l5b`

## 10. Payment status result

`comidaLocalPaymentStatus.ts`:

- `resolveComidaLocalPublishPaymentStatus()` → `not_required_for_l5b` (no fake `paid`)
- `getComidaLocalPaymentStatusLabel` for dashboard/admin
- `isComidaLocalPaymentComplete` — only `paid` or `waived`
- `isComidaLocalPublishPubliclyVisible` — `published` + (paid/waived OR L5B waiver)

Public results still query `status=published` only (unchanged).

## 11. Dashboard/admin label result

Mappers show `Comida Local Basic ($99)` / `Comida Local Plus ($149)` and real `payment_status` labels. No upgrade/checkout CTAs.

## 12. Stripe/checkout readiness result

| Item | Status |
|------|--------|
| Stripe products in code | **Not created** |
| Live price IDs hardcoded | **None** |
| Checkout route | **Deferred** |
| Webhook paid activation | **Deferred** |
| Env var names documented | `COMIDA_LOCAL_STRIPE_ENV_VARS` in payment helper |

## 13. What is intentionally not implemented

- Stripe Checkout UI/buttons
- Webhook `payment_status=paid` mutation
- Featured placement / ranking by package
- `expires_at` auto-calculation from `durationDays`
- Payment gating that blocks L5B dev publish
- Analytics, migrations, categoryConfig

## 14. Risks/deferred work

- **FOOD-L5E (proposed):** Checkout route + webhook + env Price IDs
- Confirm listing duration (30 vs 60 days) with product ops
- Plus featured placement needs ranking gate
- Transition from `not_required_for_l5b` to `pending`/`paid` when checkout ships

## 15. Manual QA checklist

- [ ] Publish with `packageTier: basic` accepts ≤2 gallery images
- [ ] Publish with `packageTier: plus` accepts up to 5 gallery images
- [ ] Invalid `packageTier` returns `invalid_package_tier`
- [ ] Dashboard shows package label with price
- [ ] Admin shows package label with price
- [ ] Payment label shows "Sin pago (desarrollo)" for existing rows
- [ ] No checkout button on publish form or dashboard
- [ ] `npm run build` passes

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------------------------------------------------------- | ---------- | -------- |
| Prior Comida Local publish/dashboard/admin audits were read | TRUE | Section 3 |
| Existing package/payment patterns were inspected read-only | TRUE | Autos/Servicios read-only |
| Comida Local package config exists | TRUE | `comidaLocalPackages.ts` |
| Basic package is defined | TRUE | `COMIDA_LOCAL_BASIC_PACKAGE` |
| Plus package is defined | TRUE | `COMIDA_LOCAL_PLUS_PACKAGE` |
| Package limits are defined | TRUE | `getComidaLocalPackageLimits` |
| Package tier validation exists | TRUE | `isValidComidaLocalPackageTier` |
| Dashboard/admin labels use real package data | TRUE | Updated mappers |
| Payment status labels use real stored payment_status | TRUE | `getComidaLocalPaymentStatusLabel` |
| No fake paid status was added | TRUE | `resolveComidaLocalPublishPaymentStatus` |
| No fake checkout URL was added | TRUE | Audit script |
| No Stripe product was created | TRUE | No Stripe API calls |
| No unapproved Stripe price ID was hardcoded | TRUE | Env names only |
| Checkout was deferred unless fully safe | TRUE | Section 12 |
| No fake analytics/counters were added | TRUE | No analytics imports |
| No database migrations were created | TRUE | No migration files |
| No forbidden category files were edited | TRUE | Audit firewall |
| npm run build passed | TRUE | `npm run build` |
