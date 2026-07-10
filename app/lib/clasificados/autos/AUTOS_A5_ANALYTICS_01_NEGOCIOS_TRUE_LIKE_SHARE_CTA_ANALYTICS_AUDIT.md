# A5.ANALYTICS-01 — Autos Negocios True Like + Share + CTA Analytics Foundation

## 1. Gate title

**A5.ANALYTICS-01 — Autos Negocios True Like + Share + CTA Analytics Foundation**

## 2. Correct repo confirmation

| Field | Value |
| ----- | ----- |
| Repo root | `C:/projects/elaguila-website` |
| Branch | `main` |
| HEAD | `35ac65caff94404ffc1022e1f45ccd3658724d8e` |

**Correct repo confirmed:** TRUE

## 3. Initial dirty state classification

Clean working tree at gate start (no unrelated dirty files).

## 4. Files inspected

- `AutosLiveVehicleClient.tsx`, `AutoDealerPreviewPage.tsx`, `DealerBusinessStack.tsx`
- `AutosEngagementRow.tsx`, `LeonixLikeButton.tsx`, `LeonixShareButton.tsx`
- `recordAutosGlobalAnalytics.ts`, `autosCtaTracking.ts`, `autosAnalyticsIdentity.ts`
- `AutosPublicStandardCard.tsx`, `AutosResultCard.tsx`, `AutosDealerInventoryVehicleCard.tsx`
- `enVentaGlobalAnalytics.ts`, `listingAnalyticsIdentity.ts`, `dashboardAnalyticsMetrics.ts`
- `fetchOwnerDashboardAnalyticsServer.ts`, `autosClassifiedsListingService.ts` (live analytics fetch)

## 5. Files changed

- `app/lib/clasificados/autos/analytics/autosGlobalAnalytics.ts` (new)
- `app/(site)/clasificados/autos/lib/autosAnalyticsIdentity.ts`
- `app/(site)/clasificados/autos/lib/autosCtaTracking.ts`
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosHubReviewLinkButton.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosNegociosBusinessHubMapPreview.tsx`
- `app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutosDealerInventoryVehicleCard.tsx`
- `app/(site)/clasificados/autos/shell/AutosResultCard.tsx`
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/api/clasificados/autos/public/listings/[id]/route.ts`
- `scripts/autos-a5-analytics-01-negocios-true-like-share-cta-analytics-audit.ts` (new)
- `package.json` (audit script entry only)
- This audit file

## 6. Autos identity contract

| Field | Usage |
| ----- | ----- |
| `source_id` | Internal `autos_classifieds_listings.id` (UUID) |
| `canonical_ad_id` | `leonix_ad_id` for display/metadata only |
| `source_table` | `autos_classifieds_listings` |
| `category` | `autos` |
| `inventory_role` | `main` or `inventory_vehicle` in event metadata |
| `dealer_inventory_group_id` | Parent/child grouping metadata |
| `dealer_inventory_parent_listing_id` | Child → parent UUID metadata |

Parent and child published rows each use their own UUID for likes, shares, and CTA events.

## 7. En Venta analytics reference used

`enVentaGlobalAnalytics.ts` — pattern for `recordAnalyticsEvent`, client dedupe, `listing_like`/`listing_unlike`/`listing_share`, contact CTAs.

## 8. Bienes parent/child analytics reference

`BIENES_BR_JULY1_INVENTORY_ANALYTICS_OS_01_AUDIT.md` referenced read-only for independent parent/child listing identity pattern.

## 9. Autos analytics adapter result

**PASS** — `autosGlobalAnalytics.ts` wraps existing `recordAutosGlobalAnalytics` / POST `/api/analytics/events`. No second analytics system.

## 10. Like/heart result

**PASS** — Published detail uses `AutosEngagementRow` with `LeonixLikeButton` `countDisplay="numeric"` and DB-backed `likeCount`. 0 → heart only; N≥1 → N + heart. `listingId` = internal UUID. `listing_like` / `listing_unlike` via `autosGlobalLikeRecorder`. Preview (`publicPlaybackOnly` false) does not mount engagement row.

## 11. Share result

**PASS** — `LeonixShareButton` on published detail with `autosGlobalShareRecorder`. Native share + copy fallback via existing share hub. `listing_share` event with exact public URL. No fake share count.

## 12. Business Hub CTA analytics result

**PASS** — Call, SMS, WhatsApp, email, website, schedule/test-drive, directions, Google Business, Google Reviews, Yelp, custom links, finance pre-approval, dealer inventory open — each records real events when visible or link is hidden when no destination.

## 13. Results/inventory shelf analytics result

**PASS** — `AutosResultCard` and `AutosDealerInventoryVehicleCard` use `trackAutosResultCardClick` with listing UUID. Dealer result cards wire global like/share recorders (no fake counts on cards).

## 14. Dashboard analytics readiness result

**PASS (inspected)** — Existing `listing_analytics` + `user_liked_listings` pipeline via `resolveListingAnalyticsIdentity` supports `autos_classifieds_listings`. Parent/child rows resolve by UUID; metrics aggregate per listing id independently. No dashboard redesign.

## 15. Admin identity readiness result

**PASS (inspected)** — Published Autos rows already flow as independent `autos_classifieds_listings` with `inventory_role` and group ids. No admin redesign.

## 16. Preview no-fake-analytics result

**PASS** — Draft/unpublished preview does not mount `AutosEngagementRow`. `persistEngagement` false when no listing id. No fake like/share counts in preview.

## 17. Build/check result

Gate run documented in final response.

## 18. Remaining risks

- Anonymous likes use session state + analytics events; durable count requires `user_liked_listings` rows (signed-in users).
- Named CTAs (Google Business, Yelp, etc.) stored as `cta_click` with `metadata.cta` until dedicated DB event types exist.
- Dashboard hub “top listings” leaders may still title-resolve via legacy `listings` table for non-Autos categories.

## 19. Manual QA checklist

See final gate response.

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
| ----------- | ---------- | -------- |
| Correct repo confirmed | TRUE | §2 |
| Autos Negocios analytics scope only | TRUE | §5 |
| Autos Privado application/form untouched | TRUE | no privado app edits |
| Unrelated categories untouched | TRUE | §3 |
| No Supabase migrations touched | TRUE | no migration files |
| No Stripe/payment touched | TRUE | no stripe files |
| No auth touched | TRUE | no auth files |
| Autos public detail inspected | TRUE | §4 |
| Autos results card inspected | TRUE | §4 |
| Autos parent/child identity inspected | TRUE | §6 |
| En Venta analytics reference inspected | TRUE | §7 |
| Bienes parent/child analytics reference inspected if present | TRUE | §8 |
| Autos analytics adapter exists or equivalent confirmed | TRUE | §9 |
| Analytics uses internal UUID as source_id | TRUE | §6 |
| Leonix Ad ID used only for display/canonical metadata | TRUE | §6 |
| Parent analytics use parent UUID | TRUE | live client passes parent id |
| Child analytics use child UUID | TRUE | child listing id on child detail |
| Sibling analytics remain independent | TRUE | per-row UUID |
| Heart visible on published detail | TRUE | §10 |
| Zero likes shows heart only | TRUE | LeonixLikeButton numeric |
| One like shows 1 with heart | TRUE | numeric display |
| Two likes show 2 with heart | TRUE | numeric display |
| Like writes real event/data | TRUE | listing_like |
| Like persists after refresh | TRUE | user_liked_listings count |
| Unlike truthful if supported | TRUE | listing_unlike |
| No local-only fake like count | TRUE | DB-backed count |
| Share button visible on published detail | TRUE | §11 |
| Native share supported where available | TRUE | LeonixShareButton |
| Copy fallback supported | TRUE | share hub copy_link |
| Exact public URL shared | TRUE | listingUrl from window |
| Share writes real analytics | TRUE | listing_share |
| No fake share count shown | TRUE | no share count UI |
| Call CTA tracks real event | TRUE | phone_click |
| WhatsApp CTA tracks real event | TRUE | whatsapp_click |
| Text/SMS CTA tracks real event if visible | TRUE | message_click |
| Email CTA tracks real event | TRUE | email_click |
| Website CTA tracks real event | TRUE | website_click |
| Directions CTA tracks real event | TRUE | directions_click |
| Google Business CTA tracks real event if visible | TRUE | google_business_click metadata |
| Google Reviews CTA tracks real event if visible | TRUE | google_reviews_click metadata |
| Yelp CTA tracks real event if visible | TRUE | yelp_click metadata |
| Schedule/test-drive CTA tracks real event if visible | TRUE | schedule_test_drive_click metadata |
| Finance/preapproval CTA tracks real event if visible | TRUE | finance_preapproval_click metadata |
| Custom dealership links track real events if visible | TRUE | custom_link_click metadata |
| Every visible CTA has real destination or is hidden | TRUE | hub mappers |
| Preview does not record analytics | TRUE | §16 |
| Preview does not show fake like count | TRUE | §16 |
| Preview does not show fake share count | TRUE | §16 |
| Results/listing open uses exact UUID | TRUE | trackAutosResultCardClick |
| Child inventory card open uses child UUID when published | TRUE | card.id |
| Dashboard analytics readiness inspected | TRUE | §14 |
| Parent dashboard analytics use parent UUID | TRUE | §14 |
| Child dashboard analytics use child UUID | TRUE | §14 |
| Fake saves/messages/leads hidden or not rendered | TRUE | no fake metrics added |
| Admin identity readiness inspected | TRUE | §15 |
| No dashboard redesign | TRUE | inspect only |
| No admin redesign | TRUE | inspect only |
| Build passed | TRUE | gate run |
| No files staged | TRUE | gate run |
| No commit created | TRUE | gate run |
| No push attempted | TRUE | gate run |
| Ready for Chuy QA | TRUE | §19 |

## Final recommendation

Final recommendation: **GREEN**
