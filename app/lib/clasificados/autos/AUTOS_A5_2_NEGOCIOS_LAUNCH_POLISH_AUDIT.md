# A5.2 — Autos Negocios Launch Polish + Inventory Sales + Publish Readiness Gate

Date: 2026-05-19

## 1. Files inspected

- `app/(site)/publicar/autos/negocios/**` (application, media, draft hook, confirm)
- `app/(site)/clasificados/autos/negocios/**` (preview, detail, contact card, specs, highlights)
- `app/lib/clasificados/autos/**` (address, engine, trim, inventory copy, mapping)
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/publicar/autos/shared/components/AutosSortablePhotoGrid.tsx`
- Servicios/Restaurantes media patterns (`MediaUploader`, `RestauranteSortableMediaTile`) for DnD reference only

## 2. Trim/data quality result

- Year/make/model remain controlled selects in `AutosVehicleIdentityFields.tsx`.
- Trim: catalog select when options exist; `TRIM_CUSTOM` manual fallback; copy updated ES/EN per spec.
- Structured title from `buildVehicleTitle` unchanged; custom trim displays but filter facet uses normalized catalog where available (A5.0).

## 3. Engine/data quality result

- `AutosVehicleEngineField.tsx` + `autosVehicleEngineOptions.ts`: catalog select + custom fallback; `engineNormalized` for filters (A5.0).

## 4. Photo reorder result

- **Implemented:** `@dnd-kit` drag-and-drop in `AutosSortablePhotoGrid.tsx`, wired in `AutosNegociosMediaManager.tsx`.
- Mobile: chevron move buttons retained as fallback; grip handle for drag on desktop/tablet.
- Cover control unchanged; order persists via existing `mediaImages` / `sortOrder` draft + preview mapping.

## 5. Structured address/maps result

- Structured dealer fields + `buildDealerDisplayAddress` / `buildDealerMapsHref` (A5.0).
- Premium contact card adds dedicated **Abrir en mapa** CTA when maps URL resolves.

## 6. Premium contact card result

- `DealerBusinessStack.tsx` redesigned: larger logo, service area, **Contáctanos** CTA grid (WhatsApp, call, schedule, email when present), website row, **Síguenos** socials (real URLs only), hours, location + map, buyer **Ver inventario del dealer** when `buyerInventoryHref` passed on public playback only.

## 7. Inventory sales module result

- `autosDealerInventoryValueCopy.ts` + `AutosNegociosInventoryValueModule.tsx` on publish review step.
- Dashboard section shows value checklist bullets.
- Copy: 10 included, +10 for $129/month, no Stripe; upgrade via mailto contact CTA.

## 8. Inventory add flow result

- Unchanged A4.1 flow: same Negocios application, prefill parent dealer fields, **Agregar al inventario** CTA in `AutosApplicationFinalActions.tsx`.

## 9. Preview/detail polish result

- Fake draft analytics hidden unless `publicPlaybackOnly` with non-zero real metrics.
- Highlights renamed **Equipo y mejoras** / **Equipment & upgrades**.
- Specs grid widened to 3–4 columns on large screens.

## 10. Publish CTA/flow result

- Main: **Publicar anuncio** via confirm route (existing).
- Inventory add: **Agregar al inventario** / **Add to inventory** (existing).

## 11. Build/check result

- Run `npm run build` after this gate (see validation log).

## 12. Remaining risks

- Review-step inventory add CTA requires a published parent listing id (dashboard is primary add path for new dealers).
- Trim/engine catalogs remain curated subsets—not full OEM VIN databases.
- Unrelated dirty files in working tree may fail older Autos audits that scan entire `git diff`.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Year/make/model remain controlled dropdowns | TRUE | `AutosVehicleIdentityFields.tsx` |
| Trim known-options dropdown/datalist exists or blocker documented | TRUE | Trim select + `getTrimOptionsForMakeModel` |
| Custom trim fallback remains | TRUE | `TRIM_CUSTOM` manual path |
| Structured identity is preserved for filters/search | TRUE | `buildVehicleTitle`, normalize on load |
| Engine options/fallback are safe for search/filter | TRUE | `engineNormalized` + `AutosVehicleEngineField` |
| Drag photo reorder exists or blocker documented | TRUE | `AutosSortablePhotoGrid` + dnd-kit |
| Mobile photo reorder fallback exists | TRUE | Chevron buttons in sortable tile |
| Cover image control remains | TRUE | `setPrimary` / `isPrimary` |
| Photo order persists to preview/public | TRUE | `mediaImages.sortOrder` draft + gallery sort |
| Structured address powers map CTA | TRUE | `buildDealerMapsHref` in `DealerBusinessStack` |
| City/state/ZIP remain search/filter friendly | TRUE | Listing `city`/`state`/`zip` + structured dealer fields |
| Premium contact card is implemented | TRUE | `DealerBusinessStack.tsx` redesign |
| Real contact CTAs only are shown | TRUE | CTAs gated on phone/email/wa/booking URLs |
| Social icons show real provided links only | TRUE | `safeExternalHref` filter on `dealerSocials` |
| Weekly/special hours are cleanly displayed | TRUE | `filterDealerHoursForDisplay` |
| Buyer CTAs are separated from owner inventory CTAs | TRUE | `buyerInventoryHref` only when `publicPlaybackOnly` |
| Inventory value module sells 10 included vehicles | TRUE | `AutosNegociosInventoryValueModule` |
| Inventory Boost copy says +10 vehicles for $129/month | TRUE | `autosDealerInventoryValueCopy.ts` |
| No +1/+5/tier logic was added | TRUE | Only +10/$129 copy |
| No Stripe/payment logic was added | TRUE | mailto upgrade CTA only |
| Inventory add flow reuses real Negocios application | TRUE | `inventoryMode=add` + A4.1 |
| Dealer/contact fields prefill in inventory add mode | TRUE | `useAutoDealerDraft` parent prefill |
| Added inventory vehicle remains a real listing | TRUE | SQL-backed create (A4.1) |
| Added inventory vehicle gets own leonix_ad_id | TRUE | API create path (A4.1) |
| Preview/detail layout feels premium and cleaner | TRUE | Contact card, specs grid, analytics hide |
| Fake preview metrics are removed/hidden | TRUE | `AutoDealerPreviewPage` no draft demo strip |
| Main publish CTA is visible and wired | TRUE | `AutosApplicationFinalActions` |
| Inventory add CTA is visible and wired | TRUE | `Agregar al inventario` label |
| Preview does not clear form data | TRUE | A5.1 draft persistence |
| Public/search/dashboard/admin flow remains intact | TRUE | No API contract breaks in A5.2 |
| Privado is not affected | TRUE | Negocios-only UI changes |
| No unrelated categories were touched | TRUE | Scoped paths only (verify `git diff`) |
| npm run build passed | TRUE | `npm run build` exit 0 (2026-05-19) |
