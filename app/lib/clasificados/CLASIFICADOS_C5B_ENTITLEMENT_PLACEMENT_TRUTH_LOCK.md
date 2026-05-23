# Gate C5B — Entitlement Placement Truth Lock

**Audit date:** 2026-05-22  
**References:** C1 field integrity, C4 filter/search, C5A publish pipeline  
**Scope:** Package → public placement → dashboard claims → admin controls. **No Stripe, no fake `payment_status`, no fake Premium inventory.**

**C5B code changes:** Entitlement hydration on Servicios/Restaurantes public reads; placement sort/badge truth; Quarter Page `classified_listing` fix; BR dev upgrade flag gated in production; dashboard Destacado/Priority badges via `/api/dashboard/listing-package-entitlements`.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves behavior against active `listing_package_entitlements` (or safe hidden UI) |
| FALSE | Benefit claimed without active entitlement backing |
| DEFERRED_INTENTIONAL | UI hidden / honest copy; documented for post-Stripe |
| NOT_APPLICABLE | Category does not use Print-to-Digital V1 |

---

## System matrix

| System | Surface | Entitlement input | Public behavior | Dashboard behavior | Admin behavior | Status | Notes |
|---|---|---|---|---|---|---|---|
| Package model | `packageEntitlements.ts`, `packagePricingRules.ts` | Tier defs, benefits, dates, `isPackageEntitlementActive` | N/A (resolver only) | Plan labels via `categoryAdPlans` (category rules, not payment) | Tier/benefits snapshot on create | TRUE | Quarter Page: `classified_listing` **removed** (C5B) |
| DB entitlements | `listing_package_entitlements` migration | `status`, `starts_at`, `ends_at`, `revoked_at`, `listing_id`, `benefits`, `metadata.payment_status` | Service-role hydration on public reads | POST API for owner badge lookup | CRUD/revoke/extend/attach | TRUE | No RLS for anon; admin + server only |
| Placement helpers | `listingPackageEntitlementPlacement.ts` | Merged row fields | Destacado / priority / NN eligibility | Badge rules | N/A | TRUE | Does not infer from `membership_tier` |
| Server hydration | `listingPackageEntitlementsServer.ts` | Active rows by `category` + `listing_source` + keys | Merges `package_entitlement_tier` onto listing rows | Used by dashboard API | N/A | TRUE | Missing table → empty map (no crash) |
| Servicios public | Results + landing + cards | Hydrated on `listServiciosPublicListingsForDiscovery` | Destacado = active **premium** only; sort by visibility rank | Badges from entitlement API | Admin grants + attach listing | TRUE | Legacy `isFeatured` no longer grants Destacado alone |
| Restaurantes public | Results + landing | Hydrated in inventory servers | `promoted`/sponsored = active premium only | Badges from entitlement API | Admin grants | TRUE | Exposure policy uses corrected `promoted` |
| Global Inicio / Clasificados hub | Homepage Premium bands | `placement_scope` includes `homepage` / `clasificados` | Not wired to global Premium modules | N/A | Admin can set scopes on grant | DEFERRED_INTENTIONAL | No fake hub Premium feed (C5A/C5B) |
| Bienes Raíces results | BR resultados / cards | Row `promoted` + organic policy | Not fully entitlement-hydrated on browse | Plan from `categoryAdPlans`; no false Destacado from detail pairs on manage card | Package entitlements admin | DEFERRED_INTENTIONAL | BR uses separate spotlight policy; C6 can hydrate `listings` source |
| Rentas | Results | Same as BR V1 category | Deferred full entitlement join | Plan labels only | Admin grants `listings` source | DEFERRED_INTENTIONAL | Property-manager careful rollout |
| Autos negocio | Dealer inventory / ranking | `featured` + lane policy | Live dealer band (C4); not NN print matrix | Inventory limits enforced (10); boost CTA mailto | Admin + package table | DEFERRED_INTENTIONAL | Placement not entitlement-sorted; inventory boost not entitlement-backed |
| Empleos | Premium lane / results | Separate model | Premium preview routes; not print entitlements | Dashboard sin badge Destacado print | N/A | NOT_APPLICABLE | `SEPARATE_MODEL` in rank helper |
| Viajes | Staged listings | Separate model | No print entitlement ranking | Affiliate/plan labels | N/A | NOT_APPLICABLE | |
| En Venta | Featured / Pro | Free/Pro ideology | `featured` + Pro window (real, not print package) | Republish/renewal UI | Admin | NOT_APPLICABLE | |
| Clases / Comunidad | — | Deferred | Organic only | Free plan labels | N/A | NOT_APPLICABLE | |
| Dashboard | `/dashboard/mis-anuncios` | `/api/dashboard/listing-package-entitlements` | N/A | Destacado/Priority only if API returns grants | N/A | TRUE | Restaurantes + Servicios wired; otros inventarios sin badge falso |
| Dashboard BR inventory | `BrPropertyInventoryDashboardSection` | Metadata keys reserved | N/A | Upgrade **not** active in production from env/localStorage | N/A | TRUE | `isBrInventoryUpgradeActive()` false in production unless `entitlementActive` |
| Admin | `/admin/workspace/package-entitlements` | Full row + `effectiveEntitlementStatus` | N/A | N/A | active/scheduled/expired/revoked/pending listing; pricing metadata; no fake paid | TRUE | `payment_status: null` in metadata until Stripe |
| Analytics | `listing_analytics` | Optional migration | N/A | Degraded notice if table missing | N/A | TRUE | Documented in C5A — not silently assumed |
| BR inventory add-on | `leonixBrPropertyInventoryPolicy.ts` | `inventory_addon_br_properties` metadata (future) | Limit 3 base enforced | No “upgrade active” in prod without entitlement | Admin manual grant possible via metadata | FALSE | Env/localStorage dev only; **C6** Stripe + entitlement row |
| Autos inventory add-on | `autosDealerInventoryPolicy.ts`, checkout | Future metadata `inventory_addon_autos_vehicles` | Hard cap 10 on activation | Mailto boost CTA | Admin | FALSE | +10 @ $129.99 not entitlement-backed; **C6** |
| Stripe / payment | Entitlement `metadata` | `payment_status` null | No paid inference | No fake paid UI | Admin shows null payment | DEFERRED_INTENTIONAL | Correct deferral |

---

## Package summary

| Package | Monthly (USD) | Included NN | Public placement | Dashboard claim allowed | Admin control | Status | Notes |
|---|---:|---|---|---|---|---|---|
| Premium / Destacado | $1,999 | Yes | Destacado modules when active entitlement (Servicios/Restaurantes wired) | Destacado badge if active premium | Grant/revoke/attach | TRUE | Global Inicio/Clasificados band still DEFERRED |
| Full Page | $1,199 | Yes | Priority sort (no Destacado badge) in wired categories | “Prioridad” badge if active | Grant/revoke | TRUE | BR/Autos browse not wired |
| Half Page | $799 | Yes (standard NN) | Print pool / standard placement | Plan label only (no false Destacado) | Grant/revoke | TRUE | Republish/boost in tier def; dashboard does not claim boost without entitlement |
| Nuestros Negocios Only | $399 (`classified_print`) | Yes | Standard placement | Plan label | Grant as `classified_print` | TRUE | Pricing tier maps to NN-only package |
| Quarter Page | $499 | **No** by default | Print pool; **no** NN listing default | No NN-included claim | Grant/revoke | TRUE | `classified_listing: false` in code (C5B) |
| BR base | $399 class | 3 properties | Publish limit enforced | Counts + upgrade pitch | Listings admin | TRUE | Add-on separate row |
| BR +5 properties | $99.99/mo | +5 (total 8) | Same | **Not** “active” in production without entitlement | Metadata grant (C6) | FALSE | Left for C6 |
| Autos base | (dealer plan) | 10 vehicles | `dealer_active_limit_reached` | Counts + mailto boost | Autos admin | TRUE | |
| Autos +10 | $129.99/mo | +10 (total 20) | Cap still 10 until entitlement | Mailto only | Future grant | FALSE | Left for C6 |

---

## C5B blockers before Stripe

| System / category | File path | Issue | Impact | Stripe impact | Recommended fix | C5B vs C6 |
|---|---|---|---|---|---|---|
| Global homepage | `app/(site)/page.tsx`, hub modules | No query of active premium entitlements for Inicio/Clasificados Destacados | Premium package value not visible site-wide | Needs paid + scoped entitlements | Hub module fed by `listing_package_entitlements` + `placement_scope` | **C6** (documented DEFERRED) |
| Bienes Raíces browse | BR results servers / policy | `promoted` on `listings` not hydrated from entitlements | Possible legacy promoted without contract | Payment + attach listing | Hydrate `listings` source in BR public read | **C6** |
| Rentas browse | Rentas results | Same as BR | Same | Same | Hydrate on public read | **C6** |
| Autos placement | `autosPublicRanking`, dealer cards | Sort uses `featured`, not entitlement table | Dealer priority not contract-based | Subscription per dealer | Join `autos_classifieds_listings` entitlements | **C6** |
| BR inventory add-on | `leonixBrPropertyInventoryPolicy.ts` | No DB entitlement check for +5 slots | Dev flag could imply paid upgrade in non-prod only | Recurring add-on product | Admin grant metadata + server count | **C6** |
| Autos inventory add-on | checkout, dashboard copy | Boost mailto; limit 10 only | Cannot sell +10 in-app | Stripe price $129.99 | Entitlement metadata + raise cap | **C6** |
| payment_status | `package-entitlements/actions.ts` metadata | Always `null` | Cannot show “pending payment” truth | Stripe webhooks | Write session/intent/status on checkout | **C6** |
| Servicios `isFeatured` legacy | publish profile | Field may still be set in profile_json | No public Destacado from it alone (C5B) | N/A | Optional: sync from entitlement on grant | **C6** optional |

---

## Analytics migration

`listing_analytics` is **optional**: dashboard aggregates degrade with an explicit notice when the table or columns are missing (`listingAnalyticsReadIsDegraded`). Do not assume migration applied in all environments — apply `supabase/migrations/20260507180000_listing_analytics_schema_complete.sql` before relying on per-listing analytics in production.

---

## Files changed (C5B)

- `app/lib/listingPlans/listingPackageEntitlementPlacement.ts` (new)
- `app/lib/listingPlans/listingPackageEntitlementsServer.ts` (new)
- `app/lib/listingPlans/packageEntitlements.ts` (quarter_page benefits)
- `app/(site)/clasificados/servicios/lib/serviciosPublicListingsServer.ts`
- `app/(site)/clasificados/servicios/lib/serviciosResultsFilter.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesResultsInventoryServer.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesLandingInventoryServer.ts`
- `app/(site)/clasificados/lib/leonixBrPropertyInventoryPolicy.ts`
- `app/api/dashboard/listing-package-entitlements/route.ts` (new)
- `app/(site)/dashboard/lib/dashboardPackageEntitlementBadges.ts` (new)
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx`
- `docs/package-entitlement-model.md`
- `app/lib/clasificados/CLASIFICADOS_C5B_ENTITLEMENT_PLACEMENT_TRUTH_LOCK.md` (this file)
