# 11 — REVENUE OS / STRIPE / PROMO / ENTITLEMENT AUDIT
Ref: `origin/main` (observed `2dcf5c70` → `056a1486` → `a0a47839`; drift touches **0** files in this
surface). Sept seal `e3956df8`. Stream status: **COMPLETE**.

---

## 1. CANONICAL PIPELINE — EXACT PATHS

| Stage | Path:line | Symbol |
|---|---|---|
| Canonical pricing matrix | `app/lib/listingPlans/revenuePricingMatrix.ts:86` | `REVENUE_V1_PACKAGE_MATRIX` — 24 packages, 14 categories |
| Package resolver | `revenuePricingMatrix.ts:516-521` | `getRevenuePackageDefinition(packageKey)` |
| Eligibility gates | `revenuePricingMatrix.ts:523-533` | `isStripeEligiblePackageKey`, `isPromoEligiblePackageKey` |
| Per-category listing | `revenuePricingMatrix.ts:511` | `listRevenuePackagesForCategory` |
| **Checkout route (canonical)** | `app/api/revenue-os/checkout/route.ts:82` | `POST` — the single Revenue OS entry point |
| Legacy/side Stripe routes | `app/api/clasificados/autos/checkout/route.ts`, `.../autos/inventory-pack/checkout/route.ts`, `.../leonix/stripe/checkout/route.ts` | side lanes |
| Request validation | `app/lib/listingPlans/revenueCheckout.ts:248` | `validateRevenueCheckoutRequest` — **matrix-driven, NO category allowlist** |
| Category↔package pairing | `revenueCheckout.ts:237-246`, mismatch `:315-321` | `resolveCheckoutPackage` → `package_category_mismatch` |
| Stripe-eligibility gate | `revenueCheckout.ts:326-332` | `package_not_stripe_eligible` (422) |
| Free-package gate | `revenueCheckout.ts:334-340` | `package_is_free` |
| **Stripe mode** | `revenueCheckout.ts:365-366` | `billingMode === "monthly_subscription" ? "subscription" : "payment"` — data-driven |
| Add-on allowlist | `revenueCheckout.ts:41-59` | `CHECKOUT_ADDON_ALLOWLIST` — bienes-raices, autos only |
| Retired add-on 410 | `checkout/route.ts:132-142` | restaurantes/servicios offers add-ons |
| **Pending payment row** | `app/lib/listingPlans/revenuePaymentRecords.ts` → table **`leonix_payment_records`** | `createPendingPaymentRecord` (called `checkout/route.ts:633`) |
| Double-click / race guard | `checkout/route.ts:664-687` | `computeCheckoutAttemptKey` + `findOpenCheckoutAttempt`; on `open_attempt_exists` returns the winner's open session — **never mints a second payable session** |
| Session creation | `app/lib/listingPlans/revenueStripe.ts:191-193` | `stripe.checkout.sessions.create` (idempotent variant `:192`, key `:187-189`) |
| Session metadata | `revenueStripe.ts:105-123, 156-182` | `buildStripeCheckoutMetadataPayload`; mirrored to `payment_intent_data.metadata` / `subscription_data.metadata` at `:180-182` |
| Metadata contract | `app/lib/listingPlans/revenueWebhook.ts:170-176` | requires `leonix_category`, `leonix_package_key`, `leonix_billing_mode` |
| **Webhook route** | `app/api/revenue-os/webhook/route.ts:58` | `POST` |
| **Signature verification** | `webhook/route.ts:60-71` → `revenueWebhook.ts:178-206` | `stripe.webhooks.constructEvent`; no secret → 503, no sig → 400, invalid → 400 |
| **Idempotency / replay** | `webhook/route.ts:79-95` → `app/lib/listingPlans/stripeEventLedger.ts:56` | `claimStripeEvent` on **`leonix_stripe_webhook_events`** |
| Fulfilling event | `revenueWebhook.ts:14` | `checkout.session.completed` (branch `webhook/route.ts:103-135`) |
| Companion | `revenueWebhook.ts:15` | `checkout.session.expired` (`route.ts:137-150`) |
| Fulfillment orchestrator | `app/lib/listingPlans/revenueFulfillment.ts:1174` | `fulfillCheckoutSessionCompleted`; per-category chain `:1349-1600` (idempotent) and `:1721-1960` (fresh) |
| **Entitlement writer** | `app/lib/listingPlans/revenueEntitlementFulfillment.ts:135` → **`listing_package_entitlements`** | `activatePackageEntitlement` (`:153,166,176`); `activateEntitlementsForPayment` `:347`; invoice extension `:454` |
| Placement | `revenueEntitlementFulfillment.ts:298` | `activatePlacementForRealPayment` |
| **Subscription lifecycle** | `app/lib/listingPlans/subscriptionLifecycle.ts` → **`leonix_subscription_records`** | states pending/active/grace/suspended/canceled |
| Grace window | `app/lib/listingPlans/subscriptionLifecyclePolicy.ts:8` | `SUBSCRIPTION_GRACE_DAYS = 7` (calendar; `past_due` folds into grace) |
| Grace enforcement | `webhook/route.ts:96-100` | `reconcileSubscriptionByStripeId` on every subscription-scoped delivery — **no cron dependency**; plus `app/api/revenue-os/admin/subscription-sweep/route.ts` |
| **Suspension lanes** | `subscriptionLifecyclePolicy.ts:139` | `LANE_SUSPENSION` — **only 4 lanes** ⚠ see §4 |
| Recurring consent | `app/lib/listingPlans/recurringConsent.ts` → **`leonix_billing_consents`** | `packageRequiresRecurringConsent = billingMode === "monthly_subscription"` |
| **Promo** | `app/lib/listingPlans/revenuePromoRedemptions.ts` → **`leonix_promo_codes`**, **`leonix_promo_code_redemptions`** | `resolvePromoForCheckout:328`, `createPendingPromoRedemption:491`, `markPromoRedemptionRedeemed:903` |
| Promo policy | `app/lib/listingPlans/revenuePromoValidation.ts:52-53` | "Redemption is recorded only after successful Stripe payment webhook — not on Apply or session creation" |
| Verified intro discount | `app/lib/listingPlans/verifiedIntroDiscount*.ts`; `revenueStripe.ts:170-172` | `duration:"once"` coupon, subscription mode only |
| **No-base-recharge guard** | `app/lib/listingPlans/revenueActiveEntitlementGuard.ts:64` + `checkout/route.ts:482-501` | `isRevenueBaseEntitlementGuardedPackage` → HTTP **409 `active_entitlement_no_recharge`** |
| Capacity guard | `app/lib/listingPlans/commercialWriteGuard.ts` | `assertCommercialCapacityForWrite` — blocks add-on activation during grace/suspension |
| Publish checkpoint | `app/lib/listingPlans/publishCheckoutCheckpoint.ts:238` | `resolvePublishCheckoutCheckpoint` |
| Stripe promo codes | `revenueStripe.ts:169` | `allow_promotion_codes: false` — server-attached coupon only (`:174-176`) |

---

## 2. VERIFIED HEALTHY — DO NOT REBUILD

These are **matrix-driven with no category registry in the path**, so they structurally cannot drift:

1. **Webhook signature verification** — `revenueWebhook.ts:178-206`. Correct failure modes.
2. **Two-layer idempotency / replay protection** — `stripeEventLedger.ts:56-128`. Layer 1: sequential
   replay of a completed event → `{action:"skip"}` → 200 without reprocessing (`:124`); concurrent
   replay → exactly one delivery wins the INSERT/UPDATE claim; stale/retryable reclaim at `:97,:114`.
   Layer 2: row-state guards. Settled via `settleStripeEvent`.
3. **Checkout-attempt race guard** — `checkout/route.ts:664-687`. Never mints a second payable session.
4. **Promo redemption only after webhook** — never on Apply, never on session creation.
5. **Stripe mode + recurring consent derivation** — purely `billingMode`-driven.
6. **`validateRevenueCheckoutRequest`** — generic matrix lookup, no allowlist to fall out of sync.

---

## 3. PER-CATEGORY CHECKOUT RESOLUTION

| Category | Checkout resolves? | Evidence |
|---|---|---|
| autos | **TRUE** | 3 packages |
| bienes-raices | **TRUE** | 3 packages |
| rentas | **TRUE** | `rentas_30d` |
| restaurantes | **TRUE** | `restaurantes_base_monthly`; offers add-on 410-retired `checkout/route.ts:132` |
| servicios | **TRUE** | `servicios_base_monthly`; offers add-on 410-retired |
| comida-local | **TRUE** | `comida_local_base_monthly` |
| empleos | **TRUE** (paid) / **FALSE** (job fair) | `empleos_job_post_paid` resolves; `empleos_job_fair_free` explicitly rejected `revenueCheckout.ts:307-313` |
| ofertas-locales | **TRUE** | both packages; ownership gate `checkout/route.ts:122-125` |
| clases | **TRUE** (paid) / **FALSE** (free) | `clases_paid_30d`; `clases_free` → `package_is_free` |
| **viajes** | **TRUE (route) / FALSE (end-to-end)** | ⚠ see §5 |
| en-venta / comunidad / mascotas / busco | **FALSE — N/A** | `billingMode:"free"`, `stripeEligible:false` (`revenuePricingMatrix.ts:376-505`) |
| negocios-locales | **N/A** | not a listing category |

---

## 4. 🔴 P0 — COMIDA LOCAL SUBSCRIPTION CAN NEVER BE SUSPENDED

`subscriptionLifecyclePolicy.ts:139` `LANE_SUSPENSION` contains only **restaurantes, servicios,
autos, bienes-raices**. `comida_local_base_monthly` (`revenuePricingMatrix.ts:287-298`) is:
`monthly_subscription` · **$129/mo** · `stripeEligible: true` · has a fulfillment writer
(`revenueFulfillment.ts:1349-1600`) · is in the base-entitlement guard
(`revenueActiveEntitlementGuard.ts:64`).

But with no suspension lane, `applyPaymentSuspension` / `reconcileSubscriptionRow` **can never
suspend it**. Non-payment leaves the listing publicly live **indefinitely**.

```
git log -S'"comida-local": {' origin/main -- app/lib/listingPlans/subscriptionLifecyclePolicy.ts
→ EMPTY   (it never existed on main)
```
**PROVEN REFERENCE EXISTS: YES** · REFERENCE: the 4 existing lanes in the same const, and the lane
itself on `e3956df8` (added by `8b867eaf` "close global revenue lifecycle gaps")
· TARGET: `subscriptionLifecyclePolicy.ts:139` · DIFFERENCE: one missing lane entry mapping
`comida-local` → `comida_local_public_listings` · **ACTION: ADOPT EXISTING (merge Sept).**

`rentas` absent from `LANE_SUSPENSION` is **INTENTIONAL_NA** — `rentas_30d` is `one_time`.

---

## 5. 🟠 P1 — VIAJES: CHARGE WITHOUT FULFILLMENT

`viajes_business_monthly` (`revenuePricingMatrix.ts:477-491`): $399/mo, `stripeEligible:true`,
`promoEligible:true`, `placementEligible:true`.

It is **absent** from: `revenueCategoryCheckoutPayload.ts` (no client payload const) ·
`CATEGORY_DEFAULT_RETURN_PATHS` (`revenueOsReturnPath.ts:31`) · `LANE_SUSPENSION` · **the fulfillment
chain** — `git ls-tree origin/main -- app/lib/listingPlans | grep -i fulfill` → 12 files, **no viajes**.

It is referenced only for price display: `categoryPublishCheckpoints.ts:786`
`monthlyPrice("viajes_business_monthly","viajes")` and `:819` `couponEligible: …` → **true**.

**Consequence:** the Viajes publish checkpoint advertises "$399/mo" and "coupon eligible", but a
`POST /api/revenue-os/checkout` with `{category:"viajes", packageKey:"viajes_business_monthly"}`
**would pass every validator, create a `leonix_payment_records` row, and open a real $399/mo Stripe
subscription** — after which the webhook writes a generic entitlement row but **no Viajes listing is
activated and no suspension lane can ever suspend it**.

**EVIDENCE GAP:** no client was found that constructs this call. Proven at route level; end-user
reachability unconfirmed.
**RELATED:** the unintegrated branch `globalization-release-reconcile-2026-08-14` (`d1447ae7` "lock
free Viajes and Cupones catalog", `c0912a71` "label free Viajes/Cupones as free, not paid") appears
to be the intended resolution. **ACTION: OWNER_POLICY_DECISION.**

---

## 6. 🟠 P1 — ONE-TIME PAID LANES LOST THE ANTI-DOUBLE-CHARGE GUARD

`revenueActiveEntitlementGuard.ts:64-70` guards exactly 5 keys, **all monthly subscriptions**:
`autos_dealer_monthly`, `br_agent_monthly`, `restaurantes_base_monthly`, `servicios_base_monthly`,
`comida_local_base_monthly`.

**Every one-time paid lane is unguarded on `origin/main`**: `autos_privado_30d`, `br_fsbo_45d`,
`empleos_job_post_paid`, `rentas_30d`, `clases_paid_30d`, both `ofertas_locales_*`.

Sept has `app/lib/listingLifecycle/activePaidEditCheckoutOwnership.ts` plus 3 call sites in
`checkout/route.ts` — `validateAutosPrivadoActiveEditCheckoutOwnership`,
`validateBrFsboActiveEditCheckoutOwnership`, `validateEmpleosJobPostActiveEditCheckoutOwnership`.
Sept's own comment: *"there is no renewal operation for these packages, only 'don't recharge a row
that's already active.'"* Gate ref **Globalization Build C (RED #14)**.

**THE FILE DOES NOT EXIST ON `origin/main`.**
**PROVEN REFERENCE EXISTS: YES** — the Sept file itself. **ACTION: ADOPT EXISTING (merge Sept).**

---

## 7. PROMO — FULL VERDICT

### 7.1 The three layers do not agree
| Layer | Path:line | Behaviour for `ofertas-locales` |
|---|---|---|
| Admin promo UI dropdown | `app/admin/(dashboard)/workspace/promo-codes/page.tsx:403` renders `PROMO_CODE_CATEGORIES` | **Not selectable** |
| Promo server action | `promo-codes/actions.ts:80` reads `formData.get("category")` verbatim → `:210` `category_scope: [category]` | **NO allowlist. Accepts any posted string.** |
| Checkout-time validation | `promoCodeRules.ts:103-108` | **Hard-rejects regardless** |

### 7.2 The decisive line is in the matrix, not the admin constant
```
revenuePricingMatrix.ts:334   promoEligible: false   (ofertas_locales_flyer_30d,   $399)
revenuePricingMatrix.ts:351   promoEligible: false   (ofertas_locales_coupons_30d, $199)

promoCodeRules.ts:103-108
  if (packageKey && !isPromoEligiblePackageKey(packageKey))
    return { eligible:false, reason:"Package is not promo-eligible." }
```
Both promo entry points funnel through it — preview `revenuePromoValidation.ts:161` (surfaced by
`app/api/revenue-os/promo/validate/route.ts:65`) and real checkout `revenuePromoRedemptions.ts:389`
(called from `checkout/route.ts:293`). The category-scope check at `promoCodeRules.ts:139-141` is
**unreachable** for Ofertas. Even a wildcard "any category" promo (`promoScopeIsUnrestricted`,
`promoCodeRules.ts:69-75`) fails.

**→ For ofertas-locales + promo, `PACKAGE_ENTITLEMENT_CATEGORIES` is `INTENTIONAL_NA`.**

### 7.3 🟠 P1 — the dead promo field (the owner-visible symptom)
`app/(site)/dashboard/ofertas-locales/[id]/checkout/page.tsx` — copy `:51-54`
("Código promocional" / "Aplicar" / "Código aplicado."), state `:119-123`, submit `:172-193`,
passed to checkout `:208`. **No code of any kind, held by anyone, can ever succeed there.** Every
attempt returns the generic "Este código promocional no es válido para este pago."
(`revenuePromoValidation.ts:46-49`).
**ACTION: OWNER_POLICY_DECISION** — enable promos for Ofertas (one matrix line) or hide the field.

### 7.4 🟠 P1 — the real promo victims
Categories with ≥1 genuinely `promoEligible: true` package that **cannot** receive a category-scoped promo:

| Category | Package | Price | Matrix |
|---|---|---|---|
| comida-local | `comida_local_base_monthly` | $129/mo | `:287,295` |
| empleos | `empleos_job_post_paid` | $24.99 | `:307,316` |
| clases | `clases_paid_30d` | $24.99 | `:393,401` |
| viajes | `viajes_business_monthly` | $399/mo | `:478,486` |

Internal inconsistency: `PROMO_CODE_PACKAGE_SCOPE_OPTIONS` (`promoCodeConstants.ts:31-40`) IS
matrix-derived and DOES list these packages — an admin can scope by *package* but not by *category*,
in the same form.

Also: `WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS` (`revenuePromoRedemptions.ts:105`) —
`rentas_30d`, `empleos_job_post_paid`, `autos_privado_30d`, `restaurantes_base_monthly`,
`servicios_base_monthly`.

---

## 8. 🟠 P1 — ENTITLEMENT GRANT IS SERVER-BLOCKED FOR TWO LIVE PAID CATEGORIES

```
app/admin/(dashboard)/workspace/package-entitlements/actions.ts:39
const ALLOWED_CATEGORIES = new Set(["servicios","restaurantes","autos","bienes-raices","rentas"]);
// enforced :101-104 → redirectWith({ error: "invalid_category" })
```
A **hard server-side block** — unlike promo, not bypassable by a crafted post. An operator cannot
manually grant or track a package entitlement for **ofertas-locales** or **comida-local**, both live
paid Stripe products, nor for empleos/clases/viajes/comunidad/mascotas/busco/en-venta.

Compounded by `PACKAGE_ENTITLEMENT_LISTING_SOURCES` (`packageEntitlementConstants.ts:20-25`), which
names no source table for ofertas or comida-local and is rendered `required` (`page.tsx:339`).
**The two constants must be fixed together** — widening one alone produces a form that writes an
entitlement row pointing at the wrong `listing_source`.

**MITIGATIONS (limit severity):** the complimentary/partner grant path in the *same file*
(`:583` `getRevenuePackageDefinition(packageKey)` → `:591` `category: packageDef.category`) is
matrix-driven and works for **all 14** categories. Automated webhook fulfillment never touches this
file.

---

## 9. MAIN vs SEPT — REVENUE DIVERGENCE

```
git diff --stat e3956df8 origin/main -- app/lib/listingPlans app/api/revenue-os
 app/api/revenue-os/checkout/route.ts                | 58 +-----------
 app/lib/listingPlans/categoryAdPlans.ts             | 18 ------
 app/lib/listingPlans/categoryListingMonetization.ts |  5 --
 app/lib/listingPlans/commercialWriteGuard.ts        | 26 ++++------
 app/lib/listingPlans/subscriptionLifecyclePolicy.ts |  8 ---
 5 files changed, 11 insertions(+), 104 deletions(-)
```
**All-minus = present in Sept, absent in main.** In every case main is MISSING work.

| # | Divergence | Impact |
|---|---|---|
| D1 | Comida Local suspension lane | **CRITICAL** — §4 |
| D2 | Comida Local monetization plan (`categoryAdPlans.ts`: `comida_local_paid_business` kind, `comida_local_public` source mapping, `resolveCategoryAdPlan` branch) | HIGH — listings resolve to `unknown_from_row` |
| D3 | Comida Local pipeline classification (`categoryListingMonetization.ts`: `FOOD_BUSINESS_PROFILE`, `SUPPORTED_CATEGORY_SLUGS` entry, `categoryFromSource`, `pipelineForCategory`) | HIGH |
| D4 | `activePaidEditCheckoutOwnership.ts` + 3 call sites | **HIGH** — §6 |
| D5 | `inventory_role` capacity anchoring (Gate 6C.2) in `commercialWriteGuard.ts` — `countActiveAutosDealerGroupInventory` filters `row.inventory_role !== "inventory_vehicle"`, plus the BR `inventory_property` parallel | MEDIUM — on main the dealer/agent **parent row is counted as a capacity slot**, silently costing one paid inventory slot |

**Files with NO revenue divergence:** `revenuePricingMatrix.ts`, `promoCodeRules.ts`,
`promoCodeLifecycle.ts`, `revenuePromoValidation.ts`, `revenuePromoRedemptions.ts`,
`revenueFulfillment.ts`, `revenueEntitlementFulfillment.ts`, `revenueWebhook.ts`,
`stripeEventLedger.ts`, `revenueStripe.ts`, `revenueActiveEntitlementGuard.ts`,
`packageEntitlementConstants.ts`, `promoCodeConstants.ts`, `app/api/revenue-os/webhook/route.ts`.
**The seed defect is identical on all three refs — Sept never fixed it either.**

---

## 10. OFERTAS COUPON PRICE — TWO SOURCES OF TRUTH DISAGREE

| Source | Says |
|---|---|
| `revenuePricingMatrix.ts:346,:354` | `priceCents: 19900`, `stripeEligible: true` |
| `ofertasLocalesConstants.ts:22-23,:152` | `PRICE_CENTS = 0`, "Cupones is a free product (locked)", `displayPriceUsd: 0` |
| `ofertasLocalesCommercialServer.ts:357-363` | returns `{ source: "free" }` — never reaches Stripe |
| `revenueFulfillment.ts:225-226` | "the free coupon lane never reaches Stripe at all" |

Also: `revenueStripe.ts:117` hardcodes `aiIncluded: category === "ofertas-locales" ? true : null`
for the whole category, while `ofertasLocalesCommercial.ts:52` declares coupons `aiIncluded:false`,
and `revenueFulfillment.ts:1299` hard-rejects any ofertas session with `aiIncluded !== true`.
A coupon session would pass only because of the category-wide hardcode.

**Package key literals are declared 3× independently with no import chain:**
`revenuePricingMatrix.ts:12-13` · `publishCheckoutCheckpoint.ts:48,51` · `ofertasLocalesConstants.ts:19-20`.
The checkout route and payload constants import from `publishCheckoutCheckpoint`; the pricing
definitions live in `revenuePricingMatrix`. **Drift risk.**
**ACTION: OWNER_POLICY_DECISION** — resolve via `globalization-release-reconcile-2026-08-14`.

---

## 11. EVIDENCE GAPS
1. **Viajes reachability** — no client constructs the call; route-level only.
2. **`listing_source` convention split** — automated writer stores `listing_source: input.category`
   (`revenueEntitlementFulfillment.ts:179`); manual admin form stores a **table name**. Impact unverified.
3. **No DB-level verification.** All findings source-level. `listing_package_entitlements_live_uniq`
   is referenced in a comment (`revenueActiveEntitlementGuard.ts:94`) but not verified to exist.
4. **Runtime promo rows unread** — `resolvePromoCategoryScope` (`revenuePromoRedemptions.ts:206-210`)
   falls back to a legacy scalar `row.category`; how many live codes depend on it is unknown.
