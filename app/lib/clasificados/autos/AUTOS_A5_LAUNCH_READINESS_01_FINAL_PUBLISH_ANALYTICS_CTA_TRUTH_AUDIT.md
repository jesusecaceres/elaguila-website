# A5.LAUNCH-READINESS-01 — Autos Dealers Final Publish + Analytics + CTA Truth Audit

## Gate title

A5.LAUNCH-READINESS-01 — Autos Dealers Final Publish + Analytics + CTA Truth Audit

## Correct repo confirmation

`C:/projects/elaguila-website` (Leonix / El Águila)

## Files inspected

### Publish / application
- `app/(site)/publicar/autos/negocios/**`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `app/api/clasificados/autos/checkout/route.ts`
- `app/api/clasificados/autos/inventory-pack/checkout/route.ts`
- `app/lib/clasificados/autos/autosNegociosBundlePublish.ts`
- `app/lib/clasificados/autos/autosDealerInventoryApplicationPublishGuard.ts`

### Public detail / CTAs / analytics
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/lib/autosCtaTracking.ts`
- `app/(site)/clasificados/autos/lib/recordAutosGlobalAnalytics.ts`
- `app/lib/clasificados/autos/analytics/autosGlobalAnalytics.ts`

### Results / cards
- `app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx`
- `app/(site)/clasificados/autos/shell/AutosResultCard.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx`

### Dashboard / admin
- `app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx`
- `app/(site)/dashboard/mis-anuncios/page.tsx`
- `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts`
- `app/admin/(dashboard)/workspace/clasificados/autos/page.tsx`

### Boost return (MONETIZATION-03)
- `app/lib/clasificados/autos/autosDealerInventoryBoostReturnContract.ts`

## Files changed

- `app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx` — card like/save/share now use listing UUID (matches detail `source_id` truth)
- `scripts/autos-a5-launch-readiness-01-final-publish-analytics-cta-truth-audit.ts` (new)
- `package.json` (verifier script only)

## Publish pipeline result

| Check | Result |
|-------|--------|
| Entry package → application → confirm → checkout | TRUE |
| Required checkboxes (application + confirm) | TRUE |
| Hidden pending save before checkout | TRUE |
| Main dealer listing publishes via Stripe legacy checkout | TRUE |
| Child vehicles in same Stripe checkout (production) | FALSE — `bundle_requires_qa_bypass`; QA/bypass only |
| Child vehicles post-publish via inventory add API | TRUE — `POST /api/clasificados/autos/listings` + `createAutosClassifiedsListingWithInventoryParent` |
| Parent/child separate UUIDs + Leonix Ad IDs | TRUE (DB-backed) |
| Preview vs public structural parity | PARTIAL — preview may show draft children not yet published rows |
| Back to edit / hard refresh draft preserved | TRUE |

**Approved rule:** Publish main dealer with Stripe ($399/mo); add inventory vehicles from dashboard/application inventory drawer after main is active. Multi-vehicle bundle in one Stripe session is QA-bypass only.

## Stripe / boost return result

| Check | Result |
|-------|--------|
| Base $399/mo / 10 vehicles | TRUE |
| Boost +$129/mo / +10 (20 total) | TRUE |
| Boost unlocks 20 only after webhook entitlement | TRUE |
| Draft boost return to application | TRUE (MONETIZATION-03) |
| Dashboard/manage boost return | TRUE |
| Locked-site draft safe | TRUE |
| Failed/cancelled boost does not unlock 20 | TRUE |
| Publish blocks 11–20 without boost | TRUE |
| Publish allows 11–20 with active boost (application guard) | TRUE |
| >20 blocked | TRUE |

## Public detail CTA result

All dealer CTAs in `DealerBusinessStack` + CTA sheet are **conditional** (hidden when destination missing). Analytics via `autosCtaTracking` → `recordAutosGlobalAnalyticsEvent` with `source_id` = listing UUID.

| CTA | Visible | Works | Analytics | source_id |
|-----|---------|-------|-----------|-----------|
| Like | When live | TRUE | `listing_like` / `listing_unlike` | UUID |
| Share | When live | TRUE | `listing_share` | UUID |
| Call | If phone | TRUE | `phone_click` | UUID |
| WhatsApp | If number | TRUE | `whatsapp_click` | UUID |
| SMS | If mobile | TRUE | `message_click` | UUID |
| Email | If email | TRUE | `email_click` | UUID |
| Website | If URL | TRUE | `website_click` | UUID |
| Directions | If address | TRUE | `directions_click` | UUID |
| Google Business | If URL | TRUE | `cta_click` | UUID |
| Google Reviews | If URL | TRUE | `cta_click` | UUID |
| Yelp | If URL | TRUE | `cta_click` | UUID |
| Schedule test drive | If URL | TRUE | `cta_click` | UUID |
| Finance CTAs | If configured | TRUE | typed events | UUID |
| Custom links | If URL | TRUE | `cta_click` | UUID |
| Report | Live detail | TRUE | no listing_analytics event | UUID to report action |
| Fake Save/Message/Lead UI | — | N/A | Hidden / not shown on Negocios public detail | — |

## Like / heart result

- Detail `AutosEngagementRow`: UUID `listingSourceId`, numeric count from `user_liked_listings` + `listing_analytics`
- 0 likes → heart only; N≥1 → N + heart
- Unlike supported (signed-in)
- Preview/draft: engagement row only on `publicPlaybackOnly` (not draft preview)
- Card fix: `AutosPublicStandardCard` now uses UUID like `AutosResultCard` and detail

## Share result

- `LeonixShareButton` → share hub → `listing_share` event
- Clipboard + native share from hub
- Exact public URL shared
- No fake share count displayed
- Parent/child use own UUID on respective detail pages

## Results / inventory card result

- View details opens `/clasificados/autos/vehiculo/[uuid]`
- Parent/child cards use respective listing UUID
- `AutosDealerInventoryVehicleCard`: no like/share (hidden)
- `AutosResultCard`: dealer engagement with UUID truth
- No fake paid placement in results ranking (this gate)

## Dashboard result

| Check | Result |
|-------|--------|
| Paid Autos section in mis-anuncios | TRUE |
| Parent + child rows visible independently | TRUE |
| Each shows Leonix Ad ID | TRUE |
| Per-listing analytics drill-down for `autos_classifieds_listings` | **FALSE** — category tool `analytics: unproven`; no proven `analyticsHref` |
| Legacy `listings.category=autos` analytics via mis-anuncios/[id] | PARTIAL — separate legacy path only |
| Fake saves/messages/leads shown | FALSE — not surfaced on paid dealer section |
| Ad plan shows listing plan not account plan | TRUE (entitlement badges) |

Public/global analytics events are real (`listing_analytics` + `source_table=autos_classifieds_listings`). Seller dashboard lacks per-listing Autos dealer analytics page equivalent to En Venta/Restaurantes.

## Admin result

| Check | Result |
|-------|--------|
| Dedicated Autos admin queue | TRUE |
| Parent + child rows with UUID + Leonix Ad ID | TRUE |
| inventory_role + group + parent hint | TRUE |
| Staff actions target selected UUID | TRUE |
| No fake global admin metrics | TRUE |

## Restaurantes comparison

**PARTIAL** — Autos Negocios has business hub stack (DealerBusinessStack, finance, custom links, inventory shelf) aligned with Restaurantes business-category patterns, but lacks Restaurantes-level proven per-listing dashboard analytics wiring.

## Varios / En Venta comparison

**PARTIAL** — CTA truth discipline largely matches (work or hidden; real analytics events). Card like identity fixed to UUID. Dashboard per-listing analytics truth lags En Venta standard.

## What remains before publish

1. **Owner Stripe live activation** — production `STRIPE_PRICE_AUTOS_NEGOCIOS` + webhook verify path (expected owner step).
2. **Per-listing dashboard analytics for paid `autos_classifieds_listings`** — wire proven analytics href or dedicated Autos listing analytics view (YELLOW blocker).
3. **Operational clarity** — dealers publishing multiple vehicles must add inventory post-main-publish (not single-checkout bundle in production).
4. **Live QA** — Chuy manual checklist (heart persist, share URL, parent/child metric separation).

## TRUE/FALSE audit table

| Check | Result |
|-------|--------|
| Correct repo confirmed | TRUE |
| Autos Negocios scope only | TRUE |
| Autos Privado untouched | TRUE |
| Unrelated categories untouched | TRUE |
| Main dealer publish pipeline works | TRUE |
| Child publish follows approved post-main rule | TRUE |
| Child bundle in production Stripe checkout | FALSE |
| Parent/child UUID identity separate | TRUE |
| Leonix Ad ID on each published row | TRUE |
| Preview draft preservation | TRUE |
| Boost draft return safe | TRUE |
| Boost dashboard return preserved | TRUE |
| Public detail CTAs work or hidden | TRUE |
| No fake saves/messages/leads on public detail | TRUE |
| Like uses real data (UUID source_id) | TRUE |
| Share uses real listing_share event | TRUE |
| Result cards open correct UUID | TRUE |
| Inventory shelf cards no fake engagement | TRUE |
| Admin parent/child identity true | TRUE |
| Dashboard per-listing analytics proven | FALSE |
| Analytics source_id is UUID not Leonix Ad ID | TRUE |
| Autos matches Restaurantes business hub standard | PARTIAL |
| Autos matches Varios CTA truth standard | PARTIAL |
| Autos has any fake visible actions | FALSE |
| Autos publish-ready except Stripe + dashboard analytics gap | PARTIAL |
| Build passed | TRUE |
| No files staged | TRUE |
| No commit created | TRUE |
| No push attempted | TRUE |
| Ready for Chuy QA | TRUE |

Final recommendation: YELLOW

## Manual QA checklist for Chuy

1. Open Autos Negocios draft; confirm parent/dealer data.
2. Add child vehicle in application.
3. Activate Inventory Boost if needed; confirm Stripe return to draft.
4. Confirm limit 20 after boost entitlement.
5. Publish test dealer main listing (Stripe test).
6. Add child vehicle from dashboard inventory drawer; confirm separate UUID + Leonix ID.
7. Open public parent detail; test heart 0→1→refresh.
8. Share: hub + exact URL.
9. Click every visible CTA; confirm destination + no dead buttons.
10. Open child listing; repeat like/share/CTA.
11. Dashboard: confirm parent/child rows separate (note: per-listing analytics link not yet proven).
12. Admin Autos queue: confirm identities.
13. Confirm no fake saves/messages/leads visible.
