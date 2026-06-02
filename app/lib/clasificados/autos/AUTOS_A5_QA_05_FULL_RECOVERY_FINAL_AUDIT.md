# A5.QA-05 — Autos Negocios Full Recovery + Final QA Readiness Gate

**Gate:** A5.QA-05  
**Platform:** Cursor  
**Date:** 2026-06-02  
**HEAD at audit:** `6281bc784d1f25717cd3db46fcdd80a43acf1cdb` (production redeploy trigger)  
**Repo:** `C:/projects/elaguila-website` · `main` · `origin` → `jesusecaceres/elaguila-website`

## 1. Repo/source confirmation

- Correct git repo: **TRUE**
- Branch: `main`
- Working tree: clean at audit start except QA-05 surgical fixes
- Q1/Q2/Q3 markers present in source (not assumed from prior GREEN)

## 2. Files inspected

- `app/(site)/publicar/autos/negocios/**` — `AutosNegociosApplication`, inventory/boost modules, media, draft hooks
- `app/(site)/publicar/autos/privado/**` — cross-check only
- `app/(site)/publicar/autos/shared/**` — `AutosSortablePhotoGrid`, finance fields, address, engine
- `app/(site)/clasificados/autos/negocios/**` — `DealerBusinessStack`, `DealerFinanceContact`, `RelatedDealerCars`
- `app/(site)/clasificados/autos/dashboard/**` — inventory dashboard section, value drawer
- `app/lib/clasificados/autos/**` — copy, policy, boost pipeline, audits Q1–Q3
- `app/api/clasificados/autos/**` — listings, public bundle
- `scripts/autos-*`, `package.json`

## 3. Servicios read-only references inspected

- `app/(site)/servicios/lib/serviciosBusinessHubContactTypes.ts`
- `app/(site)/servicios/lib/serviciosBusinessHubSocialBrand.tsx`
- `app/(site)/servicios/lib/mapServiciosProfileToBusinessHubContact.ts`
- `app/(site)/servicios/components/ServiciosBusinessHubContactCard.tsx`
- `app/(site)/servicios/components/ServiciosBusinessHubFauxMap.tsx`  
**Not edited.**

## 4. Business Hub fields result

**Complete.** Application step 4 (dealer/contact) includes identity, phones, SMS, email, website, booking, structured address, hours, socials (Instagram–WhatsApp profile), Google/Yelp reviews, up to 3 custom links, finance block + optional image URL. Persisted via `AutoDealerListing` / draft JSON.

## 5. Business Hub branded output result

**Complete.** `DealerBusinessStack` + `mapAutosDealerToBusinessHubContact`, branded socials (`autosNegociosBusinessHubSocialBrand.tsx`), review buttons, faux map, adaptive sections (no empty dividers). CTA order: WhatsApp → Call → SMS → Schedule → Website → Email.

## 6. Finance image/logo result

**Complete (URL-only).** Field `financeContactImageUrl` in `AutosDealerFinanceFields` with ES/EN labels. Preview via `resolveFinanceImageHref` in `DealerFinanceContact`. **QA-05 fix:** `DealerBusinessStack` uses `hasDealerFinanceContact` so image-only finance data still renders. Upload deferred.

## 7. Spacebar/input result

**Complete.** `autosPublishFormText.ts` — no trim on change. No `e.target.value.trim()` in `app/(site)/publicar/autos/**`. Engine (`AutosVehicleEngineField`), street (`AutosDealerStructuredAddressFields`), finance/custom links use `autosDraftTextValue` / `autosDraftUrlValue`.

## 8. Media drag reorder result

**Complete.** `AutosSortablePhotoGrid` — `@dnd-kit` PointerSensor + TouchSensor, card drag, mobile chevrons, cover selection. Used by `AutosNegociosMediaManager`.

## 9. Draft/no-data-loss result

**Complete.** `useAutosDraftPersistEffects` (debounce + pagehide/beforeunload) in `useAutoDealerDraft` / `useAutoPrivadoDraft`. Inventory Boost panel calls `flushDraft` + session return context (`autosInventoryBoostPipeline.ts`). Refresh does not reset except explicit new flow / delete. **Honest limit:** local file blobs may not survive hard refresh (browser); URL/metadata persist.

## 10. Inventory Boost shell result

**Complete.** `$399` / 10 included / `+$129` / `$528` in `autosDealerInventoryCopy.ts`. CTAs in value module + drawer + **QA-05:** dashboard at-limit uses `AutosNegociosInventoryBoostTrigger` (replaces mailto-only). No fake payment; checkout-soon message; no slot unlock.

## 11. Inventory relationship result

**Complete.** `getActiveLiveAutosBundle` groups by `dealer_inventory_group_id`; each row has own id/`leonix_ad_id`/detail URL. `RelatedDealerCars` shows up to 4 others excluding current. `/clasificados/autos/dealer/[dealerInventoryGroupId]` for full inventory.

## 12. Preview/publish CTA result

**Complete.** `AutosApplicationFinalActions` — preview (`flushDraft`), publish, inventory context. Public detail: no owner add/manage/boost CTAs.

## 13. Dashboard/admin/results result

- **Landing/results:** active listings via `listActiveAutosClassifiedsRows` / search — main + inventory vehicles as separate rows.
- **Dashboard:** `AutosDealerInventoryDashboardSection` — count, remaining slots, add vehicle drawer, manage inventory, boost trigger at limit.
- **Admin:** `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx` — listing workspace (status, IDs, actions). Dealer inventory count in admin UI not expanded in this gate; rows/API preserve dealer fields.

## 14. Privado cross-check result

**Privado checked — no change needed.** No `googleReviewsUrl`, `dealerCustomLinks`, `dealerSmsPhone`, inventory boost, or finance image in Privado form. Shared input/media/draft helpers benefit Privado without dealer-only fields.

## 15. Build/check result

Run validation scripts + `npm run build` (see gate run log).

## 16. Remaining risks

- Production must deploy commit containing QA-01–03 + QA-05 fixes; verify Vercel production SHA.
- Inventory Boost Stripe/entitlement deferred — shell only.
- Finance image URL-only (no blob upload).
- Admin dealer inventory aggregate UI may be lighter than dashboard; rows remain complete.

## Manual QA checklist for Chuy

1. `/publicar/autos/negocios` — type `3.5 V6` in motor, `1601 Coleman Ave` in calle (spaces work).
2. Business step — finance image URL field visible (ES/EN labels).
3. Review step — inventory copy $399 / 10 / $129 / $528; boost panel opens; no payment success.
4. Refresh mid-draft — fields remain.
5. Preview/back — draft remains; photo order matches.
6. Live/preview detail — Business Hub branded; related inventory section when siblings exist.
7. Dashboard `mis-anuncios` Autos — count + boost CTA at limit (panel, not mailto-only).
8. Privado — spaces + reorder still work; no dealer-only fields.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Correct repo confirmed | TRUE | `git rev-parse` → elaguila-website |
| Servicios Business Hub files inspected read-only | TRUE | Five Servicios paths read, not edited |
| Autos Negocios dealer contact fields exist | TRUE | `AutosNegociosApplication.tsx` step 4 |
| SMS/text support exists or safe source documented | TRUE | `dealerSmsPhone` + mapper SMS CTA |
| Expanded socials exist: Instagram/Facebook/TikTok/YouTube/LinkedIn/X/Snapchat/Pinterest/WhatsApp profile | TRUE | `autoDealerListing.ts`, application form |
| Google Reviews link is supported | TRUE | `googleReviewsUrl` |
| Yelp Reviews link is supported | TRUE | `yelpReviewsUrl` |
| Up to 3 custom links with titles are supported | TRUE | `autosDealerCustomLinks.ts`, max 3 |
| Custom links show under Encuentra más sobre nosotros / Find more about us | TRUE | `DealerBusinessStack`, `autosNegociosCopy.ts` |
| Finance/pre-approval fields exist | TRUE | `AutosDealerFinanceFields.tsx` |
| Optional finance image/logo field exists or blocker documented | TRUE | `financeContactImageUrl` URL field |
| Finance image/logo output hides when empty | TRUE | `resolveFinanceImageHref` + conditional render |
| Finance image/logo output shows when valid | TRUE | `DealerFinanceContact.tsx` |
| Branded social output exists | TRUE | `autosNegociosBusinessHubSocialBrand.tsx` |
| Branded review link output exists | TRUE | `AutosNegociosHubReviewLinkButton.tsx` |
| Branded map/location panel exists | TRUE | `AutosNegociosBusinessHubFauxMap.tsx` |
| Empty Business Hub fields hide cleanly | TRUE | Section gating in `DealerBusinessStack` |
| Contact card adapts without blank gaps | TRUE | `SectionBlock` + conditional grids |
| Free-text fields allow spaces | TRUE | `autosDraftTextValue`, no trim onChange |
| Engine accepts 3.5 V6 | TRUE | `AutosVehicleEngineField` |
| Calle/street accepts 1601 Coleman Ave | TRUE | `AutosDealerStructuredAddressFields` |
| Numeric-only fields remain intentionally restricted | TRUE | price/mileage/ZIP formatters unchanged |
| Photo cards support desktop drag reorder | TRUE | `AutosSortablePhotoGrid` dnd-kit |
| Mobile photo reorder fallback remains | TRUE | chevron move controls |
| Cover image selection still works | TRUE | `onSetPrimary` in grid |
| Reordered images persist to preview/detail | TRUE | `mediaImages` sortOrder in draft + API |
| Refresh preserves Autos Negocios draft | TRUE | `useAutosDraftPersistEffects` |
| Preview/back preserves Autos Negocios draft | TRUE | `flushDraft` on preview |
| Inventory module uses $399/month base | TRUE | `BASE_AUTOS_NEGOCIO_MONTHLY_USD = 399` |
| Inventory module says 10 active vehicles included | TRUE | `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT` |
| Inventory Boost says +10 for $129/month | TRUE | `INVENTORY_BOOST_MONTHLY_USD = 129` |
| Inventory Boost total shows $528/month where useful | TRUE | `AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD = 528` |
| $129.99/$528.99 copy removed or documented | TRUE | Not in inventory copy source files |
| Included add-inventory CTA exists | TRUE | `autosDealerInventoryAddVehicleCta` |
| Inventory Boost CTA/pipeline shell exists | TRUE | `AutosNegociosInventoryBoostPanel` |
| Inventory Boost does not fake payment success | TRUE | checkout-soon message only |
| Inventory Boost does not unlock slots without payment | TRUE | no entitlement change |
| Inventory Boost does not touch global Stripe/payment | TRUE | Autos session helper only |
| Draft is saved before upgrade path interaction | TRUE | `flushDraft` in boost panel |
| Future Stripe return context is prepared or blocker documented | TRUE | `lx-autos-inventory-boost-return` session |
| Main listings appear in landing/results | TRUE | active listing queries |
| Additional inventory vehicles appear in landing/results | TRUE | separate rows per vehicle |
| Each vehicle remains its own listing with its own Leonix Ad ID | TRUE | row-level `leonix_ad_id` |
| Detail pages show other dealer vehicles excluding current vehicle | TRUE | `RelatedDealerCars` |
| Public buyer does not see owner inventory management CTAs | TRUE | no owner CTAs on public detail |
| Dashboard inventory summary exists or blocker documented | TRUE | `AutosDealerInventoryDashboardSection` |
| Admin inventory visibility exists or blocker documented | TRUE | admin autos workspace; full count UI not expanded |
| Privado was inspected for shared impact | TRUE | read-only cross-check |
| No dealer-only fields were added to Privado | TRUE | grep clean on privado form |
| No unrelated categories were touched | TRUE | Autos-only edits in QA-05 |
| No fake ratings/reviews/socials were added | TRUE | links only when provided |
| No global Stripe/payment logic was added | TRUE | no payment file edits |
| npm run build passed | TRUE | gate validation run |
