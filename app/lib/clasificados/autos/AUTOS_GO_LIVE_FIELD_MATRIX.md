# Autos go-live — field matrix (application → storage → public → filters)

**Sources of truth**

- Application / payload type: `app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts` (`AutoDealerListing`) — shared by **privado** and **negocios** publish UIs.
- Persisted row: `app/lib/clasificados/autos/autosClassifiedsTypes.ts` (`AutosClassifiedsListingRow`: `listing_payload`, `lane`, `status`, `featured`, Stripe columns, timestamps).
- Public browse card + filter input type: `app/(site)/clasificados/autos/data/autosPublicSampleTypes.ts` (`AutosPublicListing`).
- Public row mapper: `app/lib/clasificados/autos/mapAutosClassifiedsToPublic.ts` (`autosClassifiedsRowToPublicListing`).
- Filters + search: `app/(site)/clasificados/autos/components/public/autosPublicFilters.ts` (`applyAutosPublicFilters`), URL contract `app/(site)/clasificados/autos/filters/autosBrowseFilterContract.ts`.
- Detail page: `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx` → `GET /api/clasificados/autos/public/listings/[id]` returns full normalized `AutoDealerListing` (not the slim card).

Legend: **Detail** = live/preview vehicle page. **Card** = results/landing card. **Filter** = `AutosPublicFilterState` + query applied in `applyAutosPublicFilters`. **Search** = free-text `q` on results.

## Row-level (paid autos table)

| Field | Source | Storage | Card | Detail | Filter | Search (q) | Admin | Dashboard | Notes |
| ----- | ------ | ------- | ---- | ------ | ------ | ---------- | ----- | --------- | ----- |
| Listing id | API | `id` | id | URL | — | — | truncated id | id | Public URLs use UUID. |
| Owner | auth | `owner_user_id` | — | — | — | — | fragment | — | |
| Lane | publish flow | `lane` (`negocios` / `privado`) | sellerType (mapped dealer/private) | autosLane | sellerType | — | column | — | |
| Status | lifecycle | `status` | — | — | — | — | label + visibility bucket | label | Public only `active`. |
| Lang | publish | `lang` | — | locale | — | — | — | — | |
| Featured | DB / product | `featured` | featured (dealer only) | — | — | — | implied | — | Not a buyer filter; drives featured band partition. |
| Stripe checkout id | checkout | `stripe_checkout_session_id` | — | — | — | — | hint column | — | Cleared on successful activation. |
| Stripe payment intent | verify/webhook | `stripe_payment_intent_id` | — | — | — | — | hint column | — | |
| published_at | activation | `published_at` | — | — | — | — | column | published_at | |
| created_at / updated_at | DB | timestamps | — | — | — | — | updated column | updated_at | |

## `listing_payload` — vehicle + seller

| Field | Source files | Storage | Card | Detail | Filter | Search (q) | Admin-only | Dashboard | Fix applied (this pass) |
| ----- | ------------ | ------- | ---- | ------ | ------ | ---------- | ----------- | ----------- | ----------------------- |
| vehicleTitle | Negocios/Privado apps | `listing_payload.vehicleTitle` | vehicleTitle | yes | — | yes (via vehicleTitle) | — | title derived | — |
| year | apps | `year` | year | yes | yearMin/Max | yes | — | — | — |
| make | apps | `make` | make (trimmed) | yes | make (exact, case-insensitive) | yes | — | — | Trim on card; filter case-insensitive. |
| model | apps | `model` | model | yes | model (contains, case-insensitive) | yes | — | — | — |
| trim | apps | `trim` | trim | yes | — | yes | — | — | High-cardinality; use search, not rail. |
| condition | apps | `condition` | condition | yes | condition | — | — | — | — |
| price | apps | `price` | price | yes | priceMin/Max | — | — | priceUsd | — |
| monthlyEstimate | apps | `monthlyEstimate` | optional | dealer UI | — | — | — | — | Dealer-oriented display. |
| mileage | apps | `mileage` | mileage | yes | mileageMin/Max | — | — | — | — |
| city | apps | `city` | city | yes | city (canonical match) | yes | — | city | — |
| state | apps | `state` | state | yes | — | yes | — | — | Not on filter rail (city/ZIP preferred MVP); appears in copy when inferred from inventory. |
| zip | apps | `zip` | zip | yes | zip (with city/ZIP rules) | yes | — | — | Digits normalized on card. |
| bodyStyle + bodyStyleCustom | Select + Otro | stored both | bodyStyle via **resolve** | yes | bodyStyle | yes | — | — | **Fixed:** mapper used raw value; `Otro` + custom failed filters/detail parity — now `resolveBodyStyle`. |
| transmission + transmissionCustom | Select + Otro | stored | transmission via **resolve** | yes | transmission | yes | — | — | **Fixed:** `resolveTransmission`. |
| drivetrain + drivetrainCustom | Select + Otro | stored | drivetrain via **resolve** | yes | drivetrain | yes | — | — | **Fixed:** `resolveDrivetrain`. |
| fuelType + fuelTypeCustom | Select + Otro | stored | fuelType via **resolve** | yes | fuelType | yes | — | — | **Fixed:** `resolveFuelType`. |
| titleStatus + titleStatusCustom | Select + Otro | stored | titleStatus via **resolve** | yes | titleStatus | yes | — | — | **Fixed:** `resolveTitleStatus`. |
| exteriorColor + custom | apps | stored | — | yes | — | — | — | — | High-cardinality; not filterable; detail/preview. |
| interiorColor + custom | apps | stored | — | yes | — | — | — | — | Same. |
| vin | apps | `vin` | — | yes | — | — | — | — | Privacy: not filterable. |
| stockNumber | apps | `stockNumber` | — | yes | — | — | — | — | |
| engine | apps | `engine` | — | yes | — | — | — | — | |
| mpgCity / mpgHighway | apps | stored | — | yes | — | — | — | — | |
| doors | apps | `doors` | — | yes | — | — | — | — | Omit filter (low signal vs noise). |
| seats | apps | `seats` | — | yes | — | — | — | — | Same. |
| badges | apps | `badges` | badges | yes | — | — | — | — | |
| features | apps | `features` | — | yes | — | — | — | — | |
| description | apps | `description` | — | yes | — | partial | — | — | Could extend search haystack later. |
| mediaImages / heroImages | apps | stored | primaryImageUrl derived | gallery | — | — | thumb presence | thumb | |
| Video / Mux fields | apps | stored | — | preview rules | — | — | — | — | Draft/live behavior per type comments. |
| dealerName | apps | `dealerName` | dealerName / privateSellerLabel | yes | — | yes (name) | — | — | Private lane uses `dealerName` as display name in mapper. |
| dealerLogo | apps | `dealerLogo` | dealerLogoUrl | yes | — | — | — | — | |
| dealerPhoneOffice / deprecated dealerPhone | apps | stored | — | contact | — | — | — | — | Normalized in `normalizeLoadedListing`. |
| dealerPhoneMobile | apps | stored | — | optional | — | — | — | — | |
| dealerWhatsapp | apps | stored | — | yes | — | — | — | — | |
| dealerEmail | apps | stored | — | privado | — | — | — | — | |
| privadoSiteMessageEnabled | apps | stored | — | yes | — | — | — | — | |
| dealerAddress / hours / website / booking / socials | apps | stored | — | yes | — | — | — | — | |
| relatedDealerListings | server enrich | optional on listing | — | dealer strip | — | — | — | — | Built in `getActiveLiveAutosBundle`. |
| listingAnalytics | apps / server | stored | — | strip | — | — | — | — | |

## URL / UI contract — not a stored “field”

| Concern | Detail | Filter | Notes |
| ------- | ------ | ------ | ----- |
| radiusMiles | — | parsed, **disabled** in UI | Documented as reserved until geo; not applied in `applyAutosPublicFilters`. |
| sort / page / lang / q | — | results shell | `parseAutosBrowseUrl` / serialize. |

## Trust / moderation

| Concern | Implementation | This pass |
| ------- | ---------------- | --------- |
| Report listing | `LeonixInlineListingReport` + `submitListingReportAction` → `listing_reports` | **Added** to live vehicle footer (`AutosLiveVehicleClient`) so paid Autos UUID is reportable like generic clasificados. |

## Summary counts (approximate)

| Category | Count | Notes |
| -------- | ----- | ----- |
| Distinct application/payload fields reviewed | **~45** | Excluding purely internal video upload temp fields from count. |
| Exposed on public card (`AutosPublicListing`) | **~24** | Including optional titleStatus, badges, zip. |
| Buyer filter rail + URL (excluding sort/page/lang/q) | **~15** | Includes city, zip, price/year/mileage ranges, make/model, condition, seller, body, transmission, drivetrain, fuel, titleStatus. |
| Admin-only / operational | **~8** | owner id, stripe ids, status, timestamps, visibility bucket, full payload in DB. |
| Dashboard-only listing row | **~8** | id, status, lane, lang, dates, title, priceUsd, city, thumb — payment detail still status-derived. |
| Intentionally not public | **all non-`active` rows** | Plus VIN etc. not on card by design. |

| Filterable in matrix | Count |
| -------------------- | ----- |
| Fields with dedicated filter or range | **15** |
| Free-text search (`q`) | **1** (matches expanded haystack including specs + location + seller labels) |

## Parity / copy fixes (this pass)

| Issue | Fix |
| ----- | ----- |
| Select **Otro** stored canonical `"Otro"` broke filter option equality and misrepresented specs on cards. | Mapper now uses `resolveBodyStyle`, `resolveTransmission`, `resolveDrivetrain`, `resolveFuelType`, `resolveTitleStatus` from `autoDealerSelectResolve.ts`. |
| Search `q` only matched title/make/model/year/trim. | Haystack extended to bodyStyle, transmission, drivetrain, fuelType, titleStatus, city, state, zip, dealer/private labels. |
| Make filter case-sensitive. | Case-insensitive compare with trim. |
| Results subhead / featured title used hard-coded **San Jose, CA** when geo unknown. | Neutral / inventory-inferred copy via new blueprint strings and inferred state from current result set (`AutosPublicResultsShell`). |
| No report CTA on paid Autos live page. | `LeonixInlineListingReport` wired on `/clasificados/autos/vehiculo/[id]`. |
| Admin table lacked Stripe / recency hints for support. | `Stripe` (session/intent suffix) + `Actualizado` columns on `/admin/workspace/clasificados/autos`. |
| Dashboard lifecycle labels drifted from admin copy. | `AutosLeonixPaidListingsSection` now uses `autosListingStatusLabelEs` / `En` from `autosClassifiedsVisibility.ts`. |
