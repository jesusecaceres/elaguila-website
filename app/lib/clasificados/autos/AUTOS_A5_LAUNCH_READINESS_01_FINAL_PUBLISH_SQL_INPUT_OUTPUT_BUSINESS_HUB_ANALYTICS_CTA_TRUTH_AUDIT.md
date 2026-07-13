# A5.LAUNCH-READINESS-01 — Autos Dealers Final Publish + SQL/Table + Input/Output + Business Hub + Analytics + CTA Truth Audit

## Gate title

A5.LAUNCH-READINESS-01 — Autos Dealers Final Publish + SQL/Table + Input/Output + Business Hub + Analytics + CTA Truth Audit

## Correct repo confirmation

`C:/projects/elaguila-website` (Leonix / El Águila)

## Files inspected

### SQL / schema / publish
- `supabase/migrations/20260409120000_autos_classifieds_listings.sql`
- `supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql`
- `supabase/migrations/20260518124700_autos_dealer_inventory_grouping.sql`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/lib/clasificados/autos/autosClassifiedsTypes.ts`
- `app/api/clasificados/autos/checkout/route.ts`
- `app/api/clasificados/autos/checkout/verify/route.ts`
- `app/api/clasificados/autos/stripe/webhook/route.ts`
- `app/api/clasificados/autos/listings/route.ts`
- `app/lib/clasificados/autos/autosNegociosBundlePublish.ts`
- `app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts`
- `app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts`

### Application / input-output / preview
- `app/(site)/publicar/autos/negocios/**`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/(site)/publicar/autos/shared/components/AutosApplicationFinalActions.tsx`
- `app/(site)/clasificados/autos/negocios/preview/**`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosBusinessHubMapPreview.tsx`

### Public / results / analytics / CTAs
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/lib/autosCtaTracking.ts`
- `app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics.ts`
- `app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx`
- `app/(site)/clasificados/autos/shell/AutosResultCard.tsx`
- `app/components/clasificados/analytics/LeonixShareButton.tsx`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx`

### Dashboard / admin
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/dashboard/lib/dashboardInventory.ts`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/(site)/dashboard/lib/fetchDashboardAnalyticsApi.ts`
- `app/api/dashboard/analytics/listing/route.ts`
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`

## Files changed (this gate)

- `app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_INPUT_OUTPUT_BUSINESS_HUB_ANALYTICS_CTA_TRUTH_AUDIT.md` (new)
- `scripts/autos-a5-launch-readiness-01-final-publish-sql-input-output-business-hub-analytics-cta-truth-audit.ts` (new)
- `package.json` (verifier script only)

## SQL / table / schema result

| Item | Result |
|------|--------|
| **Source table** | `public.autos_classifieds_listings` |
| **Columns confirmed in migrations** | `id`, `owner_user_id`, `lane`, `status`, `lang`, `featured`, `listing_payload`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `published_at`, `created_at`, `updated_at`, `leonix_ad_id`, `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role` |
| **Code uses correct names** | `owner_user_id` (not `owner_id`); `dealer_inventory_parent_listing_id` (not `parent_listing_id`); `leonix_ad_id` (not `ad_id`); `inventory_role` values `main` \| `inventory_vehicle` |
| **Wrong-table paths** | Legacy `listings.category=autos` exists for old rows only; paid Negocios flow uses `autos_classifieds_listings` exclusively |
| **Missing column risks** | None found for publish/dashboard/public/admin paths audited |
| **Migration required** | **NO** |

## Input / output polish result

| Area | Result |
|------|--------|
| Price/currency | TRUE — `formatUsdIntegerInputDisplay` in application; public `formatAutosUsd` |
| Address/location | TRUE — city/state/ZIP fields; open geography; NorCal suggestions without hard lock |
| Vehicle details | TRUE — year/make/model/trim/price/mileage/VIN survive draft → preview → publish → public |
| Media | TRUE — images in `listing_payload`; hero/gallery derived; draft IDB refs for blobs |
| Videos | TRUE — URL-only policy; Mux fields stripped on draft load; no exposed Mux upload in Negocios publish path |
| Required checkboxes | TRUE — `AutosApplicationFinalActions` (3) + `AutosPublishConfirmCore` (3) before checkout |
| Preview quality | TRUE/PARTIAL — premium Leonix tokens on Business Hub; draft child cards may show pre-publish placeholders |

## Publish row creation result

| Item | Result |
|------|--------|
| Main row | TRUE — `createAutosClassifiedsListing` → `autos_classifieds_listings` draft → `pending_payment` → `active` |
| Child rows | TRUE — post-main via `createAutosClassifiedsListingWithInventoryParent` or QA bundle `publishNegociosBundleAdditionalVehicles` |
| UUIDs | TRUE — `gen_random_uuid()` per row |
| Leonix IDs | TRUE — DB trigger/backfill via `leonix_ad_id` migration |
| Parent/child | TRUE — `inventory_role=main` / `inventory_vehicle`; `dealer_inventory_parent_listing_id`; shared `dealer_inventory_group_id` |
| Idempotency | TRUE — `tryActivateAutosListingAfterPayment` uses `status=pending_payment` WHERE guard |
| Production bundle in one Stripe checkout | FALSE by design — `bundle_requires_qa_bypass`; approved rule is main first, add inventory after |

## Stripe / webhook / status result

| Item | Result |
|------|--------|
| Base checkout | Legacy `POST /api/clasificados/autos/checkout` — `$399/mo` via `STRIPE_PRICE_AUTOS_NEGOCIOS` |
| Boost checkout | Revenue OS `POST /api/clasificados/autos/inventory-pack/checkout` — `$129/mo` add-on |
| Webhook | `app/api/clasificados/autos/stripe/webhook/route.ts` → `tryActivateAutosListingAfterPayment` |
| Verify path | `app/api/clasificados/autos/checkout/verify/route.ts` (same activation) |
| Failed/cancelled | TRUE — stays draft/pending; no fake activation |
| Webhook source of truth | TRUE — entitlement/pack via `listing_package_entitlements`; no local bypass |

## Boost return result

| Source | Result |
|--------|--------|
| Draft | TRUE — `boost_source=draft` + Return to application CTA (`autosDealerInventoryBoostReturnContract`) |
| Dashboard/manage | TRUE — Manage inventory via `autosDealerInventoryEditHref` |
| Locked-site safety | TRUE — safe `return_to`; external URLs blocked |

## Preview / public / results parity

| Item | Result |
|------|--------|
| Field parity | TRUE — same `AutoDealerListing` payload via `getActiveLiveAutosBundle` / preview canonical draft |
| Public route | `/clasificados/autos/vehiculo/[uuid]` |
| Results cards | Open exact UUID; child shelf uses child UUID |
| Leonix ID | Visible on live detail footer when present |
| Stale shell | FALSE — uses `AutoDealerPreviewPage` + `DealerBusinessStack` for live |

## Business Hub / contact card result

| Item | Result |
|------|--------|
| Data-driven hub | TRUE — `mapAutosDealerToBusinessHubContact` + `DealerBusinessStack` |
| Contact CTAs | Conditional on phone/WhatsApp/SMS/email/website |
| Social/reviews | Conditional; brand icons; no fake ratings |
| Finance/schedule/custom | Conditional via `DealerFinanceContact` + hub links |
| Map/directions | `AutosNegociosBusinessHubMapPreview` — address-driven embed + directions href; hidden when empty |
| Empty fields hidden | TRUE — `nonEmpty()` guards throughout |
| Privado isolation | TRUE — dealer hub only on Negocios lane |

## Native share / map result

| Item | Result |
|------|--------|
| Share hub | TRUE — `LeonixShareButton` → `CtaActionSheet` share_ad |
| Native share | TRUE — `navigator.share` in hub + optional `directNativeShare` |
| Clipboard fallback | TRUE — copy exact URL |
| `listing_share` event | TRUE — UUID `source_id` |
| Map | TRUE — real address only; no fake coordinates |
| Directions | TRUE — Google Maps search/route href |

## Public detail CTA result

All visible dealer CTAs track via `autosCtaTracking` / `recordAutosGlobalAnalyticsEvent` with `source_table=autos_classifieds_listings`, `source_id=<UUID>`, `canonical_ad_id=<leonix_ad_id>`. Missing destinations hidden. No fake Save/Message/Lead on Negocios public detail.

## Like / heart result

TRUE — `AutosEngagementRow` on live detail: UUID key, numeric count from `user_liked_listings`, 0→heart only, N→N+heart, unlike supported, preview does not persist engagement. Cards use UUID (`AutosPublicStandardCard`, `AutosResultCard`).

## Share result

TRUE — see Native share section; parent/child independent UUIDs; no fake share count.

## Results / inventory card analytics

TRUE — `result_card_click` / listing open via browse routes; inventory shelf cards hide like/share; no fake paid placement.

## Dashboard result

| Item | Result |
|------|--------|
| Parent/child rows visible | TRUE — `AutosDealerInventoryDashboardSection` |
| Leonix ID shown | TRUE |
| Public/edit links | TRUE |
| Per-listing analytics UI | **FALSE** — `analytics: unproven` in category tools; API exists (`/api/dashboard/analytics/listing` + `resolveListingAnalyticsIdentity` for `autos_classifieds_listings`) but no proven per-listing drill-down link in dealer dashboard section |
| Fake metrics | FALSE — none shown; honest absence |
| Ad plan | TRUE — entitlement badges per listing |

## Admin result

TRUE — dedicated Autos admin queue; UUID + Leonix ID + inventory_role + group; actions target selected UUID; Leonix ID search supported.

## Mobile / Leonix visual QA

PARTIAL/TRUE — premium preview tokens, 44px+ CTAs on hub buttons, responsive Business Hub stacking, map compact; full 390px device QA deferred to Chuy manual checklist.

## Restaurante comparison

**PARTIAL** — Business Hub-lite aligns; dashboard per-listing analytics wiring lags Restaurantes.

## Bienes comparison

**PARTIAL** — Application stepped shell and preview polish are strong; Bienes Revenue OS publish path differs (Autos uses legacy dealer checkout by approved design).

## Varios comparison

**PARTIAL** — CTA/share/like truth aligns with En Venta discipline; dashboard per-listing analytics drill-down lags.

## What remains before publish

1. **Owner Stripe live activation + live QA** (expected owner step).
2. **Per-listing dashboard analytics UI** for paid `autos_classifieds_listings` rows (API ready; seller drill-down link/page not proven in Mis anuncios dealer section).
3. **Operational clarity**: production Stripe publishes main dealer only; additional vehicles via post-publish inventory add (not single-checkout bundle).
4. Chuy manual QA checklist (30 steps below).

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos Negocios scope only | TRUE |
| Autos Privado untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Autos SQL/table contract proven | TRUE |
| No missing-column publish blocker | TRUE |
| No migration required | TRUE |
| Input/output polish safe | TRUE |
| Media persists through pipeline | TRUE |
| Video policy safe | TRUE |
| Required checkboxes enforced | TRUE |
| Main listing row creation proven | TRUE |
| Child row creation proven (approved rule) | TRUE |
| Parent/child UUID identity separate | TRUE |
| Leonix Ad ID on published rows | TRUE |
| Stripe/webhook activation proven | TRUE |
| Boost draft return safe | TRUE |
| Boost dashboard return preserved | TRUE |
| Preview/public/results parity | TRUE |
| Business Hub data-driven | TRUE |
| Native share/copy fallback | TRUE |
| Real map/directions only | TRUE |
| Public CTAs work or hidden | TRUE |
| Like/share truth (UUID source_id) | TRUE |
| No fake saves/messages/leads | TRUE |
| Admin identity true | TRUE |
| Dashboard per-listing analytics proven | FALSE |
| Child bundle in production Stripe checkout | FALSE |
| Autos matches Restaurante business hub standard | PARTIAL |
| Autos matches Bienes input/output polish | PARTIAL |
| Autos matches Varios CTA truth standard | PARTIAL |
| Autos matches Varios publish pipeline truth | PARTIAL |
| Autos has any fake visible actions | FALSE |
| Autos has SQL/table/listing blocker | FALSE |
| Autos publish-ready except owner Stripe + dashboard analytics gap | PARTIAL |
| Build passed | TRUE |
| No files staged | TRUE |
| No commit created | TRUE |
| No push attempted | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: YELLOW

## Manual QA checklist for Chuy

1. Open Autos Negocios draft.
2. Confirm parent/dealer data.
3. Check price/currency formatting.
4. Check address split and open city/state/ZIP behavior.
5. Upload images.
6. Confirm images persist through preview and return.
7. Add video URLs if supported.
8. Confirm video URLs persist and no Mux upload appears if disabled.
9. Add child vehicle.
10. Activate Inventory Boost if needed.
11. Confirm Stripe return to draft.
12. Confirm limit 20 after boost.
13. Complete final base package checkout.
14. Confirm Stripe payment success.
15. Confirm webhook/status activates listing.
16. Confirm dashboard shows dealer listing.
17. Confirm public parent detail opens.
18. Confirm child/inventory public detail opens if independent.
19. Confirm each has Leonix ID.
20. Confirm Business Hub/contact card shows only filled fields.
21. Confirm no fake social/review/map/custom links.
22. Click heart: 0 heart only → 1 + heart → refresh persists.
23. Click Share: native/copy exact URL.
24. Click call/WhatsApp/SMS/email/website/directions/reviews/finance/test-drive if visible.
25. Confirm every visible CTA works.
26. Confirm dashboard analytics parent/child separate (note per-listing drill-down gap).
27. Open admin Autos.
28. Confirm parent/child identities separate.
29. Confirm mobile 390px layout works.
30. Confirm no fake saves/messages/leads are visible.
