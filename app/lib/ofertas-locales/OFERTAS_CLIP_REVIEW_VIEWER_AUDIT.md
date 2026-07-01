# Ofertas Locales Clip Review Viewer Audit

## 1. Task classification

**SCOPED GATED BUILD** — Ofertas Locales Step 5 clip review viewer only. No repo-wide scan, no Stripe, analytics, admin, dashboard, Supabase migrations, or unrelated categories.

## 2. Viewer decision

**NEW `OfertasClipReviewViewer.tsx` created.**

Gate 1 found the prior flyer path used native browser PDF `<iframe>` embeds (`OfertasLocalesProductClipPanel.tsx`, `OfertasLocalesSourceAdPreviewPanel.tsx`) with `pointer-events-none` bbox overlays on images only. That is not a controlled overlay surface for PDF review.

Decision: replace PDF iframe review with PDF.js canvas rendering + absolute-positioned clickable bbox overlay layer.

## 3. Files inspected

- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesSourceAdPreviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts` (existing server pdfjs usage)

## 4. Files changed

- `app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx` **(new)**
- `app/(site)/publicar/ofertas-locales/OfertasLocalesProductClipPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx`
- `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts`
- `app/lib/ofertas-locales/OFERTAS_CLIP_REVIEW_VIEWER_AUDIT.md` **(this file)**
- `scripts/verify-ofertas-clip-review-viewer.mjs` **(new)**
- `package.json` (verifier script only)

## 5. Controlled viewer contract

`OfertasClipReviewViewer` props:

| Prop | Purpose |
|------|---------|
| `fileUrl` | Flyer/coupon source URL |
| `currentPage` | Selected review page |
| `pageCount` | Optional external page count |
| `itemsOnPage` | Items with `sourceBbox`, `reviewStatus`, `sourceCropUrl` |
| `selectedItemId` | Highlight matching overlay |
| `onSelectItem(itemId)` | Overlay click → editor selection |
| `onPageChange(page)` | PDF page navigation |
| `onViewerReady({ pageCount })` | PDF load callback |
| `highlightOverlay` | “Show on flyer” emphasis |
| `collapsible/collapsed` | Mobile PWA flyer drawer |

Rendering: PDF.js legacy build → canvas; images → controlled `<img>`; overlays on `absolute inset-0` layer aligned to rendered surface.

## 6. Bbox math strategy

Implemented in `mapOfertaLocalSourceBboxToDisplayRect()` (`ofertasLocalesScanReviewRuntime.ts`):

- **Normalized** `xMin/yMin/xMax/yMax` in 0–1 → multiply by rendered width/height.
- **Pixel** `x/y/width/height` → requires known source page dimensions; otherwise returns null (no inaccurate overlay).
- Results clamped via `clampClipReviewDisplayRect()` to page bounds.
- Unknown bbox shapes → overlay omitted (honest fallback).

Assumption: production AI rows store normalized Gemini bbox (`xMin`…`yMax`) per `ofertasLocalesItemReviewMapper.ts`.

## 7. Overlay click behavior

- Each bbox is a `<button>` with `pointer-events-auto`.
- Click calls `onSelectItem(itemId)`.
- Selected item: burgundy + gold ring.
- Approved: restrained green.
- Needs review / pending: gold/burgundy.
- Rejected: hidden unless selected / highlight mode.

## 8. Clip Inspector behavior

`OfertasLocalesClipInspectorSection`:

- **`sourceCropUrl` present** → show crop image, label “Product clip ready”, optional “View source on flyer”.
- **`sourceBbox` only** → “AI found this item on Page X” + “Show on flyer” (no fake crop).
- **Neither** → “No product clip or flyer location is available yet”.
- Desktop: inspector in left column. Mobile: inspector between editor and active queue.

## 9. Active queue behavior

Per current page:

- `activeReviewItems`: `pending`, `needs_review`, null/undefined
- `reviewedItems`: `approved`, `rejected`
- Active queue list shows `activeReviewItems` only.
- Remaining count = `activeReviewItems.length`.
- Page complete when remaining = 0 → unlocks “Proceed to next page”.
- **Approve & next** / **Reject & next** save, update state, advance to next active item.
- **Reviewed on this page** tray collapsed by default.
- Next/Previous navigates active queue only.

## 10. Preview image truth

Audited `OfertasLocalesPreviewCard.tsx` → `AiDealPreviewCard`:

- Approved items only (`approvedAiItems` filter in preview client).
- `item.sourceCropUrl` rendered when present.
- Honest “No clip available yet.” when missing.
- Mapper passes `source_crop_url` → `sourceCropUrl` (`ofertasLocalesItemReviewMapper.ts`).
- **No preview code changes required** — pass-through already correct.

## 11. Mobile/PWA behavior

Mobile stack (review panel order):

1. Scan/page summary
2. Selected product editor + Clip Inspector (`xl:hidden` slot)
3. Active queue + reviewed tray
4. Collapsible flyer viewer (`OfertasClipReviewViewer` collapsible, default collapsed)

Desktop: left = Clip Inspector + viewer; right = review station.

Leonix brand: cream/ivory `#FFFCF7` / `#FDF8F0`, burgundy `#7A1E2C`, gold accent `#C9A227`, charcoal `#1E1814`, restrained green for approved/complete.

## 12. Cost-control note

- No `npm run build` during edit loop.
- Targeted Ofertas review files only.
- Lightweight verifier script only for gate 10.

## 13. Deferred items

- Production browser QA by Chuy (PDF CORS/worker behavior on real flyer URLs).
- One final `npm run build` after Chuy approves viewer behavior.
- Paid PDF SDK evaluation only if PDF.js canvas path fails V1 requirements.

## 14. TRUE/FALSE/PARTIAL table

| Check | Result |
|-------|--------|
| controlled viewer exists | TRUE |
| native/browser PDF overlay avoided unless reliable | TRUE |
| page render controlled by app code | TRUE |
| selected item highlights source bbox | TRUE |
| overlay click selects item | TRUE |
| item click highlights overlay | TRUE |
| Show on flyer exists | TRUE |
| real crop shown when source_crop_url exists | TRUE |
| bbox fallback works when crop missing | TRUE |
| no fake clips | TRUE |
| overlay math supports normalized bbox | TRUE |
| overlay math clamps bounds | TRUE |
| zoom/fit keeps overlay aligned | PARTIAL — fit-width rescale re-renders PDF canvas; manual QA needed for edge cases |
| active queue excludes approved/rejected | TRUE |
| approve/reject auto-advance | TRUE |
| reviewed tray exists | TRUE |
| remaining count uses only active items | TRUE |
| preview crop pass-through audited | TRUE |
| mobile viewer usable | PARTIAL — collapsible viewer ready; Chuy browser QA pending |
| no Stripe touched | TRUE |
| no analytics touched | TRUE |
| no unrelated categories touched | TRUE |
| npm run build intentionally not run | TRUE |
