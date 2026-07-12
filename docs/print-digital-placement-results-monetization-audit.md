# PRINT/DIGITAL FULL-PAGE PLACEMENT + LANDING/RESULTS MONETIZATION AUDIT

**Gate:** Print/Digital Placement + Landing/Results Monetization Readiness  
**Mode:** Audit only — no production behavior changes  
**Date:** 2026-07-12  
**Repo:** `C:/projects/elaguila-website`  
**Branch:** `main`  
**HEAD:** `02ae189c963bbee9b6376a3b92a70f5512216577`

---

## 1. No behavior changes confirmation

No production code, migrations, Stripe, promo, or ranking behavior was modified. This file is documentation only.

---

## 2. Business offer summary (from code/docs)

| Offer | Code backing | Notes |
| ----- | ------------ | ----- |
| Print/digital visibility ladder | **YES** — `printDigitalVisibilityRank.ts`, `placementEntitlements.ts`, `packageEntitlements.ts`, `docs/print-to-digital-visibility-policy.md` | Pure helpers + policy docs |
| Full-page print → results priority | **PARTIAL** — tier `full_page` maps to `full_page_print_priority` in helpers; **only Servicios + Restaurantes public results apply ranking** |
| Premium print → Destacados module | **PARTIAL** — Servicios + Restaurantes Destacados sections wired |
| Package entitlements (admin source of truth) | **YES** — `listing_package_entitlements` table + Admin generator UI |
| Promo codes | **YES** — Admin create/assign; **discount/access reference, not ranking truth** per docs |
| Featured/destacado | **PARTIAL** — category-specific; Bienes uses editorial badges/demo, not entitlement |
| Republish/refrescado | **YES** — `republish_sort_at` on multiple listing tables; used in sorts |
| Verified | **READ MODEL ONLY** — trust tool in `categoryListingMonetization.ts`; not paid rank |
| Boost/impulsado | **FUTURE** — `boost_expires` on `listings`; warnings only in rank helper |
| Concierge | **FUTURE** — benefit flag in package entitlements; not public rank |
| Stripe package activation | **PARTIAL** — payment records link to entitlements; fulfillment gates exist |
| Public pricing | **YES** — docs + admin pricing metadata; checkout wiring partial |

---

## 3. Admin promo/package/entitlement audit

| Capability | Status | Evidence |
| ---------- | ------ | -------- |
| Admin create promo code | **YES** | `app/admin/(dashboard)/workspace/promo-codes/actions.ts` → `createPromoCodeAction` |
| Admin assign promo to user (email/business) | **YES** | `promoCodeData.ts` — `customer_email`, `business_name`, usage modes |
| Admin assign promo to listing | **YES** | `listing_id` on promo row; `syncPromoCodeListingIdFromEntitlement` |
| Admin create package entitlement | **YES** | `createPackageEntitlementAction` — tiers include `full_page` |
| Admin attach listing to entitlement | **YES** | `attachListingToPackageEntitlementAction` |
| Admin set start/end expiration | **YES** | `starts_at`, `ends_at` on `listing_package_entitlements` |
| Admin revoke/extend entitlement | **YES** | `revokePackageEntitlementAction`, `extendPackageEntitlementAction` |
| Admin view active entitlements | **YES** | `/admin/workspace/package-entitlements` tracker |
| Admin full-page print/digital for Bienes | **YES (grant)** | `ALLOWED_CATEGORIES` includes `bienes-raices`; `listing_source: listings` |
| Entitlement affects Bienes public ranking | **NO** | No Bienes entitlement overlay or visibility sort in results pipeline |

**Doctrine (code):** Promo/coupon ≠ visibility truth. `listing_package_entitlements` = future ranking source of truth (`docs/print-package-entitlement-model.md`).

---

## 4. Supabase / data contract audit

### `listing_package_entitlements` (exists)

Fields: `category`, `listing_source`, `listing_id`, `package_tier` (`premium`, `full_page`, `half_page`, …), `starts_at`, `ends_at`, `status`, `placement_scope[]`, `benefits`, `metadata` (magazine placement, Stripe refs).

### `public.listings` (Bienes/Rentas/En Venta)

| Field | Exists | Used for placement |
| ----- | ------ | ------------------ |
| `republish_sort_at`, `republished_at` | YES | Recency sort (Bienes fetch orders by `republish_sort_at`) |
| `boost_expires` | YES | Not used in Bienes rank |
| `print_package_tier`, `featured_until`, `promoted_until` | **NO on listings** | Deferred in `fetchBrPublishedListingsBrowser.ts` comments |
| `package_entitlement_*` on row | **NO** | Must come from entitlement overlay (not built for Bienes) |

### Category-specific tables

`servicios_public_listings`, `restaurantes_public_listings`, `autos_classifieds_listings`, `empleos_public_listings` — `republish_sort_at` exists per migration `20260509120000_classifieds_republish_capability.sql`.

**Migration needed for Bienes results priority?** Not strictly — entitlement overlay pattern (like Servicios) can read `listing_package_entitlements` without new listing columns. **Missing link is application code, not schema.**

---

## 5. Category plan helper audit

| Check | TRUE/FALSE |
| ----- | ---------- |
| `categoryAdPlans.ts` exists | TRUE |
| `categoryListingMonetization.ts` read model exists | TRUE |
| Account plan quarantined from listing plan | TRUE (enforced in comments + resolvers) |
| Category-specific plan rules encoded | TRUE |
| Bienes identifies paid private/business | TRUE |
| Helper exposes placement/promoted/featured/verified tool status | TRUE (defensive; warns on missing fields) |
| Landing/results use helper for Bienes ranking | **FALSE** |

---

## 6. Bienes Raíces / property ranking audit (critical)

### Files identified

| Surface | File |
| ------- | ---- |
| Landing | `app/(site)/clasificados/bienes-raices/landing/` + `buildBrLandingInventorySections.ts` |
| Results | `app/(site)/clasificados/bienes-raices/resultados/BienesRaicesResultsClient.tsx` |
| Fetch | `app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts` |
| Sort/filter | `app/(site)/clasificados/bienes-raices/resultados/lib/brResultsFilters.ts` |
| Monetization read model | `app/(site)/clasificados/bienes-raices/resultados/lib/brMonetizationVisibilityReadModel.ts` |
| Editorial policy | `app/(site)/clasificados/bienes-raices/shared/brLaunchListingPolicy.ts` |

### What decides order today?

1. **DB fetch:** `.order("republish_sort_at", { ascending: false, nullsFirst: true })` when column exists.
2. **Client filter:** `filterBrListings` — search, city, price, beds, property type chips.
3. **Client sort:** `reciente` (default) = `effectivePublishedMsForSort` descending; price asc/desc; fairness tie-break (privado before negocio).
4. **NOT used:** `resolveListingVisibilityRank`, `listing_package_entitlements` overlay, `print_package_tier`, `featured_until`, admin promo.

### Destacados / featured

- `resolveBrMonetizationVisibility` hardcodes `isFeatured = false`, `isPromoted = false` with warning that placement fields are missing.
- `brLaunchListingPolicy.ts` states **"Destacadas: NOT pay-to-win — editorial / quality / freshness / trust signals"** and uses `destacada` **badge** on listing objects.
- Demo inventory (`demoData.ts`, `brShouldMergeDemoInventoryWithLive`) can inject `destacada`/`promocionada` badges — **not entitlement-backed**.
- `BienesRaicesFeaturedSection` renders a passed-in listing; no entitlement query.

### Verdict

**Full-page print/digital customers do NOT rank first in Bienes property search today.** Admin can grant `full_page` entitlements, but public results never read them.

---

## 7. All-category landing/results readiness matrix

| Category | Landing | Results | Ranking helper | Entitlement overlay | Placement in sort | Readiness |
| -------- | ------- | ------- | -------------- | ------------------- | ----------------- | --------- |
| **Servicios** | YES | `servicios/resultados/page.tsx` | `serviciosVisibilityRanking.ts` | `serviciosEntitlementOverlay.ts` | YES (after filter) | **READY** |
| **Restaurantes** | YES | `RestaurantesResultsShell.tsx` | `restaurantesVisibilityRanking.ts` | `restaurantesEntitlementOverlay.ts` | YES | **READY** |
| **Autos** | YES | `AutosPublicResultsShell.tsx` | `autosPublicRanking.ts` (recency only) | API hydrates entitlements → `featured` flag only | **NO visibility sort** | **PARTIAL** |
| **Bienes Raíces** | YES | `BienesRaicesResultsClient.tsx` | `brResultsFilters.ts` (recency/price) | **NONE** | **NO** | **NOT READY** |
| **Rentas** | YES | `RentasResultsClient.tsx` | `sortRentasPublicListings` (recency/price) | **NONE** | **NO** | **NOT READY** |
| **En Venta** | YES | `EnVentaResultsClient.tsx` | Separate Free/Pro + republish window | N/A (separate model) | Pro featured rail only | **PARTIAL** (by design) |
| **Empleos** | YES | `EmpleosResultsView.tsx` | `sortEmpleosJobs` — `listingTier` promoted/featured | Separate jobs model | Tier-based (not print entitlement) | **PARTIAL** |
| **Viajes** | YES | viajes browse | `discovery.featuredBase` scores | Staged model | Separate | **UNKNOWN** |
| **Clases** | YES | simple browse | None | None | None | **NOT READY** (deferred) |
| **Comunidad** | YES | simple browse | None | None | None | **NOT READY** (deferred) |

---

## 8. Results analytics audit

| Check | Status |
| ----- | ------ |
| `result_impression` event | **NOT FOUND** in codebase |
| Page-level results view (Servicios) | `search_results_view` via `ServiciosResultsViewAnalytics.tsx` |
| `listing_open` / `listing_view` | Per-category (e.g. BR `BrLiveDetailAnalyticsMount.tsx`, Autos global analytics) |
| Stable listing UUID in analytics | YES where implemented |
| Leonix Ad ID as metadata only | YES |
| Dashboard/admin analytics for results | Partial — listing-level proven; results impressions degraded |

---

## 9. Admin / dashboard proof audit

| Check | Status |
| ----- | ------ |
| Admin verify full-page placement grant | **YES** — package entitlements tracker |
| Admin verify expiration | **YES** — `starts_at`/`ends_at`/status |
| Admin explain why listing ranks first (Bienes) | **NO** — ranking reason not connected |
| Dashboard listing-specific plan | **YES** — `categoryAdPlans` on manage cards |
| Dashboard placement status (Bienes) | **NO** — no entitlement display on BR cards |
| Account vs listing plan separate | **YES** |

---

## 10. Confirmed vs not confirmed

### Confirmed

- Print-to-Digital policy and ranking helpers exist as pure functions.
- `listing_package_entitlements` persistent table and Admin CRUD exist.
- Servicios + Restaurantes: filter → entitlement overlay → visibility ranking → Destacados module.
- Republish sorting fields exist and are used (at least recency) in several categories.
- Category ad plan resolver quarantines account membership from listing monetization.

### Not confirmed

- **Bienes full-page customers rank first in property search** — NOT CONFIRMED (code proves opposite).
- **Admin-created entitlement automatically changes Bienes/Rentas/Autos results order** — NOT CONFIRMED for Bienes/Rentas; Autos sets `featured` flag but does not visibility-sort.
- **Featured/Destacado on Bienes reflects active package** — NOT CONFIRMED (badges editorial/demo only).
- **Result impression analytics** — NOT CONFIRMED globally.

---

## 11. Exact blockers

1. **Bienes results pipeline** lacks `overlayActiveEntitlementsForBienesResults` equivalent and `applyBienesVisibilityRanking` (pattern exists in Servicios).
2. **`resolveBrMonetizationVisibility`** explicitly disables featured/promoted from real data.
3. **`brLaunchListingPolicy`** uses badge-based editorial scoring, contradicting pay-to-rank entitlement promise for properties.
4. **Demo merge mode** can show fake `destacada` badges unrelated to entitlements.
5. **Autos** hydrates entitlements but `sortAutosPublicListings` ignores visibility rank.

---

## 12. Recommended next build gate

**G2-BIENES-RAICES-PRINT-DIGITAL-RANKING** (mirror Servicios stack):

1. `bienesEntitlementOverlay.ts` — hydrate `listing_package_entitlements` for `category=bienes-raices`, `listing_source=listings`.
2. `bienesVisibilityRanking.ts` — wrap `resolveListingVisibilityRank` + `compareVisibilityRank`.
3. Wire into `fetchBrPublishedListingsBrowser` / `brResultsFilters` **after** filter, before paginate.
4. Replace editorial `destacada` badge injection with `packageEntitlementGrantsDestacado` / honest empty state.
5. Admin QA: grant `full_page` → verify sort on `/clasificados/bienes-raices/resultados`.
6. Repeat for Rentas, then Autos results sort (not just `featured` flag).

---

## 13. Manual QA checklist

See final gate response §21.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE |
| ----------- | ---------- |
| Correct repo confirmed | TRUE |
| Audit-only mode respected | TRUE |
| No behavior changed | TRUE |
| No files staged | TRUE |
| No commit created | TRUE |
| No push attempted | TRUE |
| Print/digital full-page offer found in docs/code | TRUE |
| Admin promo/package creation found | TRUE |
| Admin promo/package assignment found | TRUE |
| Admin full-page placement assignment found | TRUE |
| Persistent placement entitlement found | TRUE |
| Placement expiration found | TRUE |
| Placement visible in admin | TRUE |
| Placement visible in dashboard | FALSE (Bienes/Rentas) |
| Placement affects Bienes results ranking | **FALSE** |
| Placement affects all relevant category results ranking | FALSE (only Servicios + Restaurantes) |
| Bienes results ranking file identified | TRUE |
| Bienes results sorting order identified | TRUE (recency/price/republish_sort_at) |
| Bienes full-page customers rank first | **FALSE** |
| Admin-created promo/package affects Bienes ranking | **FALSE** |
| Sponsored/promoted field affects Bienes ranking | FALSE |
| Featured field affects Bienes ranking | FALSE |
| Verified field affects Bienes ranking | FALSE |
| Republish field affects Bienes ranking | TRUE (recency only) |
| Category plan affects Bienes ranking | FALSE |
| Account plan does not affect ranking | TRUE |
| Results ranking is category-aware | TRUE (per-category implementations) |
| Results ranking is data-driven (Bienes print) | **FALSE** |
| No fake sponsored slots (Bienes) | FALSE (demo badges possible) |
| No fake featured slots (Bienes) | FALSE (editorial/demo) |
| Landing pages ready for monetization | PARTIAL |
| Results pages ready for monetization | PARTIAL (2/10 categories) |
| Analytics impressions exist | FALSE (`result_impression`) |
| Analytics opens exist | TRUE (partial) |
| Dashboard can prove placement value | PARTIAL |
| Admin can prove placement value | TRUE |
| Missing Supabase fields identified | TRUE (listings placement cache fields optional) |
| Migration needed | FALSE (overlay pattern sufficient) |
| Ready to confirm “already wired” | **FALSE** |
| Recommended next gate needed | TRUE |

## Final recommendation

**YELLOW** — Infrastructure and Admin grants are real; Servicios + Restaurantes prove the stack. **Bienes/Rentas/Autos results priority from full-page entitlements is not wired.** Business promise for properties is **NOT CONFIRMED**.
