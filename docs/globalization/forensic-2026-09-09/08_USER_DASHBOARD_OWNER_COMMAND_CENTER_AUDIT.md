# G47 — USER DASHBOARD / OWNER COMMAND CENTER — FORENSIC AUDIT

**Batch 1 of continuing Leonix forensic audit. READ-ONLY. No application source modified.**

## 0. REFS OBSERVED

| Ref | SHA | Notes |
|---|---|---|
| `origin/main` (TRUE CURRENT SOURCE) | **`a0a4783971b42ea1d71ab2602d4720d0d590baf8`** | Re-run `git rev-parse origin/main` at audit start AND at report-write time — identical both times (`a0a47839`). Matches the SHA supplied in the mission brief; it did **not** move during this audit. |
| Local working tree `HEAD` (`main`) | `d09d979c1bdba40002ac5e985d6971ce6a87bb0f` | `git rev-list --count HEAD..origin/main` = **112**. Confirmed 112 commits stale. **Not used as evidence anywhere in this report.** |
| Sealed Sept Globalization | `e3956df893f5041ca22371c999038f297d536eae` (branch `fix/globalization-final-closeout-2026-09`) | Resolvable. Clean checkout at `/c/projects/elaguila-website-globalization-final-closeout`. Not the source of truth; not cited as current truth below. |

**Every `path:line` in this report is at `origin/main` = `a0a47839` unless explicitly labelled otherwise.**
Read method used throughout: `git grep -n "<PATTERN>" origin/main -- app/`, `git show origin/main:<path>`, `git ls-tree -r --name-only origin/main -- <dir>`.
`/c/projects/elaguila-website-final-audit-fixes` was **not** read (per instruction).

---

## 1. KNOWN LEAD — VERDICT

> LEAD: `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:137` `OWNER_ENTITY_CAPABILITIES` reported COMPLETE (all 14 categories lane-split + iglesias). Verify; determine whether completeness is REAL or a zero-adopter abstraction.

### 1.1 Structural completeness — **CONFIRMED TRUE**

`OWNER_ENTITY_CAPABILITIES` at `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:137` is typed `Record<OwnerEntityCategoryKey, OwnerEntityCapabilities>` over the union declared at `:117-135`. TypeScript's `Record<K,V>` over a closed union makes a missing key a **compile error**, so structural completeness is enforced, not asserted. **18 keys** are present (not 14 — the brief undercounts; 14 is the count of *product categories*, 18 is the count after lane-splitting):

`servicios`, `restaurantes`, `en-venta`, `autos-privado`, `autos-negocios`, `bienes-raices-privado`, `bienes-raices-negocio`, `rentas-privado`, `rentas-negocio`, `empleos`, `clases`, `comunidad`, `busco`, `mascotas-y-perdidos`, `comida-local`, `ofertas-locales`, `viajes`, `iglesias` (`:117-135`, values `:139-324`).

Capability surface per key: `identity{publicView,preview,results,edit,analytics}`, `engagement{like,save,share,report}`, `communityTrust`, `externalReviews`, `video`, `contactHub`, `translateAd`, `relatedListings`, `lifecycle{pause,reactivate,archive,markSold,republish,renew,close}`, `specialized{inventory,applications,leads,requests,offers,coupons,campaign,aiScan,businessTools,businessConcierge,activity}`, `commercial{plan,entitlement,placement,verification}` (`:32-80`). States are a 4-value enum `supported|unsupported|unproven|specialized` (`:30`), with the render gate `isLiveCapability()` = `supported || specialized` at `:334-336`.

### 1.2 Is the completeness REAL? — **MOSTLY YES at module level; NO at two specific keys and at one whole capability**

This is **NOT** a `buildSharedConnectionHubContact`-class zero-adopter. The module has **9 real, non-doc app importers** at `origin/main`:

| # | Consumer (`origin/main`) | Line | Keys it resolves |
|---|---|---|---|
| 1 | `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx` | `:43` import; `:355`, `:356` | `autos-privado`, `autos-negocios` |
| 2 | `app/(site)/dashboard/empleos/page.tsx` | `:14` import; `:71` | `empleos` |
| 3 | `app/(site)/dashboard/empleos/[listingId]/page.tsx` | `:14` import; `:75` | `empleos` |
| 4 | `app/(site)/dashboard/mis-anuncios/[id]/page.tsx` | `:53` import; `:593-612` | `en-venta`, `rentas-privado`, `bienes-raices-privado`, `bienes-raices-negocio`, `clases`, `comunidad`, `busco`, `mascotas-y-perdidos` |
| 5 | `app/(site)/dashboard/ofertas-locales/page.tsx` | `:15` import; `:43` | `ofertas-locales` |
| 6 | `app/(site)/dashboard/ofertas-locales/[id]/page.tsx` | `:18` import; `:66` | `ofertas-locales` |
| 7 | `app/(site)/dashboard/restaurantes/page.tsx` | `:44` import; `:493` | `restaurantes` |
| 8 | `app/(site)/dashboard/servicios/page.tsx` | `:29` import; `:422` | `servicios` |
| 9 | `app/(site)/dashboard/viajes/page.tsx` | `:14` import; `:100` | `viajes` |
| 10 | `app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx` | `:12` import; `:31` | `comida-local` |

(10 importer files; 9 distinct dashboard surfaces + the autos dealer section.)

**Per-key adoption result: 16 of 18 keys have a traced consumer. 2 keys are ZERO-ADOPTER.**

#### DEFECT D1 (P1) — `rentas-negocio` is a ZERO-ADOPTER registry key
`ownerEntityCapabilityRegistry.ts:230-237` declares a full `rentas-negocio` capability row. **No consumer ever resolves it.** The only code path that could is the generic workspace, and it explicitly refuses to:

`app/(site)/dashboard/mis-anuncios/[id]/page.tsx:591-598`:
```
  // Rentas Privado and Rentas Negocio carry identical lifecycle/analytics capability shapes in
  // the registry, so a "rentas" row resolves to "rentas-privado" regardless of actual branch.
  ...
      : catLower === "rentas" && !isBrNegocio
        ? "rentas-privado"
```
The in-code justification ("identical lifecycle/analytics capability shapes") is **FALSE at `origin/main`**. Comparing `:221-229` (privado) with `:230-237` (negocio):
- `identity.analytics`: privado = `"supported"`, negocio = `"unsupported"` — **not identical**.
- `specialized.activity`: privado = `"supported"`, negocio = `"unsupported"` (falls to `UNSUPPORTED_ALL`, `:92`) — **not identical**.

Consequence at `mis-anuncios/[id]/page.tsx:617-618`: a Rentas **Negocio** row is evaluated with `analyticsSupported = true` and `activitySupported = true` (privado's values), so the workspace renders a performance section (`:661-663`) and an activity section (`:665-667`) that the registry says are `unsupported` for that lane. This is exactly the "render a fabricated capability" failure the registry's own header doctrine forbids (`:14-19`).

#### DEFECT D2 (P2) — `iglesias` is a ZERO-ADOPTER registry key
`ownerEntityCapabilityRegistry.ts:321-324`. No app file resolves `"iglesias"`. This one is **honest-by-design**: its own comment at `:318-320` states no owner workspace exists at any layer. There is also **no `iglesias` adapter** in `CATEGORY_ROUTE_REGISTRY` (`app/lib/listingIdentity/categoryRouteRegistry.ts:1395-1413`). Classify as *documented placeholder*, not a false claim. Severity P2 (dead weight, not a lie).

#### DEFECT D3 (P0) — `externalReviews` capability has ZERO rendering adopters (Google/Yelp panel is dead)
The registry marks `externalReviews: "supported"` for **`servicios`** (`:143`) and **`restaurantes`** (`:158`). The component exists: `app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx:12`. The shared workspace wires it: `app/(site)/dashboard/components/OwnerEntityWorkspace.tsx:27` (import), `:64` (prop type `externalReputation?: { title; links }`), `:107-109` (conditional render).

**But `git grep -n "externalReputation" origin/main -- app/` returns exactly 4 hits — all four inside `OwnerEntityWorkspace.tsx` (`:39`, `:64`, `:107`, `:108`). No page anywhere passes the `externalReputation` prop.** The gate at `:107` is therefore permanently `undefined` → the Google/Yelp panel **never renders for any category, ever**.

This is a **direct falsity in the registry**: two categories are declared `externalReviews: "supported"` when the capability is unreachable in the running product. `OwnerEntityExternalReputation.tsx` is a **structurally-imported but functionally-orphaned component** — the exact `buildSharedConnectionHubContact` pattern the mission warned about, one layer deeper (imported by a parent, but the parent's gate is never satisfied).

Contrast — `communityTrust` is REAL: passed at `app/(site)/dashboard/restaurantes/page.tsx:526` and `app/(site)/dashboard/servicios/page.tsx:501`, fed by real `GET /api/leonix-endorsements` reads at `restaurantes/page.tsx:234-235` and `servicios/page.tsx:335-336`. Exactly matching the two keys marked `communityTrust: "supported"` (`:142`, `:157`). **TRUE.**

### 1.3 Verdict on the lead
> **The registry is COMPLETE structurally and REAL in adoption for 16/18 keys.** It is NOT a zero-adopter abstraction. Two keys (`rentas-negocio`, `iglesias`) have zero adopters, and one whole declared capability (`externalReviews`) is unreachable in the product despite being marked `supported` for two categories.

---

## 2. ARCHITECTURE MAP (`origin/main` = `a0a47839`)

Tree enumerated via `git ls-tree -r --name-only origin/main -- "app/(site)/dashboard"` (148 entries, 13 of which are in-tree `.md` audit artifacts) and `-- app/api/dashboard` (32 route files).

### 2.1 Three-layer shell model (declared at `OwnerProductPageFrame.tsx:4-13`)

| Layer | Component | Path:line | Adopters (traced) |
|---|---|---|---|
| **A — global dashboard shell** | `LeonixDashboardShell` | `app/(site)/dashboard/components/LeonixDashboardShell.tsx:57` | Every dashboard page. Loads nav counts via `fetchDashboardNavCounts` (`:9`). Accepts pre-resolved `ownerId` to skip a duplicate `auth/v1/user` call (`:73-81`). |
| **B — owner product page frame** | `OwnerProductPageFrame` | `app/(site)/dashboard/components/OwnerProductPageFrame.tsx:24` | **5**: `empleos/page.tsx:11,186,271`; `ofertas-locales/page.tsx:12,144,226`; `restaurantes/page.tsx:46,368,547`; `servicios/page.tsx:31,409,523`; `viajes/page.tsx:9,307,414` |
| **C — owner entity workspace** | `OwnerEntityWorkspace` | `app/(site)/dashboard/components/OwnerEntityWorkspace.tsx:33` | **9**: `AutosDealerInventoryDashboardSection.tsx:41,411,530`; `empleos/page.tsx:12,252`; `empleos/[listingId]/page.tsx:11,311`; `mis-anuncios/[id]/page.tsx:48,777`; `ofertas-locales/page.tsx:13,193`; `ofertas-locales/[id]/page.tsx:16,488`; `restaurantes/page.tsx:45,500`; `servicios/page.tsx:30,489`; `viajes/page.tsx:10,386`; `ComidaLocalDashboardListings.tsx:14,150` |

`app/(site)/dashboard/layout.tsx:1-10` is metadata-only (`title: "Mi cuenta"`, `robots: noindex`) and renders `children` unchanged — it is **not** a shell.

Canonical section order owned by Layer C (`OwnerEntityWorkspace.tsx:80-158`): header → note → detail grid → performance → community trust → external reputation → primary action → quick actions → lifecycle actions → specialized tools → mobile action sheet → activity → footer hint. Layer C owns **zero** data and builds **zero** hrefs (`:8-13`).

### 2.2 Sub-components of Layer C

| Concern | Path:line | Fed by |
|---|---|---|
| Header | `components/OwnerEntityHeader.tsx` | `OwnerEntityWorkspace.tsx:83` |
| Identity detail grid | `components/OwnerEntityDetailGrid.tsx` | `:95` |
| **Analytics panel (per-entity)** | `components/OwnerEntityPerformance.tsx` | `:97` |
| **Community trust panel** | `components/OwnerEntityCommunityTrust.tsx:22` | `:99-105` — READ-ONLY by doctrine (`:6-14`); never imports the vote-write path |
| **Google/Yelp panel** | `components/OwnerEntityExternalReputation.tsx:12` | `:107-109` — **DEAD, see D3** |
| Specialized tools | `components/OwnerEntitySpecializedTools.tsx` | `:128-132` |
| Activity / per-listing messages | `components/OwnerEntityActivity.tsx` | `:152-154` |
| Action bar | `components/DashboardListingActionBar.tsx` (`ActionItem`) | `:113,120,125` |
| Mobile overflow | `components/DashboardMobileActionSheet.tsx` | `:143-150` |

### 2.3 Route / action / capability resolvers

| Concern | Path:line | Status |
|---|---|---|
| **Route resolver (canonical)** | `app/lib/listingIdentity/categoryRouteRegistry.ts:1395` `CATEGORY_ROUTE_REGISTRY` — **17 lane-split adapters** (`:1396-1412`); accessor `getCategoryRouteAdapter` `:1417` | REAL |
| **Action resolver (canonical)** | `app/lib/listingIdentity/dashboardActionResolver.ts:58` `resolveDashboardActions` | REAL — 4 adopters (§2.4) |
| Action types | `app/lib/listingIdentity/dashboardActionTypes.ts` | REAL |
| Identity builder | `app/lib/listingIdentity/identityBuilders.ts:72` `buildListingIdentity` | REAL |
| Barrel | `app/lib/listingIdentity/index.ts:63,82,88` | REAL |
| **Capability resolver** | `app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts:329` `getOwnerEntityCapabilities`, `:334` `isLiveCapability` | REAL (§1.2) |
| Owner lifecycle resolver | `app/lib/listingIdentity/ownerLifecycleResolver.ts:233,276,493,550` | **PARTIAL** — see D5 |
| BR lifecycle adapter | `app/lib/listingIdentity/bienesRaicesLifecycleAdapter.ts` | WIRED (`LeonixRealEstateListingManageCard.tsx:53,315`) |
| Restaurantes lifecycle adapter | `app/lib/listingIdentity/restaurantesLifecycleAdapter.ts` | WIRED (`restaurantes/page.tsx:34,412`) |
| Business Profile Family adapter | `app/lib/listingIdentity/businessProfileLifecycleAdapter.ts` | **INDIRECT ONLY** — see D6 |
| Preview mode contract | `app/lib/listingIdentity/previewModeContract.ts` | REAL — 6 public preview clients |
| Category dashboard action contract | `app/(site)/dashboard/lib/categoryDashboardActionContract.ts` | 1 importer |
| Owner classification (groups) | `app/(site)/dashboard/lib/dashboardOwnerClassification.ts` | 2 importers; explicitly **not** a replacement for `resolveDashboardActions` (`:9-14`) |

#### DEFECT D4 (P1) — `dashboardRoute` is a 17× ZERO-CALLER adapter field
Every one of the 17 adapters implements `dashboardRoute` (e.g. `categoryRouteRegistry.ts:207, 274, 378, 498, 602, 664, 738, 784, 829, 936, 1039, 1076, 1124, 1176, 1215, 1268, 1335`). 

`git grep -n "dashboardRoute" origin/main -- app/ ":!*.md" ":!*categoryRouteRegistry.ts"` returns **exactly one hit**: the type declaration at `app/lib/listingIdentity/types.ts:178`. **No page, component, or resolver ever calls `adapter.dashboardRoute()`.** `dashboardActionResolver.ts` calls `publicRoute` (`:97`), `previewRoute` (`:104`), `editRoute` (`:114`), `secondaryManageRoute` (`:150,159,171,184`) — never `dashboardRoute`. It is a fully-specified, carefully-documented, zero-adopter abstraction across the whole registry.

#### DEFECT D4b (P1) — three adapters carry STALE FALSE claims about Mis Anuncios membership
`CLASES_ADAPTER` (`categoryRouteRegistry.ts:1176-1184`), `COMUNIDAD_ADAPTER` (`:1215-1223`) and `MASCOTAS_Y_PERDIDOS_ADAPTER` (`:1268,:1288-1290`) all return `dashboardRoute: () => null` and justify it in prose:

- `:1141-1143` — *"free quick-ad categories with NO dedicated Mis Anuncios category tab (confirmed `ready:false`, `manageHref: () => null` in dashboardMisAnunciosCategories.ts, still true as of Gate I.6A)"*
- `:1288-1290` — *"dashboardRoute() returns null — confirmed absent from Mis Anuncios entirely (no key in dashboardMisAnunciosCategories.ts), still true as of Gate I.6B."*

**All three claims are FALSE at `origin/main`.** `app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts`:
- `clases` — `ready: true` (`:155`), `manageHref: (q) => "/dashboard/mis-anuncios?"+q+"&cat=clases"` (`:156`)
- `comunidad` — `ready: true` (`:166`), `manageHref` `:167`
- `mascotas` — `ready: true` (`:191`), `manageHref` `:192`; the key IS present in `MIS_ANUNCIOS_CATEGORY_KEYS` (`:34`) and `MisAnunciosCategoryKey` (`:19`)

Two registries at the same ref state contradictory truth about the same three categories. Blast radius is currently limited **only because D4 makes `dashboardRoute` uncallable** — the moment anything consumes it, three categories route to `null`.

### 2.4 `resolveDashboardActions` adopters (4 traced)
1. `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts:2` (import), `:345` `buildListingIdentity`, `:356` `resolveDashboardActions`
2. `app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx:44,46,142,156`
3. `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx:34,123,137`
4. `app/(site)/clasificados/bienes-raices/dashboard/BrNegocioListingInventoryActions.tsx:34,72,83`

**Resolver scope boundary is explicit and real** (`dashboardActionResolver.ts:8-16`): it emits **only** `actionKind: "navigate"` with static hrefs. Lifecycle mutations (pause/resume/archive/mark-sold) and checkout *activation* are **outside** it, handled by client-side async handlers per page. This is the structural reason the SHARED/SILO split below is **partial for every listings-table lane**: navigation is shared, mutation is not.

**Per-pipeline branches inside `resolveDashboardActions`:** `servicios` (`:117-121`), `restaurantes` (`:122-123`, analytics deliberately omitted), `autos_negocios` (`:124-134`, `:175-187`), `bienes_raices_negocio` (`:135-140`, `:163-174`). Coupons/offers/inventory manage: `restaurantes` `:145`, `servicios` `:154`, `bienes_raices_negocio` `:163`, `autos_negocios` `:175`.
**CONFIRMED: there is NO `ofertas_locales` branch, no `empleos` branch, no `viajes` branch, no `comida_local` branch, and no `en_venta`/`clases`/`comunidad`/`busco`/`mascotas` analytics branch** anywhere in the file (full file read, 190 lines).

### 2.5 Mis Anuncios category system

| Concern | Path:line |
|---|---|
| Category keys + defs | `app/(site)/dashboard/lib/dashboardMisAnunciosCategories.ts:6-19` (`MisAnunciosCategoryKey`, **13 keys**), `:21-35` (`MIS_ANUNCIOS_CATEGORY_KEYS`), `:51-196` (`MIS_ANUNCIOS_CATEGORY_DEFS`) |
| Default-tab resolver | `:211-220` `resolveMisAnunciosDefaultCategory`; order at `:198-209` (10 entries — omits `clases`, `comunidad`, `mascotas`) |
| Analytics-href gate | `:223-229` `provenInventoryAnalyticsHref` — allow-list of 5: `empleos`, `viajes`, `servicios`, `autos`, `autos_paid` |
| **Load plan** | `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryLoadPlan.ts:21-29` `SHARED_LISTINGS_CATEGORIES` (7), `:39-45` `DEFERRED_DEDICATED_CATEGORIES` (5), **`:49-56` `ENTITLEMENT_ELIGIBLE_CATEGORIES` (6)**, `:70-77` `resolveMisAnunciosLoadPlan`, `:100-118` `fetchDedicatedCategoryCounts` |
| Per-category tool truth | `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts:52-71` `CATEGORY_PANEL_TOOL_TRUTH`, `:74-159` `CATEGORY_LISTING_TOOL_TRUTH`, `:161-186` accessors |
| Category selector UI | `app/(site)/dashboard/components/DashboardMisAnunciosCategorySelector.tsx` |
| Generic list card | `app/(site)/dashboard/components/DashboardCategoryListingCard.tsx` |

`ENTITLEMENT_ELIGIBLE_CATEGORIES` **verified = 6**: `restaurantes`, `servicios`, `autos`, `bienes-raices`, `rentas`, `en-venta` (`dashboardMisAnunciosCategoryLoadPlan.ts:50-55`). Matches the brief.

### 2.6 Listing readers per source

| Source table / API | Reader path:line | Owner column |
|---|---|---|
| `listings` (shared, all 7 shared-listings lanes) | `app/(site)/dashboard/lib/ownerListingsQuery.ts:74` `fetchOwnerListingsForDashboard` → `.from("listings")` `:90` / `:112`; single-row `:142` `fetchOwnerListingForWorkspace` → `:161-164`; mapper `:198` | `owner_id` |
| `restaurantes_public_listings` | `dashboardInventory.ts:163` `fetchOwnerRestaurantListings` → `:168`; also direct at `restaurantes/page.tsx:192`, `:286` | `owner_user_id` |
| `empleos_public_listings` | `dashboardInventory.ts:178` → `:183`; also direct at `empleos/page.tsx:123` | `owner_user_id` |
| `viajes_staged_listings` | `dashboardInventory.ts:193` → `:198`; also direct at `viajes/page.tsx:175` + API `viajes/page.tsx:241` `/api/clasificados/viajes/staged-owner` | `owner_user_id` |
| `autos_classifieds_listings` | `dashboardInventory.ts:209` → `:214` | `owner_user_id` |
| Servicios (API-only, no owner-read RLS) | `dashboardInventory.ts:361` `fetchOwnerServiciosListings` → `:365` `GET /api/clasificados/servicios/my-listings`; page call `servicios/page.tsx:233` | server-side |
| `comida_local_public_listings` | `app/lib/clasificados/comida-local/comidaLocalDashboardQueries.ts:38` `listUserComidaLocalListings` → `:46`, `:48` | `owner_user_id` |
| `ofertas_locales` (API-only) | `ofertas-locales/page.tsx:117` `GET /api/ofertas-locales/owner?lang=` | server-side |
| Dedicated count-only heads | `dashboardMisAnunciosCategoryLoadPlan.ts:104-110` (5 tables, `head:true`) | `owner_user_id` |

VM builders: `buildAutosClassifiedsInventoryItems` `:249`, `buildServiciosInventoryItems` `:308`, `buildRestaurantInventoryItems` `:418`, `buildEmpleosInventoryItems` `:467`, `buildViajesInventoryItems` `:507`, `dedupeRestaurantInventoryWithListings` `:543` — all in `app/(site)/dashboard/lib/dashboardInventory.ts`.
Comida Local VM: `app/lib/clasificados/comida-local/mapComidaLocalDashboardListing.ts` (`mapComidaLocalRowToDashboardVm`, imported `mis-anuncios/page.tsx:125`).

### 2.7 Status / payment / entitlement resolvers

| Concern | Path:line | Wired? |
|---|---|---|
| Owner-facing status display | `lib/dashboardOwnerStatusDisplay.ts` (`ownerDashboardStatusLabel`) — 4 importers | YES |
| Listing UI status | `lib/listingDisplayStatus.ts` (`resolveListingUiStatus`, `listingUiStatusLabel`, `listingUiStatusChipClass`, `expiresInDaysLabel`, `shortListingRef`) | YES |
| Lifecycle status card | `components/ListingLifecycleStatusCard.tsx` — 2 importers | YES |
| **Entitlement badges** | `lib/dashboardPackageEntitlementBadges.ts:56` → `POST/GET /api/dashboard/listing-package-entitlements` | YES — 8 importers (`mis-anuncios/page.tsx:93`, `restaurantes/page.tsx:32`, `business-tools/page.tsx:16`, `derivedDashboardFeed.ts:18`, `autosDashboardInventoryAddonCheckout.ts:30`, `bienesDashboardInventoryAddonCheckout.ts:34`, `AutosDealerInventoryDashboardSection.tsx:39`, `BrNegocioListingInventoryActions.tsx:39`, `BrPropertyInventoryDashboardSection.tsx:35`, `LeonixRealEstateListingManageCard.tsx:54`) |
| Entitlement API | `app/api/dashboard/listing-package-entitlements/route.ts` (placement `:176`, capability `:214`, addon `:277` groups) | YES |
| Included-capability enable | `app/api/dashboard/enable-included-capability/route.ts`; client `app/lib/listingPlans/enableIncludedCapabilityClient.ts:10` | YES |
| Commercial state badges | `app/lib/listingPlans/commercialStateBadges.ts` (`resolveCommercialStateBadges`) — `mis-anuncios/page.tsx:94` | YES |
| Product truth | `lib/dashboardProductTruth.ts` — 2 importers | YES |
| Count definitions | `lib/dashboardCountDefinitions.ts` — 4 importers | YES |
| Nav counts | `lib/dashboardNavCounts.ts` — 3 importers | YES |

### 2.8 Attention / action center

| Concern | Path:line |
|---|---|
| Per-row attention resolver | `lib/dashboardAttentionItems.ts:86` `resolveOwnerDashboardAttentionItems`; `:167` `countByAttentionSeverity`; severities `:13`; reason keys `:15` |
| Account-level attention feed | `lib/derivedDashboardFeed.ts` `fetchDerivedDashboardFeed` / `DerivedFeedItem` |
| Account attention mapper | `lib/ownerAccountCommandCenter.ts` (`accountAttentionItems`, `derivedFeedTone`) |
| Attention UI | `components/OwnerNeedsAttention.tsx:9` |
| Consumers | `mis-anuncios/page.tsx:47`; `page.tsx:24,267`; `notificaciones/page.tsx:12` |

### 2.9 Analytics

| Concern | Path:line |
|---|---|
| Event rollup (pure) | `lib/listingAnalyticsAggregate.ts` (`rollupListingAnalyticsEvents`, `aggregateListingAnalyticsEvents`, `ListingAnalyticsBucket`) |
| Degraded-read guard | `lib/listingAnalyticsReadErrors.ts` (`listingAnalyticsReadIsDegraded`) |
| Insights | `lib/ownerListingAnalyticsInsights.ts` — 2 importers |
| Summary fetch client | `lib/fetchDashboardAnalyticsApi.ts` (`fetchDashboardAnalyticsSummary`) → `app/api/dashboard/analytics/summary/route.ts:16` |
| Summary shaping | `lib/dashboardAnalyticsSummary.ts` |
| Per-listing API | `app/api/dashboard/analytics/listing/route.ts:14` — `?source_table=&source_id=&canonical_ad_id=&category=` (`:12`, `:21`, `:61`) |
| Analytics pages | `analytics/page.tsx`, `analytics/listing/page.tsx`; ES alias `analiticas/page.tsx` |
| Direct table read | `mis-anuncios/page.tsx:700` `.from("listing_analytics")` |
| Identity keys | `app/lib/analytics/listingAnalyticsIdentity.ts` (`buildAnalyticsKeySet`, `buildCanonicalAdId`) — `mis-anuncios/[id]/page.tsx:22-25` |
| Account performance UI | `components/OwnerAccountPerformance.tsx` |

### 2.10 Leads / messages / applications

| Concern | Path:line | Coverage |
|---|---|---|
| Messages inbox | `mensajes/page.tsx` — `.from("messages")` `:134`, joins `listings` `:150`, read-receipt `:180` | account-wide |
| EN alias | `messages/page.tsx:1-19` — server `redirect()` to `/dashboard/mensajes` | — |
| Per-listing activity | `mis-anuncios/[id]/page.tsx` (`ListingMsgRow` `:92-100`) → `OwnerEntityActivity` `:665-667` | listings-table lanes |
| **Leads** | `GET /api/clasificados/servicios/my-leads` — called at `servicios/page.tsx:270` | **SERVICIOS ONLY** |
| **Applications** | `app/api/clasificados/empleos/applications/route.ts`, `.../[id]/route.ts`, `.../listings/[listingId]/applications/route.ts`; gated `empleos/page.tsx:202`, `empleos/[listingId]/page.tsx:239` (`lane !== "feria"`) | **EMPLEOS ONLY** |
| Owner engagement | `lib/fetchOwnerEngagementDashboard.ts` → `app/api/dashboard/owner-engagement/route.ts:16` | account-wide |

### 2.11 Notifications
`notificaciones/page.tsx` (ES canonical) — feeds from `fetchDerivedDashboardFeed` (`:12`); profile read `:177`. `notifications/page.tsx:1-16` is a server `redirect()` alias. **No dedicated notifications table** — the feed is derived from listing/entitlement state. This is a derived-notifications architecture, not a stored one.

### 2.12 Media manager / active edit / republish

| Concern | Path:line |
|---|---|
| **Shared owner editor** | `mis-anuncios/[id]/editar/page.tsx` — the ONE post-publish editor for `listings`-table rows |
| Category field adapters | `mis-anuncios/[id]/editar/categoryLifecycleAdapters.ts:37` type; `:415` `en-venta`, `:422` `busco`, `:429` `clases`, `:436` `comunidad`, `:443` `mascotas-y-perdidos`; accessor `:451` `getCategoryLifecycleAdapter`. **5 categories only.** Wired at `editar/page.tsx:24,245,264,582-583,744-810` |
| **Media manager** | `editar/page.tsx:42` `getListingImageUrls`; media contract `app/lib/media/listingMediaContract.ts` (`buildProposedFinalMediaSet`, imported `:8`); storage bucket `listing-images` `:471`, `:480`; bucket candidates `:285`; persist `:330-356`; per-category minimum-image floor `:367-374` |
| Republish UI truth | `lib/dashboardRepublishUi.ts:7` `dashboardCanRepublishListingsRow`, `:16` `dashboardRepublishPrimaryKind`, `:27` `dashboardRepublishPrimaryLabel` — delegates to `app/admin/_lib/classifiedsRepublishCapability.ts` (`:2-4`) |
| Republish consumers | `mis-anuncios/page.tsx:119` (en-venta `:2215`, BR/rentas `:2140`); `mis-anuncios/[id]/page.tsx:40` |
| En Venta visibility renewal | `app/clasificados/en-venta/boosts/enVentaVisibilityRenewal.ts` (`computeEnVentaVisibilityRenewalVm`) — `mis-anuncios/[id]/page.tsx:42-45`; refresh action `:707-709` |
| Rentas renewal | `app/lib/listingLifecycle/resolveListingLifecycle.ts` + `listingLifecycleConfig.ts` (`RENTAS_LISTING_LIFECYCLE_CONFIG`) + `listingRenewalCheckout.ts` (`startListingRenewalCheckout`) — `mis-anuncios/page.tsx:120-122`; UI `components/ListingRenewalAction.tsx` |
| Ofertas renewal | `app/api/ofertas-locales/owner/[id]/renewal/route.ts`; UI `ofertas-locales/[id]/OfertasLocalesOwnerRenewalActionCenter.tsx` |
| Generic lifecycle client | `lib/ownerListingsLifecycleClient.ts` (`OWNER_LISTING_PAUSE_PATCH`, `OWNER_LISTING_SOFT_ARCHIVE_PATCH`, `ownerListingResumeFromPausePatch`, `applyOwnerListingPatch`) — `mis-anuncios/[id]/page.tsx:7-12` |
| BR server-authorized lifecycle | `lib/brDashboardLifecycleClient.ts` (`callBrLifecycleMutation`) — 3 importers |

**Republish is NOT global.** Only two categories have a real republish/refresh action path: **en-venta** (`republished_at`/`republish_count` + `dashboardRepublishUi`) and **bienes-raices/rentas** via `dashboardRepublishPrimaryKind` at `mis-anuncios/page.tsx:2140`. `ofertas-locales` and `rentas` have *renewal* (a different, paid concept). The registry agrees: only `en-venta` (`:178`) and `bienes-raices-negocio` (`:215`) carry a non-`unsupported` `lifecycle.republish`.

### 2.13 Inventory tools (parent/child)

| Lane | Parent section | Child handling |
|---|---|---|
| Autos dealer | `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx` — parent `:474-514`, child `:385-402`; rendered `mis-anuncios/page.tsx:1911` | `editVehicleId` drawer; `InventoryRole` = `inventory_vehicle` |
| BR negocio | `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryDashboardSection.tsx` — rendered `mis-anuncios/page.tsx:1913`; actions `BrNegocioListingInventoryActions.tsx` (entitlement gate `:163-169`) | `openChildDraftId`; `InventoryRole` = `inventory_property`; role helpers `app/clasificados/lib/leonixBrPropertyInventoryPolicy.ts` (`isBrNegocioListing`, `isBrInventoryMainListing`, `isBrInventoryProperty`) |
| Checkout helpers | `lib/autosDashboardInventoryAddonCheckout.ts`, `lib/bienesDashboardInventoryAddonCheckout.ts` (`bienesInventoryEditHref`, `bienesListingEditHref`, `bienesListingPreviewHref`) | |
| Role predicates in resolver | `dashboardActionResolver.ts:24-30` `isParentRole` / `isChildRole` | |

### 2.14 Billing
**No `/dashboard/billing` or `/dashboard/facturacion` route exists** (`git ls-tree -r --name-only origin/main -- "app/(site)/dashboard"` — 148 entries, none billing). Commerce reaches the dashboard only as **entitlement state** (`§2.7`) and **add-on checkout launchers**: `lib/autosDashboardInventoryAddonCheckout.ts`, `lib/bienesDashboardInventoryAddonCheckout.ts`, `lib/restaurantesDashboardCouponAddonCheckout.ts`, `lib/serviciosDashboardOffersAddonCheckout.ts`, plus `ofertas-locales/[id]/checkout/page.tsx`. Account pages present: `perfil/`, `seguridad/`, `guardados/`, `busquedas-guardadas/`, `vistos-recientes/`, `borradores/`→`drafts/`.
**EVIDENCE GAP EG-1:** whether a billing/invoice surface exists outside `app/(site)/dashboard/` was not swept in this batch.

### 2.15 Business tools / concierge (separate product)
`business-tools/` — 22 files (onboarding wizard 9 steps `_steps/Step1..Step9`, `concierge/`, `idea-builder/`, `business-health/`, `business/[businessId]/`, `claim/[token]/`, `what-we-understand/`, `proximo-paso/`) backed by 24 `app/api/dashboard/business/**` routes. Declared "SPECIALIZED MODULE (Concierge hub) — not a second dashboard" (`OWNER_COMMAND_CENTER_FINAL_RECONCILIATION_AUDIT.md:109`, at `origin/main`). Entry from `/dashboard` via `components/OwnerBusinessGrowthEntry.tsx` (`page.tsx:15,297`).

### 2.16 `/dashboard` home composition
`app/(site)/dashboard/page.tsx` — `LeonixDashboardShell` `:237` → `OwnerAccountCommandCenter` `:266` wrapping `OwnerNeedsAttention` `:267`, `OwnerAccountPerformance` `:268`, `OwnerManagedEntitiesPreview` `:289`, `OwnerRecentActivity` `:296`, `OwnerBusinessGrowthEntry` `:297`. Data: `fetchDashboardNavCounts` `:23`, `fetchDerivedDashboardFeed` `:24`, `fetchDashboardAnalyticsSummary` `:25`, `fetchOwnerListingsForDashboard` `:26`.

---

## 3. CATEGORY COVERAGE PROOF

**Definitions used (traced imports/routes only, never filenames):**
- **SHARED** = renders through `OwnerEntityWorkspace` (Layer C) **and** gates on `getOwnerEntityCapabilities`.
- **SILO** = renders through a category-owned bespoke card/section that does **not** import `OwnerEntityWorkspace`.
- Several lanes are **SPLIT**: SILO at the Mis Anuncios *list* level, SHARED at the per-listing *detail* level (`/dashboard/mis-anuncios/[id]`). This is recorded explicitly — it is the single most important structural fact in this audit.

| LANE | DASHBOARD ROUTE | READER PATH | ADAPTER PATH or MISSING | EDIT ROUTE | REPUBLISH ACTION PATH | SHARED or SILO | T/F/N-A |
|---|---|---|---|---|---|---|---|
| **servicios** | `/dashboard/servicios` (dedicated) — `dashboardMisAnunciosCategories.ts:80` | `GET /api/clasificados/servicios/my-listings` — `dashboardInventory.ts:361,365`; `servicios/page.tsx:233` | `SERVICIOS_ADAPTER` `categoryRouteRegistry.ts:243` | `categoryRouteRegistry.ts:253` | MISSING (`lifecycle.republish` = `unsupported`, registry `:148`) | **SHARED** — `servicios/page.tsx:409` Frame + `:489` Workspace + `:422` caps | **TRUE** |
| **restaurantes** | `/dashboard/restaurantes` (dedicated) — `:70` | `.from("restaurantes_public_listings")` `restaurantes/page.tsx:192`,`:286`; `dashboardInventory.ts:168` | `RESTAURANTES_ADAPTER` `:174` | `:192` | MISSING (registry `:163`) | **SHARED** — `restaurantes/page.tsx:368` Frame + `:500` Workspace + `:493` caps | **TRUE** |
| **comida-local** | `/dashboard/mis-anuncios?cat=comida-local` — `:90` | `comidaLocalDashboardQueries.ts:46` `comida_local_public_listings` | `COMIDA_LOCAL_ADAPTER` `:1014` | `:1033` → `/publicar/comida-local?edit=1&listingId=` | MISSING (registry `:297`) | **SHARED** — `ComidaLocalDashboardListings.tsx:150` Workspace + `:31` caps (no Frame) | **TRUE** |
| **bienes-raices — privado/FSBO** | `/dashboard/mis-anuncios?cat=bienes-raices` — `:129` | `ownerListingsQuery.ts:90` `listings` | `BIENES_RAICES_PRIVADO_ADAPTER` `:629` | `:649` → `/dashboard/mis-anuncios/{id}/editar` | `dashboardRepublishUi.ts:16` via `mis-anuncios/page.tsx:2140` | **SPLIT** — list SILO (`LeonixRealEstateListingManageCard` `mis-anuncios/page.tsx:2154`, no Workspace import); detail SHARED (`mis-anuncios/[id]/page.tsx:777` + `:599` caps) | **PARTIAL** |
| **bienes-raices — negocio parent** | same | same | `BIENES_RAICES_NEGOCIO_ADAPTER` `:316` | `:335` | same | **SPLIT** — list SILO (`BrPropertyInventoryDashboardSection` `mis-anuncios/page.tsx:1913`); detail SHARED (`:601` caps). Uses `resolveDashboardActions` (`BrNegocioListingInventoryActions.tsx:83`) + `ownerLifecycleResolver` (`LeonixRealEstateListingManageCard.tsx:315-326`) | **PARTIAL** |
| **bienes-raices — property child** | same | same | same adapter (`isChildRole` `dashboardActionResolver.ts:28`) | `:335` (`openChildDraftId`) | same | **SILO** — child rows render only inside `BrPropertyInventoryDashboardSection`; `dashboardActionResolver.ts:102` omits Preview for BR children | **PARTIAL** |
| **rentas — privado** | `/dashboard/mis-anuncios?cat=rentas` — `:119` | `ownerListingsQuery.ts:90` | `RENTAS_PRIVADO_ADAPTER` `:756` | `:769` | MISSING; **renewal** via `listingRenewalCheckout.ts` (`mis-anuncios/page.tsx:120-122`) | **SPLIT** — list SILO (`LeonixRealEstateListingManageCard` `:2154`); detail SHARED (`:597` caps) | **PARTIAL** |
| **rentas — negocio** | same | same | `RENTAS_NEGOCIO_ADAPTER` `:696` | `:721` | same | **SPLIT** — but capability key `rentas-negocio` is **never resolved** (D1); rows evaluated as `rentas-privado` (`mis-anuncios/[id]/page.tsx:597`) | **FALSE** (D1) |
| **autos — privado** | `/dashboard/mis-anuncios?cat=autos` — `:99` | `ownerListingsQuery.ts:90` (`listings`, `category="autos"`) | `AUTOS_PRIVADO_ADAPTER` `:572` | `:584` | MISSING (registry `:187`) | **SILO** — `AutosClassifiedListingManageCard` `mis-anuncios/page.tsx:2072` (no Workspace, no caps). Caps for `autos-privado` are read only by the **dealer** section (`AutosDealerInventoryDashboardSection.tsx:355`) | **PARTIAL** |
| **autos — dealer parent** | same | `autos_classifieds_listings` `dashboardInventory.ts:214`; VM `:249` | `AUTOS_NEGOCIOS_ADAPTER` `:439` | `:453` | MISSING | **SHARED** — `AutosDealerInventoryDashboardSection.tsx:530` Workspace + `:356` caps + `:137` `resolveDashboardActions` | **TRUE** |
| **autos — dealer inventory child** | same | same | same adapter (`isChildRole`) | `:453` (`editVehicleId`) | MISSING | **SHARED** — `AutosDealerInventoryDashboardSection.tsx:411` Workspace + `:355` caps | **TRUE** |
| **empleos — premium** | `/dashboard/empleos` (dedicated) — `:109`; detail `/dashboard/empleos/[listingId]` | `.from("empleos_public_listings")` `empleos/page.tsx:123`; `dashboardInventory.ts:183` | `EMPLEOS_ADAPTER` `:812` | `:822` → `/dashboard/empleos/{id}` | MISSING (registry `:245`) | **SHARED** — `empleos/page.tsx:186` Frame + `:252` Workspace + `:71` caps; detail `[listingId]/page.tsx:311` + `:75` | **TRUE** |
| **empleos — quick** | same | same | same adapter | same | MISSING | **SHARED** — same components; `lane !== "feria"` gate for applications (`:202`, `:239`) | **TRUE** |
| **ofertas-locales** | `/dashboard/ofertas-locales` (dedicated) — **NOT in Mis Anuncios**: absent from `MIS_ANUNCIOS_CATEGORY_KEYS` `:21-35`; adapter note `categoryRouteRegistry.ts:1059-1060` | `GET /api/ofertas-locales/owner` `ofertas-locales/page.tsx:117` | `OFERTAS_LOCALES_ADAPTER` `:1064`, `dashboardRoute` `:1076` | `:1074` → `/dashboard/ofertas-locales/{id}` | MISSING; **renewal** `app/api/ofertas-locales/owner/[id]/renewal/route.ts` + `OfertasLocalesOwnerRenewalActionCenter.tsx` | **SHARED** — `ofertas-locales/page.tsx:144` Frame + `:193` Workspace + `:43` caps; detail `[id]/page.tsx:488` + `:66` | **TRUE**, *except* `dashboardActionResolver.ts` has **NO ofertas branch** (full-file read, 190 lines) |
| **comunidad / eventos** | `/dashboard/mis-anuncios?cat=comunidad` — `:167` (`ready:true` `:166`) | `ownerListingsQuery.ts:90` | `COMUNIDAD_ADAPTER` `:1201` — **`dashboardRoute: () => null` `:1215` (STALE FALSE, D4b)** | `:1213` → `/dashboard/mis-anuncios/{id}/editar`; field adapter `categoryLifecycleAdapters.ts:436` | MISSING | **SPLIT** — list SILO (`DashboardCategoryListingCard`); detail SHARED (`mis-anuncios/[id]/page.tsx:605` caps) | **PARTIAL** |
| **clases** | `/dashboard/mis-anuncios?cat=clases` — `:156` (`ready:true` `:155`) | `ownerListingsQuery.ts:90` | `CLASES_ADAPTER` `:1157` — **`dashboardRoute: () => null` `:1176` (STALE FALSE, D4b)** | `:1172`; field adapter `categoryLifecycleAdapters.ts:429` | MISSING | **SPLIT** — list SILO; detail SHARED (`:603` caps) | **PARTIAL** |
| **busco** | `/dashboard/mis-anuncios?cat=busco` — `:177` | `ownerListingsQuery.ts:90` | `BUSCO_ADAPTER` `:1103`, `dashboardRoute` `:1124` | `:1121`; field adapter `categoryLifecycleAdapters.ts:422` | MISSING | **SPLIT** — list SILO; detail SHARED (`:607` caps) | **PARTIAL** |
| **mascotas-y-perdidos** | `/dashboard/mis-anuncios?cat=mascotas` — `:192` (`ready:true` `:191`, key present `:19`,`:34`) | `ownerListingsQuery.ts:90` | `MASCOTAS_Y_PERDIDOS_ADAPTER` `:1242` — **`dashboardRoute: () => null` `:1268` (STALE FALSE, D4b)** | `:1266`; field adapter `categoryLifecycleAdapters.ts:443` | MISSING | **SPLIT** — list SILO; detail SHARED (`:609` caps) | **PARTIAL** |
| **en-venta / varios** | `/dashboard/mis-anuncios?cat=en-venta` — `:60` | `ownerListingsQuery.ts:90` | `EN_VENTA_ADAPTER` `:911` | `:932` → `/dashboard/mis-anuncios/{id}/editar`; field adapter `categoryLifecycleAdapters.ts:415`; En Venta–only description rule `editar/page.tsx:547-552` | **REAL** — `dashboardCanRepublishListingsRow` + `dashboardRepublishPrimaryKind` `mis-anuncios/page.tsx:2215-2222`; refresh `mis-anuncios/[id]/page.tsx:707-709` | **SPLIT** — list SILO (`EnVentaListingManageCard` `mis-anuncios/page.tsx:2230`); detail SHARED (`:595` caps) | **PARTIAL** |
| **viajes** | `/dashboard/viajes` (dedicated) — `:141` | `.from("viajes_staged_listings")` `viajes/page.tsx:175` + `GET /api/clasificados/viajes/staged-owner` `:241`; `dashboardInventory.ts:198` | `VIAJES_ADAPTER` `:1302` | **`editRoute: () => null` `:1333`** — registry `identity.edit: "specialized"` (`:310`); page uses its own href (`viajes/page.tsx:340`) | MISSING (registry `:315`) | **SHARED** — `viajes/page.tsx:307` Frame + `:386` Workspace + `:100` caps | **TRUE** (edit is specialized, not shared) |
| **negocios-locales** | **NO DASHBOARD ROUTE EXISTS** | — | **MISSING — no adapter** (absent from `CATEGORY_ROUTE_REGISTRY` `:1395-1413`) | — | — | **N/A** | **N-A** |

### 3.1 Mis Anuncios membership vs. bespoke dashboards — established

**IN Mis Anuncios** (`MIS_ANUNCIOS_CATEGORY_KEYS`, `dashboardMisAnunciosCategories.ts:21-35`) — **13 keys**:
`en-venta`, `restaurantes`, `servicios`, `comida-local`, `autos`, `empleos`, `rentas`, `bienes-raices`, `viajes`, `clases`, `comunidad`, `busco`, `mascotas`.

Of these, **4 have their `manageHref` pointing OUT to a dedicated dashboard** (they are tabs that *link away*, not tabs that render inline): `restaurantes`→`/dashboard/restaurantes` (`:70`), `servicios`→`/dashboard/servicios` (`:80`), `empleos`→`/dashboard/empleos` (`:109`), `viajes`→`/dashboard/viajes` (`:141`). Their rows *also* render inline as `DashboardCategoryListingCard` sections inside `mis-anuncios/page.tsx` (restaurantes `:1795`, empleos `:1858`, viajes `:1887`, servicios `:1933`) — **so these 4 categories have two owner surfaces each.**

**BESPOKE-ONLY (not in Mis Anuncios at all):** `ofertas-locales` — confirmed absent from `MIS_ANUNCIOS_CATEGORY_KEYS`; adapter comment `categoryRouteRegistry.ts:1059-1060` states it explicitly. Brief's claim **CONFIRMED TRUE**.

**NO OWNER SURFACE AT ALL:** `negocios-locales` (public pillar only — `app/(site)/negocios-locales/page.tsx` renders `NegociosLocalesClient` with `PublicPillarJsonLd`, no owner path); `iglesias` (no adapter, no route, no consumer).

**Naming trap recorded:** `app/lib/listingIdentity/businessProfileLifecycleAdapter.ts:8-11` explicitly warns the internal family name is **"Business Profile Family"**, *not* "Negocios Locales", and that `/negocios-locales` "is a separate directory product and must never be confused with this internal family grouping."

---

## 4. REFERENCE-IMPLEMENTATION RULE — every FALSE / PARTIAL cell

Per instruction: proven working reference identified **first**; no replacement engine designed.

### R1 — `rentas-negocio` capability key never resolved (FALSE / D1) — **P1**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | `bienes-raices` (privado vs. negocio lane split) |
| REFERENCE PATH | `app/(site)/dashboard/mis-anuncios/[id]/page.tsx:589` (`isBrNegocioListing(row)`) → `:599-602` branches `bienes-raices-privado` vs `bienes-raices-negocio`. Predicate: `app/clasificados/lib/leonixBrPropertyInventoryPolicy.ts` `isBrNegocioListing`, imported `:13` |
| TARGET CATEGORY PATH | `app/(site)/dashboard/mis-anuncios/[id]/page.tsx:597-598` |
| DIFFERENCE | Rentas has a real branch discriminator already loaded on the page (`parseLeonixListingContract(...).branch`, used at `mis-anuncios/page.tsx:2143` as `lx.branch` and passed to `classifyOwnerDashboardRow({ brRentasBranch: lx.branch })`). The detail page collapses both Rentas lanes to `"rentas-privado"` instead of using it. Missing wiring: one branch check. The in-code justification at `:591-592` is factually wrong (`analytics` and `specialized.activity` differ between `:222`/`:228` and `:231`). |
| ACTION | **ADOPT EXISTING** (BR's lane-split pattern, on the discriminator Rentas already computes) |

### R2 — `externalReviews` capability unreachable (FALSE / D3) — **P0**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | Community Trust on `servicios` / `restaurantes` |
| REFERENCE PATH | `app/(site)/dashboard/servicios/page.tsx:335-336` (fetch) → `:501` (`communityTrust=` prop) → `OwnerEntityWorkspace.tsx:99-105` → `OwnerEntityCommunityTrust.tsx:22`. Mirror: `restaurantes/page.tsx:234-235` → `:526` |
| TARGET CATEGORY PATH | `app/(site)/dashboard/servicios/page.tsx:489-501` and `app/(site)/dashboard/restaurantes/page.tsx:500-526` — the two `OwnerEntityWorkspace` call sites that must pass `externalReputation=` and do not |
| DIFFERENCE | Consumer half is complete and identical in shape (`OwnerEntityWorkspace.tsx:64,107-109`; `OwnerEntityExternalReputation.tsx:10,12`). Missing: the **producer** — no page maps a source row's Google/Yelp URLs into `OwnerExternalReviewLink[]`. Source data confirmed to exist for Servicios: `app/(site)/servicios/lib/resolveServiciosProfile.ts:140-148,242` (`externalReviewLinks`), typed `app/(site)/servicios/types/serviciosBusinessProfile.ts:238,403`, already mapped for the public hub at `app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts:65` (google), `:73` (yelp). Ofertas Locales has a real `yelp_url` column (`app/lib/ofertas-locales/ofertasLocalesDbSchema.ts:38,230`). |
| ACTION | **ADOPT EXISTING** for Servicios (data already resolved by `resolveServiciosProfile.ts`, mapper pattern already proven at `mapServiciosProfileToBusinessHubContact.ts:65,73`). For Restaurantes: **EVIDENCE GAP EG-2** — no equivalent Google/Yelp source field was located on `restaurantes_public_listings` in this batch; the registry's `externalReviews: "supported"` for `restaurantes` (`:158`) is **unproven** pending that sweep. |

### R3 — `dashboardRoute` zero callers across 17 adapters (D4) — **P1**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | `editRoute` / `publicRoute` / `previewRoute` on the same adapters |
| REFERENCE PATH | `app/lib/listingIdentity/dashboardActionResolver.ts:97` (`publicRoute`), `:104` (`previewRoute`), `:114` (`editRoute`), `:150,159,171,184` (`secondaryManageRoute`) — all consumed through `getCategoryRouteAdapter` `:64` |
| TARGET CATEGORY PATH | `app/lib/listingIdentity/types.ts:178` (the only reference); implementations `categoryRouteRegistry.ts:207,274,378,498,602,664,738,784,829,936,1039,1076,1124,1176,1215,1268,1335` |
| DIFFERENCE | The consuming call is simply never made. Today `manageHref` is duplicated by hand in `dashboardMisAnunciosCategories.ts:60,70,80,90,99,109,119,129,141,156,167,177,192` — 13 hardcoded string literals in a second registry. That duplication is the direct cause of D4b. |
| ACTION | **FIX REGRESSION** — the field was built to be the single source for category manage-hrefs; a parallel hardcoded list took over and drifted. Reconcile the two registries before adding any consumer. |

### R4 — `clases` / `comunidad` / `mascotas` adapters assert false Mis Anuncios absence (D4b) — **P1**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | `busco` |
| REFERENCE PATH | `app/lib/listingIdentity/categoryRouteRegistry.ts:1124` — `BUSCO_ADAPTER.dashboardRoute: (_identity, opts) => withLang("/dashboard/mis-anuncios", lang(opts))`. Busco is the structurally identical quick-ad category (`ready:true`, `manageHref` `dashboardMisAnunciosCategories.ts:177`) and correctly returns a route. |
| TARGET CATEGORY PATH | `categoryRouteRegistry.ts:1176` (clases), `:1215` (comunidad), `:1268` (mascotas) — all `() => null`, plus the false prose at `:1141-1143` and `:1288-1290` |
| DIFFERENCE | Three adapters still encode a pre-Gate-I.6B/I.8B world. `dashboardMisAnunciosCategories.ts` was corrected (`:150-158` I.6B, `:165-170` I.6B, `:186-195` I.8B) and those adapters were not. Busco shows the exact correct value. |
| ACTION | **FIX REGRESSION** — value + comment drift, one-line each, matching the `busco` precedent already in the same file |

### R5 — `en-venta`, `autos-privado`, `bienes-raices`, `rentas`, `clases`, `comunidad`, `busco`, `mascotas` list cards are SILO (PARTIAL)
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | `comida-local` (in-Mis-Anuncios category rendering through the shared workspace) |
| REFERENCE PATH | `app/lib/clasificados/comida-local/ComidaLocalDashboardListings.tsx:14` (imports `OwnerEntityWorkspace`), `:31` (`getOwnerEntityCapabilities("comida-local")`), `:127-140` (gates each action on `isLiveCapability`), `:150` (renders Workspace) — mounted from `mis-anuncios/page.tsx:1917`. Proves an inline Mis Anuncios category section CAN be fully shared. Secondary reference: `AutosDealerInventoryDashboardSection.tsx:411,530` proves parent/child inventory in the shared Workspace. |
| TARGET CATEGORY PATH | `mis-anuncios/page.tsx:2230` (`EnVentaListingManageCard`), `:2072` (`AutosClassifiedListingManageCard`), `:2154` (`LeonixRealEstateListingManageCard`, serves BR + rentas), and the `DashboardCategoryListingCard` path for clases/comunidad/busco/mascotas |
| DIFFERENCE | These four card components do **not** import `OwnerEntityWorkspace` (verified: absent from the full `OwnerEntityWorkspace` importer list) and do **not** call `getOwnerEntityCapabilities`; their action visibility is decided ad hoc per card. The per-listing detail page for the same rows IS shared (`mis-anuncios/[id]/page.tsx:777`). **Note the structural blocker:** `dashboardActionResolver.ts:8-16` deliberately excludes lifecycle mutations, so a card that needs pause/resume/archive/mark-sold buttons cannot get them from the canonical resolver today. This is a **declared scope boundary, not a regression.** |
| ACTION | **ADOPT EXISTING** for the presentation/gating half (Comida Local pattern, per card). **NET NEW** would be required only to move lifecycle *mutation* into the canonical resolver — explicitly out of scope per `dashboardActionResolver.ts:8-16`. Do not conflate the two. |

### R6 — `autos-privado` capability key read only by the dealer section (PARTIAL) — **P2**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | `comida-local` (as R5), and `autos-negocios` in the very same file |
| REFERENCE PATH | `AutosDealerInventoryDashboardSection.tsx:356` (`autos-negocios`) → `:474-514` gated actions → `:530` Workspace |
| TARGET CATEGORY PATH | `app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx`, mounted `mis-anuncios/page.tsx:2072` |
| DIFFERENCE | `autos-privado` capabilities ARE read — but at `AutosDealerInventoryDashboardSection.tsx:355`, i.e. by the **dealer** section for its own privado-lane rows. The Mis Anuncios privado card never reads them. The privado card is the gap, not the registry key. |
| ACTION | **ADOPT EXISTING** (same-file `autos-negocios` gating pattern) |

### R7 — `ofertas-locales` has no `dashboardActionResolver` branch (noted) — **P2**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **YES** |
| REFERENCE CATEGORY | `servicios` |
| REFERENCE PATH | `dashboardActionResolver.ts:117-121` (analytics branch) and `:154-162` (`manageOffers`, entitlement-gated) |
| TARGET CATEGORY PATH | `dashboardActionResolver.ts` — full 190-line file, no `ofertas_locales` branch |
| DIFFERENCE | Ofertas Locales does not currently route through `resolveDashboardActions` at all; its two pages build hrefs directly and gate on `isLiveCapability` (`ofertas-locales/page.tsx:180,188`; `[id]/page.tsx:430,446,449`). Because the adapter exists and is complete (`:1064-1090`), the branch is additive. |
| ACTION | **ADOPT EXISTING** — but **note**: `ofertas-locales` is genuinely SHARED at Layers B and C already (`:144`, `:193`, `:43`). This is a resolver-coverage gap, **not** an architecture silo. Lower priority than R1/R2. |

### R8 — `negocios-locales` has no owner surface — **N/A, not a defect**
| Field | Value |
|---|---|
| PROVEN REFERENCE EXISTS | **N/A** |
| REASON | `/negocios-locales` is a **public pillar/directory page**, not an owner-manageable entity: `app/(site)/negocios-locales/page.tsx` renders `PublicPillarJsonLd` + `NegociosLocalesClient` only. `businessProfileLifecycleAdapter.ts:8-11` explicitly forbids treating it as the internal "Business Profile Family". It correctly has no adapter, no capability key, no dashboard route. |
| ACTION | **NONE.** Do not build a dashboard for it. Recording this so a future batch does not mistake it for a gap. |

---

## 5. PER-CAPABILITY REPORT

Columns: UI EXISTS(path) · SERVER ACTION/API EXISTS(path) · DATA SOURCE(table) · CATEGORY COVERAGE · CURRENTLY WIRED (traced import) · SOURCE T/F · OWNER_QA_REQUIRED

| Capability | UI EXISTS | SERVER ACTION / API | DATA SOURCE | CATEGORY COVERAGE | CURRENTLY WIRED | T/F | OWNER_QA |
|---|---|---|---|---|---|---|---|
| **Global shell** | `components/LeonixDashboardShell.tsx:57` | `lib/dashboardNavCounts.ts` | `listings` + dedicated | ALL | every dashboard page | **T** | NO |
| **Product page frame (B)** | `components/OwnerProductPageFrame.tsx:24` | n/a (pure) | n/a | 5 pages | `empleos:186`, `ofertas:144`, `restaurantes:368`, `servicios:409`, `viajes:307` | **T** | NO |
| **Entity workspace (C)** | `components/OwnerEntityWorkspace.tsx:33` | n/a (pure) | n/a | 9 surfaces | see §2.1 | **T** | NO |
| **Capability resolver** | n/a | n/a (pure) | n/a | 16/18 keys | 10 importers §1.2 | **T** (2 keys F) | NO |
| **Route resolver** | n/a | n/a (pure) | n/a | 17 adapters | `getCategoryRouteAdapter` `dashboardActionResolver.ts:64` | **T** | NO |
| **Action resolver** | n/a | n/a (pure) | n/a | 4 pipelines w/ branches | 4 adopters §2.4 | **T** (scope-bounded `:8-16`) | NO |
| **`dashboardRoute` field** | n/a | n/a | n/a | 17 adapters | **ZERO callers** — only `types.ts:178` | **F (D4)** | NO |
| **Owner status resolver** | `lib/dashboardOwnerStatusDisplay.ts`, `lib/listingDisplayStatus.ts` | n/a | row status cols | broad | 4 + many importers | **T** | NO |
| **Owner lifecycle resolver** | n/a | n/a (pure) | n/a | BR negocio, restaurantes | `LeonixRealEstateListingManageCard.tsx:324-326`; `restaurantes/page.tsx:420-421` | **PARTIAL (D5)** | NO |
| **Entitlement status** | `lib/dashboardPackageEntitlementBadges.ts:56` | `app/api/dashboard/listing-package-entitlements/route.ts` | package/addon/placement tables | 6 (`ENTITLEMENT_ELIGIBLE_CATEGORIES` `loadPlan.ts:49-56`) | 10 importers §2.7 | **T** | **YES** — payment truth |
| **Included-capability enable** | `app/lib/listingPlans/enableIncludedCapabilityClient.ts:10` | `app/api/dashboard/enable-included-capability/route.ts` | entitlements | restaurantes coupons + | `restaurantesDashboardCouponAddonCheckout.ts:81` | **T** | **YES** |
| **Payment / billing page** | **NONE** | — | — | — | — | **N/A (EG-1)** | **YES** |
| **Attention / action center** | `components/OwnerNeedsAttention.tsx:9` | derived (no API) | derived from listing+entitlement state | account-wide | `page.tsx:267`; `mis-anuncios/page.tsx:47`; `notificaciones/page.tsx:12` | **T** | NO |
| **Analytics — account** | `components/OwnerAccountPerformance.tsx`; `analytics/page.tsx` | `app/api/dashboard/analytics/summary/route.ts:16` via `lib/fetchDashboardAnalyticsApi.ts` | `listing_analytics` | account-wide | `page.tsx:25,268` | **T** | NO |
| **Analytics — per listing** | `components/OwnerEntityPerformance.tsx`; `analytics/listing/page.tsx` | `app/api/dashboard/analytics/listing/route.ts:14` | `listing_analytics` | shared-listings lanes + autos dealer; **allow-list of 5** at `dashboardMisAnunciosCategories.ts:225` | `mis-anuncios/[id]/page.tsx:661-663`; `mis-anuncios/page.tsx:700` | **T** | NO |
| **Leads** | `servicios/page.tsx` | `GET /api/clasificados/servicios/my-leads` (`:270`) | servicios leads | **SERVICIOS ONLY** — registry `specialized.leads:"supported"` only at `:149` | `servicios/page.tsx:270` | **T** | NO |
| **Applications** | `empleos/page.tsx:202`; `[listingId]/page.tsx:239` | `app/api/clasificados/empleos/applications/**` (3 routes) | empleos applications | **EMPLEOS ONLY** (`lane !== "feria"`) | both empleos pages | **T** | NO |
| **Messages (account)** | `mensajes/page.tsx`; alias `messages/page.tsx:1-19` | direct Supabase `:134`,`:180` | `messages` + `listings` | account-wide | shell nav | **T** | NO |
| **Activity (per listing)** | `components/OwnerEntityActivity.tsx` | direct Supabase | `messages` by `listing_id` | listings-table lanes | `mis-anuncios/[id]/page.tsx:665-667` | **T** | NO |
| **Community trust** | `components/OwnerEntityCommunityTrust.tsx:22` | `GET /api/leonix-endorsements` (read-only) | endorsements | **servicios + restaurantes ONLY** | `servicios:335,501`; `restaurantes:234,526` | **T** | NO |
| **Google/Yelp reputation** | `components/OwnerEntityExternalReputation.tsx:12` | none (link render only) | Servicios `externalReviewLinks` (`resolveServiciosProfile.ts:242`); Ofertas `yelp_url` (`ofertasLocalesDbSchema.ts:38`) | registry claims servicios+restaurantes | **ZERO — no page passes `externalReputation`** | **F (D3)** | **YES** |
| **Connection hub** | **NONE in dashboard** — `git grep "ConnectionHub" origin/main -- "app/(site)/dashboard"` = 0 hits | `app/components/contact/connectionHub/sharedConnectionHubContactModel.ts:81` | — | registry marks `contactHub:"supported"` for 17/18 keys | **ZERO dashboard importers**; `buildSharedConnectionHubContact` has **zero non-self importers** (confirmed) | **F (D7)** | **YES** |
| **Media manager** | `mis-anuncios/[id]/editar/page.tsx:42,285,330-356,471,480` | Supabase Storage `listing-images` | `listings.images` (jsonb) | listings-table lanes only | `editar/page.tsx:8` (`buildProposedFinalMediaSet`) | **T** | NO |
| **Active edit (post-publish)** | `mis-anuncios/[id]/editar/page.tsx` | `applyOwnerListingPatch` (`lib/ownerListingsLifecycleClient.ts`) | `listings` | **5 categories** with field adapters (`categoryLifecycleAdapters.ts:415,422,429,436,443`); others get title/price/desc/photos only | `editar/page.tsx:24,245,264,582-583` | **T** (scope-limited) | NO |
| **Republish** | `lib/dashboardRepublishUi.ts:7,16,27` | `app/admin/_lib/classifiedsRepublishCapability.ts` | `listings.republished_at`, `republish_count` | **en-venta + BR/rentas ONLY** | `mis-anuncios/page.tsx:119,2140,2215`; `[id]/page.tsx:40,707` | **T** | **YES** |
| **Renewal (paid)** | `components/ListingRenewalAction.tsx`; `OfertasLocalesOwnerRenewalActionCenter.tsx` | `app/lib/listingLifecycle/listingRenewalCheckout.ts`; `app/api/ofertas-locales/owner/[id]/renewal/route.ts` | lifecycle config | rentas + ofertas | `mis-anuncios/page.tsx:120-122` | **T** | **YES** |
| **Inventory — autos parent/child** | `AutosDealerInventoryDashboardSection.tsx:411,530` | `lib/autosDashboardInventoryAddonCheckout.ts` | `autos_classifieds_listings` | autos dealer | `mis-anuncios/page.tsx:1911` | **T** | **YES** |
| **Inventory — BR parent/child** | `BrPropertyInventoryDashboardSection.tsx`; `BrNegocioListingInventoryActions.tsx:163-169` | `lib/bienesDashboardInventoryAddonCheckout.ts`; `lib/brDashboardLifecycleClient.ts` | `listings` (`br_inventory_*`) | BR negocio | `mis-anuncios/page.tsx:1913` | **T** | **YES** |
| **Notifications** | `notificaciones/page.tsx`; alias `notifications/page.tsx:1-16` | derived (no table) | derived feed | account-wide | `notificaciones/page.tsx:12` | **T** (derived, not stored) | NO |
| **Business tools / concierge** | `business-tools/**` (22 files) | `app/api/dashboard/business/**` (24 routes) | business profile tables | separate product | `page.tsx:15,297` | **T** | NO |

#### DEFECT D5 (P2) — `resolveLifecycleMutationDescriptors` zero adopters
`app/lib/listingIdentity/ownerLifecycleResolver.ts:550`. Sibling exports ARE adopted: `resolveOwnerFacingStatus` `:233` and `resolveAttentionState` `:276` (2 adopters each), `resolveEligibleGlobalActions` `:493` (1 adopter — `LeonixRealEstateListingManageCard.tsx:326`). `resolveLifecycleMutationDescriptors` is called by **nothing** outside the module. Consistent with `dashboardActionResolver.ts:8-16` deliberately excluding mutations — a built-but-unwired half.

#### DEFECT D6 (P3) — `businessProfileLifecycleAdapter` self-declared as unwired; declaration now stale
`businessProfileLifecycleAdapter.ts:13-14`: *"COMPLETELY UNWIRED (Gate G.2.1 scope): nothing in this file is imported by any dashboard, category adapter, or mutation path yet."* **This is now stale at `origin/main`** — it IS imported by `bienesRaicesLifecycleAdapter.ts:34` and `restaurantesLifecycleAdapter.ts:30`, both of which reach live dashboards (`LeonixRealEstateListingManageCard.tsx:53`, `restaurantes/page.tsx:34`). The code is fine; the comment is wrong. P3 (doc drift only).

#### DEFECT D7 (P1) — `contactHub` marked `supported` for 17/18 keys with zero dashboard surface
`ownerEntityCapabilityRegistry.ts` marks `contactHub: "supported"` for every key including `iglesias` (`:145,161,175,185,193,204,213,224,234,243,260,268,277,286,295,303,314,323`). `git grep -rn "ConnectionHub\|connectionHub" origin/main -- "app/(site)/dashboard"` returns **zero hits**. `OwnerEntityWorkspace` has no contact-hub section (`:80-158`). `buildSharedConnectionHubContact` (`app/components/contact/connectionHub/sharedConnectionHubContactModel.ts:81`) has **zero non-self importers** — the mission's known zero-adopter, re-confirmed at `origin/main`.
**Mitigating reading:** `contactHub` may be intended as *public-surface* truth (does the public listing show a contact hub), not an owner-dashboard section. The registry header (`:2-10`) says it is "UI CAPABILITY TRUTH" for "the shared workspace shell" — which points to owner-surface. **EVIDENCE GAP EG-3:** intent unresolved; flagged rather than adjudicated.

---

## 6. ORPHAN CHECK

Method: for every file under `app/(site)/dashboard/lib` and `app/(site)/dashboard/components` at `origin/main`, `git grep -l "<basename-without-ext>" origin/main -- app/ ":!*.md"` excluding self. Then each zero-result confirmed with a full `git grep -n` including `.md`.

### 6.1 CONFIRMED ORPHANS — zero importers anywhere in `app/`

| Module | Only occurrences at `origin/main` | Verdict |
|---|---|---|
| `app/(site)/dashboard/components/DashboardCategoryLauncherCard.tsx` | `:6` (its own `export function`) — **nothing else, not even a doc mention** | **ORPHAN — P2** |
| `app/(site)/dashboard/components/DashboardQuickActionCard.tsx` | `:6` (its own `export function`) — **nothing else** | **ORPHAN — P2** |
| `app/(site)/dashboard/components/DashboardStatsCard.tsx` | `:5` (own export); doc-only mentions `OWNER_COMMAND_CENTER_PACKAGE2_GATE2D_AUDIT.md:64`, `..._GATE3A_AUDIT.md:282` (the latter records its **removal** from Restaurantes) | **ORPHAN — P2**, explicitly de-wired by Gate 3A, file left behind |
| `app/(site)/dashboard/components/BusinessConciergeOwnerHome.tsx` | `:33` (own export); doc-only `..._FINAL_RECONCILIATION_AUDIT.md:83,109`, `..._GATE3E_AUDIT.md:67` | **ORPHAN — P1** — two audit docs at this same ref assert `/dashboard/business-tools` *uses* it. `business-tools/page.tsx` does **not** import it. **Documentation contradicts source at `origin/main`.** |

### 6.2 FUNCTIONAL ORPHANS — imported, but the render gate is never satisfied
| Module | Evidence |
|---|---|
| `app/(site)/dashboard/components/OwnerEntityExternalReputation.tsx` | Imported once (`OwnerEntityWorkspace.tsx:27`), rendered behind `externalReputation ?` (`:107`), prop passed by **zero** callers → unreachable. **D3 / P0.** |

### 6.3 Zero-adopter symbols inside adopted modules
| Symbol | Path:line | Evidence |
|---|---|---|
| `dashboardRoute` (17 implementations) | `categoryRouteRegistry.ts` (17 sites) | only `types.ts:178`. **D4** |
| `OWNER_ENTITY_CAPABILITIES["rentas-negocio"]` | `ownerEntityCapabilityRegistry.ts:230` | never resolved. **D1** |
| `OWNER_ENTITY_CAPABILITIES["iglesias"]` | `:321` | never resolved. **D2** |
| `resolveLifecycleMutationDescriptors` | `ownerLifecycleResolver.ts:550` | zero external callers. **D5** |
| `buildSharedConnectionHubContact` | `sharedConnectionHubContactModel.ts:81` | zero non-self importers (mission's known case, re-confirmed). **D7** |

### 6.4 Single-importer modules (healthy, listed for completeness)
`DashboardAutosPaidDraftsBand.tsx`, `DashboardCompactMetricStrip.tsx`, `DashboardMetricLinkCard.tsx`, `DashboardMisAnunciosCategorySelector.tsx`, `DashboardMobilePreview.tsx`, `ListingRenewalAction.tsx`, `OwnerAccountCommandCenter.tsx`, `OwnerAccountPerformance.tsx`, `OwnerBusinessGrowthEntry.tsx`, `OwnerEntityHeader.tsx`, `OwnerEntitySpecializedTools.tsx`, `OwnerManagedEntitiesPreview.tsx`, `OwnerNeedsAttention.tsx`, `OwnerRecentActivity.tsx`, `lib/businessProfileCompleteness.ts`, `lib/categoryDashboardActionContract.ts`, `lib/dashboardAttentionItems.ts`, `lib/dashboardDataContract.ts`, `lib/dashboardMisAnunciosCategoryLoadPlan.ts`, `lib/fetchOwnerEngagementDashboard.ts`, `lib/ownerAccountCommandCenter.ts`.

### 6.5 In-tree audit `.md` files shipped inside the Next.js app route tree
13 files at `app/(site)/dashboard/*.md` (`OWNER_COMMAND_CENTER_*`). Not orphans in the import sense; noted because they are the source of several stale claims contradicted above (§6.1 `BusinessConciergeOwnerHome`, D4b) and they sit inside `app/`, not `docs/`.

---

## 7. DEFECT REGISTER

| ID | Sev | Title | Evidence (`origin/main` = `a0a47839`) | Action |
|---|---|---|---|---|
| **D3** | **P0** | `externalReviews` capability unreachable — Google/Yelp panel never renders for any category, yet registry marks it `supported` for servicios + restaurantes | `ownerEntityCapabilityRegistry.ts:143,158` vs. `externalReputation` prop passed by zero callers (`OwnerEntityWorkspace.tsx:39,64,107,108` are the only 4 occurrences in `app/`) | ADOPT EXISTING (R2) |
| **D1** | **P1** | `rentas-negocio` capability key zero-adopter; Rentas Negocio rows evaluated with Rentas Privado capabilities, rendering analytics + activity the registry calls `unsupported` | `mis-anuncios/[id]/page.tsx:591-598, 617-618`; registry `:222,228` vs `:231` | ADOPT EXISTING (R1) |
| **D4** | **P1** | `dashboardRoute` implemented 17× with zero callers | `categoryRouteRegistry.ts` 17 sites vs. sole reference `types.ts:178` | FIX REGRESSION (R3) |
| **D4b** | **P1** | clases/comunidad/mascotas adapters assert (in value + prose) that they are absent from Mis Anuncios — false at this ref | `categoryRouteRegistry.ts:1176,1215,1268,1141-1143,1288-1290` vs. `dashboardMisAnunciosCategories.ts:19,34,155-156,166-167,191-192` | FIX REGRESSION (R4) |
| **D7** | **P1** | `contactHub: "supported"` on 17/18 keys with zero dashboard connection-hub surface; `buildSharedConnectionHubContact` zero importers | registry 18 sites; zero `ConnectionHub` hits under `app/(site)/dashboard`; `sharedConnectionHubContactModel.ts:81` | RESOLVE INTENT (EG-3) then correct registry or build surface |
| **O1** | **P1** | `BusinessConciergeOwnerHome.tsx` orphan while two in-tree audit docs claim it is wired | `components/BusinessConciergeOwnerHome.tsx:33` only; `..._GATE3E_AUDIT.md:67`, `..._FINAL_RECONCILIATION_AUDIT.md:83,109` | Verify intent; de-document or wire |
| **D2** | **P2** | `iglesias` zero-adopter key (honest placeholder, self-documented `:318-320`) | registry `:321-324`; no adapter in `:1395-1413` | Accept or remove |
| **D5** | **P2** | `resolveLifecycleMutationDescriptors` zero adopters | `ownerLifecycleResolver.ts:550` | Accept (matches `dashboardActionResolver.ts:8-16` boundary) |
| **O2** | **P2** | 3 orphan components: `DashboardCategoryLauncherCard`, `DashboardQuickActionCard`, `DashboardStatsCard` | §6.1 | Delete or wire |
| **D6** | **P3** | `businessProfileLifecycleAdapter.ts:13-14` "COMPLETELY UNWIRED" is stale — 2 importers reach live dashboards | `bienesRaicesLifecycleAdapter.ts:34`; `restaurantesLifecycleAdapter.ts:30` | Correct comment |

---

## 8. EVIDENCE GAPS (explicit — not guesses)

| ID | Gap | Why unresolved |
|---|---|---|
| **EG-1** | Whether any billing / invoice / payment-method surface exists **outside** `app/(site)/dashboard/` | No billing route exists in the dashboard tree (148 entries enumerated). A repo-wide billing sweep was out of this batch's scope. |
| **EG-2** | Whether `restaurantes` has any real Google/Yelp source field | Servicios' source is proven (`resolveServiciosProfile.ts:242`; `serviciosBusinessProfile.ts:238,403`; mapper `mapServiciosProfileToBusinessHubContact.ts:65,73`) and Ofertas' `yelp_url` is proven (`ofertasLocalesDbSchema.ts:38,230`). No equivalent located on `restaurantes_public_listings`. Registry's `externalReviews:"supported"` at `:158` is therefore **unproven**, not proven-false. |
| **EG-3** | Whether `contactHub` denotes an **owner-dashboard** section or **public-listing** truth | Registry header `:2-10` says "the shared workspace shell" (owner-surface reading), but no owner surface exists and no owner surface is referenced. Ambiguous; adjudication needs the Master Blueprint, not the source. |
| **EG-4** | Runtime behaviour of every gate above | This is a **static** trace (imports, routes, props). No build, test, or runtime execution was performed. Every "renders / never renders" claim is a static-reachability claim. |
| **EG-5** | Whether the 4 dual-surface categories (restaurantes, servicios, empleos, viajes — inline Mis Anuncios section **and** dedicated dashboard, §3.1) are intentional or a migration remnant | Both surfaces are live and traced (`mis-anuncios/page.tsx:1795,1858,1887,1933` + dedicated routes). Intent not determinable from source. |
| **EG-6** | Ofertas Locales owner API internals | `GET /api/ofertas-locales/owner` traced as the reader (`ofertas-locales/page.tsx:117`); the route file's own table/ownership logic was not read in this batch. |
| **EG-7** | `iglesias` public surface | Registry claims `identity.publicView:"supported"` + `contactHub:"supported"` (`:322-323`). No public-side verification performed — outside dashboard scope. |

---

## 9. SUMMARY VERDICT

1. The Owner Command Center has a **genuine, adopted three-layer architecture** (`LeonixDashboardShell` → `OwnerProductPageFrame` → `OwnerEntityWorkspace`) with 9 real Layer-C adopters and a **16/18-adopted** capability registry. It is **not** a paper architecture.
2. **The dominant structural fact is the LIST/DETAIL SPLIT.** Every dedicated-table category (servicios, restaurantes, comida-local, empleos, viajes, ofertas-locales, autos-dealer) is fully SHARED. Every `listings`-table category (en-venta, autos-privado, bienes-raices, rentas, clases, comunidad, busco, mascotas) is **SILO at the Mis Anuncios list level and SHARED at the per-listing detail level.** 8 of 21 lane-rows are PARTIAL for this single reason.
3. The proven reference for closing the list-level gap already exists in-repo and in the same render tree: **`ComidaLocalDashboardListings.tsx:14,31,127-140,150`**. Every FALSE/PARTIAL cell in §4 resolves to **ADOPT EXISTING** or **FIX REGRESSION**. **No NET NEW engine is required anywhere** — the one place NET NEW would apply (lifecycle mutation in the canonical action resolver) is a **declared, documented scope boundary** (`dashboardActionResolver.ts:8-16`), not a defect.
4. **One P0**: the Google/Yelp external-reputation capability is declared `supported` for two categories and is unreachable in the product (D3).
5. **Five P1s**: D1 (`rentas-negocio` zero-adopter + wrong-lane capability evaluation), D4 (`dashboardRoute` 17× zero-caller), D4b (three adapters asserting stale-false Mis Anuncios absence), D7 (`contactHub` 17× with no surface), O1 (`BusinessConciergeOwnerHome` orphan contradicted by two in-tree audit docs).
6. **A recurring pattern, now documented three times in this audit** (D4b, D6, O1): **in-tree `.md` audit artifacts and source comments assert wiring truth that the source at `origin/main` contradicts.** Prose in this repo is not evidence. Every claim in this report is backed by a `git grep`/`git show` against `a0a47839`.
