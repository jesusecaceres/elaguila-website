# CLASIFICADOS ALL CATEGORIES LANDING RESULTS ROUTE OWNERSHIP V2 SHELL MIGRATION AUDIT V1

## Executive Summary

- Total categories / category-like surfaces audited: 17 (`rentas`, `bienes-raices`, `autos`, `dealers-de-autos`, `restaurantes`, `servicios`, `ofertas-locales`, `en-venta`, `empleos`, `viajes`, `travel`, `clases`, `comunidad`, `busco`, `mascotas-y-perdidos`, `comida-local`, `negocios` / `negocios-locales` exposure).
- Total landing URLs found under `/clasificados`: 17.
- Total canonical results URLs found: 14.
- Total duplicate results/alias/redirect URLs found: 11 (`/results` re-export aliases for 10 categories with `/resultados`, plus `/clasificados/travel` redirect).
- Categories already truly V2-compliant end-to-end: 0.
- Categories importing V2 but not visually/results compliant: 11 (`autos`, `dealers-de-autos`, `restaurantes`, `servicios`, `ofertas-locales`, `en-venta`, `empleos`, `viajes`, `clases`, `comunidad`, `busco`, `mascotas-y-perdidos`; Ofertas is closest but still has CTA/results product gaps).
- Categories still on protected/custom shell: 5 (`rentas`, `bienes-raices`, `comida-local`, `negocios`, plus most results shells).
- Categories with broken/missing expected results route or alias gap: 6 (`rentas` missing `/resultados`, `ofertas-locales` missing `/resultados`, `en-venta` missing `/resultados`, `dealers-de-autos` missing `/resultados`, `comida-local` has no separate results route, `negocios` is not a real category page).
- Categories with Negocios Locales exposure: 6 (`ofertas-locales`, `servicios`, `restaurantes`, `comida-local`, autos dealers, `bienes-raices`).
- Highest-risk migrations: `rentas`, `bienes-raices`, `autos` / `dealers-de-autos`, `viajes`, `en-venta`, `empleos`, `servicios`.
- Recommended migration order: fix global V2 CTA slot/results guardrails first, protect `rentas` and `bienes-raices`, pilot `ofertas-locales` and `restaurantes`, then resolve autos/dealers canonical strategy before business-heavy and marketplace categories.

## Full Canonical Route Table

| Category | Landing URL | Landing route file | Landing component | Results URL | Results route file | Results component | `/results` exists | `/resultados` exists | Canonical or alias | Negocios Locales exposure | V2 status | CTA slot status | Results cleanliness status | Migration priority |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Rentas | `/clasificados/rentas` | `app/(site)/clasificados/rentas/page.tsx` | `RentasLandingHub` | `/clasificados/rentas/results` | `app/(site)/clasificados/rentas/results/page.tsx` | `RentasResultsClient` / `RentasResultsShell` | TRUE | FALSE | `/results` canonical; `/resultados` missing | FALSE | Protected custom source standard | Visible in custom shell if publish props present | Mostly clean, custom source standard with lower visibility | Batch 1 protect |
| Bienes Raices | `/clasificados/bienes-raices` | `app/(site)/clasificados/bienes-raices/page.tsx` | `BienesRaicesLandingHub` | `/clasificados/bienes-raices/results` | `app/(site)/clasificados/bienes-raices/results/page.tsx` re-exports `resultados` | `BienesRaicesResultsClient` | TRUE | TRUE | `/results` constant but `/resultados` implementation | TRUE | Protected custom source standard | Visible in custom shell if publish props present | Not clean: sponsor lane on results | Batch 1 protect |
| Autos Privado | `/clasificados/autos` | `app/(site)/clasificados/autos/page.tsx` | `AutosLandingPage market="private"` | `/clasificados/autos/results` | `app/(site)/clasificados/autos/results/page.tsx` re-exports `resultados` | `AutosPublicResultsShell market="private"` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | Dealer exposure uses autos results query | Landing V2 partial, results old/custom | Landing has custom publish CTA; V2 slot mixed | Cluttered: notices, peer links, quick chips, bands | Batch 3 |
| Dealers de Autos | `/clasificados/dealers-de-autos` | `app/(site)/clasificados/dealers-de-autos/page.tsx` | `AutosLandingPage market="dealer"` | `/clasificados/dealers-de-autos/results` | `app/(site)/clasificados/dealers-de-autos/results/page.tsx` | `AutosPublicResultsShell market="dealer"` | TRUE | FALSE | Dealer canonical; autos query alias exists | TRUE | Landing V2 partial, results old/custom | Custom autos CTA visible | Same autos clutter; alias mismatch risk | Batch 3 |
| Restaurantes | `/clasificados/restaurantes` | `app/(site)/clasificados/restaurantes/page.tsx` | `RestaurantesLandingPage` | `/clasificados/restaurantes/results` | `app/(site)/clasificados/restaurantes/results/page.tsx` re-exports `resultados` | `RestaurantesResultsShell` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | TRUE | Landing V2, results old standard/custom | V2 publish props present; slot depends on `showPublish` | Medium clutter; sponsored/promoted concepts present | Batch 2 |
| Servicios | `/clasificados/servicios` | `app/(site)/clasificados/servicios/page.tsx` | `ServiciosLandingPage` | `/clasificados/servicios/results` | `app/(site)/clasificados/servicios/results/page.tsx` re-exports `resultados` | `ServiciosResultsPageShell` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | TRUE | Landing V2, results old standard/custom | V2 publish props present; slot depends on `showPublish` | Not clean: destacados before results | Batch 4 |
| Ofertas Locales | `/clasificados/ofertas-locales` | `app/(site)/clasificados/ofertas-locales/page.tsx` | `OfertasLocalesPublicSearchClient mode="landing"` | `/clasificados/ofertas-locales/results` | `app/(site)/clasificados/ofertas-locales/results/page.tsx` | `OfertasLocalesPublicSearchClient mode="results"` | TRUE | FALSE | `/results` canonical; `/resultados` missing | TRUE | V2 partial/closest | Broken V2 search slot: missing `showPublish` | Mostly clean; shopping-list CTA remains product exception | Batch 2 |
| En Venta / Varios | `/clasificados/en-venta` | `app/(site)/clasificados/en-venta/page.tsx` | `EnVentaHubPageClient` | `/clasificados/en-venta/results` | `app/(site)/clasificados/en-venta/results/page.tsx` | `EnVentaResultsClient` | TRUE | FALSE | `/results` canonical; `/resultados` missing | FALSE | Landing V2, results custom | Broken V2 search slot: missing `showPublish` | Not clean: footer visibility CTA/promoted/trust | Batch 5 |
| Empleos | `/clasificados/empleos` | `app/(site)/clasificados/empleos/page.tsx` | `EmpleosLandingServer` / `EmpleosLandingPage` | `/clasificados/empleos/results` | `app/(site)/clasificados/empleos/results/page.tsx` re-exports `resultados` | `EmpleosResultsView` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | FALSE | Landing V2, results old/custom | Broken V2 search slot: missing `showPublish` | Not clean: featured block, adjacent prompts, custom form | Batch 5 |
| Viajes | `/clasificados/viajes` | `app/(site)/clasificados/viajes/page.tsx` | `ViajesLandingPage` | `/clasificados/viajes/results` | `app/(site)/clasificados/viajes/results/page.tsx` re-exports `resultados` | `ViajesResultsShell` | TRUE | TRUE | `/viajes` canonical; `/travel` redirect alias | Business/agency exposure possible | Landing V2, results custom | Broken V2 search slot: missing `showPublish` | Not clean: trust strip, visibility CTA, discovery strip | Batch 4 |
| Travel alias | `/clasificados/travel` | `app/(site)/clasificados/travel/page.tsx` | `permanentRedirect` | N/A | N/A | N/A | FALSE | FALSE | Redirect alias to `/clasificados/viajes` | FALSE | N/A | N/A | N/A | Alias cleanup |
| Clases | `/clasificados/clases` | `app/(site)/clasificados/clases/page.tsx` | inline V2 landing | `/clasificados/clases/results` | `app/(site)/clasificados/clases/results/page.tsx` re-exports `resultados` | `CommunityListingsResultsClient category="clases"` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | FALSE | Landing V2, results old shared | Broken V2 search slot: missing `showPublish` | Mostly clean/simple | Batch 6 |
| Comunidad | `/clasificados/comunidad` | `app/(site)/clasificados/comunidad/page.tsx` | inline V2 landing | `/clasificados/comunidad/results` | `app/(site)/clasificados/comunidad/results/page.tsx` re-exports `resultados` | `CommunityListingsResultsClient category="comunidad"` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | FALSE | Landing V2, results old shared | Broken V2 search slot: missing `showPublish` | Mostly clean/simple | Batch 6 |
| Busco / Se Busca | `/clasificados/busco` | `app/(site)/clasificados/busco/page.tsx` | inline V2 landing | `/clasificados/busco/results` | `app/(site)/clasificados/busco/results/page.tsx` re-exports `resultados` | `BuscoResultsClient` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | FALSE | Landing V2, results custom narrow | Broken V2 search slot: missing `showPublish` | Clean/simple | Batch 6 |
| Mascotas y Perdidos | `/clasificados/mascotas-y-perdidos` | `app/(site)/clasificados/mascotas-y-perdidos/page.tsx` | inline V2 landing | `/clasificados/mascotas-y-perdidos/results` | `app/(site)/clasificados/mascotas-y-perdidos/results/page.tsx` re-exports `resultados` | `MascotasPerdidosResultsClient` | TRUE | TRUE | `/results` should be canonical; `/resultados` implementation | FALSE | Landing V2, results custom narrow | Broken V2 search slot: missing `showPublish` | Clean/simple | Batch 6 |
| Comida Local | `/clasificados/comida-local` | `app/(site)/clasificados/comida-local/page.tsx` | single hybrid page | none | none | same page filters/cards | FALSE | FALSE | Landing/results hybrid only | TRUE | Custom, outside main config | Simple header/empty publish CTA | Low clutter, but no true results route | Defer/special |
| Negocios | `/clasificados/negocios` | `app/(site)/clasificados/negocios/page.tsx` | client redirect to cuenta | none | none | N/A | FALSE | FALSE | Not a category; redirect/canonical decision needed | Related to `/negocios-locales` | FALSE | N/A | N/A | Defer/canonical cleanup |

## Category Detail Sections

### Rentas

#### URLs
- Landing URL: `/clasificados/rentas`.
- Results URL: `/clasificados/rentas/results`.
- Spanish alias URL: none found; `/clasificados/rentas/resultados` route file is absent and should be treated as page-not-found.
- English alias URL: none; `/results` is the only results route.
- Route user should QA: `/clasificados/rentas/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/rentas/page.tsx`.
- Results route file: `app/(site)/clasificados/rentas/results/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE on landing and results.
- Redirects: FALSE for landing/results.
- Wraps another component: TRUE, landing wraps `RentasLandingHub`; results server-wraps `RentasResultsClient`.
- Mode/market/lane prop: no lane prop; results passes server inventory/demo pool.

#### Component Tree
- Top route component: `RentasPage`, `RentasResultsPage`.
- Main landing component: `RentasLandingHub`.
- Main results component: `RentasResultsClient`.
- Search shell component: `RentasCompactSearchCanvas`.
- Filter drawer component: `RentasFiltersDrawer`.
- Active filters component: `RentasResultsActiveFilters`.
- Toolbar/sort/view/per-page component: `RentasResultsToolbar`.
- Card/listing renderer: `RentasResultCard`.
- Empty state component: inline compact empty state.
- Partner/sponsor component if present: none on results.
- Discovery/shortcut component if present: `RentasLandingIntentTiles`, `RentasLandingShortcutSections`.
- Old custom shell component: `RentasLandingShell`, `RentasResultsShell`, `RentasResultsGatewayPanel`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: FALSE.
- renders LeonixCategoryPageShell: FALSE.
- renders LeonixCategoryHeroGateway: FALSE.
- renders LeonixCategorySearchCanvas: FALSE.
- renders LeonixCategoryCta: FALSE.
- renders LeonixCategoryPartnerSection on landing only: FALSE.
- renders LeonixCategoryDiscoveryGrid on landing only: FALSE.
- renders LeonixCategoryShortcutSection on landing only: FALSE.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE, but custom source-standard order is closest.
- uses old CategoryStandardLandingPage: FALSE.
- uses old CategoryStandardResultsPageShell: FALSE.
- uses CategoryLandingChipsRail: FALSE.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE in custom components.
- uses old custom search shell: TRUE.
- V2 import exists but visual shell is still custom: FALSE.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: TRUE when publish props exist.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: `layout !== "landing"` or missing `publishHref` / `publishLabel`.
- Publish/advertise href: `/clasificados/publicar/rentas/privado`.
- Publish/advertise label: `Publicar renta` / `Post a rental`.
- Browse all href: `/clasificados/rentas/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED; custom canvas does not define fallback.
- Uses V2 CTA classes: FALSE.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE; custom grid changes if publish is missing.
- Needs V2 slot lock fix: TRUE before converting to V2, but protected as source standard.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: TRUE.
- Count/sort/view/per-page controls after active filters: TRUE.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE.
- Sponsor section rendered on results: FALSE.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: FALSE.
- Category shortcut pill row rendered on results: FALSE.
- Quick filters rendered on results: FALSE.
- Random CTA row rendered on results: FALSE.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: FALSE.
- Needs cleanup before migration: FALSE as protected source; route alias cleanup needed.

#### Field / Filter Source Mapping
- Keyword/search: `rentasBrowseContract.ts`, `rentasBrowseFilters.ts` (`q`).
- City/state/zip/country: `rentasBrowseContract.ts`.
- Category/type: `tipo`, `subtype`, `propiedad`, `kind`, `estado`.
- Price/budget: `precio`, `rent_min`, `rent_max`, `deposit_min`, `deposit_max`.
- Contact/action: listing/contact JSON in `mapListingRowToRentasPublicListing.ts`.
- Media: `rentasListingPublicSelect.ts`, mapped listing rows.
- Supported filter drawer fields: lease, baths, half baths, parking, sqft, room bath/kitchen, amueblado, mascotas, highlights, pool.
- Landing discovery fields backed by app data: gateway shortcuts built in `rentasLandingGateway.ts`.
- Results URL query keys: `q`, `tipo`, `subtype`, `precio`, `recs`, `branch`, `propiedad`, `city`, `state`, `zip`, `country`, `rent_min`, `rent_max`, `deposit_min`, `deposit_max`, `lease`, `baths_min`, `half_baths_min`, `parking_min`, `sqft_min`, `sqft_max`, `room_bath`, `room_kitchen`, `amueblado`, `mascotas`, `highlights`, `pool`, `kind`, `estado`, `sort`, `page`.
- Filters fake/deferred: `lat`, `lng`, `radius_km` stripped/not applied.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.
- Recommended action: leave Rentas under Clasificados canonical engine.

#### Canonical / Alias Decision
- Keep `/clasificados/rentas/results` canonical.
- Add `/clasificados/rentas/resultados` redirect or re-export only if Spanish alias parity is desired.

#### Migration Files
- Protect: `rentas/page.tsx`, `RentasLandingHub.tsx`, `landing/**`, `components/RentasCompactSearchCanvas.tsx`, `results/**`, `shared/**`.
- Migration target only if needed: V2 source extraction parity, not a simple replacement.

#### Locked Files
- `app/(site)/clasificados/rentas/**` should be locked as source standard unless a visible bug requires change.

#### Risk Notes
- Missing `/resultados` caused owner-observed not-found.
- Rich rent-specific filters make generic migration high risk.

#### Recommendation
- Protect/no migration because source standard.
- Difficulty: HIGH.
- Batch: protected source standard.

### Bienes Raices

#### URLs
- Landing URL: `/clasificados/bienes-raices`.
- Results URL: `/clasificados/bienes-raices/results`.
- Spanish alias URL: `/clasificados/bienes-raices/resultados`.
- English alias URL: `/clasificados/bienes-raices/results`.
- Route user should QA: both `/clasificados/bienes-raices/results?lang=es` and `/clasificados/bienes-raices/resultados?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/bienes-raices/page.tsx`.
- Results implementation route file: `app/(site)/clasificados/bienes-raices/resultados/page.tsx`.
- Alias route file: `app/(site)/clasificados/bienes-raices/results/page.tsx`.
- `dynamic = "force-dynamic"`: FALSE in inspected landing/results files.
- Redirects: FALSE; `/results` re-exports `/resultados`.
- Wraps another component: TRUE, landing wraps `BienesRaicesLandingHub`; results renders `BienesRaicesResultsClient`.
- Mode/market/lane prop: no lane prop.

#### Component Tree
- Top route component: `BienesRaicesPage`, `BienesRaicesResultsPage`.
- Main landing component: `BienesRaicesLandingHub`, `BienesRaicesLandingView`.
- Main results component: `BienesRaicesResultsClient`.
- Search shell component: `BienesRaicesCompactSearchCanvas`.
- Filter drawer component: `BienesRaicesResultsFilterDrawer`.
- Active filters component: `BienesRaicesResultsActiveFilters`.
- Toolbar/sort/view/per-page component: `BienesRaicesResultsHeader`.
- Card/listing renderer: `BienesRaicesNegocioCard`.
- Empty state component: inline.
- Partner/sponsor component if present: `BienesRaicesSponsorsLane` on landing and results.
- Discovery/shortcut component if present: `BienesRaicesLandingIntentTiles`, `BienesRaicesLandingShortcutSections`.
- Old custom shell component: `BienesRaicesLandingShell`, `BienesRaicesResultsShell`, `BienesRaicesResultsGatewayPanel`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: FALSE.
- renders LeonixCategoryPageShell: FALSE.
- renders LeonixCategoryHeroGateway: FALSE.
- renders LeonixCategorySearchCanvas: FALSE.
- renders LeonixCategoryCta: FALSE.
- renders LeonixCategoryPartnerSection on landing only: FALSE.
- renders LeonixCategoryDiscoveryGrid on landing only: FALSE.
- renders LeonixCategoryShortcutSection on landing only: FALSE.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE; custom source standard.
- uses old CategoryStandardLandingPage: FALSE.
- uses old CategoryStandardResultsPageShell: FALSE.
- uses CategoryLandingChipsRail: FALSE.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE.
- uses old custom search shell: TRUE.
- V2 import exists but visual shell is still custom: FALSE.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: TRUE when publish props exist.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: missing publish props or non-landing mode.
- Publish/advertise href: `/publicar/bienes-raices/negocios` on landing; `/clasificados/publicar/bienes-raices` in results gateway.
- Publish/advertise label: `copy.publishNegocio` / `copy.footerPublish`.
- Browse all href: `/clasificados/bienes-raices/results`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: FALSE.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE before generic migration.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: TRUE.
- Count/sort/view/per-page controls after active filters: TRUE.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE.
- Sponsor section rendered on results: TRUE (`BienesRaicesSponsorsLane`).
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: FALSE.
- Category shortcut pill row rendered on results: FALSE.
- Quick filters rendered on results: FALSE.
- Random CTA row rendered on results: FALSE.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: FALSE.
- Needs cleanup before migration: TRUE, but protected as source standard.

#### Field / Filter Source Mapping
- Keyword/search: `brResultsUrlState.ts`, `brResultsFilters.ts` (`q`).
- City/state/zip/country: `brFilterContract.ts`.
- Category/type: `operationType`, `propertyType`, `sellerType`.
- Price/budget: `priceMin`, `priceMax`, `precio`.
- Contact/action: `contact_json`, BR card mapper.
- Media: `mapBrListingRowToCard.ts`.
- Supported filter drawer fields: beds/recs, baths, pets, furnished, pool plus operation/property/seller.
- Landing discovery fields backed by app data: intent tiles and live/recent/sponsor inventory.
- Results URL query keys: `lang`, `q`, `city`, `colonia`, `state`, `country`, `zip`, `operationType`, `propertyType`, `sellerType`, `priceMin`, `priceMax`, `beds`, `baths`, `pets`, `furnished`, `pool`, `sort`, `page`, legacy aux `primary`, `secondary`, `precio`, `tipo`, `recs`, `propiedad`.
- Filters fake/deferred: many characteristic keys such as `patio`, `balcony`, `view`, `gated`, `homeOffice`, `solar`, `fireplace`, `laundry`, `coveredParking`, `accessControl`, `elevator`, `terrace`, `gym`, `amenities`, `walkInCloset`, `highCeilings`, `smartHome`.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`, lane `bienes-raices`.
- Target URL: `/clasificados/bienes-raices?lang=...`.
- Target is canonical Clasificados route: TRUE.
- Recommended action: leave link as canonical.

#### Canonical / Alias Decision
- Decide and document canonical: current route constant points to `/results`, but implementation lives at `/resultados`.
- Recommended action: keep `/results` canonical and make `/resultados` a redirect or explicit alias with metadata parity.

#### Migration Files
- `app/(site)/clasificados/bienes-raices/page.tsx`
- `app/(site)/clasificados/bienes-raices/landing/**`
- `app/(site)/clasificados/bienes-raices/components/BienesRaicesCompactSearchCanvas.tsx`
- `app/(site)/clasificados/bienes-raices/resultados/**`
- `app/(site)/clasificados/bienes-raices/shared/**`

#### Locked Files
- Protect as second source standard.

#### Risk Notes
- Results include sponsor lane, which violates future results-shell rule unless explicitly approved.
- Route ownership comments/constants disagree on `/results` vs `/resultados`.

#### Recommendation
- Protect/no migration because source standard.
- Difficulty: HIGH.
- Batch: protected source standard.

### Autos Privado

#### URLs
- Landing URL: `/clasificados/autos`.
- Results URL: `/clasificados/autos/results`.
- Spanish alias URL: `/clasificados/autos/resultados`.
- English alias URL: `/clasificados/autos/results`.
- Route user should QA: `/clasificados/autos/results?lang=es` and dealer query behavior at `/clasificados/autos/results?lang=es&seller=dealer`.

#### Route Files
- Landing route file: `app/(site)/clasificados/autos/page.tsx`.
- Results implementation route file: `app/(site)/clasificados/autos/resultados/page.tsx`.
- Alias route file: `app/(site)/clasificados/autos/results/page.tsx`.
- `dynamic = "force-dynamic"`: not exported in inspected autos route files.
- Redirects: client `router.replace` only when `seller` is missing/invalid.
- Wraps another component: landing wraps `AutosLandingPage market="private"`; results wraps `AutosPublicResultsShell market="private"`.
- Mode/market/lane prop: `market="private"`.

#### Component Tree
- Top route component: autos page/results page.
- Main landing component: `AutosLandingPage`.
- Main results component: `AutosPublicResultsShell`.
- Search shell component: `LeonixCategorySearchCanvas` on landing; autos custom results search/filter controls on results.
- Filter drawer component: `AutosPublicFilterRail` / autos filter UI.
- Active filters component: autos active filter chips.
- Toolbar/sort/view/per-page component: autos results controls.
- Card/listing renderer: autos public vehicle cards.
- Empty state component: autos results empty/recovery.
- Partner/sponsor component if present: dealer/featured bands.
- Discovery/shortcut component if present: `AutosQuickChips`, peer links, recent/dealer bands.
- Old custom shell component: `CategoryStandardResultsPageShell`, autos public shell.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- renders LeonixCategoryPageShell: TRUE on landing.
- renders LeonixCategoryHeroGateway: TRUE on landing.
- renders LeonixCategorySearchCanvas: TRUE on landing.
- renders LeonixCategoryCta: not verified as primary shell CTA.
- renders LeonixCategoryPartnerSection on landing only: partial/custom.
- renders LeonixCategoryDiscoveryGrid on landing only: partial/custom.
- renders LeonixCategoryShortcutSection on landing only: partial/custom.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardLandingPage: FALSE.
- uses old CategoryStandardResultsPageShell: TRUE on results.
- uses CategoryLandingChipsRail: TRUE via `AutosQuickChips`.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE.
- uses old custom search shell: TRUE on results.
- V2 import exists but visual shell is still custom: TRUE/PARTIAL.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE on landing.
- Primary CTA slot visible on live landing: TRUE through custom autos CTA, V2 slot behavior requires verification.
- CTA slot can disappear due to condition: TRUE if V2 `showPublish` is not set or publish props missing.
- Condition that hides it: `LeonixCategorySearchCanvas` requires `showPublish && publishHref && publishLabel`.
- Publish/advertise href: private `/publicar/autos/privado`.
- Publish/advertise label: `marketCopy.postAd`.
- Browse all href: `/clasificados/autos/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE in current V2 component.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: PARTIAL.
- Count/sort/view/per-page controls after active filters: PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: PARTIAL.
- Sponsor section rendered on results: TRUE/PARTIAL dealer/featured bands.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: TRUE/PARTIAL recent/peer/dealer bands.
- Category shortcut pill row rendered on results: TRUE.
- Quick filters rendered on results: TRUE.
- Random CTA row rendered on results: TRUE/PARTIAL.
- Cross-link promo block rendered between shell and results: TRUE.
- Old featured/destacados section rendered on results: TRUE/PARTIAL.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Keyword/search: `autosBrowseFilterContract.ts`, `autosPublicFilters.ts` (`q`).
- City/state/zip/country: `city`, `zip`; no state/country in autos contract.
- Category/type: make/model/bodyStyle/condition/seller.
- Price/budget: `priceMin`, `priceMax`.
- Contact/action: autos mapped public listing, seller lane.
- Media: `mapAutosClassifiedsToPublic.ts`, API `/api/clasificados/autos/public/listings`.
- Supported filter drawer fields: make, model, year, condition, seller, body style, transmission, drivetrain, fuel, colors, mileage, title, has photos/video.
- Results URL query keys: `lang`, `q`, `city`, `zip`, `radiusMiles`, `priceMin`, `priceMax`, `make`, `model`, `yearMin`, `yearMax`, `condition`, `seller`, `bodyStyle`, `transmission`, `drivetrain`, `fuelType`, `exteriorColor`, `interiorColor`, `mileageMin`, `mileageMax`, `titleStatus`, `hasPhotos`, `hasVideo`, `sort`, `page`, `perPage`.
- Filters fake/deferred: `radiusMiles` parsed/serialized but not applied.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE indirectly as autos dealer lane.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`, lane `autos-dealer`.
- Target URL: `/clasificados/autos/results?lang=...&seller=dealer`.
- Target is canonical Clasificados route: FALSE for dealer UX.
- Target is alias route: TRUE, query alias to dealer inventory.
- Alias route renders same canonical component: FALSE; private chrome can show dealer inventory.
- Recommended action: change link to `/clasificados/dealers-de-autos/results?lang=...&seller=dealer`.

#### Canonical / Alias Decision
- Private canonical: `/clasificados/autos` and `/clasificados/autos/results`.
- Avoid generating new dealer links through `/clasificados/autos/results?seller=dealer`.

#### Migration Files
- `app/(site)/clasificados/autos/page.tsx`
- `app/(site)/clasificados/autos/landing/**`
- `app/(site)/clasificados/autos/resultados/page.tsx`
- `app/(site)/clasificados/autos/components/public/**`
- `app/(site)/clasificados/autos/filters/**`

#### Locked Files
- Do not change autos UI in this audit.

#### Risk Notes
- Dealer query alias can create private-market copy with dealer inventory.
- Results are not V2 and remain cluttered.

#### Recommendation
- V2-ready after route/canonical cleanup and results cleanup.
- Difficulty: MEDIUM/HIGH.
- Batch: special category with custom inventory/results logic.

### Dealers de Autos / Concesionarios

#### URLs
- Landing URL: `/clasificados/dealers-de-autos`.
- Results URL: `/clasificados/dealers-de-autos/results`.
- Spanish alias URL: none found.
- English alias URL: `/clasificados/dealers-de-autos/results`.
- Additional alias/exposure URL: `/clasificados/autos/results?seller=dealer`.
- Route user should QA: `/clasificados/dealers-de-autos/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/dealers-de-autos/page.tsx`.
- Results route file: `app/(site)/clasificados/dealers-de-autos/results/page.tsx`.
- Alias route file if any: no route alias; query alias lives on autos results.
- `dynamic = "force-dynamic"`: not exported in inspected dealer route files.
- Redirects: results client defaults seller to dealer if missing.
- Wraps another component: TRUE, wraps autos shared components.
- Mode/market/lane prop: `market="dealer"`.

#### Component Tree
- Top route component: dealers page/results page.
- Main landing component: `AutosLandingPage market="dealer"`.
- Main results component: `AutosPublicResultsShell market="dealer"`.
- Search shell/filter/card/empty components: shared autos public components.
- Partner/sponsor/discovery components: dealer hub card, featured dealer/inventory concepts.
- Old custom shell component: autos public shell and old `CategoryStandardResultsPageShell`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE via shared autos landing.
- renders LeonixCategoryPageShell: TRUE on landing.
- renders LeonixCategoryHeroGateway: TRUE on landing.
- renders LeonixCategorySearchCanvas: TRUE on landing.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardResultsPageShell: TRUE on results.
- uses custom shell wrappers: TRUE.
- V2 import exists but visual shell is still custom: TRUE/PARTIAL.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE on landing.
- Primary CTA slot visible on live landing: TRUE through autos custom CTA.
- CTA slot can disappear due to condition: TRUE in V2 canvas if `showPublish` missing.
- Publish/advertise href: `/publicar/autos/negocios`.
- Publish/advertise label: dealer market copy.
- Browse all href: `/clasificados/dealers-de-autos/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Same as Autos results: not clean, old/custom, with dealer/featured bands and query alias risk.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Same source as Autos, with `seller=dealer` lane.
- Dealer inventory group detail also exists at `app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/page.tsx`.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`.
- Current target URL: `/clasificados/autos/results?lang=...&seller=dealer`.
- Canonical target: `/clasificados/dealers-de-autos/results?lang=...&seller=dealer`.
- Recommended action: change link to canonical dealer route.

#### Canonical / Alias Decision
- Dealer canonical landing/results should be `/clasificados/dealers-de-autos` and `/clasificados/dealers-de-autos/results`.
- Keep autos seller query only as compatibility if needed.

#### Migration Files
- `app/(site)/clasificados/dealers-de-autos/**`
- shared autos public components listed in Autos section.

#### Locked Files
- Do not change autos/dealers UI in this audit.

#### Risk Notes
- High ownership coupling with Autos.

#### Recommendation
- High-risk special migration after canonical cleanup.
- Difficulty: MEDIUM/HIGH.
- Batch: autos/dealers canonical cleanup.

### Restaurantes

#### URLs
- Landing URL: `/clasificados/restaurantes`.
- Results URL: `/clasificados/restaurantes/results`.
- Spanish alias URL: `/clasificados/restaurantes/resultados`.
- Detail URL: `/clasificados/restaurantes/[slug]`.
- Route user should QA: `/clasificados/restaurantes/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/restaurantes/page.tsx`.
- Results implementation: `app/(site)/clasificados/restaurantes/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/restaurantes/results/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE on landing/results/detail implementation.
- Redirects: `/results` re-exports, no redirect.
- Wraps another component: TRUE.
- Mode/market/lane prop: none.

#### Component Tree
- Top route component: restaurants landing/results pages.
- Main landing component: `RestaurantesLandingPage`.
- Main results component: `RestaurantesResultsShell`.
- Search shell component: `LeonixCategorySearchCanvas` on landing; old standard/custom results search on results.
- Filter drawer component: restaurante results filters.
- Active filters component: restaurante active filters/chips.
- Toolbar/sort/view/per-page component: old category results header/sort/pagination.
- Card/listing renderer: restaurante cards from blueprint/public rows.
- Empty state component: results empty state.
- Partner/sponsor component: `LeonixCategoryPartnerSection` on landing; sponsored/promoted concepts in results code.
- Discovery/shortcut component: landing V2 discovery/shortcuts.
- Old custom shell component: `RestaurantesResultsShell`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- renders LeonixCategoryPageShell: TRUE on landing.
- renders LeonixCategoryHeroGateway: TRUE on landing.
- renders LeonixCategorySearchCanvas: TRUE on landing.
- renders LeonixCategoryCta: copy exists; not bottom-shell primary.
- renders LeonixCategoryPartnerSection on landing only: TRUE.
- renders LeonixCategoryDiscoveryGrid on landing only: TRUE.
- renders LeonixCategoryShortcutSection on landing only: TRUE.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardLandingPage: FALSE.
- uses old CategoryStandardResultsPageShell: likely TRUE/PARTIAL through old results system.
- uses CategoryLandingChipsRail: not primary; landing uses V2 shortcuts.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE.
- uses old custom search shell: TRUE on results.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN because `showPublish` not passed to V2 canvas.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: `showPublish` defaults FALSE in `LeonixCategorySearchCanvas`.
- Publish/advertise href: `/publicar/restaurantes`.
- Publish/advertise label: sponsor/publish CTA copy.
- Browse all href: `/clasificados/restaurantes/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: TRUE/PARTIAL.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: PARTIAL.
- Count/sort/view/per-page controls after active filters: PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE/PARTIAL.
- Sponsor section rendered on results: FALSE visible in inspected output, but promoted/sponsored code/data exists.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: FALSE.
- Category shortcut pill row rendered on results: FALSE/PARTIAL.
- Quick filters rendered on results: PARTIAL via promoted filters.
- Random CTA row rendered on results: FALSE/PARTIAL.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: FALSE visible, but `destacadosRows` computed.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Keyword/search: `restaurantesDiscoveryContract.ts` (`q`).
- City/state/zip/country: city/state/zip supported; country UI/URL only per contract caveat.
- Category/type: cuisine, business type, service, family, price, diet, spoken language, payment, ambiance, amenities, accessibility, food/menu/social/web/WhatsApp flags.
- Price/budget: `price`.
- Contact/action: menu/social/website/whatsapp/reservations/preorder/pickup flags.
- Media: blueprint/public row data.
- Supported filter drawer fields: broad discovery contract flags.
- Results URL query keys: `q`, `city`, `state`, `zip`, `country`, `cuisine`, `biz`, `svc`, `family`, `price`, `diet`, `spoken`, `pay`, `amb`, `amen`, `acc`, `food`, `menu`, `social`, `web`, `wa`, `sort`, `open`, `near`, `top`, `mv`, `hb`, `ft`, `pu`, `hl`, `saved`, `page`, `perPage`, `nbh`, `rsv`, `pre`, `pku`, `feat`, `lxv`, `drm`.
- Filters fake/deferred: country is UI/URL only; data quality depends on blueprint completeness.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`, lane `restaurantes`.
- Target URL: `/clasificados/restaurantes?lang=...`.
- Target is canonical Clasificados route: TRUE.
- Recommended action: leave link as canonical.

#### Canonical / Alias Decision
- Use `/clasificados/restaurantes/results` as canonical.
- Keep `/resultados` as alias/redirect after migration.

#### Migration Files
- `app/(site)/clasificados/restaurantes/page.tsx`
- `app/(site)/clasificados/restaurantes/landing/**`
- `app/(site)/clasificados/restaurantes/resultados/page.tsx`
- `app/(site)/clasificados/restaurantes/components/RestaurantesResultsShell.tsx`
- `app/(site)/clasificados/restaurantes/lib/**`

#### Locked Files
- No UI changes in this audit.

#### Risk Notes
- Landing is V2 but results are not.
- Results code still carries promoted/destacados concepts.

#### Recommendation
- V2-ready after CTA slot fix and results shell cleanup.
- Difficulty: MEDIUM.
- Batch: pilot proof.

### Servicios

#### URLs
- Landing URL: `/clasificados/servicios`.
- Results URL: `/clasificados/servicios/results`.
- Spanish alias URL: `/clasificados/servicios/resultados`.
- Detail URL: `/clasificados/servicios/[slug]`.
- Route user should QA: `/clasificados/servicios/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/servicios/page.tsx`.
- Results implementation: `app/(site)/clasificados/servicios/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/servicios/results/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE on landing/results/detail.
- Redirects: `/results` re-exports `/resultados`.
- Wraps another component: TRUE.
- Mode/market/lane prop: none.

#### Component Tree
- Top route component: services landing/results pages.
- Main landing component: `ServiciosLandingPage`.
- Main results component: `ServiciosResultsPageShell` plus results implementation.
- Search shell component: `LeonixCategorySearchCanvas` on landing; old standard/custom on results.
- Filter drawer component: `ServiciosResultsAdvancedFilterFields` / compact drawer.
- Active filters component: servicios chips.
- Toolbar/sort/view/per-page component: results header/sort.
- Card/listing renderer: servicios cards.
- Empty state component: servicios empty state.
- Partner/sponsor component: `ServiciosDestacadosSection` on results.
- Discovery/shortcut component: landing quick chips/categories/recent.
- Old custom shell component: `CategoryStandardResultsPageShell`, `ServiciosResultsPageShell`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- renders LeonixCategoryPageShell: TRUE on landing.
- renders LeonixCategoryHeroGateway: TRUE on landing.
- renders LeonixCategorySearchCanvas: TRUE on landing.
- renders LeonixCategoryCta: FALSE/PARTIAL, custom publish CTA.
- renders LeonixCategoryPartnerSection on landing only: PARTIAL/custom.
- renders LeonixCategoryDiscoveryGrid on landing only: PARTIAL/custom.
- renders LeonixCategoryShortcutSection on landing only: PARTIAL/custom.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardResultsPageShell: TRUE.
- uses CategoryLandingChipsRail: TRUE in service quick chips.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE.
- uses old custom search shell: TRUE on results.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: V2 `showPublish` default FALSE.
- Publish/advertise href: `/clasificados/publicar/servicios/checkpoint`.
- Publish/advertise label: service publish copy.
- Browse all href: `/clasificados/servicios/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: PARTIAL.
- Count/sort/view/per-page controls after active filters: PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE/PARTIAL.
- Sponsor section rendered on results: TRUE (`ServiciosDestacadosSection`).
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: FALSE.
- Category shortcut pill row rendered on results: FALSE/PARTIAL.
- Quick filters rendered on results: TRUE/PARTIAL.
- Random CTA row rendered on results: TRUE/PARTIAL.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: TRUE.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Keyword/search: `serviciosResultsFilter.ts` (`q`).
- City/state/zip/country: live row/profile city/state/zip/country.
- Category/type: `group`, seller/profile/service flags.
- Price/budget: offers/promo fields, no single price budget contract.
- Contact/action: whatsapp, call, email, web, msg, physical location.
- Media: has photos/videos/offers.
- Supported filter drawer fields: verified, bilingual, languages, open now, licensed, insured, free estimate/consultation, same day, appointment, emergency, mobile, weekend, vintage.
- Results URL query keys: `city`, `state`, `zip`, `country`, `group`, `q`, `sort`, `seller`, `whatsapp`, `promo`, `call`, `verified`, `web`, `bilingual`, `email`, `emergency`, `mobileSvc`, `msg`, `phys`, `svcMulti`, `offer`, `legal`, `langEs`, `langEn`, `langOt`, `vint`, `wknd`, `open_now`, `licensed`, `insured`, `free_estimate`, `free_consultation`, `has_photos`, `has_videos`, `has_offers`, `same_day`, `appointment`, `page`, `perPage`.
- Filters fake/deferred: open-now contract note says pipeline reliability caveat, but code applies it.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`, lane `servicios`.
- Target URL: `/clasificados/servicios?lang=...`.
- Target is canonical Clasificados route: TRUE.
- Recommended action: leave link as canonical.

#### Canonical / Alias Decision
- Use `/clasificados/servicios/results` as canonical.
- Keep `/resultados` as alias/redirect.

#### Migration Files
- `app/(site)/clasificados/servicios/page.tsx`
- `app/(site)/clasificados/servicios/landing/**`
- `app/(site)/clasificados/servicios/resultados/page.tsx`
- `app/(site)/clasificados/servicios/ServiciosResultsPageShell.tsx`
- `app/(site)/clasificados/servicios/lib/**`

#### Locked Files
- No UI changes in this audit.

#### Risk Notes
- Business-heavy filters and destacados content make migration higher risk.

#### Recommendation
- V2-ready after CTA slot fix and results cleanup.
- Difficulty: HIGH.
- Batch: business-heavy.

### Ofertas Locales

#### URLs
- Landing URL: `/clasificados/ofertas-locales`.
- Results URL: `/clasificados/ofertas-locales/results`.
- Spanish alias URL: none found.
- Detail URL: `/clasificados/ofertas-locales/[id]`.
- Route user should QA: `/clasificados/ofertas-locales/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/ofertas-locales/page.tsx`.
- Results route file: `app/(site)/clasificados/ofertas-locales/results/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE on landing/results/detail.
- Redirects: FALSE.
- Wraps another component: TRUE, both render `OfertasLocalesPublicSearchClient`.
- Mode/market/lane prop: `mode="landing"` / `mode="results"`.

#### Component Tree
- Top route component: ofertas landing/results pages.
- Main landing/results component: `OfertasLocalesPublicSearchClient`.
- Search shell component: `LeonixCategorySearchCanvas`.
- Filter drawer component: `OfertasLocalesFiltersDrawer`.
- Active filters component: inline active filter state.
- Toolbar/sort/view/per-page component: result counts/sort inside client.
- Card/listing renderer: offer cards and item cards.
- Empty state component: inline offer/item empty states.
- Partner/sponsor component: `LeonixCategoryPartnerSection` on landing.
- Discovery/shortcut component: V2 discovery/shortcut on landing.
- Old custom shell component: none primary.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE.
- renders LeonixCategoryPageShell: TRUE.
- renders LeonixCategoryHeroGateway: TRUE.
- renders LeonixCategorySearchCanvas: TRUE.
- renders LeonixCategoryCta: TRUE/PARTIAL through partner CTA.
- renders LeonixCategoryPartnerSection on landing only: TRUE.
- renders LeonixCategoryDiscoveryGrid on landing only: TRUE.
- renders LeonixCategoryShortcutSection on landing only: TRUE.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE; custom client but close.
- uses old CategoryStandardLandingPage: FALSE.
- uses old CategoryStandardResultsPageShell: FALSE.
- uses CategoryLandingChipsRail: FALSE.
- uses custom shell wrappers: FALSE/PARTIAL.
- uses inline CTA classes: TRUE in detail/client sections.
- uses old custom search shell: FALSE.
- V2 import exists but visual shell is still custom: PARTIAL.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: `publishHref`/`publishLabel` passed only on landing, but `showPublish` is not passed and defaults FALSE.
- Publish/advertise href: `/publicar/ofertas-locales?lang=...`.
- Publish/advertise label: `c.sponsorPrimaryCta`.
- Browse all href: `/clasificados/ofertas-locales/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: TRUE.
- Uses inline CTA classes: TRUE/PARTIAL.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: TRUE/PARTIAL.
- Count/sort/view/per-page controls after active filters: TRUE/PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: PARTIAL, separate offers/items empty states.
- Sponsor section rendered on results: FALSE.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: FALSE.
- Category shortcut pill row rendered on results: FALSE.
- Quick filters rendered on results: FALSE.
- Random CTA row rendered on results: TRUE/PARTIAL shopping-list CTA remains.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: FALSE.
- Needs cleanup before migration: TRUE/PARTIAL; product decision needed for shopping list.

#### Field / Filter Source Mapping
- Keyword/search: `OfertasLocalesPublicSearchClient.tsx`, `ofertasLocalesPublicSearchHelpers.ts`.
- City/state/zip/country: client query keys and helpers.
- Category/type: `category`, `marketType`, `offerType`.
- Price/budget: item sort can include price-low; offer/item data has pricing.
- Contact/action: phone, WhatsApp, website, directions.
- Media: flyer/coupon/item assets.
- Supported filter drawer fields: q, location, category, market type, offer type, sort.
- Results URL query keys: `lang`, `q`, `city`, `state`, `zip`, `country`, `category`, `marketType`, `offerType`, `sort`.
- Filters fake/deferred: no complex fake filters found.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`, lane `ofertas-locales`; also `app/(site)/clasificados/page.tsx` and `OfertasLocalesHubCategoryCard.tsx`.
- Target URL: `/clasificados/ofertas-locales?lang=...`.
- Target is canonical Clasificados route: TRUE.
- Recommended action: leave canonical.

#### Canonical / Alias Decision
- Keep `/clasificados/ofertas-locales/results` canonical.
- Add `/resultados` alias only if Spanish parity is required.

#### Migration Files
- `app/(site)/clasificados/ofertas-locales/page.tsx`
- `app/(site)/clasificados/ofertas-locales/results/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesFiltersDrawer.tsx`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`

#### Locked Files
- Preserve shopping list behavior.

#### Risk Notes
- `showPublish` is missing while publish href/label exist.

#### Recommendation
- V2-ready after CTA slot fix and explicit results CTA/product exception decision.
- Difficulty: LOW/MEDIUM.
- Batch: pilot proof.

### En Venta / Varios

#### URLs
- Landing URL: `/clasificados/en-venta`.
- Results URL: `/clasificados/en-venta/results`.
- Spanish alias URL: none found.
- `/clasificados/varios`: no route found.
- Route user should QA: `/clasificados/en-venta/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/en-venta/page.tsx`.
- Results route file: `app/(site)/clasificados/en-venta/results/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE.
- Redirects: FALSE.
- Wraps another component: TRUE, landing `EnVentaHubPageClient`, results `EnVentaResultsClient`.
- Mode/market/lane prop: none.

#### Component Tree
- Main landing component: `EnVentaHubPageClient`.
- Main results component: `EnVentaResultsClient`.
- Search shell: `LeonixCategorySearchCanvas` on landing; compact custom results search.
- Filter drawer: `EnVentaResultsFiltersDrawer`.
- Active filters: active chips in results.
- Toolbar/sort/view/per-page: results sort/view/perPage controls.
- Card renderer: `EnVentaResultsListingSections`.
- Empty state: inline.
- Partner/discovery/shortcut: V2 landing shortcuts, `EnVentaHubRecentListings`, visibility/trust CTAs.
- Old custom shell: custom results client.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- renders LeonixCategoryPageShell: TRUE.
- renders LeonixCategoryHeroGateway: TRUE.
- renders LeonixCategorySearchCanvas: TRUE.
- renders LeonixCategoryCta: FALSE/PARTIAL.
- renders LeonixCategoryPartnerSection on landing only: PARTIAL/custom.
- renders LeonixCategoryDiscoveryGrid on landing only: TRUE/PARTIAL.
- renders LeonixCategoryShortcutSection on landing only: TRUE.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardResultsPageShell: FALSE.
- uses custom shell wrappers: TRUE on results.
- uses inline CTA classes: TRUE.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: V2 `showPublish` default FALSE.
- Publish/advertise href: `/clasificados/publicar/en-venta`.
- Publish/advertise label: landing publish copy.
- Browse all href: `/clasificados/en-venta/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE including sticky/mobile CTA.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: TRUE.
- Count/sort/view/per-page controls after active filters: TRUE.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: PARTIAL.
- Sponsor section rendered on results: FALSE.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: PARTIAL.
- Category shortcut pill row rendered on results: FALSE.
- Quick filters rendered on results: PARTIAL.
- Random CTA row rendered on results: TRUE.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: TRUE/PARTIAL promoted strip.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Keyword/search: `enVentaResultsUrlParams.ts`, `buildEnVentaSearchText.ts`.
- City/state/zip/country: URL params and listing rows.
- Category/type: `evDept`, `evSub`, `itemType`, `cond`, `seller`.
- Price/budget: `priceMin`, `priceMax`, free/nego flags.
- Contact/action: seller/contact fields and listing DTO.
- Media: `images`, `hasPhoto`, `hasVideo`.
- Supported filter drawer fields: delivery/pickup/ship, seller, free, negotiable, meetup, featured, sort, view, pagination.
- Results URL query keys: `lang`, `q`, `city`, `state`, `zip`, `country`, `evDept`, `evSub`, `itemType`, `cond`, `priceMin`, `priceMax`, `pickup`, `ship`, `delivery`, `seller`, `free`, `nego`, `meetup`, `hasPhoto`, `hasVideo`, `sort`, `view`, `page`, `perPage`, `featured`.
- Filters fake/deferred: mostly real after broad Supabase fetch.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.

#### Canonical / Alias Decision
- Keep `/clasificados/en-venta/results` canonical.
- Add `/resultados` alias only if Spanish parity is required.
- No `/clasificados/varios` route found; do not invent one.

#### Migration Files
- `app/(site)/clasificados/en-venta/page.tsx`
- `app/(site)/clasificados/en-venta/EnVentaHubPageClient.tsx`
- `app/(site)/clasificados/en-venta/results/**`
- `app/lib/clasificados/en-venta/**`

#### Locked Files
- Preserve recent listings and marketplace behavior.

#### Risk Notes
- Results are custom and cluttered; no `/resultados` alias.

#### Recommendation
- V2-ready after CTA slot fix and results cleanup.
- Difficulty: MEDIUM.
- Batch: marketplace.

### Empleos

#### URLs
- Landing URL: `/clasificados/empleos`.
- Results URL: `/clasificados/empleos/results`.
- Spanish alias URL: `/clasificados/empleos/resultados`.
- Detail URL: `/clasificados/empleos/[slug]`.
- Route user should QA: `/clasificados/empleos/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/empleos/page.tsx`.
- Results implementation: `app/(site)/clasificados/empleos/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/empleos/results/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE on `/resultados` and detail.
- Redirects: `/results` re-exports `/resultados`.
- Wraps another component: TRUE.
- Mode/market/lane prop: jobs lane internally.

#### Component Tree
- Main landing: `EmpleosLandingServer`, `EmpleosLandingPage`.
- Main results: `EmpleosResultsView`.
- Search shell: `LeonixCategorySearchCanvas` on landing; custom jobs results form.
- Filter drawer: `EmpleosBrowseDrawerFields`.
- Active filters: jobs chips.
- Toolbar/sort/view/per-page: custom sort/list controls.
- Card renderer: job cards/list blocks.
- Empty state: jobs recovery actions.
- Partner/discovery/shortcut: `JobCategoryGrid`, `LatestJobsAndEmployer`, `CategoryVisibilityCta`.
- Old custom shell: `CategoryStandardResultsPageShell`, custom jobs results.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- renders LeonixCategoryPageShell: TRUE.
- renders LeonixCategoryHeroGateway: TRUE.
- renders LeonixCategorySearchCanvas: TRUE.
- renders LeonixCategoryCta: FALSE/PARTIAL.
- renders LeonixCategoryPartnerSection on landing only: FALSE/custom.
- renders LeonixCategoryDiscoveryGrid on landing only: TRUE/PARTIAL.
- renders LeonixCategoryShortcutSection on landing only: TRUE/PARTIAL.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardResultsPageShell: TRUE.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: V2 `showPublish` default FALSE.
- Publish/advertise href: `/clasificados/publicar/empleos` / publish hub path.
- Publish/advertise label: `Publicar empleo` / `Post a job`.
- Browse all href: `/clasificados/empleos/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: PARTIAL.
- Count/sort/view/per-page controls after active filters: PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: FALSE/PARTIAL.
- Sponsor section rendered on results: FALSE.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: TRUE/PARTIAL adjacent prompts.
- Category shortcut pill row rendered on results: PARTIAL.
- Quick filters rendered on results: TRUE.
- Random CTA row rendered on results: TRUE/PARTIAL.
- Cross-link promo block rendered between shell and results: TRUE/PARTIAL.
- Old featured/destacados section rendered on results: TRUE.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Keyword/search: `empleosResultsQuery.ts`, API `/api/clasificados/empleos/listings`.
- City/state/zip/country: jobs query/state.
- Category/type: `category`, `jobType`, `modality`, `experience`, `companyType`, `lane`, `industry`.
- Price/budget: `salaryMin`, `salaryMax`.
- Contact/action: quick apply, employer contacts in public listings.
- Media: job/company media as available.
- Supported filter drawer fields: featured, recent, quick apply, verified, premium, bilingual, industry.
- Results URL query keys: `q`, `city`, `state`, `zip`, `country`, `category`, `jobType`, `modality`, `salaryMin`, `salaryMax`, `experience`, `companyType`, `featured`, `recent`, `quickApply`, `verified`, `premium`, `lane`, `industry`, `bilingual`, `sort`.
- Filters fake/deferred: staged `radiusKm`; seed/sample jobs can appear depending environment.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.

#### Canonical / Alias Decision
- Recommend `/clasificados/empleos/results` canonical.
- Keep `/resultados` as alias/redirect; implementation is currently reversed.

#### Migration Files
- `app/(site)/clasificados/empleos/page.tsx`
- `app/(site)/clasificados/empleos/EmpleosLandingPageClient.tsx`
- `app/(site)/clasificados/empleos/resultados/page.tsx`
- `app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx`
- `app/(site)/clasificados/empleos/lib/**`

#### Locked Files
- Preserve job publication lanes and sample/live behavior until product decision.

#### Risk Notes
- API revalidation references `/resultados`; canonical flip must be careful.

#### Recommendation
- V2-ready after CTA slot fix and route/results cleanup.
- Difficulty: MEDIUM/HIGH.
- Batch: marketplace.

### Viajes

#### URLs
- Landing URL: `/clasificados/viajes`.
- Results URL: `/clasificados/viajes/results`.
- Spanish alias URL: `/clasificados/viajes/resultados`.
- English alias URL: `/clasificados/travel` redirects to `/clasificados/viajes`.
- Detail URLs: `/clasificados/viajes/oferta/[slug]`, `/clasificados/viajes/negocio/[slug]`.
- Route user should QA: `/clasificados/viajes/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/viajes/page.tsx`.
- Results implementation: `app/(site)/clasificados/viajes/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/viajes/results/page.tsx`.
- Travel redirect: `app/(site)/clasificados/travel/page.tsx`.
- `dynamic = "force-dynamic"`: TRUE on results/detail; landing not explicitly dynamic.
- Redirects: `/travel` uses `permanentRedirect`.
- Wraps another component: TRUE.
- Mode/market/lane prop: internal offer/business/editorial kind.

#### Component Tree
- Main landing: `ViajesLandingPage`.
- Main results: `ViajesResultsShell`.
- Search shell: `LeonixCategorySearchCanvas` on landing; custom results filter/search.
- Filter drawer/panel: viajes results panel.
- Active filters: custom active labels.
- Toolbar/sort/view/per-page: custom result controls.
- Card renderer: cards by kind (offer/business/editorial).
- Empty state: custom.
- Partner/discovery/shortcut: top offers, departures, destinations, audiences, trust strip, publish CTA.
- Old custom shell: `ViajesResultsShell`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- renders LeonixCategoryPageShell: TRUE.
- renders LeonixCategoryHeroGateway: TRUE.
- renders LeonixCategorySearchCanvas: TRUE.
- renders LeonixCategoryCta: FALSE/PARTIAL.
- renders LeonixCategoryPartnerSection on landing only: PARTIAL/custom.
- renders LeonixCategoryDiscoveryGrid on landing only: TRUE/PARTIAL.
- renders LeonixCategoryShortcutSection on landing only: TRUE/PARTIAL.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses old CategoryStandardResultsPageShell: FALSE.
- uses custom shell wrappers: TRUE.
- uses inline CTA classes: TRUE.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Condition that hides it: V2 `showPublish` default FALSE.
- Publish/advertise href: `/publicar/viajes`.
- Publish/advertise label: `Publicar viaje` / `Post trip`.
- Browse all href: `/clasificados/viajes/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: PARTIAL.
- Count/sort/view/per-page controls after active filters: PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: FALSE/PARTIAL.
- Sponsor section rendered on results: FALSE.
- Partner section rendered on results: FALSE.
- Landing discovery rendered on results: TRUE (`ViajesResultsDiscoveryStrip`).
- Category shortcut pill row rendered on results: PARTIAL.
- Quick filters rendered on results: TRUE/PARTIAL.
- Random CTA row rendered on results: TRUE (`CategoryVisibilityCta`, trust strip).
- Cross-link promo block rendered between shell and results: FALSE/PARTIAL.
- Old featured/destacados section rendered on results: FALSE/PARTIAL curated/demo.
- Needs cleanup before migration: TRUE.

#### Field / Filter Source Mapping
- Keyword/search: `viajesBrowseContract.ts`, `viajesResultsMatch.ts`.
- City/state/zip/country: origin/destination model uses `from`, `dest`; zip/radius reserved.
- Category/type: `t`, offer/business/editorial kind.
- Price/budget: `budget`.
- Contact/action: staged listing JSON, WhatsApp/contact channels.
- Media: hero/gallery image URLs.
- Supported filter drawer fields: destination, origin, type, budget, audience, season, duration, service language, sort/page.
- Results URL query keys: `lang`, `dest`, `q`, `from`, `t`, `budget`, `audience`, `season`, `duration`, `svcLang`, `sort`, `page`; reserved `zip`, `radiusMiles`, `nearMe`, `originByGeo`.
- Filters fake/deferred: zip/radius/near-me/originByGeo reserved/informational; curated/demo rows may merge.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE directly in current page; business/agency lanes exist in Viajes.
- Recommended action: defer direct Negocios link unless product wants agencies exposed.

#### Canonical / Alias Decision
- Keep `/clasificados/viajes` public canonical.
- Keep `/clasificados/travel` permanent redirect.
- Use `/clasificados/viajes/results` as canonical results; keep `/resultados` as alias/redirect.

#### Migration Files
- `app/(site)/clasificados/viajes/page.tsx`
- `app/(site)/clasificados/viajes/components/**`
- `app/(site)/clasificados/viajes/resultados/page.tsx`
- `app/(site)/clasificados/viajes/lib/**`

#### Locked Files
- Preserve affiliate/business/editorial lane distinctions.

#### Risk Notes
- Category key is `travel`, public URL is `viajes`.
- Results include non-listing discovery/trust/CTA sections.

#### Recommendation
- High-risk special migration after CTA slot fix and route/canonical confirmation.
- Difficulty: HIGH.
- Batch: business-heavy.

### Clases

#### URLs
- Landing URL: `/clasificados/clases`.
- Results URL: `/clasificados/clases/results`.
- Spanish alias URL: `/clasificados/clases/resultados`.
- Route user should QA: `/clasificados/clases/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/clases/page.tsx`.
- Results implementation: `app/(site)/clasificados/clases/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/clases/results/page.tsx`.
- `dynamic = "force-dynamic"`: FALSE in inspected pages.
- Redirects: `/results` re-exports.
- Wraps another component: results uses shared `CommunityListingsResultsClient`.
- Mode/market/lane prop: `category="clases"`.

#### Component Tree
- Landing: inline V2 category landing.
- Results: `CommunityListingsResultsClient category="clases"`.
- Search shell: `LeonixCategorySearchCanvas` on landing; `CommunityResultsSearchPanel` on results.
- Filter drawer: lightweight category drawer fields.
- Active filters: lightweight chips.
- Toolbar/sort/view/per-page: shared community results header/list.
- Card renderer: community listing cards.
- Empty state: shared community empty state.
- Shortcut component: `CategoryLandingChipsRail`, `LeonixCategoryShortcutSection`.
- Old custom shell: `CategoryStandardResultsPageShell`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE.
- renders LeonixCategoryPageShell: TRUE.
- renders LeonixCategoryHeroGateway: TRUE.
- renders LeonixCategorySearchCanvas: TRUE.
- renders LeonixCategoryShortcutSection on landing only: TRUE.
- renders LeonixCategoryResultsShell or equivalent V2 results order: FALSE.
- uses CategoryLandingChipsRail: TRUE.
- uses old CategoryStandardResultsPageShell: TRUE on results.
- uses custom shell wrappers: TRUE on results.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Publish/advertise href: `/publicar/clases/quick`.
- Publish/advertise label: `Publicar clase` / class post copy.
- Browse all href: built with `buildCategoryResultsUrl("clases", ...)`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE/PARTIAL.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: TRUE/PARTIAL.
- Count/sort/view/per-page controls after active filters: TRUE/PARTIAL.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE.
- Sponsor/partner/landing discovery on results: FALSE.
- Category shortcut pill row rendered on results: FALSE.
- Quick filters rendered on results: FALSE/PARTIAL.
- Random CTA row rendered on results: FALSE.
- Cross-link promo block rendered between shell and results: FALSE.
- Old featured/destacados section rendered on results: FALSE.
- Needs cleanup before migration: FALSE/LOW.

#### Field / Filter Source Mapping
- Keyword/search: `CommunityListingsResultsClient.tsx`, `CommunityResultsSearchPanel.tsx`.
- City/state/zip/country: shared community listing fields.
- Category/type: `classType`.
- Price/budget: `cost`, `is_free`, price amount detail.
- Contact/action: registration/contact detail pairs.
- Media: `images`.
- Supported filter drawer fields: class type, cost, mode, level, audience, registration.
- Results URL query keys: `q`, `city`, `state`, `zip`, `country`, `classType`, `cost`, `mode`, `level`, `audience`, `registration`, `filters=1`.
- Filters fake/deferred: active chips only show core fields; filters still apply.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.

#### Canonical / Alias Decision
- Use `/clasificados/clases/results` canonical; keep `/resultados` alias/redirect.

#### Migration Files
- `app/(site)/clasificados/clases/page.tsx`
- `app/(site)/clasificados/clases/resultados/page.tsx`
- `app/(site)/clasificados/community/**`
- `app/(site)/publicar/clases/**`

#### Locked Files
- Preserve quick publish route.

#### Risk Notes
- Simple but still old results shell.

#### Recommendation
- V2-ready after CTA slot fix and lightweight results shell swap.
- Difficulty: LOW/MEDIUM.
- Batch: simple/community.

### Comunidad

#### URLs
- Landing URL: `/clasificados/comunidad`.
- Results URL: `/clasificados/comunidad/results`.
- Spanish alias URL: `/clasificados/comunidad/resultados`.
- Route user should QA: `/clasificados/comunidad/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/comunidad/page.tsx`.
- Results implementation: `app/(site)/clasificados/comunidad/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/comunidad/results/page.tsx`.
- `dynamic = "force-dynamic"`: FALSE in inspected pages.
- Redirects: `/results` re-exports.
- Mode/market/lane prop: `category="comunidad"`.

#### Component Tree
- Same shared community shell pattern as Clases.
- Landing inline V2 shell/search/shortcuts/recent.
- Results `CommunityListingsResultsClient category="comunidad"`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE.
- landing V2 components: TRUE.
- results V2 shell: FALSE.
- old `CategoryStandardResultsPageShell`: TRUE on results.
- `CategoryLandingChipsRail`: TRUE.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Publish/advertise href: `/publicar/comunidad/quick`.
- Publish/advertise label: community post copy.
- Browse all href: `/clasificados/comunidad/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE/PARTIAL.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Mostly clean/simple; no sponsor/partner/discovery/destacados found on results.
- Needs cleanup before migration: FALSE/LOW.

#### Field / Filter Source Mapping
- Keyword/search: shared community client.
- City/state/zip/country: shared listing rows.
- Category/type: `eventType`.
- Price/budget: `eventCost`.
- Contact/action: registration/contact details.
- Media: `images`.
- Supported filter drawer fields: event type, event cost, date from/to, audience, registration, accessibility.
- Results URL query keys: `q`, `city`, `state`, `zip`, `country`, `eventType`, `eventCost`, `dateFrom`, `dateTo`, `audience`, `registration`, `accessibility`, `filters=1`.
- Filters fake/deferred: active chips only core; event expiration filtering applied.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.

#### Canonical / Alias Decision
- Use `/clasificados/comunidad/results` canonical; keep `/resultados` alias/redirect.

#### Migration Files
- `app/(site)/clasificados/comunidad/page.tsx`
- `app/(site)/clasificados/comunidad/resultados/page.tsx`
- `app/(site)/clasificados/community/**`
- `app/(site)/publicar/comunidad/**`

#### Locked Files
- Preserve free/simple category behavior.

#### Risk Notes
- Low risk.

#### Recommendation
- V2-ready after CTA slot fix and results shell swap.
- Difficulty: LOW/MEDIUM.
- Batch: simple/community.

### Busco / Se Busca

#### URLs
- Landing URL: `/clasificados/busco`.
- Results URL: `/clasificados/busco/results`.
- Spanish alias URL: `/clasificados/busco/resultados`.
- Route user should QA: `/clasificados/busco/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/busco/page.tsx`.
- Results implementation: `app/(site)/clasificados/busco/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/busco/results/page.tsx`.
- `dynamic = "force-dynamic"`: FALSE in inspected pages.
- Redirects: `/results` re-exports.
- Mode/market/lane prop: none.

#### Component Tree
- Landing inline V2 shell/search/shortcut, helper not-dating note, recent listings.
- Results `BuscoResultsClient` inside `BuscoShellLayout`.
- Search shell: `BuscoResultsSearchPanel`.
- Filter drawer: lightweight category drawer fields.
- Cards/empty: simple busco list/empty CTA.
- Old custom shell: `CategoryStandardResultsPageShell` via `BuscoShellLayout`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- landing V2 components: TRUE.
- results V2 shell: FALSE.
- old results shell: TRUE.
- `CategoryLandingChipsRail`: TRUE.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Publish/advertise href: `/publicar/busco/quick`.
- Publish/advertise label: `Publicar solicitud` / `Post request`.
- Browse all href: built results URL.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE/PARTIAL.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Active filters immediately after shell if active: PARTIAL.
- Count/sort/view/per-page controls after active filters: PARTIAL/simple.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE.
- Sponsor/partner/discovery/shortcuts/random CTA/cross-link/destacados on results: FALSE.
- Needs cleanup before migration: FALSE/LOW.

#### Field / Filter Source Mapping
- Keyword/search: `BuscoResultsClient.tsx`, `BuscoResultsSearchPanel.tsx`.
- City/state/zip/country: parsed; city applied.
- Category/type: `tipo`.
- Price/budget: `budget`.
- Contact/action: `contact`, row phone/email and detail availability.
- Media: generic listing images.
- Supported filter drawer fields: tipo, zone, budget, contact.
- Results URL query keys: `q`, `city`, `state`, `zip`, `country`, `tipo`, `zone`, `budget`, `contact`, `filters=1`.
- Filters fake/deferred: none obvious.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.

#### Canonical / Alias Decision
- Use `/clasificados/busco/results` canonical; keep `/resultados` alias/redirect.
- Align landing recent links currently pointing to `/resultados`.

#### Migration Files
- `app/(site)/clasificados/busco/page.tsx`
- `app/(site)/clasificados/busco/resultados/page.tsx`
- `app/(site)/clasificados/busco/**`
- `app/(site)/publicar/busco/**`

#### Locked Files
- Preserve not-dating note on landing only.

#### Risk Notes
- Simple results, canonical links mixed.

#### Recommendation
- V2-ready after CTA slot fix and results shell swap.
- Difficulty: LOW.
- Batch: simple/community.

### Mascotas y Perdidos

#### URLs
- Landing URL: `/clasificados/mascotas-y-perdidos`.
- Results URL: `/clasificados/mascotas-y-perdidos/results`.
- Spanish alias URL: `/clasificados/mascotas-y-perdidos/resultados`.
- No `/clasificados/mascotas` or `/clasificados/perdidos` route found.
- Route user should QA: `/clasificados/mascotas-y-perdidos/results?lang=es`.

#### Route Files
- Landing route file: `app/(site)/clasificados/mascotas-y-perdidos/page.tsx`.
- Results implementation: `app/(site)/clasificados/mascotas-y-perdidos/resultados/page.tsx`.
- Alias: `app/(site)/clasificados/mascotas-y-perdidos/results/page.tsx`.
- `dynamic = "force-dynamic"`: FALSE in inspected pages.
- Redirects: `/results` re-exports.

#### Component Tree
- Landing inline V2 shell/search/notice-type shortcuts/recent.
- Results `MascotasPerdidosResultsClient` inside `MascotasPerdidosShellLayout`.
- Search shell: `MascotasResultsSearchPanel`.
- Filter drawer: lightweight category drawer.
- Card/listing renderer: simple mascotas/perdidos listing cards.
- Empty state: simple empty CTA.
- Old custom shell: `CategoryStandardResultsPageShell`.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: TRUE on landing.
- landing V2 components: TRUE.
- results V2 shell: FALSE.
- old results shell: TRUE.
- V2 import exists but visual shell is still custom: TRUE for results.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: TRUE.
- Primary CTA slot visible on live landing: FALSE/UNCERTAIN due missing `showPublish`.
- CTA slot can disappear due to condition: TRUE.
- Publish/advertise href: `/publicar/mascotas-y-perdidos/quick`.
- Publish/advertise label: publish pet/lost notice copy.
- Browse all href: `/clasificados/mascotas-y-perdidos/results?lang=...`.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: PARTIAL.
- Uses inline CTA classes: TRUE/PARTIAL.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE.

#### Results Cleanliness TRUE/FALSE
- Top hero/search shell exists: TRUE.
- Listings/cards after controls: TRUE.
- Compact empty state max one CTA: TRUE.
- Sponsor/partner/discovery/shortcuts/random CTA/cross-link/destacados on results: FALSE.
- Needs cleanup before migration: FALSE/LOW.

#### Field / Filter Source Mapping
- Keyword/search: `MascotasPerdidosResultsClient.tsx`, `MascotasResultsSearchPanel.tsx`.
- City/state/zip/country: city applied; state/zip/country parsed by shell but not applied.
- Category/type: `tipo`, notice type.
- Price/budget: N/A.
- Contact/action: contact details in listings.
- Media: `images`, `hasPhoto`.
- Supported filter drawer fields: tipo, last seen area, has photo.
- Results URL query keys: `q`, `city`, `state`, `zip`, `country`, `tipo`, `lastSeenArea`, `hasPhoto`, `filters=1`.
- Filters fake/deferred: state/zip/country parsed but not applied.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: FALSE.

#### Canonical / Alias Decision
- Use `/clasificados/mascotas-y-perdidos/results` canonical; keep `/resultados` alias/redirect.
- Do not create `mascotas` or `perdidos` aliases until product approves.

#### Migration Files
- `app/(site)/clasificados/mascotas-y-perdidos/page.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/resultados/page.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/**`
- `app/(site)/publicar/mascotas-y-perdidos/**`

#### Locked Files
- Preserve lost/found/simple behavior.

#### Risk Notes
- Low risk but location filters are partially parsed-only.

#### Recommendation
- V2-ready after CTA slot fix and results shell swap.
- Difficulty: LOW.
- Batch: simple/community.

### Comida Local

#### URLs
- Landing URL: `/clasificados/comida-local`.
- Results URL: none separate.
- Detail URL: `/clasificados/comida-local/[slug]`.
- Route user should QA: `/clasificados/comida-local?lang=es`.

#### Route Files
- Landing/hybrid route file: `app/(site)/clasificados/comida-local/page.tsx`.
- Results route file: none.
- `dynamic = "force-dynamic"`: TRUE.
- Redirects: FALSE.
- Wraps another component: single page renders filters/cards/empty/error.
- Mode/market/lane prop: none.

#### Component Tree
- Top route component: comida local page.
- Main landing/results component: page-level hybrid.
- Search/filter component: `ComidaLocalResultsFilters`.
- Active filters/toolbar: page-level.
- Card renderer: comida local listing cards.
- Empty state: page-level.
- Partner/sponsor/discovery/shortcut: none.
- Old custom shell component: custom.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: FALSE.
- renders V2 shell components: FALSE.
- uses old CategoryStandardLandingPage: FALSE.
- uses old CategoryStandardResultsPageShell: FALSE.
- uses custom shell wrappers: TRUE.
- V2 import exists but visual shell is still custom: FALSE.

#### CTA Slot Audit TRUE/FALSE
- Search shell has primary CTA slot: FALSE.
- Primary CTA slot visible on live landing: TRUE via simple header/empty publish CTA, not V2 slot.
- CTA slot can disappear due to condition: TRUE/PARTIAL.
- Publish/advertise href: `/publicar/comida-local`.
- Publish/advertise label: food seller publish copy.
- Browse all href: same page/hybrid.
- Fallback CTA if no publish href: DEFERRED.
- Uses V2 CTA classes: FALSE.
- Uses inline CTA classes: TRUE.
- Shell keeps same shape when CTA missing: FALSE.
- Needs V2 slot lock fix: TRUE if added to V2 migration.

#### Results Cleanliness TRUE/FALSE
- Separate results page exists: FALSE.
- Current hybrid page clutter: LOW.
- Sponsor/partner/discovery/shortcut/random CTA on results: FALSE.
- Needs cleanup before migration: route decision needed.

#### Field / Filter Source Mapping
- Keyword/search: `comidaLocalPublicQueries.ts` (`q`).
- City: `city`.
- State/zip/country: not in current filter contract.
- Category/type: `foodType`, `service`.
- Price/budget: `priceLevel`.
- Contact/action: phone, WhatsApp, socials.
- Media: main/logo/gallery images.
- Supported filters: q, city, food type, service, price level.
- Results URL query keys: `q`, `city`, `foodType`, `service`, `priceLevel`.
- Filters fake/deferred: state/zip/country absent.

#### Negocios Locales Relationship
- Exposed from Negocios Locales: TRUE.
- Source file/card/link: `app/(site)/negocios-locales/page.tsx`, lane `comida-local`.
- Target URL: `/clasificados/comida-local?lang=...`.
- Target is canonical Clasificados route: TRUE for current hybrid page.
- Recommended action: defer until category registry decision.

#### Canonical / Alias Decision
- Decide whether `comida-local` belongs in core category config.
- If migrated, add canonical `/results` or explicitly document hybrid-only.

#### Migration Files
- `app/(site)/clasificados/comida-local/page.tsx`
- `app/(site)/clasificados/comida-local/components/**`
- `app/lib/clasificados/comida-local/**`
- `app/(site)/publicar/comida-local/**`

#### Locked Files
- Do not merge with Restaurantes without product approval.

#### Risk Notes
- Supplemental category outside main category registry.

#### Recommendation
- Defer/special category.
- Difficulty: MEDIUM.
- Batch: business-heavy or separate food lane decision.

### Negocios Locales / Negocios

#### URLs
- Negocios Locales public hub: `/negocios-locales`.
- Clasificados negocios route: `/clasificados/negocios`.
- Results URL: none.
- Route user should QA: `/negocios-locales?lang=es` and `/clasificados/negocios?lang=es`.

#### Route Files
- Negocios Locales file: `app/(site)/negocios-locales/page.tsx`.
- Clasificados negocios file: `app/(site)/clasificados/negocios/page.tsx`.
- `dynamic = "force-dynamic"`: not found for Negocios Locales; Clasificados negocios is client redirect.
- Redirects: `/clasificados/negocios` redirects client-side to `/clasificados/cuenta?lang=...`; not a server redirect.
- Wraps another component: Negocios Locales is standalone page.

#### Component Tree
- Negocios Locales renders lanes/cards for business exposure.
- `/clasificados/negocios` is not a true landing/results category.

#### V2 Usage TRUE/FALSE
- imports categoryStandardV2: FALSE.
- renders V2 shell: FALSE.
- should migrate to Clasificados V2: FALSE.

#### CTA Slot Audit TRUE/FALSE
- Not applicable to category standard migration.
- Business advertise CTA entry uses `/login?mode=post&lang=...&redirect=/clasificados/publicar?...`.

#### Results Cleanliness TRUE/FALSE
- Not applicable.

#### Field / Filter Source Mapping
- Negocios Locales is directory/exposure doorway, not canonical listing/filter engine.
- Category links point into Clasificados canonical/alias routes.

#### Negocios Locales Relationship
- Exposed categories: `ofertas-locales`, `servicios`, `restaurantes`, `comida-local`, autos dealers, `bienes-raices`.
- Keep double exposure: TRUE.

#### Canonical / Alias Decision
- Do not migrate `/negocios-locales` to Category Standard V2.
- Decide whether `/clasificados/negocios` should server-redirect to `/negocios-locales`, `/clasificados/cuenta`, or be removed from public category maps.

#### Migration Files
- No Category V2 migration files.
- Link source: `app/(site)/negocios-locales/page.tsx`.

#### Locked Files
- Do not convert Negocios Locales to Clasificados V2 shell.

#### Risk Notes
- Autos dealer link currently points to risky autos query alias.

#### Recommendation
- Keep as business directory/exposure doorway.
- Difficulty: LOW for link cleanup; no shell migration.
- Batch: canonical cleanup.

## Alias / Redirect Map

| Route | Current behavior | Canonical target | Recommended action |
|---|---|---|---|
| `/clasificados/rentas/resultados` | No route found; page not found | `/clasificados/rentas/results` | Add redirect/re-export only if Spanish alias parity required |
| `/clasificados/bienes-raices/results` | Re-exports `../resultados/page` | `/clasificados/bienes-raices/results` recommended | Keep canonical but make implementation/metadata explicit |
| `/clasificados/bienes-raices/resultados` | Implementation route | `/clasificados/bienes-raices/results` recommended | Convert to redirect/alias after canonical decision |
| `/clasificados/autos/results` | Re-exports `../resultados/page` | `/clasificados/autos/results` | Keep canonical; move implementation or document alias |
| `/clasificados/autos/resultados` | Implementation route | `/clasificados/autos/results` | Keep as Spanish alias/redirect |
| `/clasificados/autos/results?seller=dealer` | Private market route can filter dealer inventory | `/clasificados/dealers-de-autos/results?seller=dealer` | Stop generating links to query alias |
| `/clasificados/dealers-de-autos/resultados` | No route found | `/clasificados/dealers-de-autos/results` | Add only if alias parity required |
| `/clasificados/restaurantes/results` | Re-exports `../resultados/page` | `/clasificados/restaurantes/results` | Keep canonical; redirect `/resultados` later |
| `/clasificados/servicios/results` | Re-exports `../resultados/page` | `/clasificados/servicios/results` | Keep canonical; redirect `/resultados` later |
| `/clasificados/ofertas-locales/resultados` | No route found | `/clasificados/ofertas-locales/results` | Add only if alias parity required |
| `/clasificados/en-venta/resultados` | No route found | `/clasificados/en-venta/results` | Add only if alias parity required |
| `/clasificados/empleos/results` | Re-exports `../resultados/page` | `/clasificados/empleos/results` | Keep canonical; update revalidation/canonical refs |
| `/clasificados/viajes/results` | Re-exports `../resultados/page` | `/clasificados/viajes/results` | Keep canonical; redirect `/resultados` later |
| `/clasificados/travel` | `permanentRedirect` to `/clasificados/viajes` preserving query | `/clasificados/viajes` | Keep redirect |
| `/clasificados/clases/results` | Re-exports `../resultados/page` | `/clasificados/clases/results` | Keep canonical; redirect `/resultados` later |
| `/clasificados/comunidad/results` | Re-exports `../resultados/page` | `/clasificados/comunidad/results` | Keep canonical; redirect `/resultados` later |
| `/clasificados/busco/results` | Re-exports `../resultados/page` | `/clasificados/busco/results` | Keep canonical; align internal links |
| `/clasificados/mascotas-y-perdidos/results` | Re-exports `../resultados/page` | `/clasificados/mascotas-y-perdidos/results` | Keep canonical; align internal links |
| `/clasificados/comida-local/results` | No route found | undecided | Decide hybrid vs true results |
| `/clasificados/negocios` | Client redirect to `/clasificados/cuenta` | undecided | Replace with server redirect or remove from category surface |

## Negocios Locales Exposure Map

| Business card/link | Source file | Current target URL | Canonical Clasificados target | Action needed |
|---|---|---|---|---|
| Ofertas Locales explore | `app/(site)/negocios-locales/page.tsx` | `/clasificados/ofertas-locales?lang=...` | `/clasificados/ofertas-locales?lang=...` | Leave link as canonical |
| Ofertas Locales advertise | `app/(site)/negocios-locales/page.tsx` | `/publicar/ofertas-locales?lang=...` | same | Leave |
| Servicios explore | `app/(site)/negocios-locales/page.tsx` | `/clasificados/servicios?lang=...` | `/clasificados/servicios?lang=...` | Leave link as canonical |
| Servicios advertise | `app/(site)/negocios-locales/page.tsx` | `/clasificados/publicar/servicios?lang=...` | `/clasificados/publicar/servicios/checkpoint?lang=...` | Optional canonicalize publish checkpoint |
| Restaurantes explore | `app/(site)/negocios-locales/page.tsx` | `/clasificados/restaurantes?lang=...` | `/clasificados/restaurantes?lang=...` | Leave link as canonical |
| Restaurantes advertise | `app/(site)/negocios-locales/page.tsx` | `/clasificados/publicar/restaurantes?lang=...` | `/publicar/restaurantes?lang=...` via redirect | Optional canonicalize |
| Comida Local explore | `app/(site)/negocios-locales/page.tsx` | `/clasificados/comida-local?lang=...` | `/clasificados/comida-local?lang=...` | Defer until registry decision |
| Comida Local advertise | `app/(site)/negocios-locales/page.tsx` | `/publicar/comida-local?lang=...` | same | Leave |
| Autos dealer explore | `app/(site)/negocios-locales/page.tsx` | `/clasificados/autos/results?lang=...&seller=dealer` | `/clasificados/dealers-de-autos/results?lang=...&seller=dealer` | Change link to canonical dealer route |
| Autos dealer advertise | `app/(site)/negocios-locales/page.tsx` | `/publicar/autos/negocios?lang=...` | same | Leave |
| Bienes Raices explore | `app/(site)/negocios-locales/page.tsx` | `/clasificados/bienes-raices?lang=...` | `/clasificados/bienes-raices?lang=...` | Leave link as canonical |
| Bienes Raices advertise | `app/(site)/negocios-locales/page.tsx` | `/clasificados/publicar/bienes-raices?lang=...` | route dispatches to publish hub | Leave or canonicalize after publish audit |
| Ofertas hub promo | `app/(site)/clasificados/page.tsx`, `OfertasLocalesHubCategoryCard.tsx` | `/clasificados/ofertas-locales?lang=...` | same | Leave |
| Dealer hub card | `app/(site)/clasificados/autos/components/public/DealersDeAutosHubCategoryCard.tsx` | `/clasificados/dealers-de-autos?lang=...` | same | Leave |

## Global Problems Found

- V2 imported but not fully rendered end-to-end: most V2 landings still feed non-V2/custom results pages.
- Publish slot hidden by missing `showPublish`: `LeonixCategorySearchCanvas` defaults `showPublish = false`, while many pages pass `publishHref` and `publishLabel` without passing `showPublish`.
- Shell collapses when CTA missing: V2 second-row columns change based on `hasPublish`, so the primary action slot can disappear instead of preserving the approved layout.
- Results pages still have random CTA rows or lower CTAs: `viajes`, `en-venta`, `empleos`, `autos`, and `servicios` need cleanup.
- Results pages still have landing shortcut/discovery/promoted ideas: `viajes`, `autos`, `empleos`, and `servicios` are the clearest.
- Old CategoryStandard mixed with V2: results for autos, servicios, community categories, busco/mascotas, and empleos.
- Custom shell still wrapping V2: autos/dealers, viajes, en-venta, empleos.
- Route mismatch between `/results` and `/resultados`: many `/results` routes re-export `/resultados`; several categories have no `/resultados`.
- Negocios Locales links point to old/alias routes: autos dealer exposure points to `/clasificados/autos/results?seller=dealer`.
- Dealer route and autos route duplication: dealer inventory has canonical dealer route plus autos seller query alias.
- Categories with no true landing/results pair: `comida-local` is hybrid-only; `negocios` is a redirect/account route.
- Categories with only results-style page: none among mandatory categories, but `comida-local` is hybrid.

## Field Mapping Summary

| Category | q/search | city | state | zip | country | primary category/type | price/budget | contact/action | supported filters | fake/deferred filters |
|---|---|---|---|---|---|---|---|---|---|---|
| Rentas | `q` | TRUE | TRUE | TRUE | TRUE | `tipo`, `subtype`, `propiedad`, `kind` | `precio`, rent/deposit min/max | contact JSON | lease, baths, parking, sqft, amueblado, mascotas, highlights | `lat`, `lng`, `radius_km` stripped |
| Bienes Raices | `q` | TRUE | TRUE | TRUE | TRUE | `operationType`, `propertyType`, `sellerType` | `priceMin`, `priceMax`, `precio` | contact JSON/card actions | beds, baths, pets, furnished, pool | many amenity keys parsed/deferred |
| Autos | `q` | TRUE | FALSE | TRUE | FALSE | make/model/body/seller | `priceMin`, `priceMax` | seller actions | year, condition, drivetrain, fuel, mileage, photos/video | `radiusMiles` not applied |
| Dealers de Autos | same as Autos | TRUE | FALSE | TRUE | FALSE | `seller=dealer` | same as Autos | dealer actions | same as Autos | autos query alias risk |
| Restaurantes | `q` | TRUE | TRUE | TRUE | URL/UI only | cuisine/biz/service | `price` | menu/social/web/wa/reservations | diet, pay, ambiance, amenities, promoted flags | country UI/URL only; blueprint completeness |
| Servicios | `q` | TRUE | TRUE | TRUE | TRUE | `group`, seller/service flags | offers/promo | whatsapp/call/email/web/msg | verified, bilingual, languages, open, licensed, media/offers | open-now reliability caveat |
| Ofertas Locales | `q` | TRUE | TRUE | TRUE | TRUE | `category`, `marketType`, `offerType` | item price/sort | phone/WA/web/directions | category, market, offer type, sort | none obvious |
| En Venta | `q` | TRUE | TRUE | TRUE | TRUE | `evDept`, `evSub`, `itemType`, `cond` | price min/max, free/nego | seller/contact | delivery/pickup/seller/media/view | mostly real after broad fetch |
| Empleos | `q` | TRUE | TRUE | TRUE | TRUE | category/jobType/modality/lane | salary min/max | quick apply/employer | experience, company, featured, recent, verified | `radiusKm` staged; seed data possible |
| Viajes | `q`, `dest` | origin/dest | FALSE | reserved | FALSE | `t`, kind | `budget` | WhatsApp/contact channels | audience, season, duration, language | zip/radius/near-me reserved; demo curated rows |
| Clases | `q` | TRUE | TRUE | TRUE | TRUE | `classType` | `cost` | registration/contact | mode, level, audience, registration | active chips show only core |
| Comunidad | `q` | TRUE | TRUE | TRUE | TRUE | `eventType` | `eventCost` | registration/contact | dates, audience, accessibility | active chips show only core |
| Busco | `q` | TRUE | parsed | parsed | parsed | `tipo` | `budget` | `contact` | zone, budget, contact | none obvious |
| Mascotas y Perdidos | `q` | TRUE | parsed | parsed | parsed | `tipo` | N/A | contact | lastSeenArea, hasPhoto | state/zip/country parsed but not applied |
| Comida Local | `q` | TRUE | FALSE | FALSE | FALSE | `foodType`, `service` | `priceLevel` | phone/WA/socials | food type, service, price | state/zip/country absent |
| Negocios Locales | N/A | N/A | N/A | N/A | N/A | exposure lanes | N/A | advertise links | links into Clasificados | not a listing engine |

## Migration Order

Batch 0:
- Fix global V2 shell behavior if needed:
- Always preserve landing CTA slot.
- Do not collapse shell when CTA data is missing.
- Pass or infer `showPublish` when `publishHref` and `publishLabel` exist, or introduce approved fallback CTA.
- Hard-block partner/sponsor/discovery/shortcut/random CTA sections from results shell.
- Confirm mobile/PWA horizontal scroll only where needed.

Batch 1:
- Protected source standards:
- Rentas.
- Bienes Raices.

Batch 2:
- Pilot proof:
- Ofertas Locales.
- Restaurantes.

Batch 3:
- Autos/Dealers canonical cleanup:
- Autos privado.
- Dealers de Autos.

Batch 4:
- Business-heavy:
- Servicios.
- Viajes if business/agency lanes apply.
- Comida Local only after registry/hybrid decision.

Batch 5:
- Marketplace:
- En Venta.
- Empleos.

Batch 6:
- Simple/community:
- Clases.
- Comunidad.
- Busco.
- Mascotas y Perdidos.

## TRUE/FALSE FINAL AUDIT

- all categories audited: TRUE.
- all landing URLs found: TRUE.
- all results URLs found: TRUE.
- all aliases found: TRUE.
- all route files identified: TRUE.
- all rendered components identified: TRUE.
- V2 usage verified for all categories: TRUE.
- old shell usage identified for all categories: TRUE.
- CTA slot conditions identified for all categories: TRUE.
- results clutter identified for all categories: TRUE.
- Negocios Locales exposure links audited: TRUE.
- Autos/Dealers canonical relationship audited: TRUE.
- Ofertas showPublish/CTA condition audited: TRUE.
- Restaurantes live route audited: TRUE.
- Rentas results route verified: TRUE.
- Bienes results/resultados route verified: TRUE.
- application field mapping started from real repo files: TRUE.
- fake/deferred filters identified: TRUE.
- no category UI files changed: TRUE.
- no admin/dashboard/auth/Supabase/Stripe changed: TRUE.
- audit document created: TRUE.
