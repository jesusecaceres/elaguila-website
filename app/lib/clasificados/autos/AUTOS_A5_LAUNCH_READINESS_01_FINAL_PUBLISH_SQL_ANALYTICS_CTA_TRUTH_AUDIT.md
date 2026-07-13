# A5.LAUNCH-READINESS-01 — Autos Dealers Final Publish + SQL/Table + Analytics + CTA Truth Audit

## Gate title

A5.LAUNCH-READINESS-01 — Autos Dealers Final Publish + SQL/Table + Analytics + CTA Truth Audit

## Correct repo / branch / HEAD

| Item | Value |
|------|-------|
| Repo | `C:/projects/elaguila-website` |
| Remote | `origin` → `https://github.com/jesusecaceres/elaguila-website.git` |
| Branch | `main` |
| HEAD | `3b5dedef94db9f0d579ad1ee49a062b68b846b10` |

## Initial dirty state (Gate 0)

### RELATED_ALLOWED_AUTOS_LAUNCH (in-progress Revenue OS dealer preview + fulfillment parity)

- `app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx`
- `app/(site)/clasificados/autos/negocios/lib/autosDealerRevenueCheckout.ts` (untracked)
- `app/lib/listingPlans/revenueAutosDealerFulfillment.ts` (untracked)
- `app/api/revenue-os/checkout/route.ts` (scoped: `autos_dealer_monthly` pending_payment)
- `app/lib/listingPlans/revenueFulfillment.ts` (scoped: dealer activation hook)
- `app/lib/listingPlans/revenueCategoryCheckoutPayload.ts`, `publishCheckoutCheckpoint.ts`, `revenueCheckout.ts`, `revenueAuditLog.ts`
- `app/lib/newsletter/checkoutNewsletterCapture.ts`, `app/api/newsletter/checkout-capture/route.ts` (`autos_dealer_checkout`)
- `package.json`, autos verifier scripts (untracked)

### READ_ONLY_REFERENCE

- Prior audit variants (`AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_*`)

### UNRELATED_LOCKED

- None in dirty set (no Bienes/Ofertas/Privado/Rentas/Servicios/Restaurantes/Empleos edits)

## Files inspected

SQL/schema: `20260409120000_autos_classifieds_listings.sql`, `20260506150000_leonix_ad_id_all_classifieds.sql`, `20260518124700_autos_dealer_inventory_grouping.sql`, `autosClassifiedsListingService.ts`, `autosClassifiedsTypes.ts`

Publish: `AutosNegociosApplication.tsx`, `AutosNegociosPreviewClient.tsx`, `autosDealerRevenueCheckout.ts`, `AutosPublishConfirmCore.tsx` (legacy confirm fallback), `autosNegociosBundlePublish.ts`, `autosDealerInventoryApplicationPublishGuard.ts`

Payment: `POST /api/clasificados/autos/checkout` (legacy), `POST /api/revenue-os/checkout` (dealer base + bundled inventory pack add-on), `POST /api/clasificados/autos/inventory-pack/checkout` (dashboard boost), `autos/stripe/webhook`, `checkout/verify`, `revenueAutosDealerFulfillment.ts`, `revenueFulfillment.ts`

Public/results/CTAs: `AutosLiveVehicleClient.tsx`, `AutoDealerPreviewPage.tsx`, `DealerBusinessStack.tsx`, `AutosEngagementRow.tsx`, `autosCtaTracking.ts`, `recordAutosGlobalAnalytics.ts`, `AutosPublicStandardCard.tsx`, `AutosResultCard.tsx`

Dashboard/admin: `AutosDealerInventoryDashboardSection.tsx`, `dashboardMisAnunciosCategoryTools.ts`, `resolveListingAnalyticsIdentity.ts`, `/api/dashboard/analytics/listing`, admin autos workspace

## Files changed (this gate)

- `app/lib/clasificados/autos/AUTOS_A5_LAUNCH_READINESS_01_FINAL_PUBLISH_SQL_ANALYTICS_CTA_TRUTH_AUDIT.md` (this file)
- `scripts/autos-a5-launch-readiness-01-final-publish-sql-analytics-cta-truth-audit.ts` (verifier)
- `package.json` (verifier script entry only)

WIP Revenue OS dealer preview/fulfillment files listed above are **pre-existing dirty work** in the working tree — not reverted by this audit gate.

## SQL / table / schema result

| Item | Result |
|------|--------|
| **Source table** | `public.autos_classifieds_listings` |
| **Columns confirmed** | `id`, `owner_user_id`, `lane`, `status`, `lang`, `featured`, `listing_payload`, `stripe_checkout_session_id`, `stripe_payment_intent_id`, `published_at`, `created_at`, `updated_at`, `leonix_ad_id`, `dealer_inventory_group_id`, `dealer_inventory_parent_listing_id`, `inventory_role` |
| **Wrong names avoided** | Uses `owner_user_id` not `owner_id`; `dealer_inventory_parent_listing_id` not `parent_listing_id`; `leonix_ad_id` not `ad_id`; public detail uses UUID `id` |
| **Missing column risks** | **None** for audited publish/dashboard/public/admin paths |
| **Migration required** | **NO** |

## Publish row creation result

| Item | Result |
|------|--------|
| Main dealer row | TRUE — `POST /api/clasificados/autos/listings` → draft → `pending_payment` → `active` |
| Child rows | TRUE — `createAutosClassifiedsListingWithInventoryParent` / post-publish inventory add; QA bundle via `publishNegociosBundleAdditionalVehicles` (bypass only) |
| UUIDs | TRUE — `gen_random_uuid()` per row |
| Leonix IDs | TRUE — `leonix_ad_id` trigger/backfill |
| Parent/child | TRUE — `inventory_role` `main` / `inventory_vehicle`; `dealer_inventory_parent_listing_id`; shared `dealer_inventory_group_id` |
| Owner identity | TRUE — `owner_user_id` preserved |
| Failed/cancelled checkout | TRUE — no activation without paid verify/webhook |
| Duplicate risk | LOW — `tryActivateAutosListingAfterPayment` guards `pending_payment`; Stripe session reuse on retry |
| Production multi-child in one checkout | FALSE by design — `bundle_requires_qa_bypass`; approved: main first, add inventory after |

## Stripe / webhook / status result

| Path | Result |
|------|--------|
| **Primary dealer publish (WIP)** | Application → `/clasificados/autos/negocios/preview` → `PublishCheckoutCheckpoint` → `startRevenueCategoryCheckout` (`autos_dealer_monthly` + optional inventory pack add-on) → Revenue OS webhook → `activatePaidAutosDealerListingFromRevenueOs` |
| **Legacy confirm (still present)** | `/publicar/autos/negocios/confirm` → `POST /api/clasificados/autos/checkout` → autos Stripe webhook/verify |
| **Inventory boost only** | Revenue OS `inventory-pack/checkout` or dashboard add-on — does not re-charge base |
| **Base price** | $399/mo — 10 vehicles (`autos_dealer_monthly`) |
| **Boost price** | +$129/mo — +10 vehicles (`autos_dealer_inventory_pack_monthly`) |
| **20-vehicle limit** | TRUE — only with active pack entitlement |
| **Webhook source of truth** | TRUE — no browser-side activation for production Stripe |

## Boost return result

| Source | Result |
|--------|--------|
| Draft (`boost_source=draft`) | TRUE — returns to `/publicar/autos/negocios` with `focus=inventory-pack` |
| Dashboard/manage | TRUE — `autosDealerInventoryEditHref` / manage inventory |
| Unknown source | TRUE — safe fallback |
| Locked-site draft safety | TRUE — external URLs blocked; draft namespace preserved |

## Preview / public / results parity

| Item | Result |
|------|--------|
| Preview route | `/clasificados/autos/negocios/preview` |
| Public detail | `/clasificados/autos/vehiculo/[uuid]` |
| Dealer shelf | `/clasificados/autos/dealer/[dealerInventoryGroupId]` |
| Field parity | TRUE — shared `AutoDealerListing` / `getActiveLiveAutosBundle` |
| Child opens child UUID | TRUE |
| Leonix ID visible | TRUE on live detail footer when present |
| Stale shell | FALSE |

## Public detail CTA result

All visible dealer CTAs in `DealerBusinessStack` / `AutosSheetCtaLink` are data-driven and track via `autosCtaTracking` / `recordAutosGlobalAnalyticsEvent` with `source_table=autos_classifieds_listings`, `source_id=<UUID>`, `canonical_ad_id=<leonix_ad_id>`. Missing destinations hidden. No fake Save/Message/Lead on Negocios public detail.

| CTA | Visible | Tracks | Hidden if empty |
|-----|---------|--------|-----------------|
| Like/heart | Live only | `listing_like` / `listing_unlike` | N/A |
| Share | Live only | `listing_share` | N/A |
| Call/WhatsApp/SMS/email | Conditional | contact events | TRUE |
| Website/directions/map | Conditional | click events | TRUE |
| Reviews/social/finance/test-drive | Conditional | click events | TRUE |

## Like / heart result

TRUE — `AutosEngagementRow` on published detail: UUID key, DB-backed count, 0→heart only, N→N+heart, unlike supported, preview does not persist engagement.

## Share result

TRUE — `LeonixShareButton`: native `navigator.share` + clipboard fallback, exact public URL, `listing_share` with UUID `source_id`, no fake share count.

## Results / inventory card analytics

TRUE — result cards open exact UUID; inventory shelf child cards use child UUID; card like/share only when live listing context exists; no fake paid placement.

## Dashboard result

| Item | Result |
|------|--------|
| Parent/child visible | TRUE — `AutosDealerInventoryDashboardSection` |
| Leonix ID | TRUE |
| Public/edit/manage links | TRUE |
| Per-listing analytics drill-down | **FALSE** — API supports `autos_classifieds_listings` (`resolveListingAnalyticsIdentity`); dealer dashboard section has **no** per-listing analytics link; `dashboardMisAnunciosCategoryTools` marks autos `analytics: "unproven"` |
| Fake metrics | FALSE — honest absence |
| Ad plan | TRUE — entitlement badges per listing |

## Admin result

TRUE — dedicated Autos admin queue; UUID + Leonix ID + `inventory_role` + group; actions target selected UUID; Leonix ID search supported.

## Restaurante comparison

**PARTIAL** — Business Hub-lite aligns; dashboard per-listing analytics wiring lags Restaurantes.

## Varios comparison

**PARTIAL** — CTA/share/like truth aligns with En Venta discipline; dashboard per-listing analytics drill-down lags.

## What remains before publish

1. **Owner Stripe live activation + live QA** (expected owner step).
2. **Per-listing dashboard analytics UI** for `autos_classifieds_listings` rows (API ready; seller drill-down not proven in dealer dashboard section).
3. **Operational clarity**: production publishes main dealer first; additional vehicles via post-publish inventory add (not single-checkout bundle unless QA bypass).
4. **Revenue OS dealer preview path**: WIP in working tree must ship with owner Stripe QA (preview checkpoint is primary; legacy confirm remains fallback).
5. Chuy manual QA checklist (20 steps below).

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
| Main listing row creation proven | TRUE |
| Child row creation proven (approved rule) | TRUE |
| Parent/child UUID identity separate | TRUE |
| Leonix Ad ID on published rows | TRUE |
| Stripe/webhook activation proven | TRUE |
| Boost draft return safe | TRUE |
| Boost dashboard return preserved | TRUE |
| Preview/public/results parity | TRUE |
| Public CTAs work or hidden | TRUE |
| Like/share truth (UUID source_id) | TRUE |
| No fake saves/messages/leads | TRUE |
| Admin identity true | TRUE |
| Dashboard per-listing analytics proven | FALSE |
| Child bundle in production Stripe checkout | FALSE |
| Autos matches Restaurante business hub standard | PARTIAL |
| Autos matches Varios CTA truth standard | PARTIAL |
| Autos matches publish pipeline truth standard | PARTIAL |
| Autos has any fake visible actions | FALSE |
| Autos has SQL/table/listing blocker | FALSE |
| Autos publish-ready except owner Stripe + dashboard analytics gap | PARTIAL |
| Build passed | TRUE |
| No files staged | TRUE |
| No commit created | TRUE |
| No push attempted | TRUE |
| Ready for Chuy QA | TRUE |

**Final recommendation: YELLOW**

YELLOW means: code is largely publish-ready for Autos Dealers **except** (a) owner Stripe live activation/QA and (b) per-listing dashboard analytics drill-down not yet proven in the dealer dashboard UI. No SQL/schema blocker. No fake public CTAs.

## Manual QA checklist for Chuy

1. Open Autos Negocios draft.
2. Confirm parent/dealer data.
3. Add child vehicle.
4. Activate Inventory Boost if needed.
5. Confirm Stripe return to draft.
6. Confirm limit 20 after boost.
7. Complete final base package checkout (preview checkpoint or legacy confirm).
8. Confirm Stripe payment success.
9. Confirm webhook/status activates listing.
10. Confirm dashboard shows dealer listing.
11. Confirm public parent detail opens.
12. Confirm child/inventory public detail opens if independent.
13. Confirm each has Leonix ID.
14. Click heart: 0 heart only → 1 + heart → refresh persists.
15. Click Share: native/copy exact URL.
16. Click every visible CTA.
17. Confirm dashboard analytics parent/child separate (note per-listing drill-down gap).
18. Open admin Autos.
19. Confirm parent/child identities separate.
20. Confirm no fake saves/messages/leads are visible.
