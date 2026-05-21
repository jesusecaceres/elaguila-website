# A5.4 — Autos Negocios Inventory Drawer + Premium Output Polish Audit

**Gate:** A5.4 — Autos Negocios Inventory Drawer + Premium Output Polish Gate  
**Date:** 2026-05-19  
**Product lock:** Autos Negocio $399/mo · 10 active vehicles · Inventory Boost +10 @ $129/mo · $528/mo for 20 active.

## 1. Files inspected

- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx`
- `app/(site)/clasificados/autos/dealer/[dealerInventoryGroupId]/AutosDealerInventoryPageClient.tsx`
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/publicar/autos/negocios/components/AutosNegociosInventoryValueModule.tsx`
- `app/lib/clasificados/autos/autosDealerInventoryCopy.ts`
- `app/lib/clasificados/autos/autosDealerInventoryValueCopy.ts`
- `app/(site)/clasificados/bienes-raices/dashboard/BrPropertyInventoryValueDrawer.tsx` (pattern reference)
- `app/(site)/publicar/autos/shared/components/AutosVehicleIdentityFields.tsx` / `AutosVehicleEngineField.tsx`

## 2. Preview/detail layout polish

- Title/price band retained with stronger hierarchy (`text-3xl`/`sm:text-4xl` price).
- Contact aside remains sticky on desktop with elevated card shell.
- Description moved above specs/highlights so copy is not buried.
- Related inventory moved after specs/highlights.
- Fake draft analytics remain hidden unless `publicPlaybackOnly` + non-zero real metrics.

## 3. Premium contact card

- Larger dealer logo, identity block, CTA grid (WhatsApp → Call → Schedule → Website → Email).
- Social icons only for validated `dealerSocials` URLs.
- Today's hours line when weekday matches `dealerHours` day label.
- Structured address + map CTA unchanged (real data only).
- Buyer inventory link stays separate from owner add-inventory CTAs.

## 4. Inventory drawer/bottom sheet

- `AutosNegociosInventoryValueDrawer` — desktop slide-over (`lg:ml-auto`, max 480px), mobile bottom sheet (`rounded-t-[24px]`, max 92dvh).
- `AutosNegociosInventoryValueDrawerTrigger` wired from dashboard and review-step value module.
- Shows active count, remaining slots, 10-included copy, +10/$129 upgrade, $528/20 total, payment note.
- Under limit: primary CTA → `buildAutosInventoryAddPublishHref` (same-tab Negocios add flow).
- At limit: mailto upgrade CTAs (no Stripe).

## 5. Inventory add form behavior

- Reuses existing Negocios application via inventory add query (`autosDealerInventoryAddFlow`).
- Dealer/contact/logo/social/hours/address prefilled from parent; vehicle fields empty.
- Final confirm CTA remains “Agregar al inventario” (`AutosApplicationFinalActions`).

## 6. Inventory cards / full inventory page

- `AutosDealerInventoryVehicleCard` — Autos result-card visual language (gold border, serif title, green price).
- `RelatedDealerCars` uses shared card; subtitle updated to inventory exploration copy.
- Full dealer inventory page uses same cards + dealer header with active count.

## 7. Publish/review CTA behavior

- Main publish: `Publicar anuncio` on confirm (unchanged).
- Inventory add: `Agregar al inventario` when `inventoryAddMode`.
- Review step value module opens drawer before add route.

## 8. Trim/engine reality check

- `AutosVehicleIdentityFields` — catalog trim + `__trim_custom__` manual fallback (A2/A3).
- `AutosVehicleEngineField` — catalog engine + manual fallback; `engineNormalized` only when catalog match.
- No new car DB; filters stay clean for manual values.

## 9. Build/check result

- `npm run autos:a5-4-negocios-inventory-drawer-polish-audit` — PASS (scope warnings: unrelated Servicios dirty files)
- `npm run autos:a5-3` / `a5-2` / `a5-1` / `a4-1` / `a4-dealer` / `autos:enforce-smoke` — PASS
- `npm run autos:a5-0` — FAIL (unrelated dirty: `servicios/*`)
- `npm run lint` (Autos scope) — PASS
- `npm run build` — PASS

## 10. Remaining risks

- Review-step drawer needs `parentListingId`; brand-new drafts without a saved parent row hide the add CTA until first publish.
- Today's hours depends on dealer day labels matching weekday aliases (EN/ES).
- Mobile layout polish is manual QA only.
- `autos:a5-0` / `autos:a3` may still fail if unrelated dirty files exist outside Autos scope.

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Autos preview/detail output was polished | TRUE | `AutoDealerPreviewPage.tsx` section reorder + contact shell |
| Title/price hierarchy improved | TRUE | Title band + `text-3xl`/`sm:text-4xl` price column |
| Hero/gallery/contact layout improved | TRUE | Sticky aside + elevated dealer card wrapper |
| Description placement improved | TRUE | Description before specs/highlights |
| Specs grid improved | TRUE | `VehicleSpecsGrid` `lg:grid-cols-3 xl:grid-cols-4` (A5.2) |
| Fake preview metrics hidden/removed | TRUE | `publicPlaybackOnly` + non-zero gate |
| Premium dealer contact card exists | TRUE | `DealerBusinessStack.tsx` |
| Real CTAs only are shown | TRUE | Conditional tiles; no fake quote/reviews |
| Social icons show real links only | TRUE | `safeExternalHref` per social key |
| Hours/location/map are cleanly displayed | TRUE | Hours block + today line + address/map |
| Inventory drawer/slide-over exists or blocker documented | TRUE | `AutosNegociosInventoryValueDrawer.tsx` |
| Mobile drawer/bottom-sheet behavior exists or blocker documented | TRUE | `rounded-t-[24px]`, `max-h-[min(92dvh,720px)]` |
| Active inventory count is shown | TRUE | `autosDealerInventoryActiveCountLine` |
| Remaining slots are shown | TRUE | `autosDealerInventoryRemainingSlotsLine` |
| 10 included vehicles copy exists | TRUE | `autosDealerInventoryDrawerBasePackageLine` |
| +10 vehicles for $129/month copy exists | TRUE | `INVENTORY_BOOST_MONTHLY_USD` / drawer upgrade line |
| $528/month total copy exists | TRUE | `AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD` |
| No +1/+2/+5/tier logic was added | TRUE | Only 10 + boost 10 constants |
| No Stripe/payment logic was added | TRUE | mailto upgrade only |
| Under-limit add CTA opens inventory add flow | TRUE | `buildAutosInventoryAddPublishHref` in drawer |
| At-limit upgrade CTA does not fake payment | TRUE | `autosDealerInventoryUpgradeContactHref` |
| Inventory add flow reuses real Autos Negocios app | TRUE | `autosDealerInventoryAddFlow.ts` |
| Dealer fields prefill in add mode | TRUE | `useAutoDealerDraft` parent fetch |
| New vehicle fields start empty in add mode | TRUE | Inventory add mode clears vehicle identity |
| Child inventory vehicle remains a real listing | TRUE | SQL-backed create (A4) |
| Child inventory vehicle gets own leonix_ad_id | TRUE | E2E + service (A5.3) |
| Related inventory uses real listing cards | TRUE | `AutosDealerInventoryVehicleCard` in `RelatedDealerCars` |
| Full dealer inventory page uses real listings | TRUE | API `public/dealer/[groupId]` + cards |
| Main publish CTA is visible and wired | TRUE | `AutosApplicationFinalActions` |
| Inventory add CTA is visible and wired | TRUE | Drawer + confirm inventory mode |
| Trim fallback remains clean | TRUE | `AutosVehicleIdentityFields` `TRIM_CUSTOM` |
| Engine fallback remains clean | TRUE | `AutosVehicleEngineField` `ENGINE_CUSTOM` |
| Preview does not clear form data | TRUE | `flushDraft` before preview (A5.1) |
| Privado is not affected | TRUE | Negocios-only paths touched |
| No unrelated categories were touched | TRUE | Scope limited to Autos paths |
| npm run build passed | TRUE | `npm run build` exit 0 |
