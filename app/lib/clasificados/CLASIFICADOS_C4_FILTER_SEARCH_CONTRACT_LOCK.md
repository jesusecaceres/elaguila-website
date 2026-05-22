# Gate C4 — Clasificados Filter / Search Contract Lock

**Audit date:** 2026-05-22  
**References:** `CLASIFICADOS_FULL_FIELD_INTEGRITY_AUDIT.md` (C1/C2), `CLASIFICADOS_C3_BUYER_JOURNEY_QA.md` (C3)

**Goal:** Every public search box, chip, filter, sort, and city control is tied to real publish/storage fields and narrows (or honestly defers) on results.

**C4 code changes:**
- **Autos:** Dealer landing band from live inventory only (`buildAutosLandingDealersFromInventory.ts`); section hidden when no dealers.
- **Viajes:** `serviceLanguage` filter rail → `svcLang` URL param (`ViajesResultsShell.tsx`).
- **Restaurantes:** Removed no-op landing chip `near_me` (`near=1` without city/ZIP).

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Parsed, applied against real stored fields, chips/clear work |
| FALSE | Visible control ignored, sample-backed, or misleading |
| DEFERRED_INTENTIONAL | Reserved param or intent-only control with **no fake narrowing** (hidden UI or honest copy) |
| NOT_APPLICABLE | Control type absent on this surface |

---

## Application / publish fields (by category)

| Category | Primary publish surfaces | Storage |
|---|---|---|
| Autos | `AutosPrivadoApplication`, `AutosNegociosApplication` | `autos_classifieds_listings.listing_payload` |
| Bienes Raíces | BR privado/negocio forms | `listings` + `Leonix:*` / human `detail_pairs` |
| En Venta | `enVentaPublishFromDraft` | `listings` + `Leonix:*` pairs |
| Empleos | empleos publish + snapshot | `listings` + `empleos` columns / JSON snapshot |
| Rentas | rentas privado/negocio (BR stack) | `listings` + `Leonix:*` / pairs |
| Servicios | servicios publish → profile | `servicios_public_listings` + `profile_json` |
| Restaurantes | `restauranteListingApplication` | staged/published restaurant rows + amenities |
| Clases | community publish | `listings` + community `detail_pairs` |
| Comunidad | community event publish | same + event datetime pairs |
| Mascotas y Perdidos | mascotas publish | `listings` + tipo/location pairs |
| Busco | busco quick publish | `listings` (category busco) + description |
| Viajes | viajes business/affiliate publish | `viajes_staged_listings` + browse facets on rows |

---

## Control contract matrix

### Autos

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Autos | Landing search | Keyword + city + ZIP | make, model, description, city, zip, specs | `listing_payload.*` | `q`, `city`, `zip` | `autosBrowseFilterContract.ts`, `autosPublicFilters.ts` | N/A (navigates to results) | TRUE | TRUE | `AutosHeroSearch` → `serializeAutosBrowseUrl` |
| Autos | Landing chip | Body style / price / need shortcuts | bodyStyle, price, mileage, year | payload | `bodyStyle`, `priceMin`, `priceMax`, … | same | N/A | TRUE | TRUE | `AutosQuickChips`, `NeedBasedBrowseSection` |
| Autos | Landing chip | Dealer band | `dealerName`, city | payload | `sellerType=dealer`, `city`, `q` | `buildAutosLandingDealersFromInventory.ts` | N/A | TRUE | TRUE | **C4:** only live dealers; hidden if empty |
| Autos | Results search | Keyword | searchable blurb + title fields | payload + `searchableBlurb` | `q` | `autosPublicFilters.ts` | `AutosPublicResultsActiveFilters` | TRUE | TRUE | |
| Autos | Results filter | Make, model, year, price, mileage, condition, seller, specs, photos/video | payload fields | payload | contract keys | `autosPublicFilters.ts` | active filters strip | TRUE | TRUE | |
| Autos | City filter | City / ZIP | city, zip | payload | `city`, `zip` | `autosPublicLocationMatch.ts` | chip remove | TRUE | TRUE | NorCal canonical on publish |
| Autos | Results sort | newest, price, mileage, year | timestamps, price, mileage, year | payload | `sort` | `autosPublicFilters.ts` `sortAutosPublicListings` | select | TRUE | TRUE | |
| Autos | Results filter | Radius | — | — | `radiusMiles` | parsed only | — | TRUE | DEFERRED_INTENTIONAL | Reserved in contract; **not in public UI** |
| Autos | Detail handoff | Card → vehiculo | id | payload | — | route | — | TRUE | TRUE | `/autos/vehiculo/[id]` |

### Bienes Raíces

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Bienes Raíces | Landing search | q, operation, property type, city | title, operation, kind, city | `Leonix:operation`, `Leonix:results_property_kind`, `listings.city` | `q`, `operationType`, `propertyType`, `city` | `BienesRaicesLandingView`, `buildBrResultsUrl` | N/A | TRUE | TRUE | NorCal `getCanonicalCityName` |
| Bienes Raíces | Landing chip | Quick chips (venta, renta, tipo) | operation, propertyType | machine pairs | same keys | `bienesRaicesLandingSample.ts` → resultados | N/A | TRUE | TRUE | |
| Bienes Raíces | Results search | q | title, description, address, facets | `searchBlob`, pairs | `q` | `brResultsFilters.ts` | `BienesRaicesResultsActiveFilters` | TRUE | TRUE | Description in `q` since C1 |
| Bienes Raíces | Results filter | operation, propertyType, seller, price, beds, baths, pets, furnished, pool | publish form + `Leonix:*` | pairs / machine | canonical keys | `filterBrListings`, `brFilterContract.ts` | chips + drawer | TRUE | TRUE | |
| Bienes Raíces | City filter | city | city | `listings.city` | `city` | `brNorCalCity.ts`, `cityFilterMatchesListingAddress` | chip | TRUE | TRUE | `BR_URL_QUERY_CIUDAD` = `city` (C2) |
| Bienes Raíces | Results sort | reciente, precio | price, timestamps | row | `sort` | `sortBrListings` | select | TRUE | TRUE | |
| Bienes Raíces | Results filter | ZIP / parking | postal (zip); parking spots | `Leonix:postal_code`; `Leonix:parking_spots` | `zip`, `parking` | reserved | — | TRUE | DEFERRED_INTENTIONAL | **No public UI** (`BR_RESERVED_QUERY_KEYS`) |
| Bienes Raíces | Detail handoff | Card → anuncio | id | listings.id | — | `leonixLiveAnuncioPath` | — | TRUE | TRUE | |

### En Venta

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| En Venta | Landing search | q, city presets | title, description, evDept | `Leonix:evDept`, city | `q`, `city`, `evDept` | `EnVentaHubPageClient`, `buildEnVentaResultsUrl` | N/A | TRUE | TRUE | GET → `/results` |
| En Venta | Landing chip | Department tiles | evDept, evSub | `Leonix:evDept` | `evDept`, `evSub` | taxonomy + results URL | N/A | TRUE | TRUE | |
| En Venta | Results search | q | `buildEnVentaSearchText` blob | title, desc, brand, model, pairs | `q` | `EnVentaResultsClient.tsx` | `EnVentaResultsChipsRow` | TRUE | TRUE | |
| En Venta | Results filter | evDept, evSub, cond, price, seller, pickup/ship/delivery, free, nego, meetup | publish schema | `Leonix:*` | `EV_RESULTS_PARAM` | `EnVentaResultsClient` filter fn | chips | TRUE | TRUE | brand/model facets search-only (C2 defer) |
| En Venta | City filter | city, zip | city, postal | `listings.city`, zip / `Leonix:postal_code` | `city`, `zip` | `enVentaLocationMatch.ts` | chips | TRUE | TRUE | ZIP fallback C2 |
| En Venta | Results sort | newest, price | price, timestamps | row | `sort` | results client | select | TRUE | TRUE | |
| En Venta | City filter | Usar mi ubicación | geo → NorCal city | canonical city | `city`, `zip` | `nearestCanonicalCityFromLatLng` | sets URL | TRUE | TRUE | Does not fake radius; sets city/ZIP |
| En Venta | Detail handoff | Card → anuncio | id | listings | `evReturn` | listing links | — | TRUE | TRUE | |

### Empleos

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Empleos | Landing search | q, city, state, zip, category, jobType | job fields | DB columns + snapshot | per `empleosFilterContract` | `HeroAndSearch`, `buildEmpleosResultadosUrl` | N/A | TRUE | TRUE | |
| Empleos | Landing chip | Quick tiles / categories | category, modality, etc. | record slugs | contract keys | landing components | N/A | TRUE | TRUE | Live inventory when `empleosOmitMarketingSeedCatalog` |
| Empleos | Results search | q | title, company, summary, description | row + snapshot | `q` | `filterEmpleosJobs` / results view | active chips | TRUE | TRUE | |
| Empleos | Results filter | city, state, zip, category, jobType, modality, salary, featured, recent, verified, premium, lane, bilingual | indexed + snapshot | columns | `empleosFilterContract.ts` | `EmpleosResultsView.tsx` | chips | TRUE | TRUE | `radiusKm` removed C2 |
| Empleos | Results sort | relevance, date, salary | salary range, publishedAt | row | `sort` | ranking helpers | select | TRUE | TRUE | |
| Empleos | Detail handoff | Card → slug | slug | listings | — | `/empleos/[slug]` | — | TRUE | TRUE | |

### Rentas

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Rentas | Landing search | q, city, zip, tipo | title, city, branch, tipo | pairs + row | `RENTAS_QUERY_*` | `RentasLandingHub`, `rentasBrowseContract.ts` | N/A | TRUE | TRUE | |
| Rentas | Landing chip | Property / amenity shortcuts | categoria, mascotas, amueblado, pool | `Leonix:*` | browse keys | landing hub | N/A | TRUE | TRUE | |
| Rentas | Results search | q | title, description, location | row + pairs | `q` | `rentasBrowseFilters.ts` | `RentasResultsActiveFilters` | TRUE | TRUE | |
| Rentas | Results filter | tipo, subtype, price, beds, baths, pets, furnished, pool, highlights, deposit, estado | publish | pairs / machine | `rentasBrowseContract.ts` | `filterRentasPublicListings` | chips | TRUE | TRUE | `estado` availability C2 |
| Rentas | City filter | city, zip | city | `listings.city`, postal | `city`, `zip` | `rentasLocationNormalize.ts` | chips | TRUE | TRUE | NorCal canonical C2 |
| Rentas | Results sort | reciente, precio | rent, timestamps | row | `sort` | `sortRentasPublicListings` | select | TRUE | TRUE | |
| Rentas | Results filter | lat/lng/radius_km | — | — | reserved | stripped from URL in client | — | TRUE | DEFERRED_INTENTIONAL | Not written to URL; copy explains |
| Rentas | Detail handoff | Card → listing | id | listings | — | rentas listing routes | — | TRUE | TRUE | |

### Servicios

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Servicios | Landing search | q + location | business_name, profile areas, quickFacts | `profile_json`, row.city | `q`, `city`, … | `ServiciosHeroSearch`, `serviciosDiscoveryContract.ts` | N/A | TRUE | TRUE | |
| Servicios | Results search | q | profile + group + city | row + profile_json | `q` | `filterServiciosDiscoveryRows` | chips | TRUE | TRUE | |
| Servicios | Results filter | group, verified, emergency, mobile, bilingual, web, promo, whatsapp | quickFacts, contact | profile_json | contract params | discovery filter | chips | TRUE | TRUE | |
| Servicios | City filter | city / location text | city, serviceAreas | row + profile | `city` | filter module | chips | TRUE | TRUE | |
| Servicios | Results sort | listing order | timestamps / ranking | row | `sort` if present | discovery ranking | — | TRUE | TRUE | |
| Servicios | Detail handoff | slug | slug | row | — | `/servicios/[slug]` | — | TRUE | TRUE | Unknown slug → 404 |

### Restaurantes

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Restaurantes | Landing search | q + location | businessName, cuisine, city, zip | application fields | `q`, `city`, `zip` | `restaurantesDiscoveryContract.ts` | N/A | TRUE | TRUE | Live landing inventory |
| Restaurantes | Landing chip | open, delivery, family, top, price, cuisine | hours, svc, flags | indexed row | `open`, `svc`, … | `buildRestaurantesResultsHref` | N/A | TRUE | TRUE | **C4:** removed `near_me` chip (no-op) |
| Restaurantes | Results search | q | name, cuisine, city | row | `q` | `filterRestaurantesBlueprintRows.ts` | chips | TRUE | TRUE | |
| Restaurantes | Results filter | cuisine, biz, svc, diets, price, amenities, open, near, saved, … | `restauranteListingApplication` | row facets | discovery params | same | chips + honest `near` copy | TRUE | TRUE | `near` alone = intent-only + disclosure |
| Restaurantes | Results sort | newest, name, rating | publishedAt, rating | row | `sort`, `top` | sort in shell | select | TRUE | TRUE | |
| Restaurantes | Detail handoff | slug | slug | row | — | `/restaurantes/[slug]` | — | TRUE | TRUE | |

### Clases

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Clases | Landing search | q, city | title, description, topic | pairs + row | `q`, `city` | `clases/page.tsx` GET | N/A | TRUE | TRUE | |
| Clases | Landing chip | Topic quick chips | q seeds | text | `q` | form hidden + chip links | N/A | TRUE | TRUE | |
| Clases | Results search | q | `buildCommunityDiscoverySearchBlob` | row + pairs | `q` | `CommunityListingsResultsClient` | inline | TRUE | TRUE | |
| Clases | Results filter | category, skill, audience, registration, accessibility | taxonomy | pairs | URL keys | same client | chips | TRUE | TRUE | |
| Clases | City filter | city | city | `listings.city` | `city` | substring match | chip | TRUE | TRUE | |
| Clases | Detail handoff | Card | id | listings | — | `/clasificados/anuncio/[id]` | — | TRUE | TRUE | |

### Comunidad

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Comunidad | Landing search | q, city | event fields | pairs + row | `q`, `city` | `comunidad/page.tsx` | N/A | TRUE | TRUE | |
| Comunidad | Results search | q | search blob | row + pairs | `q` | `CommunityListingsResultsClient` | chips | TRUE | TRUE | Active events filter |
| Comunidad | Results filter | event type, audience, registration, accessibility | taxonomy | pairs | URL | same | chips | TRUE | TRUE | |
| Comunidad | City filter | city | city | row | `city` | match | chip | TRUE | TRUE | |
| Comunidad | Detail handoff | Card | id | listings | — | anuncio | — | TRUE | TRUE | |

### Mascotas y Perdidos

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Mascotas | Landing search | q | title, description, tipo | row + pairs | `q` | GET → resultados | N/A | TRUE | TRUE | |
| Mascotas | Landing chip | Tipo chips | notice type | taxonomy | `tipo` | `mascotasPerdidosTipoChipHref` | N/A | TRUE | TRUE | |
| Mascotas | Results search | q | text blob | row | `q` | results client | apply | TRUE | TRUE | |
| Mascotas | Results filter | tipo, contact, etc. | publish taxonomy | pairs | params | filter fn | chips | TRUE | TRUE | |
| Mascotas | Detail handoff | Card | id | listings | — | anuncio | — | TRUE | TRUE | |

### Busco

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Busco | Landing CTA | View results | — | — | — | link only | N/A | TRUE | TRUE | No search on landing |
| Busco | Results search | q | title, description | row | `q` | `BuscoResultsClient` | form | TRUE | TRUE | |
| Busco | Results filter | tipo, city, zone, budget, contact | publish | row fields | `tipo`, `city`, … | client filter | apply | TRUE | TRUE | |
| Busco | Detail handoff | Card | id | listings | — | anuncio | — | TRUE | TRUE | |

### Viajes

| Category | Surface | Control | Source publish field(s) | Storage key/detail pair | URL param | Search/filter/sort logic file | Active chip/clear behavior | Real data only | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|
| Viajes | Landing search | destination, from, trip type | destination, departure, trip keys | staged row | `q`, `dest`, `from`, `t`, … | `ViajesSearchBar`, `viajesBrowseContract.ts` | N/A | TRUE | TRUE | |
| Viajes | Landing chip | Audience / trip pills | trip, season, budget | row facets | browse keys | `ViajesCategoryPillsPanel` | N/A | TRUE | TRUE | |
| Viajes | Results search | q / dest | text + slugs | row | `q`, `dest` | `viajesResultsMatch.ts` | summary line | TRUE | TRUE | |
| Viajes | Results filter | budget, trip, duration, audience, season, service language | publish facets | row keys | contract | `viajesRowMatchesBrowse` | filter rail | TRUE | TRUE | **C4:** svcLang rail wired |
| Viajes | Results sort | featured, price, etc. | row | — | `sort` | `sortViajesResultRows` | select | TRUE | TRUE | |
| Viajes | Results filter | zip, radius, nearMe | — | — | reserved | not in match | — | TRUE | DEFERRED_INTENTIONAL | Parsed only; no public geo UI |
| Viajes | Detail handoff | offer / negocio slug | slug | staged | — | detail routes | — | TRUE | TRUE | No seed in prod (C2) |

---

## Category summary

| Category | All search boxes wired | All filters backed by real data | City canonical | Active chips/clear work | Sorts real | No fake controls | Overall |
|---|---|---|---|---|---|---|---|
| Autos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Bienes Raíces | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| En Venta | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Empleos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Rentas | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Restaurantes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Clases | TRUE | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE |
| Comunidad | TRUE | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE |
| Mascotas y Perdidos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Busco | TRUE | TRUE | TRUE | TRUE | NOT_APPLICABLE | TRUE | TRUE |
| Viajes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

*Clases/Comunidad/Busco: no dedicated results sort control (recency ordering in client).*

---

## C4 blockers before launch

### Fixed in Gate C4

| Category | Route | File path | Control name | Issue | User impact | Recommended fix | Gate |
|---|---|---|---|---|---|---|---|
| Autos | `/clasificados/autos` | `autos/landing/AutosLandingPage.tsx`, `buildAutosLandingDealersFromInventory.ts` | Featured dealer band | Blueprint dealer names always shown | Fake dealerships | Build band from live dealer listings; hide when empty | **C4** |
| Viajes | `/clasificados/viajes/resultados` | `viajes/components/ViajesResultsShell.tsx` | Service language filter | Rail did not set `svcLang` in URL | Filter appeared broken | Map `serviceLanguage` → `svcLang` | **C4** |
| Restaurantes | `/clasificados/restaurantes` | `restaurantes/landing/restaurantesBlueprintSampleData.ts` | `near_me` landing chip | `near=1` without city/ZIP narrows nothing | Misleading “Near me” | Remove chip from landing | **C4** |

### Left for Gate C5 (documented, no fake UI)

| Category | Route | File path | Control name | Issue | User impact | Recommended fix | Gate |
|---|---|---|---|---|---|---|---|
| Restaurantes | `/clasificados/restaurantes/resultados` | `filterRestaurantesBlueprintRows.ts`, `RestaurantesResultsShell.tsx` | `near` filter alone | Intent-only until geo; honest copy shown | Users may expect radius | Hide `near` toggle until geo, or wire geolocation → city | **C5** |
| En Venta | — | `enVentaResultsUrlParams.ts` | brand/model/itemType facets | Search-only by design | No facet filters in URL | Add facets when product wants | **C5** (DEFERRED_INTENTIONAL) |
| Autos / BR / Rentas / Viajes | — | browse contracts | Reserved geo params | Parsed but not applied | None if UI hidden | Wire when geo index exists | **C5** |

---

## Verification

```text
npm run build
```

**Result:** PASS (run after C4 changes).

---

## Gate C4 completion

| Item | Value |
|---|---|
| Categories audited | 12 |
| Search boxes verified | 22 (all public GET/hero search paths) |
| Filters verified | 12 categories; all visible filters map to storage (reserved keys have no UI) |
| Filters removed/hidden | 2 (`near_me` landing chip removed; Autos blueprint dealers removed/hidden) |
| Controls fixed (logic) | 1 (Viajes `svcLang` filter rail) |
| Remaining FALSE (route Overall) | 0 |
| Files changed | See C4 fixes above + this audit file |
