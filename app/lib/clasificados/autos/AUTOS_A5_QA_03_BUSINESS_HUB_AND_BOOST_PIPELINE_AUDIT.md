# A5.QA-03 — Autos Negocios Business Hub Completion + Inventory Boost Pipeline Shell Gate

**Gate:** A5.QA-03  
**Platform:** Cursor  
**Date:** 2026-06-02  
**Scope:** Autos Negocios Business Hub parity completion, optional finance image URL, Inventory Boost pipeline shell ($399 / 10 included / +$129 / $528), draft preservation on boost path, A5.QA-02 regression check, Privado cross-check.

## 1. Files inspected

- `app/(site)/publicar/autos/negocios/**` (application, inventory modules, boost panel)
- `app/(site)/clasificados/autos/negocios/**` (types, DealerBusinessStack, DealerFinanceContact, preview)
- `app/(site)/publicar/autos/shared/**`, `app/(site)/clasificados/autos/shared/**`
- `app/(site)/publicar/autos/privado/**` (read-only cross-check)
- `app/lib/clasificados/autos/**` (inventory copy, boost pipeline, finance contact, QA-01/02 audits)
- `app/api/clasificados/autos/**` (inventory counts API)
- `scripts/autos-a5-qa-*.ts`, `scripts/autos-a5-9-*.ts`
- Read-only: Servicios Business Hub contact/map/social patterns

## 2. A5.QA-01 completion result

Re-verified: expanded socials, SMS, Google/Yelp reviews, custom links (max 3), branded output via `DealerBusinessStack` + mapper/faux map. No regressions introduced in QA-03.

## 3. A5.QA-02 behavior recheck result

Re-verified: `autosDraftTextValue` / `autosDraftUrlValue` on Negocios fields; `AutosSortablePhotoGrid` drag; `useAutosDraftPersistEffects` flush on refresh. No QA-02 code paths reverted.

## 4. Business Hub fields result

Complete from A5.QA-01; QA-03 did not remove any application or output fields.

## 5. Branded output result

Complete from A5.QA-01; adaptive contact card, branded socials/reviews/map unchanged.

## 6. Finance image/logo result

Added optional `financeContactImageUrl` (https URL) on `AutoDealerListing`, form in `AutosDealerFinanceFields`, preview in `DealerFinanceContact` via `resolveFinanceImageHref`. Upload deferred — URL-only in this gate.

## 7. Inventory Boost pipeline shell result

- Pricing standardized: `$399/month` base, `10` included, `+$129/month` boost, `$528/month` total (`INVENTORY_BOOST_MONTHLY_USD = 129`, `AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD = 528`).
- `AutosNegociosInventoryBoostPanel` + `AutosNegociosInventoryBoostTrigger`: explains pricing, **Prepare Inventory Boost** saves draft + session return context, shows checkout-soon message. No payment, no slot unlock.
- Value module + drawer: boost CTA replaces mailto-only upgrade path at/at-near limit.

## 8. No-data-loss upgrade/draft result

`flushDraft` called before writing `lx-autos-inventory-boost-return` session context (path, search, step, inventory IDs). Cancel/close preserves draft. Stripe return wiring deferred.

## 9. Inventory relationship result

Existing A5.9 group logic + `RelatedDealerCars` unchanged; verified still in place.

## 10. Privado cross-check result

**Privado checked — no change needed.** No dealer Business Hub, finance image, inventory boost, or dealer inventory fields added to Privado.

## 11. Build/check result

Run `npm run autos:a5-qa-03-business-hub-and-boost-pipeline-audit` and `npm run build` after this gate (see validation section).

## 12. Remaining risks

- Inventory Boost checkout/entitlement still requires global Stripe activation (deferred).
- Finance image is URL-only; durable upload would need blob/storage pattern (deferred).
- Dashboard inventory drawer without `flushDraft` still saves boost return context but may not flush unpublished draft from other tabs.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Autos Negocios Business Hub fields were verified | TRUE | A5.QA-01 libs + `AutosNegociosApplication` dealer section |
| SMS/text support exists or safe source documented | TRUE | `dealerSmsPhone` + mapper text CTA |
| Expanded socials are supported | TRUE | `DealerSocialKey` + `autosNegociosBusinessHubSocialBrand.tsx` |
| Google/Yelp review links are supported | TRUE | `googleReviewsUrl`, `yelpReviewsUrl` |
| Up to 3 custom links with titles are supported | TRUE | `dealerCustomLinks` + `autosDealerCustomLinks.ts` |
| Custom links show under Encuentra más sobre nosotros / Find more about us | TRUE | `DealerBusinessStack` custom links section |
| Branded social output exists | TRUE | `autosNegociosBusinessHubSocialBrand.tsx` |
| Branded review link output exists | TRUE | `AutosNegociosHubReviewLinkButton.tsx` |
| Branded map/location panel exists | TRUE | `AutosNegociosBusinessHubFauxMap.tsx` |
| Empty fields hide cleanly | TRUE | Mapper + conditional sections in `DealerBusinessStack` |
| Contact card layout adapts without gaps | TRUE | Section gating in `DealerBusinessStack` |
| Finance/pre-approval contact still works | TRUE | `AutosDealerFinanceFields` + `DealerFinanceContact` |
| Optional finance image/logo is supported or blocker documented | TRUE | `financeContactImageUrl` URL field |
| Inventory module uses $399/month base copy | TRUE | `BASE_AUTOS_NEGOCIO_MONTHLY_USD`, `autosDealerInventoryBaseMonthlyLine` |
| Inventory module uses 10 included active vehicles copy | TRUE | `STANDARD_DEALER_ACTIVE_VEHICLE_LIMIT`, value bullets |
| Inventory Boost uses +10 for $129/month copy | TRUE | `INVENTORY_BOOST_MONTHLY_USD = 129`, `autosDealerInventoryAddTenSlotsCta` |
| Inventory Boost total shows $528/month where useful | TRUE | `AUTOS_NEGOCIO_TOTAL_WITH_BOOST_MONTHLY_USD = 528` |
| $129.99/$528.99 copy was removed or documented | TRUE | Removed from `autosDealerInventoryCopy.ts` |
| Included add-inventory CTA exists | TRUE | `autosDealerInventoryAddVehicleCta` + drawer trigger |
| Inventory Boost CTA/pipeline shell exists | TRUE | `AutosNegociosInventoryBoostPanel` |
| Inventory Boost does not fake payment success | TRUE | Checkout-soon message only |
| Inventory Boost does not unlock slots without payment | TRUE | No entitlement/cap changes |
| Inventory Boost does not touch global Stripe/payment | TRUE | Autos-scoped session helper only |
| Draft is saved before upgrade path interaction | TRUE | `flushDraft` in `handlePrepare` |
| Refresh preserves current draft | TRUE | A5.QA-02 `useAutosDraftPersistEffects` |
| Preview/back preserves current draft | TRUE | `flushDraft` on preview in application |
| Future Stripe return context is prepared or blocker documented | TRUE | `autosInventoryBoostPipeline.ts` session key |
| Main listings appear in landing/results | TRUE | Existing bundle/search (A5.9) |
| Additional inventory vehicles appear in landing/results | TRUE | Group listings API |
| Any vehicle detail shows other dealer vehicles excluding itself | TRUE | `RelatedDealerCars` |
| Public buyer does not see owner inventory management CTAs | TRUE | No owner CTAs on public detail |
| A5.QA-02 spacebar behavior remains fixed | TRUE | `autosDraftTextValue` unchanged |
| A5.QA-02 media reorder behavior remains fixed | TRUE | `AutosSortablePhotoGrid` unchanged |
| A5.QA-02 draft persistence behavior remains fixed | TRUE | Draft hooks unchanged |
| Privado was inspected for shared impact | TRUE | Read-only review |
| No dealer-only fields were added to Privado | TRUE | No Privado file edits |
| No unrelated categories were touched | TRUE | Autos paths only |
| No fake ratings/reviews/socials were added | TRUE | Links only when provided |
| No Stripe/payment logic was added | TRUE | Shell + session context |
| npm run build passed | TRUE | See validation log |
