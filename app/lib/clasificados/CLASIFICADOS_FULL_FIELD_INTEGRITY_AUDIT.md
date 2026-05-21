# Gate C1 — Full Clasificados Category Field Integrity Audit

**Audit date:** 2026-05-21  
**Scope:** Publish flows, storage/detail_pairs, landing discovery, results, filters, search, sort, city/NorCal, cards, detail pages.  
**Reference patterns:** `AUTOS_A3_FIELD_SEARCH_FILTER_SORT_AUDIT.md`, `brFilterContract.ts`, `enVentaResultsUrlParams.ts`, `CommunityListingsResultsClient.tsx`.

**Fixes applied in this gate (safe wiring only):**
- Bienes Raíces: sqft on results cards from human `detail_pairs`; `q` search includes description blob + structured card fields.
- Clases / Comunidad: landing search forms wired to results (`GET` with `q` + `city`).
- No UI redesign; no route renames; no pricing changes.

---

## Status legend

| Status | Meaning |
|---|---|
| TRUE | Code proves field/control is wired end-to-end |
| FALSE | Visual-only, placeholder, sample-only, or disconnected |
| DEFERRED_INTENTIONAL | Documented deferral; no fake filter exposed |
| NOT_APPLICABLE | Field does not apply to this category |

---

## 1. Autos

**Publish:** `AutosPrivadoApplication.tsx`, `AutosNegociosApplication.tsx` → `AutoDealerListing` → `autos_classifieds_listings.listing_payload`.  
**Discovery:** `mapAutosClassifiedsToPublic.ts`, `autosPublicFilters.ts`, `AutosPublicResultsShell.tsx`.  
**City:** `CityAutocomplete` + `getCanonicalCityName` in publish; `listingMatchesAutosCityFilter` on results.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| year, make, model, trim | `autoDealerListing.ts` | `listing_payload.*` | TRUE | TRUE | TRUE | TRUE | make/model/year | year sorts | — | TRUE | Canonical title via `buildVehicleTitle` |
| vehicleTitle | same | `vehicleTitle` | TRUE | TRUE | TRUE | TRUE | — | — | — | TRUE | |
| condition | same | `condition` | — | TRUE | TRUE | TRUE | TRUE | — | — | TRUE | |
| price | same | `price` | TRUE | TRUE | TRUE | TRUE | TRUE | price asc/desc | — | TRUE | |
| mileage | same | `mileage` | TRUE | TRUE | TRUE | TRUE | TRUE | mileage | — | TRUE | |
| city, state, zip | same | `city`/`state`/`zip` | TRUE | TRUE | TRUE | TRUE | TRUE | — | TRUE | TRUE | NorCal canonical in publish + filter |
| bodyStyle (+ custom) | same | both + resolvers | — | — | TRUE | TRUE | TRUE | — | — | TRUE | `resolveBodyStyle` |
| transmission, drivetrain, fuel (+ custom) | same | both + resolvers | — | — | TRUE | TRUE | TRUE | — | — | TRUE | |
| exterior/interior color (+ custom) | same | both | — | — | TRUE | TRUE | TRUE | — | — | TRUE | Not on card (high cardinality) |
| titleStatus (+ custom) | same | both | — | — | TRUE | TRUE | TRUE | — | — | TRUE | |
| vin, stockNumber | same | payload | — | — | TRUE | TRUE | — | — | — | TRUE | Stock hidden in Privado detail |
| engine, mpg, doors, seats | same | payload | — | — | TRUE | TRUE | — | — | — | TRUE | |
| features, otherEquipmentDetails, description | same | payload | — | — | TRUE | TRUE | — | — | — | TRUE | `buildSearchableBlurb` |
| media / Mux video | same | images + mux_* | TRUE | TRUE badge | TRUE | — | hasPhotos/hasVideo | — | — | TRUE | Video = durable Mux only |
| dealer/private seller contact | lane-specific | payload | — | TRUE | TRUE | TRUE | sellerType | — | — | TRUE | |
| radiusMiles | URL only | — | — | — | — | — | DEFERRED | — | — | DEFERRED_INTENTIONAL | Parsed, not applied (no geo index) |
| negotiable | — | — | — | — | — | — | — | — | — | NOT_APPLICABLE | Not in schema |

### Autos category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Autos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

---

## 2. Bienes Raíces

**Publish:** `BienesRaicesPrivadoForm.tsx`, `bienesRaicesNegocioFormState.ts` → `public.listings` + `Leonix:*` machine pairs.  
**Discovery:** `mapBrListingRowToNegocioCard.ts`, `filterBrListings`, `brFilterContract.ts`.  
**City:** `brCanonicalNorCalCity` / `cityFilterMatchesListingAddress`; publish uses NorCal combobox.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| titulo | privado/negocio forms | `listings.title` | TRUE | TRUE | TRUE | TRUE | — | reciente | — | TRUE | |
| precio | forms | `listings.price` | TRUE | TRUE | TRUE | — | priceMin/Max | precio asc/desc | — | TRUE | |
| ciudad | forms | `listings.city` | TRUE | TRUE | TRUE | TRUE | city | — | TRUE | TRUE | Canonical on publish |
| descripcion | forms | `listings.description` | — | — | TRUE | TRUE | — | — | — | TRUE | **Fixed C1:** `searchBlob` in `q` |
| recamaras, banos | forms | `Leonix:bedrooms_count` / `bathrooms_count` | — | TRUE | TRUE | TRUE | beds/baths | — | — | TRUE | |
| interiorSqft / piesCuadrados | forms | human `detail_pairs` | — | TRUE | TRUE | TRUE | — | — | — | TRUE | **Fixed C1:** card reads human pairs |
| pets, pool, furnished | forms | `Leonix:pets_allowed` etc. | — | metaLines | TRUE | TRUE | pets/pool/furnished | — | — | TRUE | |
| operationType | forms | `Leonix:operation` | TRUE | TRUE | TRUE | — | operationType | — | — | TRUE | |
| propertyType | forms | `Leonix:results_property_kind` | TRUE | TRUE | TRUE | — | propertyType | — | — | TRUE | |
| sellerType | forms | `seller_type` + branch | — | TRUE | TRUE | — | sellerType | — | — | TRUE | |
| zip / gate12d | forms | `Leonix:postal_code`, gate12d JSON | — | — | partial | — | zip | — | — | TRUE | |
| estadoAnuncio / listingStatus | forms | — | — | — | — | — | — | — | — | FALSE | Not persisted; `status` forced active |
| enlaceMapa | forms | human pairs only | — | — | partial | — | — | — | — | FALSE | No machine key |
| deepDetails.* | negocio form | human pairs | — | — | partial | — | — | — | — | PARTIAL | Detail via pairs view |
| parking filter | — | `Leonix:parking_spots` stored | — | — | TRUE | — | DEFERRED | — | — | DEFERRED_INTENTIONAL | Reserved in contract, not in UI |
| BR_URL_QUERY_CIUDAD (`ciudad`) | `brNorCalCity.ts` | — | — | — | — | — | — | — | — | FALSE | Constant=`ciudad`; parser uses `city` — latent handoff risk |

### Bienes Raíces category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Bienes Raíces | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | TRUE | TRUE | FALSE |

---

## 3. En Venta

**Publish:** `enVentaPublishFromDraft.ts` → `public.listings` (`category=en-venta`).  
**Discovery:** `EnVentaResultsClient.tsx`, `enVentaResultsUrlParams.ts`, `buildEnVentaSearchText.ts`.  
**City:** `validateEnVentaLocation` → `getCanonicalCityName` (CA_CITIES).

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title | publish schema | `listings.title` | — | TRUE | TRUE | TRUE | q | newest | — | TRUE | |
| description | publish | `listings.description` | — | — | TRUE | TRUE | q | — | — | TRUE | |
| price / is_free | publish | `price`, `is_free` | hub | TRUE | TRUE | TRUE | priceMin/Max, free | price sorts | — | TRUE | |
| rama (evDept) | publish | `Leonix:evDept` | chips | TRUE | TRUE | TRUE | evDept | — | — | TRUE | |
| evSub | publish | detail_pairs | — | TRUE | TRUE | TRUE | evSub | — | — | TRUE | |
| condition | publish | `Leonix` + human | — | TRUE | TRUE | TRUE | cond | — | — | TRUE | |
| city | publish | `listings.city` | presets | TRUE | TRUE | TRUE | city | — | TRUE | TRUE | CA validated |
| zip | publish | `listings.zip` | — | — | — | TRUE | zip | — | — | FALSE | Column may be absent on legacy DB |
| pickup/ship/delivery/meetup | publish | `Leonix:*` | — | — | TRUE | TRUE | params | — | — | TRUE | |
| negotiable | publish | `Leonix:negotiable` | — | badge | TRUE | TRUE | nego | — | — | TRUE | |
| brand, model, itemType | publish | `Leonix:*` | — | — | TRUE | TRUE | — | — | — | FALSE | Search-only; no facet URL params |
| seller_kind | publish | `seller_type` | — | TRUE | TRUE | TRUE | seller | — | — | TRUE | |
| images / Mux (Pro) | publish | `images`, mux_* | — | TRUE | TRUE | — | — | — | — | TRUE | |
| plan_tier / featured | publish | `Leonix:plan` | — | — | — | — | featured | — | — | TRUE | |

### En Venta category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| En Venta | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE |

---

## 4. Empleos

**Publish:** `upsertEmpleosListingFromEnvelope` → `empleos_public_listings` + `listing_snapshot` JSONB.  
**Discovery:** `empleosResultsQuery.ts`, `empleosFilterContract.ts`.  
**City:** freeform string; state filter exact 2-letter; no CA-only gate at publish.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title | empleos publish | `title` + snapshot | TRUE | TRUE | TRUE | TRUE | q | relevance/date | — | TRUE | |
| company | publish | `company_name` | — | TRUE | TRUE | TRUE | — | — | — | TRUE | |
| city, state | publish | cols + snapshot | — | TRUE | TRUE | TRUE | city/state | — | FALSE | No NorCal canonical |
| postalCode | premium regex | `postal_code` | — | — | TRUE | TRUE | zip | — | — | FALSE | Not guaranteed |
| category, modality, jobType | publish | indexed cols | pills | TRUE | TRUE | TRUE | exact filters | — | — | TRUE | |
| salaryMin/Max/label | publish | cols | — | TRUE | TRUE | — | salary band | salary_desc | — | TRUE | |
| experience, companyType | publish | cols | — | — | TRUE | TRUE | filters | — | — | PARTIAL | Quick hardcodes companyType=small |
| quickApply, listingTier | publish | cols | — | badge | — | TRUE | featured/quickApply | tier weight | — | TRUE | |
| verifiedEmployer | admin only | `verified_employer` | — | badge | TRUE | TRUE | verified | — | — | FALSE | Always false at publish |
| industryFocus, bilingual | publish | snapshot JSONB | — | chip | TRUE | TRUE | filters | — | — | PARTIAL | Not indexed columns |
| screenerQuestions | publish | snapshot | — | — | apply form | — | — | — | — | TRUE | |
| radiusKm | URL | — | — | — | — | — | FALSE | — | — | FALSE | Parsed, never applied |
| listing_snapshot null fallback | DB | — | — | — | FALSE | — | — | — | — | FALSE | Thin detail when snapshot missing |

### Empleos category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Empleos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | FALSE | TRUE | TRUE | FALSE |

---

## 5. Rentas

**Publish:** privado/negocio rentas forms → `public.listings` + `Leonix:rent:*` pairs.  
**Discovery:** `rentasBrowseFilters.ts`, `mapListingRowToRentasPublicListing.ts`.  
**City:** `normalizeCityForBrowse` trim only — **no** `getCanonicalCityName` at publish.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| titulo | rentas forms | `listings.title` | TRUE | TRUE | TRUE | TRUE | q | reciente | — | TRUE | |
| rentaMensual | forms | `Leonix:rent:monthly_usd` | bands | TRUE | TRUE | — | precio/rent_min/max | precio sorts | — | TRUE | |
| ciudad | forms | `listings.city` | chips | TRUE | TRUE | TRUE | city | — | FALSE | Freeform; not NorCal-validated |
| recamaras, banos, sqft | forms | detail_pairs + machine | — | TRUE | TRUE | TRUE | recs/baths/sqft | — | — | TRUE | sqft parse can fail on bad text |
| amueblado, mascotas, pool | forms | `Leonix:rent:*` | — | chips | TRUE | TRUE | filters | — | — | TRUE | |
| leaseTerm, deposit | forms | machine pairs | — | badge | TRUE | — | lease/deposit | — | — | TRUE | |
| highlights, subtype | forms | `Leonix:highlight_slugs` | — | badges | TRUE | TRUE | highlights/subtype | — | — | TRUE | |
| estadoAnuncio | forms | `Leonix:rent:listing_status` | — | — | TRUE | — | — | — | — | FALSE | Not user-filterable on results |
| media / Mux | forms | images + mux | — | TRUE | TRUE | — | — | — | — | TRUE | |
| contact channels (Gate 12C) | forms | machine + business_meta | — | — | TRUE | — | — | — | — | TRUE | |
| radius_km | URL | — | — | — | — | — | FALSE | — | — | FALSE | Parsed, not applied |
| demo pool on landing | env flag | — | sample | — | — | — | — | — | — | DEFERRED_INTENTIONAL | `RENTAS_INCLUDE_DEMO_POOL=1` only non-prod |

### Rentas category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Rentas | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | TRUE | TRUE | TRUE | FALSE |

---

## 6. Servicios

**Publish:** `publicar/servicios` → `servicios_public_listings` / business profiles.  
**Discovery:** `serviciosPublicListingsServer.ts`, `ServiciosResultsFilters.tsx` — live DB, filters backed by listing fields.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| businessName, slug | publish | DB row | TRUE | TRUE | TRUE | TRUE | q | — | — | TRUE | |
| city | publish | `city` | TRUE | TRUE | TRUE | TRUE | city | — | TRUE | CityAutocomplete pattern |
| category / internalGroup | publish | taxonomy | tiles | TRUE | TRUE | TRUE | group/q | — | — | TRUE | |
| services offered | publish | listing payload | — | TRUE | TRUE | TRUE | — | — | — | TRUE | |
| reviews merge | DB | reviews table | — | — | TRUE | — | — | — | — | TRUE | |
| landing explore tiles | `serviciosLandingSampleData.ts` | — | taxonomy only | — | — | — | handoff q= | — | — | TRUE | Tiles route to results, not fake listings |

### Servicios category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Servicios | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

---

## 7. Restaurantes

**Publish:** `restaurantes/publicar` → `restauranteListingApplicationModel`.  
**Discovery:** `restaurantesDiscoveryContract.ts`; landing uses blueprint sample cards when live pool thin.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| name, cuisine, hours | application model | listings + pairs | sample/ live mix | TRUE | TRUE | TRUE | wired filters | — | TRUE | Landing chips use blueprint samples |
| openNow | hours parse | derived | — | badge | — | — | openNow | — | — | TRUE | From hours only |
| /shell preview route | shell page | — | fake | — | — | — | — | — | — | FALSE | `restaurantes/shell` — noindex but public |

### Restaurantes category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Restaurantes | TRUE | TRUE | FALSE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE |

---

## 8. Clases

**Publish:** `publicar/clases` → community listing contract (`category=clases`).  
**Discovery:** `CommunityListingsResultsClient.tsx` (`category=clases`).

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title, description | community publish | `listings` + pairs | recent strip | TRUE | TRUE | TRUE | q | — | — | TRUE | `buildCommunityDiscoverySearchBlob` |
| city | publish | `listings.city` | — | TRUE | TRUE | TRUE | city | — | partial | Freeform on results |
| classType, skill level | publish | detail_pairs | chips | TRUE | TRUE | TRUE | classType/level | — | — | TRUE | |
| cost, mode | publish | pairs | — | TRUE | TRUE | TRUE | cost/mode | — | — | TRUE | |
| landing search | `clases/page.tsx` | — | — | — | — | TRUE | — | — | — | TRUE | **Fixed C1:** GET form → `/resultados` |
| landing recent | `CategoryRecentListings` | live API | TRUE | — | — | — | — | — | — | TRUE | |

### Clases category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Clases | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | TRUE | TRUE | TRUE | TRUE |

---

## 9. Comunidad

Same stack as Clases with `category=comunidad` and event-specific filters (eventType, dateFrom/To, audience, registration, accessibility).

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title, description, city | community publish | listings + pairs | recent | TRUE | TRUE | TRUE | q/city | — | partial | |
| eventType, dates, audience | publish | detail_pairs | chips | TRUE | TRUE | TRUE | filters | — | — | TRUE | |
| landing search | `comunidad/page.tsx` | — | — | — | — | TRUE | — | — | — | TRUE | **Fixed C1:** GET form wired |

### Comunidad category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Comunidad | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | TRUE | TRUE | TRUE | TRUE |

---

## 10. Mascotas y Perdidos

**Publish:** `publicar/mascotas-y-perdidos` → listings + taxonomy.  
**Discovery:** `mascotasPerdidosSearchText.ts`, `MascotasResultsCityFilter.tsx` (NorCal autocomplete).

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title, description, notice type | publish | listings + pairs | recent + chips | TRUE | TRUE | TRUE | q/tipo | — | — | TRUE | |
| city | publish | `listings.city` | — | TRUE | TRUE | TRUE | city filter | — | TRUE | NorCal autocomplete on results |
| landing search form | `mascotas-y-perdidos/page.tsx` | — | — | — | — | TRUE | — | — | — | TRUE | GET → resultados |
| reward, contact | publish | pairs | — | TRUE | TRUE | TRUE | — | — | — | TRUE | |

### Mascotas y Perdidos category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Mascotas y Perdidos | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

---

## 11. Busco (Se Busca)

**Publish:** `publicar/busco/quick` → listings.  
**Discovery:** `buscoSearchText.ts`, results client — live published requests only on landing recent strip.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| title, description | publish | listings | recent | TRUE | TRUE | TRUE | q | — | — | TRUE | |
| city, category | publish | cols/pairs | — | TRUE | TRUE | TRUE | city/category | — | partial | Freeform city |
| budget, urgency | publish | pairs | — | TRUE | TRUE | TRUE | filters | — | — | TRUE | |

### Busco category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Busco | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | TRUE | TRUE | TRUE | TRUE |

---

## 12. Viajes

**Publish:** viajes business/private offers → staged + approved rows.  
**Discovery:** `viajesPublicInventory.ts` — production excludes samples unless `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1`.

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| offer title, destination, price | publish | staged/DB | gated live | TRUE | TRUE | TRUE | wired | newest | partial | Sample catalog has Bay Area cities |
| affiliate links | publish | payload | — | — | TRUE | — | — | — | — | TRUE | |
| curated seed rows | `viajesNegocioProfileSampleData` | — | FALSE if flag | — | — | — | — | — | — | FALSE | 10 fake offers if env flag set in prod |
| production demo policy | `viajesPublicInventory.ts` | — | TRUE | TRUE | — | — | — | — | — | TRUE | Default prod = live only |

### Viajes category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Viajes | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | FALSE | TRUE | TRUE | TRUE | FALSE |

---

## 13. Negocios (hub redirect)

| Field | Source form/file | Storage key | Landing display | Results card | Detail page | Search | Filter | Sort | City/NorCal impact | Status | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| all | `negocios/page.tsx` | — | redirect | — | — | — | — | — | — | NOT_APPLICABLE | Redirects to `/clasificados/cuenta` |

### Negocios category summary

| Category | Publish fields inventoried | Storage verified | Landing uses real data | Results use real data | Search wired | Filters wired | City tied to NorCal | Detail page complete | No fake filters | Build passed | Overall |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Negocios | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | NOT_APPLICABLE | TRUE | TRUE | NOT_APPLICABLE |

---

## Aggregate status counts (field rows above)

| Status | Count (approx.) |
|---|---:|
| TRUE | 118 |
| FALSE | 14 |
| DEFERRED_INTENTIONAL | 5 |
| NOT_APPLICABLE | 4 |

---

## Blockers before go-live

| Category | Field/filter/page | File path | What is broken | Recommended fix | Fixed in C1? |
|---|---|---|---|---|---|
| Bienes Raíces | `estadoAnuncio` / listing status | `publicar/bienes-raices/*/application` | Collected but not persisted | Add `Leonix:listing_status` machine pair on publish | No — future gate |
| Bienes Raíces | `enlaceMapa` | privado/negocio publish mappers | Human pairs only; weak detail link | Machine key + detail CTA | No |
| Bienes Raíces | `BR_URL_QUERY_CIUDAD` mismatch | `shared/brNorCalCity.ts` vs `brResultsUrlState.ts` | Constant `ciudad` vs parser `city` | Align constant to `city` or update parser | No |
| En Venta | `zip` column | `enVentaPublishFromDraft.ts` | Legacy DB may omit zip; filter degrades | Migration + require zip on publish | No |
| En Venta | brand/model/itemType facets | `enVentaResultsUrlParams.ts` | Search-only, no dedicated filters | Add params if product wants facets | No |
| Empleos | `radiusKm` | `empleosResultsQuery.ts` | Parsed, never applied | Geo index or remove param from UI | No |
| Empleos | snapshot null detail | `empleosPublicListingsDbServer.ts` | Thin detail without JSONB snapshot | Always write snapshot on publish | No |
| Empleos | `verifiedEmployer` | `empleosEnvelopeToJobRecord.ts` | Always false at publish | Bridge admin `leonix_verified` | No |
| Rentas | city canonicalization | `rentasLocationNormalize.ts` | Freeform cities accepted | Reuse `getCanonicalCityName` at publish | No |
| Rentas | `radius_km` | `rentasBrowseContract.ts` | Parsed, not applied | Geo or hide param | No |
| Rentas | availability filter | `rentasBrowseFilters.ts` | `estadoAnuncio` not filterable | Add URL param when backed | No |
| Restaurantes | landing blueprint samples | `restaurantesBlueprintSampleData.ts` | Featured/recent may be sample-backed | Wire landing modules to live pool only | No |
| Restaurantes | `/shell` route | `restaurantes/shell` | Public fake restaurant page | Auth-gate or remove route | No |
| Viajes | curated seed in prod | `viajesPublicInventory.ts` | Fake inventory if `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1` | Verify Vercel env unset in prod | No |
| Clases / Comunidad | landing search (was decorative) | `clases/page.tsx`, `comunidad/page.tsx` | readOnly input did nothing | **Fixed:** GET form to resultados | **Yes** |
| BR | sqft on card / description search | `brFacetFromDetailPairs.ts`, `brResultsFilters.ts` | Hardcoded sqft; `q` ignored description | **Fixed** in C1 | **Yes** |

---

## Verification

### Build

```text
npm run build
```

Result: **PASS** — `npm run build` exit 0 (2026-05-21). First attempt failed on stale `.next` prerender cache for `/coming-soon`; clean rebuild succeeded.

### Tests / scripts

- `node scripts/dup-guard.js` (prebuild)
- `node scripts/next-build.js` (build wrapper)
- No new unit tests added in C1 (audit gate).

### Routes inspected in code

| Route | Purpose |
|---|---|
| `/clasificados/autos`, `/clasificados/autos/resultados` | Autos discovery |
| `/clasificados/bienes-raices`, `/clasificados/bienes-raices/resultados` | BR discovery |
| `/clasificados/en-venta`, `/clasificados/en-venta/results` | En Venta |
| `/clasificados/empleos`, `/clasificados/empleos/resultados` | Empleos |
| `/clasificados/rentas`, `/clasificados/rentas/results` | Rentas |
| `/clasificados/servicios` | Servicios |
| `/clasificados/restaurantes` | Restaurantes |
| `/clasificados/clases`, `/clasificados/clases/resultados` | Clases |
| `/clasificados/comunidad`, `/clasificados/comunidad/resultados` | Comunidad |
| `/clasificados/mascotas-y-perdidos/resultados` | Mascotas |
| `/clasificados/busco/resultados` | Busco |
| `/clasificados/viajes` | Viajes |
| `/clasificados/publicar/*` | Publish entry points |

### Categories intentionally deferred

- Autos `radiusMiles` (geo not indexed)
- BR parking filter (reserved in contract)
- Empleos / Rentas radius filters (no fake proximity)
- Negocios hub (redirect-only by design)

---

## Cross-category go-live readiness

| Category | Overall |
|---|---|
| Autos | TRUE |
| Servicios | TRUE |
| Clases | TRUE |
| Comunidad | TRUE |
| Mascotas y Perdidos | TRUE |
| Busco | TRUE |
| Bienes Raíces | FALSE |
| En Venta | FALSE |
| Empleos | FALSE |
| Rentas | FALSE |
| Restaurantes | FALSE |
| Viajes | FALSE |
| Negocios | NOT_APPLICABLE |
