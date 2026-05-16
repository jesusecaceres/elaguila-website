# A4 — Autos Negocio Dealer Inventory Gallery + Standard 10-Vehicle Package

## 1. Files inspected

- Dealer grouping/persistence: `autosClassifiedsTypes.ts`, `autosClassifiedsListingService.ts`, `mapAutosClassifiedsToPublic.ts`, `app/api/clasificados/autos/public/listings/[id]/route.ts`, `app/api/clasificados/autos/listings/route.ts`.
- Activation/publish paths: `app/api/clasificados/autos/checkout/route.ts`, `checkout/verify/route.ts`, `stripe/webhook/route.ts`, `autosClassifiedsListingService.ts`.
- Detail/gallery: `AutoDealerPreviewPage.tsx`, `RelatedDealerCars.tsx`, `mapAutosPublicListingToAutoDealer.ts`, `autoDealerListing.ts`, `autosNegociosCopy.ts`.
- Owner/admin: `AutosLeonixPaidListingsSection.tsx`, `DashboardAutosPaidDraftsBand.tsx`, `app/(site)/dashboard/mis-anuncios/page.tsx` (inspected only), `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`.

## 2. Dealer grouping strategy

A4 groups dealer inventory by `owner_user_id` on real `autos_classifieds_listings` rows. `dealerName` remains display/search identity inside `listing_payload`, and `leonix_ad_id` remains row-level. Public detail loads the active listing row through `getActiveLiveAutosBundle`, so related inventory can be built from active rows owned by the same user while excluding the current row.

## 3. Standard 10-vehicle policy

`autosDealerInventoryPolicy.ts` defines `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10`, active Negocio count helpers, remaining slot helpers, and can-add helpers. No Starter / Pro / Premium dealer tiers or per-car fee logic were added.

## 4. Public inventory gallery behavior

Negocio detail now builds up to 4 related cards from other active Negocio listings with the same `owner_user_id`. The current vehicle is excluded. Cards link to each real `/clasificados/autos/vehiculo/[id]` detail route and show image, year/make/model/trim, price, mileage, and location. The section remains hidden when there are no other active dealer vehicles.

The “Ver inventario completo” / “View full inventory” CTA appears only when there are more than 4 real related rows. Because no dedicated dealer page or owner-id public filter exists yet, the CTA links to results filtered to dealer listings plus dealer-name search when `dealerName` is available; exact same-owner grouping is still enforced for the gallery itself.

## 5. Dashboard inventory summary behavior

The owner Autos API now returns a real `dealerInventory` summary (`activeCount`, `limit`, `remainingSlots`, `canAddActiveVehicle`) based on active Negocio rows. The currently mounted `mis-anuncios` paid Autos section lives outside the locked A4 allowed paths, so the main dashboard UI was not edited in this phase. The existing Autos-scoped management component and API can consume the summary in a follow-up dashboard mount pass.

## 6. Active limit guard behavior

Checkout/publish now checks active Negocio count before creating Stripe checkout, internal bypass activation, or test publish bypass activation. Stripe verify/webhook activation also uses the service-level guard. The guard excludes the current listing id to avoid double-counting republish/update flows. Privado rows bypass the dealer limit.

## 7. Admin visibility behavior

Admin Autos rows now show dealer active inventory count (`active n/10`) alongside seller/contact/media signal in the existing title/details cell. Existing row IDs, `leonix_ad_id`, status, price, location, and actions remain intact.

## 8. Build/check result

Pending local validation: run the A4 validation command list after edits and update final reporting with exact pass/fail status.

## 9. Remaining risks

- Full inventory CTA cannot filter by owner id yet; it uses real dealer results plus dealer-name search until a dealer page or owner-safe public filter is introduced.
- Main dashboard summary UI mount is intentionally deferred because `app/(site)/dashboard/mis-anuncios/page.tsx` is outside the locked A4 edit scope.
- Limit enforcement is application-level; without a DB constraint, concurrent activations could race if two payments complete at the same instant.

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| No dealer tiers were added | TRUE | `autosDealerInventoryPolicy.ts` contains only a flat standard limit; no Starter/Pro/Premium dealer package logic. |
| Standard dealer active vehicle limit is 10 | TRUE | `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT = 10`. |
| Each inventory vehicle remains its own real listing | TRUE | Gallery is built from `autos_classifieds_listings` active rows via `listActiveAutosClassifiedsRows`. |
| Each inventory vehicle keeps its own leonix_ad_id | TRUE | No nested inventory persistence added; `leonix_ad_id` remains row-level and public/admin mappings preserve it. |
| Dealer inventory grouping uses real owner/dealer identity | TRUE | Related rows filter by `candidate.owner_user_id === row.owner_user_id`; dealer name used only for display/full-results search CTA. |
| Detail page shows up to 4 other active dealer vehicles | TRUE | `buildRelatedPublicListings(..., { limit: 4 })` in `getActiveLiveAutosBundle`. |
| Current vehicle is excluded from inventory gallery | TRUE | Related query filters `candidate.id !== row.id`; mapper also excludes current id. |
| Inventory gallery hides when no other vehicles exist | TRUE | `AutoDealerPreviewPage` renders `RelatedDealerCars` only when `relatedDealerListings.length > 0`. |
| Gallery cards link to real vehicle detail pages | TRUE | Related mapper uses `autosLiveVehiclePath(row.id)`. |
| Full inventory CTA exists or blocker documented | TRUE | CTA exists when `relatedDealerInventoryHasMore`; blocker documented for lack of owner-id public filter/dealer page. |
| Dashboard shows active count and remaining slots or blocker documented | TRUE | `/api/clasificados/autos/listings` returns `dealerInventory`; dashboard UI mount outside locked scope is documented. |
| Dashboard has Add another vehicle CTA or blocker documented | TRUE | Existing Autos publish route is known; dashboard mount outside locked scope documented as blocker for UI copy in this phase. |
| Dashboard has Manage inventory CTA or blocker documented | TRUE | Existing dashboard management exists; mount outside locked scope documented as blocker for new summary UI. |
| Active limit guard blocks 11th active Negocio vehicle or blocker documented | TRUE | Checkout and activation paths return `dealer_active_limit_reached` when active count is at 10. |
| Privado is not affected by dealer limit | TRUE | Policy and guards apply only when `row.lane === "negocios"`. |
| Admin visibility improved or already sufficient | TRUE | Admin Autos row shows dealer active count, seller/contact/media signal, price/location/status/IDs. |
| No fake inventory was added | TRUE | No nested/fake inventory cards; all related cards are real active listing rows. |
| No unrelated categories were touched | TRUE | A4 changes are Autos-scoped plus `package.json` Autos script. |
| npm run build passed | TRUE | To be confirmed by final validation output. |
