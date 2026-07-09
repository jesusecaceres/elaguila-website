# OFERTAS PUBLIC FLYER VIEWER V1 — Clickable Approved Item Overlays + Product Detail Drawer

## 1. Task classification

**SCOPED GATED BUILD** — Ofertas Locales public/preview flyer viewer: approved-item bbox overlays on the shopper-facing flyer modal; overlay click opens the existing product detail drawer (same as product card “Ver detalle”). No edit/review controls, no fake commerce CTAs.

## 2. Files inspected

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesProductDetailDrawer.tsx` (read-only)
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx` (read-only)
- `app/(site)/publicar/ofertas-locales/OfertasClipReviewViewer.tsx` (read-only / pattern reference)
- `app/lib/ofertas-locales/ofertasLocalesScanReviewRuntime.ts` (read-only — bbox math)
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts` (read-only)
- `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts` (read-only)

## 3. Files changed

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/lib/ofertas-locales/OFERTAS_PUBLIC_FLYER_VIEWER_AUDIT.md` (this file)
- `scripts/verify-ofertas-public-flyer-viewer.mjs`
- `package.json` (verifier script only)

## 4. Existing Step 5 review viewer pattern

`OfertasClipReviewViewer.tsx` renders PDF.js canvas or `<img>`, measures display surface, maps `sourceBbox` via `mapOfertaLocalSourceBboxToDisplayRect`, and renders absolute-positioned `<button>` overlays with status-colored borders. Selecting an item opens the internal review panel (approve/reject/edit).

## 5. Public viewer data path

1. `OfertasLocalesPreviewClient.tsx` loads AI items and filters `reviewStatus === "approved"` → `approvedAiItems`.
2. `OfertasLocalesPreviewCard.tsx` receives `approvedAiItems` and passes them to:
   - `OfertasLocalesPreviewProductGrid` (cards + shared drawer trigger)
   - `OfertasLocalesFlyerViewerModal` (overlay source)
3. Product detail drawer state lifted to `PreviewCard` — single source of truth for flyer overlay click and card “Ver detalle”.

## 6. Approved item filter rule

Only items with `reviewStatus === "approved"` reach the preview card (parent filter). Flyer modal additionally requires valid `sourceBbox` for overlay buttons. Items without bbox still appear in the product grid but produce no overlay (honest).

## 7. Bbox overlay strategy

- Reuse `mapOfertaLocalSourceBboxToDisplayRect` from `ofertasLocalesScanReviewRuntime.ts` (normalized xMin/yMin/xMax/yMax 0–1, or pixel bbox when source dimensions known).
- Overlays are `<button>` elements with gold/bronze idle border, burgundy hover/focus/active, translucent warm fill.
- Invalid/missing bbox → no overlay rendered.
- PDF flyers: page navigation + overlays filtered by `sourcePage` (default page 1).
- Image flyers: overlays on the single displayed image.

## 8. Overlay click → product drawer behavior

- Overlay `onClick` calls `onOpenProductDetail(item)` → `PreviewCard.openProductDetail` → sets `drawerItem` + syncs `?item=` URL param.
- `OfertasLocalesProductDetailDrawer` rendered once in `PreviewCard` (shopper-facing only — no edit/review).
- When drawer is open, flyer modal uses `stackBelowDrawer` (z-90) so drawer (z-100) stacks correctly; closing drawer returns user to open flyer.

## 9. Product card drawer regression result

Product grid `onOpenDetail` delegates to the same `openProductDetail` callback. Drawer component unchanged. Crop proof path preserved (`sourceCropUrl` → instant CSS crop → PDF bbox crop → honest fallback).

## 10. No fake overlay policy

- No overlay without valid `sourceBbox` mapped to display rect.
- No fabricated `source_crop_url` or bbox coordinates.
- No pending/rejected/needs_review items in public overlays (excluded at parent).

## 11. Performance notes

- Overlay click uses in-memory `approvedAiItems` already loaded for the product grid — no scan refetch.
- Flyer PDF rendered once per page in modal; product card images remain lazy-loaded.
- Shoppers can browse the flyer and tap overlays without waiting for all crop cards to load.

## 12. Mobile/PWA notes

- Modal: `max-w-[100vw]`, `overflow-x-hidden`, safe-area padding on header/footer.
- Overlay buttons are keyboard-focusable with ES/EN `aria-label`.
- Drawer uses existing `LeonixMobileBottomSheet` mobile pattern.

## 13. Deferred items

- Full-page multi-flyer image carousel (only page 1 image + PDF page nav today).
- Highlight animation / pulse on first visit.
- Public live route (preview-only today).

## 14. TRUE/FALSE/PARTIAL table

| Criterion | Result |
|-----------|--------|
| public flyer viewer receives approved item data | TRUE |
| rejected items excluded | TRUE |
| pending/needs_review items excluded | TRUE |
| valid source bbox creates overlay | TRUE |
| invalid/missing bbox creates no overlay | TRUE |
| overlay buttons are accessible | TRUE |
| overlay click opens product detail drawer | TRUE |
| product card Ver detalle still opens product detail drawer | TRUE |
| drawer is shopper-facing only | TRUE |
| source crop proof preserved | TRUE |
| no edit/review controls exposed | TRUE |
| no fake cart/save/wallet/claim/redeem | TRUE |
| normal flyer viewer still works without overlays | TRUE |
| ES/EN viewer copy exists | TRUE |
| mobile modal has no horizontal overflow | TRUE |
| no scan/crop engine touched | TRUE |
| no Stripe touched | TRUE |
| no analytics touched | TRUE |
| no admin/dashboard touched | TRUE |
| no unrelated categories touched | TRUE |
| build passed | TRUE |
