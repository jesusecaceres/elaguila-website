# CLASIFICADOS-REMAINING-CATEGORIES-LANDING-RESULTS-FILTER-FIELD-CONTRACT-AUDIT-V1

**Audit date:** 2026-07-12  
**Classification:** SCOPED AUDIT / FIELD CONTRACT EXTRACTION — **no code changes**  
**Reference (already QA-approved):** Busco, Mascotas y Perdidos, Clases, Comunidad  
**Target categories:** Servicios, Rentas, Bienes Raíces, En Venta, Empleos, Autos Privado, Dealers de Autos  
**Excluded:** Ofertas Locales, Viajes

---

## 1. Executive summary

The four community-simple categories now share a unified landing ↔ results filter contract (with default CA/United States sanitization patched separately). The **remaining seven categories** each have mature results-side filter systems, but **landing ↔ results parity is inconsistent**:

| Category | Landing search functional? | Landing drawer? | Results contract maturity | Primary gap |
|---|---|---|---|---|
| Servicios | Partial (search works; emits default CA/US) | No landing drawer | High (`serviciosResultsFilter.ts`) | Default location emission; landing lacks drawer; promo/offer filter drift |
| Rentas | Yes (narrower than results) | Yes (landing hub) | High (`rentasBrowseContract.ts`) | Landing narrower than results; `subtype`/`subtypeDraft` conflict on results apply |
| Bienes Raíces | Yes | Chips only (no full drawer on landing) | High (`brFilterContract.ts`) | Fake amenity drawer chips; `colonia` parsed not filtered; landing `propertyType` values mismatch filter |
| En Venta | **No** (no-op handlers) | Hub shortcuts only | High (`enVentaResultsUrlParams.ts`) | Landing search visual-only; typed search does not route |
| Empleos | **No** (no-op handlers) | No landing drawer | High (`empleosFilterContract.ts`) | Landing search visual-only; `country` missing from contract keys list |
| Autos Privado | Yes (`AutosLandingPage`) | Yes (landing + results rail) | High (`autosBrowseFilterContract.ts`) | `radiusMiles` scaffolded not applied; `seller` not hard-enforced by route |
| Dealers de Autos | Yes (reuses `AutosLandingPage market=dealer`) | Same as Autos | Same as Autos | Same HIGH RISK market/seller semantics |

**No fake filters should be added in the next build.** Several categories already expose UI filters that are **not applied** — those must be **hidden or deferred**, not wired.

---

## 2. Worktree snapshot (Gate 0)

```
git status --short (2026-07-12): mixed worktree — unrelated dirty files present
  (servicios publish/revenue, autos negocios, package.json, scripts, etc.)

git diff --name-only: same unrelated paths; NO changes from this audit gate.
```

**Audit-only mode:** Only this file created. No application code modified.

---

## 3. Scope and locked categories

| Scope | Status |
|---|---|
| Target: 7 remaining categories | Audited |
| Reference: Busco, Mascotas, Clases, Comunidad | Not reworked |
| Ofertas Locales | Locked — not inspected |
| Viajes | Locked — not inspected |
| Admin/dashboard/auth/Supabase/Stripe | Locked — not touched |
| Publish UI | Read-only inspection for field source |

---

## 4. Route ownership map (Gate 1)

### Servicios

| Role | File |
|---|---|
| A. Landing route | `app/(site)/clasificados/servicios/page.tsx` |
| B. Landing search | `landing/ServiciosLandingPage.tsx` → `LeonixCategorySearchCanvas` (categoryStandardV2) |
| C. Landing drawer | **None** (Filtros opens results via `onOpenFilters={runSearch}`) |
| D. Results route | `resultados/page.tsx` (canonical); `results/page.tsx` re-exports |
| E. Results search | `ServiciosResultsPageShell.tsx` + inline search in `resultados/page.tsx` |
| F. Results drawer | `ServiciosResultsFilters.tsx` + `resultados/ServiciosResultsAdvancedFilterFields.tsx` |
| G. Filter function | `lib/serviciosResultsFilter.ts` (`filterServiciosPublicListings`, `rowMatchesServiciosResultsFilter`) |
| H. Active chips | `ServiciosResultsActiveSummary.tsx` |
| I. Listing mapper | `lib/serviciosLandingPublicMappers.ts`, `lib/resolveServiciosProfile` (profile JSON) |
| J. Publish source | `publicar/servicios/components/ClasificadosServiciosApplication.tsx`, `lib/clasificadosServiciosApplicationTypes.ts`, `lib/mapClasificadosServiciosApplicationToServiciosDraft.ts`, `lib/serviciosPublishDiscovery.ts` |

### Rentas

| Role | File |
|---|---|
| A. Landing route | `app/(site)/clasificados/rentas/page.tsx` → `RentasLandingHub.tsx` |
| B. Landing search | `components/RentasCompactSearchCanvas.tsx` |
| C. Landing drawer | `components/RentasFiltersDrawer.tsx` (via landing hub state) |
| D. Results route | `results/page.tsx` → `RentasResultsClient.tsx` |
| E. Results search | `RentasCompactSearchCanvas` in `RentasResultsClient.tsx` |
| F. Results drawer | `RentasFiltersDrawer.tsx` (shared) |
| G. Filter function | `shared/rentasBrowseFilters.ts` (`filterRentasPublicListings`, `parseRentasBrowseParams`) |
| H. Active chips | `results/components/RentasResultsActiveFilters.tsx` |
| I. Listing mapper | `shared/mapping/rentasPublishDetailPairs.ts`, `model/rentasPublicListing.ts` |
| J. Publish source | `publicar/rentas/privado/application/RentasPrivadoForm.tsx`, `publicar/rentas/negocio/application/RentasNegocioForm.tsx` |

### Bienes Raíces

| Role | File |
|---|---|
| A. Landing route | `app/(site)/clasificados/bienes-raices/page.tsx` → `BienesRaicesLandingHub.tsx` |
| B. Landing search | `components/BienesRaicesCompactSearchCanvas.tsx` |
| C. Landing drawer | **No full drawer** — intent tiles + chips hand off to results |
| D. Results route | `resultados/page.tsx` (implementation); `results/page.tsx` alias |
| E. Results search | `resultados/components/BienesRaicesSearchBar.tsx` |
| F. Results drawer | `resultados/components/BienesRaicesResultsFilterDrawer.tsx` |
| G. Filter function | `app/lib/clasificados/bienes-raices/filterBrListings.ts` + `shared/brFilterContract.ts` |
| H. Active chips | `resultados/components/BienesRaicesResultsActiveFilters.tsx` |
| I. Listing mapper | `resultados/lib/mapBrListingRowToCard.ts`, publish detail pair assembly in publicar BI forms |
| J. Publish source | `publicar/bienes-raices/privado/`, `publicar/bienes-raices/negocio/` form state + `Leonix:*` pairs |

### En Venta / Varios

| Role | File |
|---|---|
| A. Landing route | `app/(site)/clasificados/en-venta/page.tsx` → `EnVentaHubPageClient.tsx` |
| B. Landing search | `shared/components/EnVentaCompactSearchCanvas.tsx` (in hub — **no-op handlers**) |
| C. Landing drawer | Hub shortcut tiles / `EnVentaHubMoreFilters` (partial; not full results drawer) |
| D. Results route | `results/page.tsx` → `EnVentaResultsClient.tsx` |
| E. Results search | `EnVentaCompactSearchCanvas` in `EnVentaResultsClient.tsx` |
| F. Results drawer | Inline drawer in `EnVentaResultsClient.tsx` + `filters/enVentaFilterGroups.ts` |
| G. Filter function | Inline filter memo in `EnVentaResultsClient.tsx` + `utils/enVentaLocationMatch.ts` |
| H. Active chips | `EnVentaResultsClient.tsx` → `EnVentaResultsChipsRow` |
| I. Listing mapper | `mapping/mapDbRowToEnVentaListingData.ts`, `mapping/enVentaDetailPairSignals.ts` |
| J. Publish source | `publicar/en-venta/` free + storefront applications, `input/enVentaCanonicalKeys.ts`, `taxonomy/` |

### Empleos

| Role | File |
|---|---|
| A. Landing route | `app/(site)/clasificados/empleos/page.tsx` → `EmpleosLandingServer.tsx` |
| B. Landing search | `LeonixCategorySearchCanvas` in landing client (**no-op handlers**) |
| C. Landing drawer | **None on landing** |
| D. Results route | `resultados/page.tsx` (implementation); `results/page.tsx` re-exports |
| E. Results search | `components/EmpleosSearchBar.tsx` (in `EmpleosResultsView`) |
| F. Results drawer | `components/EmpleosBrowseDrawerFields.tsx` |
| G. Filter function | `lib/empleosResultsQuery.ts` (`filterEmpleosJobs`) |
| H. Active chips | `components/EmpleosResultsView.tsx` (inline chip builder) |
| I. Listing mapper | `lib/staged/empleosEnvelopeToJobRecord.ts`, `lib/empleosJobRecordListLocation.ts` |
| J. Publish source | `publicar/empleos/quick/`, `premium/`, `feria/` application clients |

### Autos Privado

| Role | File |
|---|---|
| A. Landing route | `app/(site)/clasificados/autos/page.tsx` → `landing/AutosLandingPage.tsx market="private"` |
| B. Landing search | `AutosLandingPage.tsx` + `AutosCompactSearchCanvas` pattern |
| C. Landing drawer | Landing filter rail / quick chips |
| D. Results route | `autos/resultados/page.tsx` → `AutosPublicResultsShell market="private"` |
| E. Results search | `AutosPublicResultsShell.tsx` top refine bar |
| F. Results drawer | `AutosPublicFilterRail.tsx` |
| G. Filter function | `components/public/autosPublicFilters.ts` (`applyAutosPublicFilters`) |
| H. Active chips | `components/public/AutosPublicResultsActiveFilters.tsx` |
| I. Listing mapper | `lib/mapAutosClassifiedsToPublic.ts` (`listing_payload`) |
| J. Publish source | `publicar/autos/privado/`, `pro/contracts/autosProPrivateContract.ts` |

### Dealers de Autos

| Role | File |
|---|---|
| A. Landing route | `dealers-de-autos/page.tsx` → `AutosLandingPage market="dealer"` |
| B–J. All other roles | **Same files as Autos** with `market="dealer"` and `autosPublicMarket.ts` route defaults |
| Market contract | `autos/lib/autosPublicMarket.ts`, `dealer/contracts/autosDealerLaneContract.ts` |

---

## 5. Application field inventory (Gate 2)

### Servicios

| UI / application key | Stored / filterable | URL key | Filter support | Landing expose | Results expose | Status |
|---|---|---|---|---|---|---|
| businessName, aboutText, specialties | profile JSON + search blob | `q` | Yes | Yes | Yes | READY |
| city | row.city + profile physical | `city` | Yes | Yes | Yes | READY |
| state | `Leonix:state` / profile physicalRegion | `state` | Yes | Yes (emits default CA) | Yes | NEEDS WIRING (default emission) |
| zip | physicalPostalCode | `zip` | Yes | Yes | Yes | READY |
| country | `Leonix:country` | `country` | Yes | Yes (emits default US) | Yes | NEEDS WIRING (default emission) |
| businessTypeId / internal_group | row.internal_group | `group` | Yes | Shortcut chips | Drawer | READY |
| languageIds | `languageChipIds` in opsMeta | `langEs`, `langEn`, `langOt` | Yes | No | Drawer | RESULTS ONLY |
| phone/whatsapp/call/message | contact flags | `whatsapp`, `call`, `msg` | Yes | Shortcut chips | Drawer | READY |
| websiteUrl | profile | `web` | Yes | Shortcut | Drawer | READY |
| leonix_verified | row flag | `verified` | Yes | Shortcut | Drawer | READY |
| hasLicense / license fields | quickFacts + credentials | `licensed` | Yes | Shortcut | Drawer | READY |
| isInsured | quickFacts | `insured` | Yes | No | Drawer | RESULTS ONLY |
| hours / open now | weekly schedule | `open_now` | Yes (hero hours logic) | No | Drawer | RESULTS ONLY |
| quickFacts emergency/mobile/wknd | quickFacts kinds | `emergency`, `mobileSvc`, `wknd` | Yes | Shortcuts | Drawer | READY |
| same_day / appointment | quickFacts or amenities | `same_day`, `appointment` | Yes | No | Drawer | RESULTS ONLY — **chip gap** |
| promo / coupons | wire.promo vs coupons add-on | `promo`, `offer`, `has_offers` | Partial (legacy promo path) | No | Drawer | DEFERRED / verify data path |
| paymentMethodIds | publish field | — | **Not filtered** | No | No | DEFERRED |
| seller presentation | inferred business/independent | `seller` | Yes | No | Drawer | RESULTS ONLY |
| gallery / videos | media arrays | `has_photos`, `has_videos` | Yes | No | Drawer | RESULTS ONLY |

### Rentas

| Application field | Stored key | URL key | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| titulo | title | `q` | Yes | Yes | Yes | READY |
| ciudad / ubicacionLinea | city, addressLine | `city` | Yes | Yes | Yes | READY |
| stateRegion / postalCode | stateRegion, postalCode | `state`, `zip` | Yes | Yes | Yes | NEEDS WIRING (default state emission) |
| Leonix:country | detail pair | `country` | Yes | Yes (US suppressed on emit) | Yes | READY |
| rentaMensual | rentMonthly | `rent_min`, `rent_max`, `precio` | Yes | Yes | Yes | READY |
| categoriaPropiedad / tipo | propiedad/subtype/kind | `subtype`, `tipo`, `kind`, `propiedad` | Yes | Yes | Yes | NEEDS WIRING (subtypeDraft conflict) |
| recámaras | beds | `recs` | Yes | Yes | Yes | READY |
| baños | baths | `baths_min`, `half_baths_min` | Yes | No | Results drawer | RESULTS ONLY |
| amueblado | `Leonix:rent:furnished` | `amueblado` | Yes | Yes | Yes | READY |
| mascotas | mascotasPermitidas | `mascotas` | Yes | Yes | Yes | READY |
| pool | `Leonix:pool` | `pool` | Yes | No | Results drawer | RESULTS ONLY |
| branch privado/negocio | branch | `branch` | Yes | Yes | Yes | READY |
| plazoContrato | `Leonix:rent:lease_term_code` | `lease` | Yes | No | Results drawer | RESULTS ONLY |
| deposit | deposit fields | `deposit_min`, `deposit_max` | Yes | No | Results drawer | RESULTS ONLY |
| parking | parking count | `parking_min` | Yes | No | Results drawer | RESULTS ONLY |
| sqft | sqft fields | `sqft_min`, `sqft_max` | Partial | No | Results drawer | DEFERRED if not universally stored |
| listing_status | `Leonix:rent:listing_status` | `estado` | Yes | No | Results drawer | RESULTS ONLY |
| highlights | `Leonix:highlight_slugs` | `highlights` | Yes | No | Results drawer | RESULTS ONLY |
| room bath/kitchen | room fields | `room_bath`, `room_kitchen` | Yes | Yes | Yes | READY |
| lat/lng/radius | — | `lat`, `lng`, `radius_km` | **Stripped, not applied** | No | No | DEFERRED |

### Bienes Raíces

| Application field | Stored `Leonix:*` / listing | URL key | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| title / description | listing text | `q` | Yes | Yes | Yes | READY |
| city | location.city | `city` | Yes | Yes | Yes | READY |
| colonia | — | `colonia` | **Parsed, NOT filtered** | No | Drawer patches URL | DEFERRED / remove from UI |
| state | `Leonix:state` | `state` | Yes | Yes (emits CA default) | Yes | NEEDS WIRING (default emission) |
| country | `Leonix:country` | `country` | Yes | Yes (US omitted on emit) | Yes | READY |
| zip | `Leonix:postal_code` | `zip` | Partial (no-ops if no ZIP data) | Yes | Yes | CONDITIONAL |
| operation | `Leonix:operation` | `operationType` | Yes | Yes | Yes | READY |
| property kind | `Leonix:results_property_kind` | `propertyType` | Yes | Yes | Yes | NEEDS WIRING (landing sends residencial/proyecto/multifamiliar — filter only casa/depto/terreno/comercial) |
| price | price.amount | `priceMin`, `priceMax` | Yes | No | Yes | READY |
| bedrooms | `Leonix:bedrooms_count` | `beds` | Yes | No | Yes | READY |
| bathrooms | `Leonix:bedrooms_count` | `baths` | Yes | No | Yes | READY |
| pets | `Leonix:pets_allowed` | `pets` | Yes | No | Yes | READY |
| furnished | `Leonix:furnished` | `furnished` | Yes | No | Yes | READY |
| pool | `Leonix:pool` | `pool` | Yes | No | Yes | READY |
| seller branch | `Leonix:branch` | `sellerType` | Yes | No | Yes | READY |
| highlight slugs | `Leonix:highlight_slugs` | amenity keys in drawer | **Parsed/patched, NOT filtered** | No | Drawer chips | **FAKE — hide** |
| parking | `Leonix:parking_spots` | `parking` (reserved) | Reserved in contract | No | No | DEFERRED |

### En Venta

| Application field | Stored key | URL key | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| title, description, brand, model | listing + pairs | `q` | Yes (text blob) | Broken landing search | Yes | NEEDS WIRING (landing) |
| city/state/zip/country | location pairs | `city`, `state`, `zip`, `country` | Yes | Broken | Yes | NEEDS WIRING (landing + default emission) |
| department | taxonomy | `evDept` | Yes | Shortcut tiles | Drawer | READY |
| subcategory | taxonomy | `evSub` | Yes | Shortcuts | Drawer | READY |
| item type | `Leonix:item_type` | `itemType` | Yes | No | Drawer | RESULTS ONLY |
| condition | condition pair | `cond` | Yes | No | Drawer | RESULTS ONLY |
| price / free | price, is_free | `priceMin`, `priceMax`, `free` | Yes | Shortcuts | Drawer | READY |
| negotiable | `Leonix:negotiable` | `nego` | Yes | No | Drawer | RESULTS ONLY |
| pickup/ship/delivery/meetup | fulfillment pairs | `pickup`, `ship`, `delivery`, `meetup` | Yes | Shortcuts | Drawer | READY |
| seller kind | seller pair | `seller` | Yes | No | Drawer | RESULTS ONLY |
| has photo/video | media | `hasPhoto`, `hasVideo` | Yes | No | Drawer | RESULTS ONLY |
| featured | visibility window | `featured` | Yes | No | Drawer | RESULTS ONLY |
| brand/model/quantity | in listing text | — | Searchable only | No | No facet | DEFERRED as facet |

### Empleos

| Application field | Record field | URL key | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| title, company, description | job record | `q` | Yes | Broken landing | Yes | NEEDS WIRING (landing) |
| city, state, zip, country | location fields | `city`, `state`, `zip`, `country` | Yes | Broken | Yes | NEEDS WIRING (landing; country emits on submit) |
| category | category slug | `category` | Yes | Category tiles | Drawer | READY |
| jobType | jobType | `jobType` | Yes | No | Drawer | RESULTS ONLY |
| modality | modality | `modality` | Yes | No | Drawer | RESULTS ONLY |
| salary range | pay fields | `salaryMin`, `salaryMax` | Yes | No | Drawer | RESULTS ONLY |
| experience | experience | `experience` | Yes | No | Drawer | RESULTS ONLY |
| companyType | companyType | `companyType` | Yes | No | Drawer | RESULTS ONLY |
| featured/recent/quickApply/verified/bilingual | flags | respective keys | Yes | No | Drawer | RESULTS ONLY |
| premium/lane/industry | record fields | `premium`, `lane`, `industry` | Yes | No | **Not in drawer** | DEFERRED UI |
| radiusKm | — | `radiusKm` | **Not applied** | No | No | DEFERRED |
| schedule | schedule rows | — | In blob only | No | No | DEFERRED as facet |

### Autos Privado / Dealers (shared contract)

| Application field | `listing_payload` / public row | URL key | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| make, model, year, trim | payload | `make`, `model`, `yearMin`, `yearMax` | Yes | Yes | Yes | READY |
| price | price | `priceMin`, `priceMax` | Yes | Yes | Yes | READY |
| mileage | mileage | `mileageMin`, `mileageMax` | Yes | Yes | Drawer | READY |
| condition | condition | `condition` | Yes | Yes | Drawer | READY |
| bodyStyle, transmission, drivetrain, fuel | payload | `bodyStyle`, `transmission`, `drivetrain`, `fuelType` | Yes | Yes | Drawer | READY |
| exterior/interior color | payload | `exteriorColor`, `interiorColor` | Yes | No | Drawer | RESULTS ONLY |
| titleStatus | payload | `titleStatus` | Yes | No | Drawer | RESULTS ONLY |
| hasPhotos/hasVideo | media flags | `hasPhotos`, `hasVideo` | Yes | No | Drawer | RESULTS ONLY |
| city/state/zip/country | location | `city`, `state`, `zip`, `country` | Yes | Yes (landing defaults San Jose/CA/US) | Top bar + filter | READY |
| seller lane | `sellerType` / `autosLane` | `seller` | Yes | Default by market | Drawer | **HIGH RISK** — not route-enforced |
| q | searchableBlurb | `q` | Yes | Yes | Yes | READY |
| radiusMiles | — | `radiusMiles` | **Parsed, NOT applied** | No | No | DEFERRED |

---

## 6. Landing search/drawer contract (Gate 3)

| Category | Search inputs | Default values | Buscar emits | Filtros on landing | Drawer fields | Default CA/US emitted untouched? | Ver todos clean? |
|---|---|---|---|---|---|---|---|
| Servicios | q, city, state, zip, country | CA, United States | All non-empty incl. CA, US | Opens results (no drawer) | None | **YES — bug** | Yes (`buildCategoryResultsUrl`) |
| Rentas | q, city, state, zip, country + drawer | CA, United States | rent/subtype/branch/etc. | Yes | subtype, rent, room, branch, amueblado, mascotas | **state=CA yes; country US suppressed** | Yes |
| Bienes Raíces | q, operation, propertyType, city, state, zip, country | CA, United States | canonical keys | No drawer — chips/tiles | Intent tiles only | **state=CA yes; country US suppressed** | Yes |
| En Venta | q, city, state, zip, country | CA, United States | **Nothing — no-op handlers** | No-op | Hub shortcuts only | N/A (broken) | Yes (shortcut hrefs work) |
| Empleos | q, city, state, zip, country | Empty in canvas | **Nothing — no-op handlers** | No-op | None | N/A (broken) | Yes (category tiles) |
| Autos | q, city, state, zip, country | San Jose, CA, US | Via `serializeAutosBrowseUrl` | Yes (rail/chips) | Full vehicle facets | Depends on submit path | Yes |
| Dealers | Same as Autos | Same | Same + default seller=dealer | Same | Same | Same | Yes |

---

## 7. Results search/drawer contract (Gate 4)

| Category | URL consumed | Drawer real fields? | Apply works? | Active chips | Parsed not applied | Fake UI |
|---|---|---|---|---|---|---|
| Servicios | Full set in `serviciosResultsFilter.ts` | Yes | Yes | `ServiciosResultsActiveSummary` — gap: `same_day`, `appointment` | `promo`/`offer` vs coupons path | Duplicate drawer sections |
| Rentas | `rentasBrowseContract.ts` keys | Yes | Yes (subtypeDraft bug) | `RentasResultsActiveFilters` — comprehensive | `lat/lng/radius_km` stripped | Geo radius disabled (OK) |
| Bienes Raíces | `brFilterContract` + aux | Mostly | Yes | `BienesRaicesResultsActiveFilters` | `colonia`, amenity chip keys | **Amenity drawer chips fake** |
| En Venta | `EV_RESULTS_PARAM` | Yes | Yes | `EnVentaResultsChipsRow` — complete | — | — |
| Empleos | `empleosFilterContract` + `country` | Yes | Yes | Inline in `EmpleosResultsView` | `radiusKm` | `premium`/`lane`/`industry` in contract not in drawer |
| Autos | `AUTOS_BROWSE_URL_KEYS` | Yes | Yes | `AutosPublicResultsActiveFilters` — complete | `radiusMiles` | — |
| Dealers | Same | Same | Same | Same | Same | `seller` override risk |

---

## 8. Safe filter contract by category (Gate 5)

### Servicios

**Universal search bar:** q, city, state, zip, country

| Drawer field | URL key | Application source | Stored key | Filter fn | Chip | Landing | Results | Status |
|---|---|---|---|---|---|---|---|---|
| Service group | `group` | `businessTypeId` → internal_group | `internal_group` | Yes | Yes | Shortcut only | Drawer | READY |
| WhatsApp | `whatsapp` | enableWhatsapp | contact | Yes | Yes | Shortcut | Drawer | READY |
| Call | `call` | enableCall | contact | Yes | Yes | No | Drawer | RESULTS ONLY |
| Verified | `verified` | leonix_verified | row | Yes | Yes | Shortcut | Drawer | READY |
| Licensed | `licensed` | hasLicense | quickFacts/credentials | Yes | Yes | Shortcut | Drawer | READY |
| Insured | `insured` | isInsured | quickFacts | Yes | Yes | No | Drawer | RESULTS ONLY |
| Web | `web` | websiteUrl | profile | Yes | Yes | Shortcut | Drawer | READY |
| Bilingual | `bilingual` | languageIds | languageChipIds | Yes | Yes | No | Drawer | RESULTS ONLY |
| Emergency | `emergency` | quickFact | quickFacts | Yes | Yes | Shortcut | Drawer | READY |
| Mobile service | `mobileSvc` | quickFact | quickFacts | Yes | Yes | Shortcut | Drawer | READY |
| Weekend hours | `wknd` | hours | schedule | Yes | Yes | Shortcut | Drawer | READY |
| Open now | `open_now` | hours | schedule | Yes | Yes | No | Drawer | RESULTS ONLY |
| Seller type | `seller` | inferred | profile | Yes | Yes | No | Drawer | RESULTS ONLY |
| Same day / appointment | `same_day`, `appointment` | quickFacts | quickFacts | Yes | **Chip gap** | No | Drawer | NEEDS WIRING (chips) |
| Promo/offer | `promo`, `offer`, `has_offers` | coupons vs legacy promo | wire.promo | Partial | Yes | No | Drawer | DEFERRED — verify storage |
| Payment methods | — | paymentMethodIds | — | No | No | No | No | DEFERRED |

### Rentas

**Universal search bar:** q, city, state, zip, country

| Drawer field | URL key | Stored | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| Rent min/max | `rent_min`, `rent_max` | rentMonthly | Yes | Yes | Yes | READY |
| Subtype / tipo | `subtype`, `tipo` | `Leonix:property_subtype` | Yes | Yes | Yes | NEEDS WIRING (apply bug) |
| Bedrooms | `recs` | beds | Yes | Yes | Yes | READY |
| Baths min | `baths_min` | baths | Yes | No | Yes | RESULTS ONLY |
| Branch | `branch` | branch | Yes | Yes | Yes | READY |
| Furnished | `amueblado` | furnished | Yes | Yes | Yes | READY |
| Pets | `mascotas` | pets | Yes | Yes | Yes | READY |
| Pool | `pool` | `Leonix:pool` | Yes | No | Yes | RESULTS ONLY |
| Lease | `lease` | lease_term_code | Yes | No | Yes | RESULTS ONLY |
| Deposit | `deposit_min/max` | deposit | Yes | No | Yes | RESULTS ONLY |
| Parking | `parking_min` | parking | Partial | No | Yes | CONDITIONAL |
| Estado | `estado` | listing_status | Yes | No | Yes | RESULTS ONLY |
| Highlights | `highlights` | highlight_slugs | Yes | No | Yes | RESULTS ONLY |
| Sqft | `sqft_min/max` | sqft | Partial | No | Yes | DEFERRED |
| Geo radius | `radius_km` | — | No | No | No | DEFERRED |

### Bienes Raíces

**Universal search bar:** q, city, state, zip, country

| Drawer field | URL key | Stored | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| Operation | `operationType` | `Leonix:operation` | Yes | Yes | Yes | READY |
| Property type | `propertyType` | `Leonix:results_property_kind` | Yes | Yes (value mismatch) | Yes | NEEDS WIRING |
| Price min/max | `priceMin`, `priceMax` | price | Yes | No | Yes | READY |
| Beds | `beds` | bedrooms_count | Yes | No | Yes | READY |
| Baths | `baths` | bathrooms_count | Yes | No | Yes | READY |
| Pets | `pets` | pets_allowed | Yes | No | Yes | READY |
| Furnished | `furnished` | furnished | Yes | No | Yes | READY |
| Pool | `pool` | pool | Yes | No | Yes | READY |
| Seller | `sellerType` | branch | Yes | No | Yes | READY |
| ZIP | `zip` | postal_code | Conditional | Yes | Yes | CONDITIONAL |
| Colonia | `colonia` | — | **No** | No | Patches URL | **REMOVE/HIDE** |
| Amenity chips (patio, gym, etc.) | various | highlight_slugs | **No** | No | In drawer | **FAKE — hide** |

### En Venta

**Universal search bar:** q, city, state, zip, country

| Drawer field | URL key | Stored | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| Department | `evDept` | taxonomy | Yes | Shortcuts | Drawer | READY |
| Subcategory | `evSub` | taxonomy | Yes | Shortcuts | Drawer | READY |
| Item type | `itemType` | pair | Yes | No | Drawer | RESULTS ONLY |
| Condition | `cond` | pair | Yes | No | Drawer | RESULTS ONLY |
| Price | `priceMin`, `priceMax` | price | Yes | Shortcuts | Drawer | READY |
| Free | `free` | is_free | Yes | Shortcuts | Drawer | READY |
| Negotiable | `nego` | pair | Yes | No | Drawer | RESULTS ONLY |
| Pickup/ship/delivery/meetup | keys | pairs | Yes | Shortcuts | Drawer | READY |
| Seller | `seller` | pair | Yes | No | Drawer | RESULTS ONLY |
| Has photo/video | `hasPhoto`, `hasVideo` | media | Yes | No | Drawer | RESULTS ONLY |
| Featured | `featured` | visibility | Yes | No | Drawer | RESULTS ONLY |

### Empleos

**Universal search bar:** q, city, state, zip, country

| Drawer field | URL key | Stored | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| Category | `category` | category | Yes | Tiles | Drawer | READY |
| Job type | `jobType` | jobType | Yes | No | Drawer | RESULTS ONLY |
| Modality | `modality` | modality | Yes | No | Drawer | RESULTS ONLY |
| Salary | `salaryMin`, `salaryMax` | pay range | Yes | No | Drawer | RESULTS ONLY |
| Experience | `experience` | experience | Yes | No | Drawer | RESULTS ONLY |
| Company type | `companyType` | companyType | Yes | No | Drawer | RESULTS ONLY |
| Featured/recent/quickApply/verified/bilingual | keys | flags | Yes | No | Drawer | RESULTS ONLY |
| Premium/lane/industry | keys | fields | Yes | No | Not in drawer | DEFERRED UI |

### Autos / Dealers (shared)

**Universal search bar:** q, city, state, zip, country

| Drawer field | URL key | Stored | Filter | Landing | Results | Status |
|---|---|---|---|---|---|---|
| Make | `make` | payload | Yes | Yes | Yes | READY |
| Model | `model` | payload | Yes | Yes | Yes | READY |
| Year min/max | `yearMin`, `yearMax` | year | Yes | Yes | Yes | READY |
| Price min/max | `priceMin`, `priceMax` | price | Yes | Yes | Yes | READY |
| Mileage max | `mileageMax` | mileage | Yes | Yes | Yes | READY |
| Condition | `condition` | condition | Yes | Yes | Yes | READY |
| Body | `bodyStyle` | bodyStyle | Yes | Yes | Yes | READY |
| Transmission | `transmission` | transmission | Yes | Yes | Yes | READY |
| Fuel | `fuelType` | fuelType | Yes | Yes | Yes | READY |
| Seller | `seller` | sellerType/lane | Yes | Default by market | Drawer | **HIGH RISK** |
| Colors, title, media | keys | payload | Yes | Partial | Drawer | RESULTS ONLY |
| Radius | `radiusMiles` | — | No | No | No | DEFERRED |

---

## 9. Unsupported / deferred fields

| Category | Field / URL key | Reason |
|---|---|---|
| Servicios | `promo`, `offer`, `has_offers` | Coupon add-on path vs legacy promo filter mismatch |
| Servicios | payment methods | Published but not in filter function |
| Rentas | `radius_km`, `lat`, `lng` | Geo scaffold; stripped from URL |
| Rentas | `sqft_min/max` | Not universally stored |
| Bienes | `colonia` | Parsed/patched, not in `filterBrListings` |
| Bienes | amenity drawer chips (patio, gym, etc.) | Patched to URL, not filtered |
| Bienes | `parking` | Reserved in contract, no UI |
| En Venta | brand/model facets | Search blob only |
| Empleos | `radiusKm` | Explicitly not applied |
| Empleos | `premium`, `lane`, `industry` | In contract, not in drawer |
| Autos/Dealers | `radiusMiles` | Parsed only, not applied |

---

## 10. Implementation target files for next build (Gate 6)

### Servicios
- **Landing:** `landing/ServiciosLandingPage.tsx`
- **Landing drawer:** new shared panel or extend landing to open results drawer contract
- **Results:** `ServiciosResultsFilters.tsx`, `resultados/page.tsx`
- **Filter:** `lib/serviciosResultsFilter.ts`
- **Chips:** `ServiciosResultsActiveSummary.tsx`
- **Shared location sanitize:** reuse `lightweightBrowseLocation.ts` / `sanitizeLocationParamsForUrl` pattern from community-simple fix
- **Locked:** publish route, revenue, Supabase

### Rentas
- **Landing:** `RentasLandingHub.tsx`, `RentasCompactSearchCanvas.tsx`
- **Drawer:** `RentasFiltersDrawer.tsx`
- **Results:** `RentasResultsClient.tsx`
- **Contract:** `shared/rentasBrowseContract.ts`, `shared/rentasBrowseFilters.ts`
- **Chips:** `RentasResultsActiveFilters.tsx`
- **Fix target:** `subtype` vs `subtypeDraft` in `applySearchAndRefine`

### Bienes Raíces
- **Landing:** `BienesRaicesLandingHub.tsx`, `BienesRaicesCompactSearchCanvas.tsx`
- **Results:** `BienesRaicesResultsClient.tsx`, `BienesRaicesResultsFilterDrawer.tsx`
- **Contract:** `shared/brFilterContract.ts`, `app/lib/clasificados/bienes-raices/filterBrListings.ts`
- **Chips:** `BienesRaicesResultsActiveFilters.tsx`
- **Remove/hide:** fake amenity chips, `colonia` until wired

### En Venta
- **Landing:** `EnVentaHubPageClient.tsx`, `shared/components/EnVentaCompactSearchCanvas.tsx`
- **Results:** `EnVentaResultsClient.tsx`, `filters/enVentaFilterGroups.ts`
- **Contract:** `results/contracts/enVentaResultsUrlParams.ts`
- **Filter:** inline in `EnVentaResultsClient.tsx`, `utils/enVentaLocationMatch.ts`
- **Chips:** `EnVentaResultsChipsRow`

### Empleos
- **Landing:** `EmpleosLandingServer.tsx` + landing client with `LeonixCategorySearchCanvas`
- **Results:** `EmpleosResultsView.tsx`, `EmpleosBrowseDrawerFields.tsx`
- **Contract:** `lib/empleosFilterContract.ts`, `lib/empleosResultsQuery.ts`
- **Add `country` to `EMPLEOS_URL_PARAM_KEYS` if landing/results unified**

### Autos / Dealers
- **Landing:** `autos/landing/AutosLandingPage.tsx`
- **Results:** `autos/components/public/AutosPublicResultsShell.tsx`
- **Drawer:** `AutosPublicFilterRail.tsx`
- **Contract:** `autos/filters/autosBrowseFilterContract.ts`, `autosPublicFilters.ts`
- **Chips:** `AutosPublicResultsActiveFilters.tsx`
- **Market:** `autos/lib/autosPublicMarket.ts` — **do not break seller defaults**
- **Dealers:** `dealers-de-autos/page.tsx`, `dealers-de-autos/results/page.tsx` (thin wrappers only)

### Locked for all next prompts
- `ofertas-locales/**`, `viajes/**`
- `admin/**`, `dashboard/**`, auth, Supabase schema, Stripe
- Publish form UI (read-only unless explicit publish-filter alignment task)
- Global nav/header/footer, middleware, package.json, next config

---

## 11. Risk buckets (Gate 7)

| Bucket | Categories | Notes |
|---|---|---|
| **LOW** | — | None of the remaining seven are fully low-risk |
| **MEDIUM** | En Venta, Empleos, Servicios | Local client files; clear URL contracts; main risk is landing wiring + default location emission |
| **MEDIUM** | Rentas | Reference implementation; subtype apply bug; narrower landing drawer |
| **MEDIUM–HIGH** | Bienes Raíces | Fake amenity UI must be removed; propertyType landing mismatch; ZIP conditional |
| **HIGH** | Autos Privado, Dealers de Autos | Shared shell, market/seller semantics, inventory lane mapping; `seller` override possible |

---

## 12. Recommended build order (Gate 8)

### Batch 1 — En Venta (MEDIUM, clearest contract)
- **Why safe:** Single `EnVentaResultsClient` owns filter+drawer+chips; contract file `enVentaResultsUrlParams.ts` is explicit; landing gap is identical to pre-fix community-simple pattern.
- **Scope:** Wire `EnVentaHubPageClient` search canvas + optional landing drawer handoff; apply default location sanitize; do not add facets.
- **Model:** GPT-5.5 Medium scoped gated build
- **Test URLs:** `/clasificados/en-venta?lang=es`, `/clasificados/en-venta/results?lang=es`

### Batch 2 — Empleos (MEDIUM)
- **Why safe:** `empleosFilterContract.ts` documents every key; results `EmpleosResultsView` is mature; landing is the main gap.
- **Scope:** Wire landing search; add `country` to contract keys if needed; default location sanitize; do not add premium/lane/industry drawer until requested.
- **Test URLs:** `/clasificados/empleos?lang=es`, `/clasificados/empleos/resultados?lang=es`

### Batch 3 — Servicios (MEDIUM)
- **Why safe:** Filter function is comprehensive; work is landing drawer parity + default location + chip gaps (`same_day`, `appointment`).
- **Scope:** Do not expand filter set; fix emission; optional landing drawer mirroring results drawer subset.
- **Test URLs:** `/clasificados/servicios?lang=es`, `/clasificados/servicios/resultados?lang=es`

### Batch 4 — Rentas (MEDIUM)
- **Why safe:** Reference category; fix subtype apply bug + default state emission + landing/results drawer parity documentation.
- **Scope:** No geo radius; no new fields.
- **Test URLs:** `/clasificados/rentas?lang=es`, `/clasificados/rentas/results?lang=es`

### Batch 5 — Bienes Raíces (MEDIUM–HIGH)
- **Why later:** Must **hide** fake amenity filters before wiring; fix landing `propertyType` value mapping; colonia deferred.
- **Test URLs:** `/clasificados/bienes-raices?lang=es`, `/clasificados/bienes-raices/results?lang=es`

### Batch 6 — Autos Privado + Dealers (HIGH — together or private first)
- **Why last:** Shared `AutosPublicResultsShell`; market defaults; do not hard-break `seller` behavior without explicit owner decision.
- **Scope:** Landing/results location sanitize; optional drawer state/country parity; **no** radiusMiles UI.
- **Test URLs:** `/clasificados/autos?lang=es`, `/clasificados/autos/results?lang=es`, `/clasificados/dealers-de-autos?lang=es`, `/clasificados/dealers-de-autos/results?lang=es`

---

## 13. QA URLs

| Category | Landing | Results |
|---|---|---|
| Servicios | `/clasificados/servicios?lang=es` | `/clasificados/servicios/resultados?lang=es` |
| Rentas | `/clasificados/rentas?lang=es` | `/clasificados/rentas/results?lang=es` |
| Bienes Raíces | `/clasificados/bienes-raices?lang=es` | `/clasificados/bienes-raices/results?lang=es` |
| En Venta | `/clasificados/en-venta?lang=es` | `/clasificados/en-venta/results?lang=es` |
| Empleos | `/clasificados/empleos?lang=es` | `/clasificados/empleos/resultados?lang=es` |
| Autos | `/clasificados/autos?lang=es` | `/clasificados/autos/results?lang=es` |
| Dealers | `/clasificados/dealers-de-autos?lang=es` | `/clasificados/dealers-de-autos/results?lang=es` |

---

## 14. TRUE/FALSE final audit

| Check | Result |
|---|---|
| Audit only, no code changes | **TRUE** |
| Ofertas untouched | **TRUE** |
| Viajes untouched | **TRUE** |
| Admin/dashboard/auth/Supabase/Stripe untouched | **TRUE** |
| Application fields inspected | **TRUE** |
| Stored keys/detail_pairs inspected | **TRUE** |
| URL params inspected | **TRUE** |
| Landing search contracts inspected | **TRUE** |
| Landing drawer contracts inspected | **TRUE** |
| Results search contracts inspected | **TRUE** |
| Results drawer contracts inspected | **TRUE** |
| Filter functions inspected | **TRUE** |
| Active chips inspected | **TRUE** |
| No fake filters recommended | **TRUE** (existing fake UI flagged for removal, not extension) |
| Deferred fields documented | **TRUE** |
| Next build files listed | **TRUE** |
| Build order recommended | **TRUE** |
| npm run build | **NOT RUN** (audit only) |
