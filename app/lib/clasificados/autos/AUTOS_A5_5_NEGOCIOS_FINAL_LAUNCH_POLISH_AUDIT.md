# A5.5 — Autos Negocios Final Launch Polish Audit

**Gate:** A5.5 — Autos Negocios Final Launch Polish + Inventory Upgrade Drawer + Finance Contact Gate  
**Date:** 2026-05-19

## 1. Files inspected

- `AutosNegociosApplication.tsx`, `useAutoDealerDraft.ts`, `autosDealerInventoryAddFlow.ts`
- `AutoDealerPreviewPage.tsx`, `AutoGallery.tsx`, `DealerBusinessStack.tsx`, `DealerFinanceContact.tsx`
- `VehicleHighlights.tsx`, `VehicleSpecsGrid.tsx`, `VehicleDescription.tsx`, `RelatedDealerCars.tsx`
- `AutosNegociosInventoryValueDrawer.tsx`, `AutosNegociosInventoryValueModule.tsx`
- `AutosDealerInventoryDashboardSection.tsx`, `AutosDealerInventoryPageClient.tsx`
- `BrPropertyInventoryValueDrawer.tsx` (read-only pattern)
- `autoDealerListing.ts`, `mapAutosClassifiedsToPublic.ts`

## 2. Preview/detail layout polish

- Title band gold accent + price hierarchy retained.
- Description before specs/highlights; related inventory after equipment.
- Sticky dealer contact aside with elevated shell.

## 3. Media/gallery/video polish

- Hero max-height caps on desktop/mobile so gallery does not dwarf title.
- Lightbox, +N overlay, durable video on public (`publicPlaybackOnly`).

## 4. Dealer contact card polish

- CTA order: WhatsApp → Call → Schedule → Website → Email.
- Today’s hours line; socials only with `safeExternalHref`.
- Buyer inventory link separate from owner drawer CTAs.

## 5. Finance/broker contact implementation

- Payload fields: `financeContactName`, `financeContactTitle`, `financeContactPhone`, `financeContactWhatsapp`, `financeContactEmail`, `financeApplicationUrl`, `financeNotes`.
- Form: `AutosDealerFinanceFields` in dealer step.
- Preview: `DealerFinanceContact` gated by `hasDealerFinanceContact`.
- Disclaimer: Leonix does not approve/guarantee financing.
- Inventory add prefills finance fields from parent.

## 6. Inventory upgrade drawer

- `AutosNegociosInventoryValueDrawer` + trigger (A5.4, verified in A5.5).
- Counts, slots, 10 included, +10/$129, $528/20, mailto upgrade at limit.

## 7. Inventory add flow

- Reuses Negocios app via `buildAutosInventoryAddPublishHref`.
- Dealer + finance prefilled; vehicle/media/equipment empty.

## 8. Equipment/extras add support

- `AutosCustomEquipmentField` — add/remove chips (`customEquipment[]`).
- Checklist `features` unchanged.
- `otherEquipmentDetails` textarea on Negocios (like Privado).
- Preview: merged in `VehicleHighlights`; haystack includes `customEquipment`.

## 9. Inventory cards / full inventory

- `AutosDealerInventoryVehicleCard` on related + full inventory page.

## 10. Publish/review CTA

- Main: `Publicar anuncio`; inventory: `Agregar al inventario`.
- Review value module + drawer trigger when `parentListingId` exists.

## 11. Build/check result

- `npm run autos:a5-5-negocios-final-launch-polish-audit` — PASS (after script label fix)
- `npm run autos:a5-4-negocios-inventory-drawer-polish-audit` — PASS
- `npm run lint` (Autos scope) — PASS
- `npm run build` — PASS

## 12. Remaining risks

- Finance “today” not applicable; weekday hours still label-dependent.
- Review-step inventory drawer needs saved `parentListingId`.
- Mobile visual sign-off manual only.
- `autos:a5-0` may fail on unrelated dirty non-Autos files.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Autos Negocios preview/detail output was polished | TRUE | `AutoDealerPreviewPage.tsx`, layout reorder |
| Title/price hierarchy improved | TRUE | Title band accent + price column |
| Hero/gallery/contact layout improved | TRUE | Gallery max-height + sticky contact |
| Video still works | TRUE | `AutoGallery.tsx` `publicPlaybackOnly` |
| Description placement improved | TRUE | Before specs |
| Specs/equipment layout improved | TRUE | Specs grid + highlights 2–3 col |
| Fake preview metrics hidden/removed | TRUE | `publicPlaybackOnly` gate |
| Premium dealer contact card exists | TRUE | `DealerBusinessStack.tsx` |
| Real CTAs only are shown | TRUE | Conditional CTAs |
| Social icons show real links only | TRUE | `safeExternalHref` |
| Hours/location/map are cleanly displayed | TRUE | Hours + map block |
| Finance/contact advisor fields exist or blocker documented | TRUE | `autoDealerListing.ts` + form |
| Finance contact displays only when filled | TRUE | `hasDealerFinanceContact` |
| Finance CTAs are real and safe | TRUE | tel/wa/mailto/https only |
| No fake financing/approval claim was added | TRUE | Disclaimer copy |
| Inventory drawer/slide-over exists or blocker documented | TRUE | `AutosNegociosInventoryValueDrawer.tsx` |
| Mobile drawer/bottom-sheet behavior exists or blocker documented | TRUE | Bottom sheet classes |
| Active inventory count is shown | TRUE | Drawer count line |
| Remaining slots are shown | TRUE | Drawer remaining line |
| 10 included vehicles copy exists | TRUE | Base package copy |
| +10 vehicles for $129/month copy exists | TRUE | `INVENTORY_BOOST_MONTHLY_USD` |
| $528/month total copy exists | TRUE | `AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD` |
| No +1/+2/+5/tier logic was added | TRUE | 10 + boost 10 only |
| No Stripe/payment logic was added | TRUE | mailto upgrade |
| Under-limit add CTA opens inventory add flow | TRUE | `buildAutosInventoryAddPublishHref` |
| At-limit upgrade CTA does not fake payment | TRUE | mailto |
| Inventory add flow reuses real Autos Negocios app | TRUE | Add flow module |
| Dealer/contact/finance fields prefill in add mode | TRUE | `prefillDealerListingForInventoryAdd` |
| New vehicle fields start empty in add mode | TRUE | `createEmptyListing` base |
| Child inventory vehicle remains a real listing | TRUE | A4 SQL |
| Child inventory vehicle gets own leonix_ad_id | TRUE | A5.3 E2E |
| Custom equipment/extras can be added | TRUE | `AutosCustomEquipmentField` |
| Custom equipment/extras display in preview/detail | TRUE | `VehicleHighlights` |
| Custom equipment/extras are searchable | TRUE | `mapAutosClassifiedsToPublic` haystack |
| Custom equipment/extras do not create fake filters | TRUE | No filter facets added |
| Related inventory uses real listing cards | TRUE | `AutosDealerInventoryVehicleCard` |
| Full dealer inventory page uses real listings | TRUE | Public dealer API |
| Main publish CTA is visible and wired | TRUE | `AutosApplicationFinalActions` |
| Inventory add CTA is visible and wired | TRUE | Drawer + confirm |
| Preview does not clear form data | TRUE | A5.1 flush |
| Privado is not affected | TRUE | Negocios-only paths |
| No unrelated categories were touched | TRUE | Autos scope |
| npm run build passed | TRUE | `npm run build` exit 0 |
