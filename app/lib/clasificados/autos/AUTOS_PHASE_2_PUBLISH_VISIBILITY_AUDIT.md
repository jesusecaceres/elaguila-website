# Autos — Phase 2 publish visibility & test publish (Stripe paused)

**Policy:** Stripe integration for Autos is **intentionally paused** in this phase; no global Stripe refactors were done. Runtime publish-to-public checks below are **FALSE (runtime)** unless this document records an executed test with IDs/URLs.

## Matrix

| ID | Claim | Current proof | Verdict | If FALSE, exact fix needed |
| -- | ----- | ------------- | ------- | -------------------------- |
| P1 | Stripe work is intentionally paused for Autos Phase 2. | Product decision for Phase 2; Autos checkout still imports lane Stripe helpers but **test bypass** documents pause in `autosPublishFlowCopy.ts` | TRUE (code) | Keep Stripe changes out of Phase 2 scope. |
| P2 | Autos test publish bypass is protected by AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true. | `autosTestPublishBypass.ts` returns true only when env is exactly `true` and not production | TRUE (code) | Tighten env parsing if security review requires. |
| P3 | Without the env flag, Autos publish still cannot silently activate unpaid listings. | `checkout/route.ts`: requires Stripe **or** internal bypass **or** test bypass before POST proceeds; unpaid path uses `setAutosListingPendingPayment` + Stripe session only after bypass branches | TRUE (code) | Never call `activateAutosClassifiedsListing` without one of the gated branches. |
| P4 | With the env flag, a Privado Autos test listing can be created/activated. | Same activation as internal bypass after owner PATCH + POST checkout when `lane=privado` and bypass on (**not executed in CI**) | FALSE (runtime) | Local: set `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`, publish `/publicar/autos/privado`, confirm row `active`. |
| P5 | With the env flag, a Negocios Autos test listing can be created/activated. | Same as P4 for `lane=negocios` (**not executed in CI**) | FALSE (runtime) | Same as P4 on `/publicar/autos/negocios`. |
| P6 | Published Autos listing appears on Autos landing page. | `useAutosPublicListingsFetch` + landing arrangement consume `GET /api/clasificados/autos/public/listings` (**no live publish run here**) | FALSE (runtime) | After test publish, open `/clasificados/autos` and confirm card. |
| P7 | Published Autos listing appears on Autos results page. | Results shell uses same public listings pool (**not executed**) | FALSE (runtime) | Open `/clasificados/autos/resultados` with default sort. |
| P8 | Published Autos detail page loads at the correct /clasificados/autos/vehiculo/[id] route. | `autosLiveVehiclePath` + `vehiculo/[id]/page.tsx` (**not executed**) | FALSE (runtime) | Open live vehicle URL after publish. |
| P9 | User dashboard shows the published Autos listing. | `DashboardAutosPaidDraftsBand.tsx` + `AutosLeonixPaidListingsSection.tsx` fetch owner listings API (**not executed**) | FALSE (runtime) | Visit `/dashboard/mis-anuncios` (or drafts band on drafts page) signed in. |
| P10 | User dashboard allows Autos listing management actions that already exist in the app. | `AutosLeonixPaidListingsSection` unpublish + listing PATCH patterns in repo (**not executed**) | FALSE (runtime) | Click unpublish / manage after seeding. |
| P11 | Admin dashboard Autos category section shows the published listing. | `/admin/workspace/clasificados/autos` server page lists rows (**not executed**) | FALSE (runtime) | Open admin queue with service role env. |
| P12 | Admin dashboard Autos row actions are connected and not dead. | `ClassifiedAdminRowActions` + `autosLiveVehiclePath` links in `admin/.../autos/page.tsx` (**not executed**) | FALSE (runtime) | Click live preview / row actions on staging. |
| P13 | Public cards show year, make, model, price, mileage, location, seller type. | `AutosPublicStandardCard.tsx` + `mapAutosClassifiedsToPublic.ts` (`vehicleTitle`, price, miles, location row, seller chip) | TRUE (code) | Extend mapper if a field is missing from payload. |
| P14 | Detail page shows all important publish fields that exist in the publish form. | `AutoPrivadoPreviewPage` / `AutoDealerPreviewPage` + specs grids render `AutoDealerListing` fields when present (trim empty) | TRUE (code) | Add any missing honest field to live templates when product asks. |
| P15 | Search uses all realistic searchable Autos fields: make, model, year, trim if available, location, seller/dealer name if available. | `buildSearchableBlurb` in `mapAutosClassifiedsToPublic.ts` + `applyAutosPublicFilters` `q` matches joined haystack including make, model, year, trim, city, dealerName, privateSellerLabel, blurb | TRUE (code) | Expand blurb composition if new high-signal fields are added to drafts. |
| P16 | Filters include all practical fields that exist in the Autos publish/application data model. | `applyAutosPublicFilters`: city, zip, price, make, model, year range, condition, sellerType, bodyStyle, transmission, drivetrain, fuelType, mileage range, titleStatus. **Not** filtered: exterior/interior color, VIN (search-only via blurb), contact channels (buyer trust, not browse filters). | TRUE (code) | Add filter only when product + UX agree and `applyAutosPublicFilters` implements it. |
| P17 | Sort options are real and wired. | `AutosPublicResultsShell` options: `newest`, `priceAsc`, `priceDesc`, `mileage` → `sortAutosPublicListings`. Dedicated **Year oldest / Year newest-only** sorts are **not** exposed (newest uses recency + year tie-break, not a separate “year oldest” mode). | TRUE (code) | Add `yearAsc`/`yearDesc` keys + UI only if wired end-to-end. |
| P18 | Default sort prioritizes newest active listings first unless featured/paid placement logic already exists. | Default `sort=newest` in `parseAutosBrowseUrl`; `compareNewestAutosPublic` prefers `publicSortTimestamp` then year | TRUE (code) | Document any future paid placement in ranking module. |
| P19 | Private seller and business/dealer listings are visibly distinct on public surfaces. | `sellerType` + lane badges in blueprint copy; dealer vs private card chrome in `AutosPublicStandardCard` | TRUE (code) | Align any stray card variant with same chips. |
| P20 | No fake filter or fake sort control is presented as active. | Radius labeled not active in `autosPublicBlueprintCopy.ts`; `radiusMiles` ignored in `applyAutosPublicFilters` | TRUE (code) | Remove any new “coming soon” control presented as applying. |
| P21 | Build passes. | Run `npm run build` in Phase 2 validation | TRUE (runtime) | Fix compile/export errors until green. |
| P22 | Autos smoke/audit passes. | `npm run autos:phase1-audit`, `npm run autos:phase2-audit`, `npm run autos:enforce-smoke` | TRUE (runtime) | Fix scripts or code assertions. |
| P23 | No unrelated files changed. | Primary edits are Autos-only; **minimal** `app/(site)/clasificados/anuncio/[id]/page.tsx` type-narrow for `MediaSlot` was required so `npm run build` passes (community gallery). | TRUE (code) | Remove anuncio fix only if global build is fixed elsewhere. |
| P24 | Final Phase 2 publish visibility readiness. | P4–P12 remain **FALSE (runtime)** until a human/Playwright run documents listing ID + URLs | FALSE (runtime) | Run `npm run verify:autos:e2e` or manual checklist with `AUTOS_ALLOW_TEST_PUBLISH_BYPASS=true`. |

## Publish field mapping (from `AutoDealerListing` + row metadata)

| Field / data | (1) Public card | (2) Detail page | (3) Results filters | (4) Search `q` | (5) Sort | (6) Admin row | (7) User “Mis anuncios” |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Year, make, model, trim | `vehicleTitle` / title line | Hero + specs | via title/year filters | haystack + blurb | tie-break in `newest` | Year in blob search | Title |
| Price | Yes | Yes | min/max | haystack (numeric as string) | priceAsc/Desc | Shown in row | Yes |
| Mileage | Yes | Yes | min/max | blurb | mileage | — | — |
| City, state, ZIP | Location line | Yes | city, zip | haystack | tie-break | Text blob | — |
| Seller type (lane) | Chip | Lane-specific layout | seller filter | dealer/private labels | — | Lane column | Status/lane |
| Transmission, fuel, body, drivetrain | Chips (subset) | Specs grid | each has filter | haystack (body etc.) | — | — | — |
| Condition | Chip | Yes | filter | haystack | — | — | — |
| Title status | — | Yes | filter | blurb | — | — | — |
| Exterior / interior color | — | When set in payload | **not** a browse filter (too sparse for MVP filter UX) | blurb if in description | — | — | — |
| VIN | — | When set | no dedicated filter | blurb | — | — | — |
| Stock # | — | dealer | — | blurb | — | — | — |
| Dealer / business name | Dealer card | Dealer stack | — (use `q`) | haystack | — | blob | — |
| Private seller display name | `privateSellerLabel` | Privado strip | — | haystack | — | — | — |
| Phone / email / WhatsApp | — | Contact CTAs | — | not in `q` haystack by default | — | — | — |
| Images | Primary + gallery | Gallery | — | — | — | — | thumb |
| Description | — | Yes | — | blurb | — | — | — |
| Video / Mux | — | When allowed | — | — | — | — | — |
| Related dealer cars | — | Negocios related rail | — | — | — | — | — |
| `published_at` / `updated_at` | via sort recency | — | — | — | newest | Timestamps | — |
| Status | — | Live only serves `active` | — | — | — | Status label | Status |

## Test URLs (after local publish)

- **Landing:** `/clasificados/autos`
- **Results:** `/clasificados/autos/resultados`
- **Detail:** `/clasificados/autos/vehiculo/{listingId}?lang=es`
- **User dashboard:** `/dashboard/mis-anuncios` (and drafts: `/dashboard/drafts` shows `DashboardAutosPaidDraftsBand` when applicable)
- **Admin:** `/admin/workspace/clasificados/autos`

## Validation log (Phase 2)

Run in repo root:

1. `npm run autos:phase1-audit`
2. `npm run autos:phase2-audit`
3. `npm run autos:enforce-smoke`
4. `npm run lint`
5. `npm run build`

*(Record exit codes / “OK” lines when cutting a release; P21–P22 flip to FALSE if any command fails.)*

## Next gated phase

**Phase 3 — Stripe + global paid publishing:** re-enable production checkout, live Stripe prices, webhook-only activation guarantees, and retire or further lock test bypass flags behind explicit ops approval.
