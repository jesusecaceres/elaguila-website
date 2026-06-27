# AUTOS-GATE-B Engagement Audit

## Files Inspected
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx`
- `app/(site)/clasificados/autos/shared/types/autosListingAnalytics.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/components/clasificados/analytics/LeonixLikeButton.tsx`
- `app/components/clasificados/analytics/LeonixShareButton.tsx`
- `app/components/cta/CtaActionSheet.tsx`
- `app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx`
- `app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts`

## Files Changed
- `app/(site)/clasificados/autos/shared/components/AutosEngagementRow.tsx`
- `app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx`
- `app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx`
- `app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx`
- `app/(site)/clasificados/autos/shared/types/autosListingAnalytics.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/lib/clasificados/autos/AUTOS_GATE_B_ENGAGEMENT_AUDIT.md`
- `scripts/autos-gate-b-engagement-audit.ts`
- `package.json`

## Locked Files Respected
The existing CTA sheet, Autos CTA link adapter, dealer Business Hub, and Privado contact strip were not edited. No En Venta, dashboard, admin, Supabase schema/migration, or Stripe/payment files were edited.

## Share Behavior Used
Autos detail engagement uses `LeonixShareButton`, which opens the existing `CtaActionSheet` `share_ad` flow. That preserves the approved share-with-apps/native share behavior and the existing copy/social fallback rows.

## Like Count Source
Live Autos detail now fetches a durable like count from `user_liked_listings` using the same engagement keys used by the existing Autos cards: `leonix_ad_id` when present, and the internal Autos listing id. No localStorage, sessionStorage, hardcoded, random, or demo value is used as count truth.

## Gate B2 Live Count Refresh
`AutosEngagementRow` starts from the durable DB-backed count passed by live detail. It uses the existing `LeonixLikeButton` `onToggle` callback, which fires after the existing like/unlike write path succeeds, to adjust the visible count by +1 or -1 without changing the like system. The decrement path is clamped at 0. The row checks for an authenticated engagement user before adjusting the durable visible count, so anonymous session-only heart state does not inflate the DB-backed count.

## Negocios Result
Autos Negocios receives `AutosEngagementRow` above the existing dealer Business Hub shell in `AutoDealerPreviewPage`. `DealerBusinessStack` internals and all contact CTAs remain unchanged.

## Privado Result
Autos Privado receives `AutosEngagementRow` above `PrivadoContactStrip` in `AutoPrivadoPreviewPage`. No dealer Business Hub, dealer reviews, financing, or inventory sections were added to Privado.

## Preview/Draft Behavior
Draft/preview surfaces do not receive a published Autos listing id from `publicAnalytics`, so the engagement row is hidden. This avoids DB writes and fake counts for unpublished previews.

## Public/Live Behavior
Public/live detail passes the Autos listing source id, optional Leonix Ad ID, title, current public URL, lane, and DB-backed `listingAnalytics.likes` into the engagement row. If a real numeric like count is unavailable, the row returns `null` rather than showing a fake count.

## Risks / Deferred Work
- The visible count is server-fetched on page load; the existing like button may toggle local signed-in state immediately, while the count updates on the next live data fetch.
- Anonymous likes remain session-only in the existing `LeonixLikeButton`; they are not counted in the durable like total.

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Existing CTA business-card behavior preserved | TRUE | Locked CTA and contact files were not edited. |
| CtaActionSheet was not edited | TRUE | `app/components/cta/CtaActionSheet.tsx` unchanged. |
| AutosSheetCtaLink was not edited | TRUE | `app/(site)/clasificados/autos/shared/components/AutosSheetCtaLink.tsx` unchanged. |
| DealerBusinessStack was not edited | TRUE | `app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx` unchanged. |
| PrivadoContactStrip was not edited | TRUE | `app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx` unchanged. |
| Share uses existing LeonixShareButton | TRUE | `AutosEngagementRow` imports and renders `LeonixShareButton`. |
| Share opens approved share-with-apps/native share behavior | TRUE | `LeonixShareButton` opens the existing `CtaActionSheet` share flow. |
| Like uses existing LeonixLikeButton | TRUE | `AutosEngagementRow` imports and renders `LeonixLikeButton`. |
| Like count is real DB/event-backed | TRUE | `autosClassifiedsListingService` counts `user_liked_listings`. |
| Like count refreshes after confirmed toggle | TRUE | `AutosEngagementRow` uses `LeonixLikeButton` `onToggle` and adjusts from the DB-backed starting count. |
| Zero-like state is safe | TRUE | Count is clamped to non-negative and displays `0` when DB count is zero. |
| No localStorage count truth added | TRUE | `AutosEngagementRow` does not use localStorage/sessionStorage for counts. |
| No fake analytics added | TRUE | Existing Autos global like/share recorders are reused. |
| Autos Negocios received engagement row | TRUE | `AutoDealerPreviewPage` renders `AutosEngagementRow`. |
| Autos Privado received engagement row | TRUE | `AutoPrivadoPreviewPage` renders `AutosEngagementRow`. |
| Privado did not receive dealer Business Hub features | TRUE | Only `AutosEngagementRow` was added near `PrivadoContactStrip`. |
| No En Venta files changed | TRUE | Audit script checks diff paths. |
| No dashboard/admin files changed | TRUE | Audit script checks diff paths. |
| No DB/schema files changed | TRUE | No `supabase/**` file changed. |
| No Stripe/payment files changed | TRUE | Audit script checks diff paths. |
