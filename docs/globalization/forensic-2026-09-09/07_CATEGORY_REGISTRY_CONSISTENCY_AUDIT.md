# 07 — CATEGORY REGISTRY CONSISTENCY AUDIT
Ref: `origin/main` (`2dcf5c70` → `056a1486`; the 4-commit drift touches **0** files in this surface).
Sept seal `e3956df8` noted where it diverges. **84 category registries** were located; the 25
decision-relevant ones are reproduced below.

---

## 1. CANONICAL BASELINES — THE TWO "CORRECT" REGISTRIES

| PATH:LINE | SYMBOL | VALUES |
|---|---|---|
| `app/lib/listingIdentity/types.ts:47` | `CanonicalDbCategory` | restaurantes, servicios, bienes-raices, autos, rentas, empleos, en-venta, comida-local, ofertas-locales, busco, clases, comunidad, mascotas-y-perdidos, viajes — **14, complete** |
| `app/lib/listingIdentity/categoryRouteRegistry.ts:1395` | `CATEGORY_ROUTE_REGISTRY` | 17 lane-split adapters, `satisfies Record<CanonicalCategoryKey, CategoryRouteAdapter>` — **complete** |
| `app/lib/listingPlans/revenuePricingMatrix.ts:86` | `REVENUE_V1_PACKAGE_MATRIX` | 24 packages across the same **14** categories — **complete** |

`negocios-locales` appears in **zero** listing registries — it is a marketing hub route only
(`app/(site)/negocios-locales/_lib/negociosLocalesLanes.ts`). **INTENTIONAL_NA everywhere.**

---

## 2. REGISTRY INVENTORY (decision-relevant subset)

| # | PATH:LINE | SYMBOL | DOMAIN | VALUES |
|---|---|---|---|---|
| 1 | `app/lib/listingPlans/revenuePricingMatrix.ts:86` | `REVENUE_V1_PACKAGE_MATRIX` | pricing | all 14 |
| 2 | `app/admin/_lib/packageEntitlementConstants.ts:12` | `PACKAGE_ENTITLEMENT_CATEGORIES` | entitlement | servicios, restaurantes, autos, bienes-raices, rentas (**5**) |
| 3 | `app/admin/_lib/promoCodeConstants.ts:17` | `PROMO_CODE_CATEGORIES` | promo | **ALIAS of #2** |
| 4 | `app/admin/(dashboard)/workspace/package-entitlements/actions.ts:39` | `ALLOWED_CATEGORIES` | entitlement | **verbatim copy of #2 — SERVER-ENFORCED at :101-104** |
| 5 | `app/lib/listingPlans/packageEntitlements.ts:65` | `PACKAGE_ENTITLEMENT_V1_CATEGORIES` | entitlement | **verbatim copy of #2** |
| 6 | `app/lib/listingPlans/printDigitalVisibilityRank.ts:59` | `PRINT_DIGITAL_V1_CATEGORIES` | pricing | **verbatim copy of #2** |
| 7 | `app/lib/listingPlans/categoryListingMonetization.ts:163` | `SUPPORTED_CATEGORY_SLUGS` | pricing | 12 — **no comida-local, no ofertas-locales** |
| 8 | `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts:22+` | per-const `category:` | checkout | 9 |
| 9 | `app/lib/listingPlans/revenueOsReturnPath.ts:31` | `CATEGORY_DEFAULT_RETURN_PATHS` | checkout | 8 |
| 10 | `app/lib/listingPlans/revenueFulfillment.ts:1349-1600` | fulfillment dispatch | entitlement | 9 |
| 11 | `app/lib/listingPlans/subscriptionLifecyclePolicy.ts:139` | `LANE_SUSPENSION` | lifecycle | restaurantes, servicios, autos, bienes-raices (**4**) |
| 12 | `app/lib/listingPlans/revenueActiveEntitlementGuard.ts:64` | `REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS` | checkout | 5 package keys (all monthly) |
| 13 | `app/lib/listingPlans/categoryCommercialPlanPolicy.ts:32` | `CATEGORY_BASE_PACKAGE_KEY` | entitlement | restaurantes, servicios (2) |
| 14 | `app/lib/listingPlans/revenuePromoRedemptions.ts:105` | `WEBSITE_LAUNCH_25_ALLOWLISTED_PACKAGE_KEYS` | promo | 5 package keys |
| 15 | `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryLoadPlan.ts:49` | `ENTITLEMENT_ELIGIBLE_CATEGORIES` | entitlement | 6 |
| 16 | `app/api/dashboard/enable-included-capability/route.ts:20` | `SUPPORTED_CATEGORIES` | entitlement | restaurantes, servicios (2) |
| 17 | `app/api/dashboard/listing-package-entitlements/route.ts:19` | `CAPABILITY_CATEGORIES` | entitlement | restaurantes, servicios (2) |
| 18 | `app/lib/analytics/listingAnalyticsIdentity.ts:25` | `LISTING_ANALYTICS_CATEGORIES` | analytics | all 14 + `travel` alias — **complete** |
| 19 | `app/lib/seo/leonixDiscoveryContracts.ts:32` | `LEONIX_SITEMAP_CATEGORY_HUBS` | seo | all 14 — **complete** |
| 20 | `app/lib/leonixCommunityTrust/leonixEndorsementRegistry.ts:90` | `LEONIX_ENDORSEMENT_CATEGORIES` | trust | servicios, restaurantes, comida-local, bienes_raices_negocio, rentas_negocio (5) |
| 21 | `app/lib/saved-search/delivery/savedSearchEmailDelivery.ts:37` | `CATEGORY_RESOLVERS` | saved search | autos, bienes-raices, rentas (**3**) |
| 22 | `app/api/leonix-professional-identity/route.ts:10` | `CATEGORIES` | verification | bienes_raices_negocio, rentas_negocio (2) |
| 23 | `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:137` | `OWNER_ENTITY_CAPABILITIES` | dashboard | all 14 lane-split + iglesias — **complete** |
| 24 | `app/admin/_lib/classifiedsOpsContract.ts:54` | `CLASSIFIEDS_OPS_CONTRACTS` | admin | 13 — no ofertas-locales |
| 25 | `PublishCheckoutCheckpoint.tsx` + `RevenuePromoField.tsx` | promo UI surface | promo | 6 |
| 26 | `app/lib/analytics/listingAnalyticsIdentity.ts:19` | `LISTING_ANALYTICS_SOURCE_TABLES` | analytics | 8 source tables |
| 27 | `app/admin/_lib/packageEntitlementConstants.ts:20` | `PACKAGE_ENTITLEMENT_LISTING_SOURCES` | entitlement | 4 sources → 6 categories; **no ofertas, no comida-local** |

---

## 3. THE MATRIX

`Y` present · `-` absent · `n/a` domain does not apply
**P**=pricing(1) · **PE**=entitlement/promo list(2/3) · **AC**=ALLOWED_CATEGORIES(4) · **V1**=(5) ·
**PD**=(6) · **SC**=SUPPORTED_CATEGORY_SLUGS(7) · **CP**=checkout payload(8) · **RP**=return path(9) ·
**FF**=fulfillment(10) · **LS**=LANE_SUSPENSION(11) · **DE**=dash entitlement(15) · **AN**=analytics(18) ·
**SEO**=(19) · **CT**=community trust(20) · **SS**=saved search(21) · **PU**=promo UI(25)

| Category | P | PE | AC | V1 | PD | SC | CP | RP | FF | LS | DE | AN | SEO | CT | SS | PU |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| servicios | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | – | Y |
| restaurantes | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | – | Y |
| autos | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | – | Y | Y |
| bienes-raices | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| rentas | Y | Y | Y | Y | Y | Y | Y | Y | Y | **–** | Y | Y | Y | Y | Y | Y |
| **comida-local** | Y | **–** | **–** | **–** | – | **–** | Y | **–** | Y | **–** | **–** | Y | Y | Y | – | **–** |
| empleos | Y | **–** | **–** | – | – | Y | Y | Y | Y | n/a | – | Y | Y | – | – | Y |
| **ofertas-locales** | Y | **–** | **–** | – | – | **–** | Y | Y | Y | n/a | **–** | Y | Y | – | – | **–**◆ |
| clases | Y | **–** | **–** | – | – | Y | Y | Y | Y | n/a | – | Y | Y | – | – | **–** |
| **viajes** | Y | **–** | **–** | – | – | Y | **–** | **–** | **–** | **–** | – | Y | Y | – | – | **–** |
| en-venta | Y | – | – | – | – | Y | n/a | n/a | n/a | n/a | Y | Y | Y | – | – | n/a |
| comunidad | Y | – | – | – | – | Y | n/a | n/a | n/a | n/a | – | Y | Y | – | – | n/a |
| mascotas-y-perdidos | Y | – | – | – | – | Y | n/a | n/a | n/a | n/a | – | Y | Y | – | – | n/a |
| busco | Y | – | – | – | – | Y | n/a | n/a | n/a | n/a | – | Y | Y | – | – | n/a |
| negocios-locales | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – | – |

◆ Ofertas has no shared `RevenuePromoField`, but its bespoke checkout page renders its own
permanently-broken promo input (GAP-011).

---

## 4. CLASSIFICATION OF EVERY GAP

### 4.1 INTENTIONAL_NA (with justification)
| Cell(s) | Why |
|---|---|
| en-venta, comunidad, mascotas, busco, clases-free, viajes-affiliate × CP/RP/FF/PU | `billingMode:"free"`, `stripeEligible:false` (`revenuePricingMatrix.ts:376-505`) — no checkout to wire |
| empleos, ofertas-locales, clases × LS | All `one_time`; `packageRequiresRecurringConsent` requires `monthly_subscription` — no subscription to suspend |
| rentas × LS | `rentas_30d` is `one_time` — reclassified NA on inspection |
| ofertas-locales, comida-local, empleos, clases, viajes × PD/V1 | `placementEligible:false` / `printCompEligible:false` in the matrix |
| empleos, viajes × V1/PD | Explicitly modeled: `SEPARATE_MODEL = new Set(["empleos","viajes"])` (`packageEntitlements.ts:74`) |
| clases, comunidad × V1/PD | Explicitly modeled `NOT_CLIENT_READY` (`packageEntitlements.ts:73`) |
| **ofertas-locales × PE/PROMO (promo half only)** | Both packages `promoEligible:false` (`revenuePricingMatrix.ts:334,:351`) — adding it changes **no** runtime behavior. **This is the Owner's seed hypothesis, and it is NA.** |
| autos, empleos, ofertas, clases, comida-local, viajes × CT | Endorsement registry deliberately scoped to business-profile lanes (`leonixEndorsementRegistry.ts:19-23`) |
| servicios, restaurantes, comida-local, empleos, ofertas × SS | Saved-search resolvers are inventory-search categories only |
| negocios-locales × everything | Marketing hub route, not a listing category |

### 4.2 GLOBALIZATION_ADOPTION_GAP
| ID | Cell | Sev | Justification |
|---|---|---|---|
| G1 | **comida-local × LANE_SUSPENSION** | **CRITICAL** | $129/mo subscription with a fulfillment writer and base-entitlement guard, but **no suspension lane** — non-payment never unpublishes. **Lane EXISTS on `e3956df8`** (`8b867eaf`), never merged. `git log -S'"comida-local": {' origin/main` → empty |
| G2 | comida-local, ofertas-locales × SUPPORTED_CATEGORY_SLUGS | HIGH | Live paid products absent from the monetization classifier; `pipelineForCategory` has no branch → resolve to `unknown_from_row`. **Present on `e3956df8`** |
| G3 | ofertas-locales, comida-local × PE + AC + LISTING_SOURCES | HIGH | Live paid products with **no manual admin grant/track path** (server-enforced block). Comp path is the only workaround |
| G4 | **comida-local, empleos, clases, viajes × PROMO_CODE_CATEGORIES** | HIGH | All four have `promoEligible:true` packages; admin cannot create a category-scoped promo, though `PROMO_CODE_PACKAGE_SCOPE_OPTIONS` in the same form lists their packages |
| G5 | viajes × CP/RP/FF | HIGH | $399/mo `stripeEligible` with no checkout payload, no return path, **no fulfillment writer** → charge-without-fulfillment (GAP-007) |
| G6 | comida-local × CATEGORY_DEFAULT_RETURN_PATHS | MED | Falls back to `/dashboard/mis-anuncios` instead of the category |
| G7 | comida-local, ofertas, clases, empleos, viajes × ENTITLEMENT_ELIGIBLE_CATEGORIES | MED | Paid entitlements exist; the dashboard never loads them for these lanes |
| G8 | comida-local, ofertas, clases, viajes × promo UI surface | MED | Promo-eligible packages with nowhere to enter a code (Ofertas worse — dead field) |
| G9 | ofertas-locales × CLASSIFIEDS_OPS_CONTRACTS | LOW | Only category absent from the admin ops contract table |
| G11 | **5× verbatim duplication of the 5-item list** | **HIGH (structural)** | No single source of truth; all five must be edited together or they drift again |

---

## 5. THE STRUCTURAL FINDING

> **The 5-item list `[servicios, restaurantes, autos, bienes-raices, rentas]` is copy-pasted
> verbatim into FIVE independent files.** Fixing `packageEntitlementConstants.ts` alone fixes 2 of 5.

An additional asymmetry: the **promo** server action (`promo-codes/actions.ts:80,:210`) has **no
category allowlist at all** and would write any posted string to `category_scope`; the **entitlement**
action (`package-entitlements/actions.ts:39,:101-104`) hard-enforces one. Two adjacent admin forms,
opposite validation postures.

**REQUIRED ACTION:** derive all five from `REVENUE_V1_PACKAGE_MATRIX`
(`listRevenuePackagesForCategory` / `isPromoEligiblePackageKey` already exist at
`revenuePricingMatrix.ts:511,:529`). Class: **ADOPT_EXISTING_ENGINE**.

---

## 6. WHAT CANNOT DRIFT (verified good)
These are matrix-driven with **no category registry in the path**:
Stripe mode (`revenueCheckout.ts:365-366`, `billingMode`-driven) · request validation
(`validateRevenueCheckoutRequest`, matrix lookup only, no allowlist) · recurring consent
(`recurringConsent.ts`) · webhook signature (`revenueWebhook.ts:178-206`) · idempotency ledger
(`stripeEventLedger.ts:56-128`) · analytics category identity (server-forced,
`resolveListingAnalyticsIdentity.ts:265-310`) · SEO sitemap hubs (all 14) · owner-entity capabilities
(all 14).

---

## 7. EVIDENCE GAPS
1. Full 84-registry list abridged to 27 here; the remaining ~57 (hub copy, theme, visuals, nav, QA
   fixtures) were enumerated and changed no classification.
2. **`listing_source` convention split:** the automated writer stores `listing_source: input.category`
   (`revenueEntitlementFulfillment.ts:179`) while the manual admin form stores a **table name**.
   Practical impact unverified — worth a dedicated check; it affects entitlement lookups for every category.
3. **No DB-level verification.** All findings are source-level. A Postgres CHECK constraint or RLS
   policy could independently block or allow what the code does. Notably
   `listing_package_entitlements_live_uniq` is referenced in a comment
   (`revenueActiveEntitlementGuard.ts:94`) but not verified to exist.
4. **Runtime promo rows unread.** `resolvePromoCategoryScope`
   (`revenuePromoRedemptions.ts:206-210`) falls back to a legacy scalar `row.category` when
   `category_scope` is empty; how many live codes rely on that column is unknown.
