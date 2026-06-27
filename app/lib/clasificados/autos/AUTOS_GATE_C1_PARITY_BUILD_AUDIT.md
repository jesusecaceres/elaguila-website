# AUTOS-GATE-C1 Parity + Build Audit

## Files Inspected
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx`
- `app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx`
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/shared/types/autosListingAnalytics.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx`
- `app/(site)/clasificados/autos/shell/AutosResultCard.tsx`
- `app/(site)/clasificados/autos/shell/AutosPreviewCard.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/clasificados/autos/dashboard/AutosClassifiedListingManageCard.tsx`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`
- `app/admin/_lib/adminAdIdentity.ts`

## Files Changed
- `app/lib/clasificados/autos/AUTOS_GATE_C1_PARITY_BUILD_AUDIT.md`
- `scripts/autos-gate-c1-parity-build-audit.ts`
- `package.json`

No Autos product component changes were required in this gate.

## Negocios vs Privado Parity Summary
Negocios and Privado use the same core vehicle primitives where they should: formatted money, mileage, city/state/zip display, title/year/make/model/trim construction, shared gallery/video components, shared spec/highlight/description components, and the shared `AutosEngagementRow` for live detail. Their product difference remains intact: Negocios keeps the dealer Business Hub and Privado keeps the private seller contact card.

## Price Formatting Result
Negocios uses `formatUsd` in `AutoDealerPreviewPage`. Privado uses the same `formatUsd` import from the Negocios formatter module in `AutoPrivadoPreviewPage`. Public cards also format currency through Autos-specific formatters or `Intl.NumberFormat`.

## Phone Formatting Result
Privado uses `formatUsPhoneDisplay` for the visible phone label and `phoneDigitsForTel` for `tel:`/SMS hrefs. Negocios uses `DealerBusinessStack` through `mapAutosDealerToBusinessHubContact`, `resolveDealerOfficePhone`, and `phoneDigitsForTel`, preserving valid href behavior. CTA flow remains routed through `AutosSheetCtaLink`.

## Location Formatting Result
Negocios uses `formatCityStateZipLine` / `formatCityStateLabel` and can show dealer business address/maps inside the Business Hub. Privado uses `formatCityStateZipLine` on city/state/zip and does not receive dealer address/map Business Hub sections.

## Vehicle Identity Result
Negocios reads the listing title and formatted meta from the normalized listing. Privado builds canonical title from year/make/model/trim via `buildVehicleTitle` and preserves the same trim/title hierarchy. Shared `VehicleSpecsGrid`, `VehicleHighlights`, and `VehicleDescription` keep labels aligned for shared fields.

## Photos/Video Result
Both live detail surfaces use the shared `AutoGallery` and pass `publicPlaybackOnly` through. No upload, persistence, Mux, or video URL behavior was edited in this gate.

## Like/Share Row Result
`AutosEngagementRow` remains mounted in both live detail lanes when a published source id and real numeric like count exist. It uses `LeonixLikeButton` and `LeonixShareButton`, starts from DB-backed `user_liked_listings` count, and refreshes local visible count after successful toggles.

## CTA Preservation Result
No CTA internals were edited. `CtaActionSheet`, `AutosSheetCtaLink`, and `autosCtaSheet` remain unchanged, so the existing business-card/share-with-apps CTA behavior is preserved.

## User Dashboard Read-Only Finding
Autos appears in `Mis Anuncios`. `app/(site)/dashboard/mis-anuncios/page.tsx` renders `AutosClassifiedListingManageCard` for legacy Autos rows and builds paid Autos inventory rows from `autos_classifieds_listings` via `dashboardInventory.ts`. Paid Autos rows route to `/clasificados/autos/vehiculo/{id}?lang=...` and carry status, title, updated/published timestamps, Leonix ID where present, and Autos lane metadata.

## Admin Dashboard Read-Only Finding
Autos has a dedicated admin queue at `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`. Admin can search by Leonix ID, listing/user UUID, public Autos URL, title, city, owner profile data, and vehicle text. The table shows lane (`negocios` / `privado`), status, visibility, published timestamp, owner id, Leonix ID, image signal, public link when active, and admin actions. `adminAdIdentity.ts` normalizes Autos rows with source `autos`, source table `autos_classifieds_listings`, lane metadata, public URL, and admin URL.

## Publish QA Readiness Result
Ready for publish QA. The targeted audits passed and `npm run build` completed with exit code 0. The build emitted existing warnings from `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts`, outside this Autos gate.

## Risks / Deferred Work
- `AutosClassifiedListingManageCard` has a generic legacy Autos public link pattern for `listings.category === "autos"`; paid Autos inventory rows use `/clasificados/autos/vehiculo/{id}` through `dashboardInventory.ts`.
- The visible like count updates locally after successful toggles but server truth remains the source of the initial count on live page load.

| Requirement                                          | TRUE/FALSE | Evidence |
| ---------------------------------------------------- | ---------- | -------- |
| Negocios and Privado were compared                   | TRUE | `AutoDealerPreviewPage`, `DealerBusinessStack`, `AutoPrivadoPreviewPage`, and `PrivadoContactStrip` inspected. |
| Price formatting parity checked                      | TRUE | Both live detail pages use `formatUsd`. |
| Phone formatting parity checked                      | TRUE | Privado visible phone uses `formatUsPhoneDisplay`; both lanes use validated phone digits for hrefs. |
| Location formatting parity checked                   | TRUE | Both use city/state/zip formatters; dealer address remains dealer-only. |
| Vehicle identity parity checked                      | TRUE | Both preserve year/make/model/trim/title hierarchy through shared title helpers/normalization. |
| Photos/video behavior not broken                     | TRUE | Both use shared `AutoGallery`; no media code was edited. |
| AutosEngagementRow remains on Negocios               | TRUE | Mounted in `AutoDealerPreviewPage` live aside. |
| AutosEngagementRow remains on Privado                | TRUE | Mounted in `AutoPrivadoPreviewPage` live aside. |
| Share still uses existing LeonixShareButton          | TRUE | `AutosEngagementRow` renders `LeonixShareButton`. |
| Like still uses existing LeonixLikeButton            | TRUE | `AutosEngagementRow` renders `LeonixLikeButton`. |
| True like count behavior preserved                   | TRUE | `autosClassifiedsListingService` fetches `user_liked_listings`; row updates from real initial count. |
| Existing CTA business-card behavior preserved        | TRUE | Locked CTA files were not changed. |
| Privado did not receive dealer Business Hub features | TRUE | Privado only uses `AutosEngagementRow` plus `PrivadoContactStrip`; no dealer reviews/finance/inventory added. |
| Dashboard Autos landing inspected read-only          | TRUE | `dashboard/mis-anuncios`, `dashboardInventory`, and Autos manage card inspected. |
| Admin Autos landing inspected read-only              | TRUE | Dedicated admin Autos queue and admin identity normalizer inspected. |
| No En Venta files changed                            | TRUE | C1 audit script checks diff paths. |
| No dashboard/admin files changed                     | TRUE | C1 audit script checks diff paths. |
| No Supabase schema/migration files changed           | TRUE | C1 audit script checks `supabase/` diff paths. |
| No Stripe/payment files changed                      | TRUE | C1 audit script checks payment path patterns. |
| npm run build passed                                 | TRUE | `npm run build` completed with exit code 0; warnings were outside Autos. |
