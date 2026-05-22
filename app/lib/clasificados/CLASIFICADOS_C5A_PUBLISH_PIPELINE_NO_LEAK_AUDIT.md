# Gate C5A — Publish Pipeline No-Leak Audit

**Audit date:** 2026-05-22  
**References:** C1 field integrity, C3 buyer QA, C4 filter/search contract lock  
**Scope:** Ownership → business profile → package/entitlement → placement → inventory limits → user dashboard → admin → analytics → saved ads. **No Stripe, no checkout, no fake payment state.**

**C5A code fix:** Autos Inventory Boost price aligned to **$129.99/mo** (`INVENTORY_BOOST_MONTHLY_USD` in `autosDealerInventoryCopy.ts`; totals recompute).

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves end-to-end contract (or safe deferral with hidden UI) |
| FALSE | Pipeline leak, missing linkage, or misleading package/placement |
| DEFERRED_INTENTIONAL | Documented gap; no fake user-facing monetization until Stripe/C5B |
| NOT_APPLICABLE | Category does not use this pipeline area |

---

## Business rules reference (locked copy / pricing model)

| Package | Monthly (USD) | Nuestros Negocios / hub listing | Placement |
|---|---:|---|---|
| Premium / Destacado | $1,999 | Yes (full NN profile) | Destacado on Inicio, Clasificados hub, category |
| Full Page | $1,199 | Yes | Priority sort; **no** Destacado visual |
| Half Page | $799 | Yes (standard NN) | Standard placement |
| Nuestros Negocios Only | $399 | Yes (business hub) | Standard placement |
| Quarter Page | $499 | **No by default** | Print + digital; no NN/category listing unless purchased |

**Inventory:** BR base 3 → +5 @ **$99.99/mo** → 8 total. Autos base 10 → +10 @ **$129.99/mo** → 20 total.

---

## Per-category pipeline matrix

### Autos

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Autos | Ownership | owner, listing id, Leonix Ad ID, category, status, dates | `autos_classifieds_listings`, `AUTOS_LEONIX_AD_ID_FIELD`, publish services | Live rows keyed by `leonix_ad_id` on cards | `mis-anuncios`, `AutosClassifiedListingManageCard` | `admin/workspace/clasificados/autos` | `ownerEngagementListingKeys`, `listing_analytics` | TRUE | `owner_user_id` on dealer rows |
| Autos | Business profile | Dealer identity, logo, city, contact | `listing_payload`, dealer stack UI | Dealer inventory group pages | `AutosDealerInventoryDashboardSection` | Admin autos workspace | Profile/dealer events via listing id | TRUE | Negocio lane |
| Autos | Package entitlement | Print/digital tier, term, promo metadata | `packageEntitlements.ts`, `listing_package_entitlements` (admin) | Category uses `featured` + paid lane, not full NN package matrix on browse | `categoryAdPlans` labels on manage cards | `workspace/package-entitlements` | Tier fields on row when set | DEFERRED_INTENTIONAL | Model ready; Stripe not wired |
| Autos | Placement | Premium band / dealer featured / sort | `autosPublicRanking`, `featured` flag | Dealer spotlight from **live** API only (C4) | Republish/boost where plan allows | Admin can set promoted | Sort + engagement | TRUE | No fake dealer band (C4) |
| Autos | Inventory limit | 10 base, +10 @ $129.99 → 20 | `autosDealerInventoryPolicy.ts`, checkout `route.ts` | Block publish at limit | Dashboard counts + drawer | Admin sees rows | N/A | TRUE | Enforced on checkout API |
| Autos | User dashboard | Listings, plan, analytics, actions | `dashboard/mis-anuncios`, inventory sections | N/A | Full | N/A | Rollup via keys | TRUE | |
| Autos | Admin dashboard | User listings, Leonix Ad ID, status | `admin/.../autos`, `api/admin/autos` | N/A | N/A | Full | N/A | TRUE | |
| Autos | Analytics | view, save, like, share, CTA | `clasificadosAnalytics.ts`, `LeonixSaveButton`, autos analytics API | Public cards | Per-listing strip | N/A | `listing_analytics` | TRUE | |
| Autos | Saved ads | Persisted saves | `saved_listings` + Save button | Buyer save | Guardados | N/A | `listing_save` events | TRUE | |
| Autos | Leonix Ad ID | Stable public key | `leonixAdIdsServer.ts`, RPC on publish | Cards + detail | Shown on manage card | Admin column | Analytics key | TRUE | |

### Bienes Raíces

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Bienes Raíces | Ownership | owner, listing id, Leonix Ad ID, BR branch | `listings`, `leonixPublishRealEstateListingCore.ts` | Published browse + anuncio | `LeonixRealEstateListingManageCard`, BR inventory | `api/admin/clasificados/listings` | Keys in `ownerEngagementListingKeys` | TRUE | |
| Bienes Raíces | Business profile | Agency/office, contact, map | BR negocio forms, `detail_pairs`, gate12d | Profile on cards/detail | Dashboard business fields | Admin edit | CTA/map events | TRUE | |
| Bienes Raíces | Package entitlement | NN / print tiers | `packageEntitlements` V1 includes `bienes-raices` | Uses `promoted`/organic sort, not hub Premium module from DB entitlement yet | Plan labels via `categoryAdPlans` | Package entitlements admin | Row tier when present | DEFERRED_INTENTIONAL | Admin grants; no Stripe |
| Bienes Raíces | Placement | Featured / organic results | `brLaunchListingPolicy`, filters | Results bands + spotlight | N/A | Admin visibility | Ranking | TRUE | Prod: no demo merge |
| Bienes Raíces | Inventory limit | 3 +5 → 8 @ $99.99 | `leonixBrPropertyInventoryPolicy.ts` | Block add when at limit | `BrPropertyInventoryDashboardSection` | Count via listings | N/A | TRUE | Upgrade via env flag until billing |
| Bienes Raíces | User dashboard | Properties, add flow, counts | BR dashboard components | N/A | Full | N/A | Per listing | TRUE | |
| Bienes Raíces | Admin dashboard | Listings, moderation | BR workspace + generic admin | N/A | N/A | TRUE | N/A | TRUE | |
| Bienes Raíces | Analytics | Engagement on cards | `LeonixSaveButton`, BR cards | Public | Dashboard aggregate | N/A | Events | TRUE | |
| Bienes Raíces | Saved ads | Buyer saves | `saved_listings` | Save on cards | Guardados | N/A | Events | TRUE | |
| Bienes Raíces | Leonix Ad ID | On publish | `leonixPublishRealEstateListingCore`, RPC | Detail URLs | Display | Admin | Analytics | TRUE | |

### En Venta

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| En Venta | Ownership | owner, listing id, category | `listings`, `enVentaPublishFromDraft` | Results + anuncio | `EnVentaListingManageCard` | Admin clasificados | Analytics keys | TRUE | |
| En Venta | Business profile | Seller kind, contact | publish schema, detail pairs | Card seller badge | Manage card | Admin | CTA | TRUE | Mostly personal |
| En Venta | Package entitlement | Pro / featured / free tiers | `Leonix:plan`, republish visibility | `featured` + Pro window only (real) | Plan + renewal UI | Admin | Tier in pairs | DEFERRED_INTENTIONAL | Not NN print packages |
| En Venta | Placement | Featured strip, sort | `enVentaRepublishVisibility`, results client | No fake featured | Dashboard | Admin | Sort | TRUE | |
| En Venta | Inventory limit | N/A (per-listing) | — | N/A | N/A | N/A | N/A | NOT_APPLICABLE | |
| En Venta | User dashboard | Listings, republish, analytics | `mis-anuncios`, republish helpers | N/A | Full | N/A | Rollup | TRUE | |
| En Venta | Admin dashboard | Listing edit | admin routes | N/A | N/A | TRUE | N/A | TRUE | |
| En Venta | Analytics | Views, saves, messages | `enVentaAnalytics.ts`, engagement | Public | Dashboard | N/A | `listing_analytics` | TRUE | |
| En Venta | Saved ads | `saved_listings` | `EnVentaAnuncioLayout` | Save | Guardados | N/A | Events | TRUE | |
| En Venta | Leonix Ad ID | When allocated | listings row | Detail | Dashboard | Admin | Keys | TRUE | |

### Empleos

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Empleos | Ownership | owner, slug, listing id | `empleos_public_listings`, publish flows | Results + `/empleos/[slug]` | `dashboard/empleos`, inventory | `api/admin/empleos` | Keys + slug | TRUE | |
| Empleos | Business profile | Company, employer brand | job record, snapshot | Cards + detail | Dashboard | Admin verify | apply_* events | TRUE | |
| Empleos | Package entitlement | Premium/promoted/feria lanes | empleos tier fields, separate model in `packageEntitlements` | `listingTier`, `verified` (C2) | Plan display | Admin moderate | Tier-based | DEFERRED_INTENTIONAL | Separate from NN print V1 |
| Empleos | Placement | Featured/promoted strips | `empleosPublicRankingPolicy` | Real tiers only | Landing strips when live | Admin | Sort | TRUE | |
| Empleos | Inventory limit | N/A | — | N/A | N/A | N/A | N/A | NOT_APPLICABLE | |
| Empleos | User dashboard | Jobs inventory | `dashboard/empleos` | N/A | TRUE | N/A | Analytics page | TRUE | |
| Empleos | Admin dashboard | Jobs, verify | empleos admin API | N/A | N/A | TRUE | N/A | TRUE | |
| Empleos | Analytics | Apply started/submitted | `listingAnalyticsEventTypes`, engagement row | Public | Dashboard | N/A | Events | TRUE | |
| Empleos | Saved ads | Buyer saves | `LeonixSaveButton` on cards | Save | Guardados | N/A | Events | TRUE | |
| Empleos | Leonix Ad ID | On row | `empleos_public_listings.leonix_ad_id` | Engagement key | Shown when set | Admin | Analytics | TRUE | |

### Rentas

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Rentas | Ownership | owner, listing id, BR contract | `listings`, rentas publish | Results + listing detail | Manage cards | Admin | Keys | TRUE | Shares BR stack |
| Rentas | Business profile | PM / office | rentas negocio publish | Cards | Dashboard | Admin | Contact | TRUE | |
| Rentas | Package entitlement | NN tiers (V1) | `packageEntitlements` | Organic + promoted flags | Plan labels | Package admin | When on row | DEFERRED_INTENTIONAL | |
| Rentas | Placement | Results sort | `rentasBrowseFilters`, ranking | No fake promoted | N/A | Admin | Sort | TRUE | |
| Rentas | Inventory limit | BR policy N/A for rentas lane | Uses listings rows | N/A | BR inventory N/A | N/A | N/A | NOT_APPLICABLE | Property limits are BR-negocio |
| Rentas | User dashboard | Listings | `mis-anuncios` rentas paths | N/A | TRUE | N/A | Analytics | TRUE | |
| Rentas | Admin dashboard | Listings | rentas admin workspace | N/A | N/A | TRUE | N/A | TRUE | |
| Rentas | Analytics | Like/save on detail | `RentasListingDetailClient` | Public | Dashboard | N/A | Events | TRUE | |
| Rentas | Saved ads | Buyer saves | engagement components | Save | Guardados | N/A | Events | TRUE | |
| Rentas | Leonix Ad ID | listings | publish core | Detail | Dashboard | Admin | Keys | TRUE | |

### Servicios

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Servicios | Business profile | Full `profile_json` hub | `servicios_public_listings`, publish | `/servicios/[slug]` vitrina | `dashboard/servicios` | `api/admin/servicios` | Profile views | TRUE | Centro de Acción Digital fields in profile |
| Servicios | Package entitlement | V1 category | `PACKAGE_ENTITLEMENT_V1_CATEGORIES` | `promoted`, `leonix_verified` | Plan on dashboard | Package entitlements | Row tier | DEFERRED_INTENTIONAL | |
| Servicios | Placement | Featured band | discovery ranking | Featured cards when promoted | N/A | Admin | Sort | TRUE | |
| Servicios | Ownership | owner, slug, leonix_ad_id | server list + publish | Results | Dashboard inventory | Admin | Keys | TRUE | |
| Servicios | User dashboard | Business listings | dashboard servicios | N/A | TRUE | N/A | Analytics | TRUE | |
| Servicios | Analytics | CTA, phone, web, WhatsApp | `serviciosDiscoveryContract`, analytics | Profile + cards | Dashboard | N/A | Multiple event types | TRUE | |
| Servicios | Saved ads | `saved_listings` | Save on hub/cards | Save | Guardados | N/A | Events | TRUE | |

### Restaurantes

| Category | Pipeline area | Required contract | Current source/file(s) | Public impact | Dashboard impact | Admin impact | Analytics impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Restaurantes | Ownership | owner, slug, leonix_ad_id | `restaurantes_public_listings` | Results + slug detail | Inventory in mis-anuncios | `api/admin/restaurantes` | Keys | TRUE | |
| Restaurantes | Business profile | Full restaurant application | `restauranteListingApplication` | Shell + results cards | Dashboard | Admin | Menu/social CTAs | TRUE | |
| Restaurantes | Package entitlement | V1 + `promoted` | exposure policy | Promoted band only when `promoted` | Plan labels | Package admin | Tier | DEFERRED_INTENTIONAL | |
| Restaurantes | Placement | Featured / promoted | `restaurantesListingExposurePolicy` | Live landing only (C2) | N/A | Admin promoted | Sort | TRUE | |
| Restaurantes | User dashboard | Listing manage | dashboard inventory | N/A | TRUE | N/A | Analytics | TRUE | |
| Restaurantes | Analytics | Engagement on shell | `restaurantesListingEngagement.ts` | Public | N/A | N/A | listing_analytics | TRUE | |
| Restaurantes | Saved ads | local + account | first-party prefs + `saved_listings` | Save | Guardados | N/A | Events | TRUE | |
| Restaurantes | Leonix Ad ID | RPC REST prefix | `allocateRestauranteLeonixAdIdRpc` | Footer on profile | Dashboard | Admin | Keys | TRUE | |

### Clases / Comunidad / Mascotas / Busco / Viajes (summary rows)

| Category | Pipeline area | Status | Notes |
|---|---|---|---|
| Clases | Ownership, publish→results, dashboard, analytics, saves | TRUE | `listings` + community publish; dashboard cards |
| Clases | Business profile | DEFERRED_INTENTIONAL | Instructor/org fields in pairs; no full NN hub |
| Clases | Package entitlement (NN print) | NOT_APPLICABLE | `NOT_CLIENT_READY` in package model |
| Comunidad | Same as Clases | TRUE / N/A | Event expiration on discovery |
| Mascotas | Ownership, free publish, dashboard | TRUE | No paid package |
| Mascotas | Package entitlement | NOT_APPLICABLE | Free notices |
| Busco | Ownership, results filter | TRUE | No business hub |
| Busco | Package / placement | NOT_APPLICABLE | Request listings |
| Viajes | Ownership, staged publish, admin moderate | TRUE | `viajes_staged_listings` |
| Viajes | Business profile | TRUE | Business + affiliate rows |
| Viajes | Package (NN print) | NOT_APPLICABLE | `SEPARATE_MODEL` in visibility rank |
| Viajes | Placement | TRUE | Staged approved only in prod (C2) |

---

## Package placement summary

| Package | Price | Nuestros Negocios included | Placement | Dashboard benefits | Admin controls | Status | Notes |
|---|---:|---|---|---|---|---|
| Premium / Destacado | $1,999/mo | Yes | Destacado: Inicio + Clasificados + category | Republish/boost eligible in tier def; dashboard shows plan when row has tier | `listing_package_entitlements` + tier on listing | DEFERRED_INTENTIONAL | **Logic in** `packageEntitlements.ts` / `printDigitalVisibilityRank.ts`; **public hub Premium modules not fully driven by DB entitlements yet** |
| Full Page | $1,199/mo | Yes | Results priority sort; no Destacado UI | Same | Admin grant + fields | DEFERRED_INTENTIONAL | Sort weight 500 vs premium 600 in rank |
| Half Page | $799/mo | Yes | Standard NN placement | Republish/boost | Admin | DEFERRED_INTENTIONAL | |
| Quarter Page | $499/mo | No (default) | Print pool; no auto NN | Limited digital tools | Admin | FALSE | `classified_listing: true` in tier def — **product rule “no NN by default” needs enforcement in C5B** |
| Nuestros Negocios Only | $399/mo | Yes (hub) | Standard placement | Digital tools | Admin | DEFERRED_INTENTIONAL | Maps to `digital_only` / classified tiers |

Pricing source: `packagePricingRules.ts` (`BASE_MONTHLY_PRICE_CENTS`). Admin UI: `admin/.../package-entitlements/page.tsx`.

---

## Inventory limit summary

| Category | Base included | Add-on | Add-on price | Total with add-on | Backend enforcement | Dashboard display | Admin control | Status |
|---:|---:|---:|---:|---:|---|---|---|---|
| Bienes Raíces (negocio) | 3 | +5 | $99.99/mo | 8 | `computeBrPropertyInventoryCounts` blocks publish/add | `BrPropertyInventoryDashboardSection` | Via listings + env upgrade flag | TRUE |
| Autos (negocio dealer) | 10 | +10 | $129.99/mo | 20 | `dealer_active_limit_reached` in checkout + publish confirm | `AutosDealerInventoryDashboardSection` | Autos admin workspace | TRUE |

No $89.99 in active BR policy code (removed in BR13D). Autos boost price **updated to $129.99** in C5A.

---

## Category summary

| Category | Ownership | Business profile | Package ready | Placement ready | Dashboard ready | Admin ready | Analytics ready | Saved ads ready | Overall |
|---|---|---|---|---|---|---|---|---|---|
| Autos | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Bienes Raíces | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| En Venta | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Empleos | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Rentas | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Servicios | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Restaurantes | TRUE | TRUE | DEFERRED | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Clases | TRUE | DEFERRED | N/A | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Comunidad | TRUE | DEFERRED | N/A | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Mascotas y Perdidos | TRUE | N/A | N/A | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Busco | TRUE | N/A | N/A | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Viajes | TRUE | TRUE | N/A | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

**Overall TRUE** = no ownership/dashboard/analytics leak; package/placement on public NN bands remains **deferred until Stripe + entitlement-driven surfacing (C5B/C6)**.

---

## C5A blockers before Stripe

### Fixed in Gate C5A

| Category/system | File path | Issue | Impact | Stripe impact | Fix | Gate |
|---|---|---|---|---|---|---|
| Autos pricing | `app/lib/clasificados/autos/autosDealerInventoryCopy.ts` | Boost shown as $129 not $129.99 | Wrong upgrade copy | Blocks accurate sales | `INVENTORY_BOOST_MONTHLY_USD = 129.99` | **C5A** |

### Left for C5B / C6

| Category/system | File path | Issue | User/admin/public impact | Stripe impact | Recommended fix | Gate |
|---|---|---|---|---|---|---|
| All NN V1 categories | `packageEntitlements.ts`, public landings | Public Premium/Full/Quarter bands not fully driven by `listing_package_entitlements` rows | Buyers may not see paid placement contract until admin sets `promoted`/tier fields manually | Cannot sell placement truthfully at scale | Wire browse/featured modules to `resolvePackageEntitlement` + active entitlements | **C5B** |
| Quarter Page | `packageEntitlements.ts` (`quarter_page` benefits) | `classified_listing: true` vs product “no NN by default” | Quarter advertisers might get NN listing in code paths that only check benefit flag | Wrong package delivery | Set `classified_listing: false` for quarter + gate publish | **C5B** |
| BR inventory upgrade | `leonixBrPropertyInventoryPolicy.ts` | Upgrade via `NEXT_PUBLIC_LEONIX_BR_INVENTORY_UPGRADE` not Stripe | Admin/seller sees upgrade without payment | No paid add-on | Entitlement flag on owner/group from billing | **C6** |
| Autos inventory boost | `autosDealerInventoryCopy.ts`, checkout | Boost is mailto/contact; limit enforced but boost not entitlement-backed | Dealer hits limit with contact CTA only | Add-on not billable | Stripe + entitlement for +10 slots | **C6** |
| Payment status | — | No `payment_status` on user-facing flows | Dashboard cannot show renewal/paid state | Stripe required | C6 checkout + webhooks | **C6** |
| Homepage Premium | `app/(site)/page.tsx`, hub modules | No global “Premium Destacados” feed from entitlements table | Premium package benefit not visible on Inicio | Premium value gap | Hub query active premium entitlements | **C5B** |
| `listing_analytics` | Supabase optional | Table may be missing in some envs | Dashboard zeros + notice | Reporting after launch | Migration + env verify | **C5B** (ops) |

---

## Verification

```text
npm run build
```

**Result:** PASS (after C5A price fix).

---

## Gate C5A completion

| Item | Value |
|---|---|
| Categories audited | 12 |
| Ownership contracts verified | 12/12 (via `listings` and/or category public tables + `owner_user_id` / `owner_id`) |
| Dashboard linkages verified | `mis-anuncios`, per-category dashboards, guardados, analytics, perfil |
| Admin linkages verified | `admin/usuarios`, workspace clasificados, package-entitlements, category admin APIs |
| Package/placement readiness | Model + admin **TRUE**; public NN placement surfacing **DEFERRED** (no fake Premium UI) |
| Analytics readiness | `clasificadosAnalytics.ts` + `listing_analytics` event allowlist **TRUE** (env-dependent) |
| Saved ads readiness | `saved_listings` + `/dashboard/guardados` **TRUE** |
| Blockers fixed | 1 (Autos $129.99) |
| Blockers before Stripe | 7 documented (C5B/C6) |
| Files changed | `autosDealerInventoryCopy.ts`, `CLASIFICADOS_C5A_PUBLISH_PIPELINE_NO_LEAK_AUDIT.md` |
