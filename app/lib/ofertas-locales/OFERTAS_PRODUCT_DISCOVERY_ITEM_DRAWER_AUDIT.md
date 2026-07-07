# Gate 2 — Ofertas Product Discovery + Item Detail Drawer Foundation

**Task classification:** SCOPED PRODUCT INTERACTION BUILD  
**Date:** 2026-07-06

## Product system intent

Organize approved flyer products inside the product section with client-side search, category filter, progressive load-more, and an item detail drawer that connects each deal to its flyer/source — without changing the locked Gate 1.5A desktop Offer Hub layout.

## Files inspected

- `OfertasLocalesPreviewCard.tsx`
- `OfertasLocalesPreviewProductGrid.tsx`
- `OfertasLocalesPreviewHeroVisual.tsx`
- `ofertasLocalesPreviewCopy.ts`
- `ofertasLocalesPreviewHelpers.ts`
- `ofertasLocalesTypes.ts`
- `OFERTAS_MOBILE_PWA_INTERACTION_AUDIT.md`

## Files changed

- `OfertasLocalesPreviewProductGrid.tsx`
- `OfertasLocalesPreviewCard.tsx` (props only for drawer context)
- `OfertasLocalesProductDetailDrawer.tsx` (new)
- `ofertasLocalesPreviewCopy.ts`
- `OFERTAS_PRODUCT_DISCOVERY_ITEM_DRAWER_AUDIT.md`
- `scripts/verify-ofertas-product-discovery-item-drawer.mjs`
- `package.json` (verifier script)

## Product discovery controls

- Search input across approved item text fields (title, name, category, subcategory, description, terms, dealType, price/offer text)
- Category chips from real `item.category` values + Todos/All
- Count: Mostrando X de Y (visible of filtered; total approved when filtered subset)
- Ver todos / View all resets search + category + visible count

## Progressive display / load more

- Initial: 12 mobile/tablet, 24 desktop
- Load more: +24 per click
- Search/filter applies to full approved set; visible count resets on filter change

## Item drawer behavior

- Mobile: bottom sheet; desktop: right side panel
- `role="dialog"`, `aria-modal`, Escape + overlay close
- Body scroll lock while open
- Real item data, crop image or no-image state, flyer page chip, business name, valid dates
- CTAs: view flyer, share product (Web Share / clipboard), directions, business website, view more offers
- Disabled: add to list, save coupon (Próximamente + FUTURE WIRING)

## Flyer / source proof

- Drawer shows source crop when `sourceCropUrl` exists
- Flyer page label when `sourcePage` exists
- Ver volante links to hero asset href when available

## Item link foundation

- Preview URL `?item=<approved-item-id>` via `replaceState`
- Preserves `lang` and other params
- On load, opens drawer if id matches approved item
- Invalid id ignored safely
- Share uses current URL with item param

## Future public URL plan

After public offer pages ship, item deep links may become:
`/ofertas-locales/[offer-slug]/item/[item-id]` (or equivalent) — not implemented in this gate.

## Disabled list / coupon behavior

Drawer buttons disabled with coming-soon section; FUTURE WIRING comments for shopping list and coupon wallet tables.

## Translation status

All new labels in `ofertasLocalesPreviewCopy.ts`; ES/EN via lang prop; real text for language globe.

## Mobile / PWA status

- Search full-width; category chips wrap/scroll inside product section
- Drawer bottom sheet on mobile
- No changes to sticky bar, section chips, or hero layout

## Intentionally not touched

Step 5/6/7, AI scan, crop engine, Stripe, admin, dashboard, public results, Supabase, auth, analytics, global header/footer, HeroVisual, future card files, helpers/types (unless justified — not needed)

## Risks / deferred work

- Public item route and SEO
- Persistent filter in URL (only `item` param now)
- Item drawer keyboard trap polish
- Shopping list / coupon wallet live actions

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Work classified as SCOPED PRODUCT INTERACTION BUILD | TRUE | Audit header |
| Gate 1.5A desktop layout preserved | TRUE | No hero/nav/hub changes |
| No desktop section chips reintroduced | TRUE | PreviewCard unchanged |
| No desktop product filter rail above hero | TRUE | Controls inside #productos only |
| Product controls live only inside product section | TRUE | Discovery header in grid |
| Product search added | TRUE | search input |
| Product search uses approved item data only | TRUE | items prop filter |
| Product category filter uses real categories only | TRUE | item.category derive |
| Todos/All resets category filter | TRUE | resetDiscovery |
| Count shows visible/filtered/total state | TRUE | showing X de Y |
| Initial product dump is limited | TRUE | 12/24 initial |
| Load more works | TRUE | +24 button |
| All approved products remain reachable | TRUE | load more until end |
| Product card opens item drawer | TRUE | card button onClick |
| Ver detalle/View details opens drawer | TRUE | detail button |
| Drawer is mobile-first | TRUE | bottom sheet lg:side |
| Drawer has accessible dialog semantics | TRUE | role=dialog aria-modal |
| Drawer shows real crop only if sourceCropUrl exists | TRUE | cropUrl check |
| Drawer has clean no-image state | TRUE | no-image block |
| Drawer shows flyer/source page when real | TRUE | flyerPage chip |
| Drawer shows store/business context | TRUE | draft.businessName |
| Drawer share/copy uses real client-side behavior | TRUE | navigator.share/clipboard |
| Item query param opens valid item drawer | TRUE | readOfertasPreviewItemParam |
| Invalid item param does not crash | TRUE | find + ignore |
| Future public item URL plan documented | TRUE | Future public URL plan section |
| Add to list remains disabled/coming soon | TRUE | disabled button + FUTURE WIRING |
| Save coupon remains disabled/coming soon | TRUE | disabled button + FUTURE WIRING |
| No fake online order button added | TRUE | no order UI |
| No fake inventory/availability added | TRUE | no stock UI |
| No fake ratings/stars/counts added | TRUE | no rating UI |
| No fake route/distance/open status added | TRUE | no map/distance |
| Approved-only product behavior preserved | TRUE | items from parent unchanged |
| Step 5 untouched | TRUE | verifier |
| Step 7 untouched | TRUE | verifier |
| AI scan/crop untouched | TRUE | verifier |
| Stripe/admin/dashboard untouched | TRUE | verifier |
| Public results page untouched | TRUE | verifier |
| ES/EN copy centralized | TRUE | copy file |
| Language globe compatibility preserved | TRUE | real text |
| Verifier passed | TRUE | npm run verify |
| npm run build passed | TRUE | npm run build |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate-scoped only |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| GLOBAL WORKING TREE CLEAN: YES/NO | NO | Gate 2 files dirty (expected) |
| UNRELATED DIRTY FILES PRESENT: YES/NO | NO | Only allowed Gate 2 files |

---

## Gate 2A — Product Discovery + Item Drawer Visual Polish

**Task classification:** MICRO PATCH / SCOPED VISUAL POLISH PATCH  
**Date:** 2026-07-06

### Why this polish was needed

Gate 2 delivered working product discovery and item drawer behavior, but CTAs looked plain/rectangular, the no-image state felt cheap, and the discovery header lacked premium Leonix brand treatment. Gate 2A polishes visuals only — no behavior changes.

### Product discovery header polish

- Search input: cream/white background, gold border, burgundy focus ring, `FiSearch` left icon, rounded-full pill shape
- Filter label: `FiFilter` icon + departments label
- Category chips: smaller rounded-full pills; active burgundy; inactive cream with gold border; hover/focus states
- Count/reset row: divider bar, burgundy count emphasis, `FiRotateCcw` on reset pill

### Product card polish

- Warm cream gradient card surfaces with gold border and subtle hover shadow
- No-image: `FiImage` in gold circle frame — no fake product image
- Title: serif hierarchy; price: refined burgundy sizing
- Chips: consistent gold/cream treatment
- Ver detalle: rounded-full burgundy pill with `FiEye` + `FiChevronRight`

### CTA / icon polish

- All CTAs use `react-icons/fi` — no emoji
- Primary: burgundy rounded-full pills
- Secondary: cream outline rounded-full
- Disabled future: dashed border + `FiLock` section header + muted icons

### Drawer polish

- Mobile bottom sheet handle pill at top
- Source proof frame with crop + flyer page strip (`FiFileText`)
- Business name with `FiShoppingBag` in deep green trust cue
- CTA hierarchy: primary flyer link separated from secondary grid
- Future section: dashed card with lock icon, disabled list/coupon buttons

### Mobile / PWA polish

- 44px min tap targets on all buttons
- Category chips wrap/scroll without page overflow
- Drawer `pb-8`/`pb-10` safe bottom spacing
- `overscroll-contain` on drawer body

### Brand mapping

| Token | Usage |
|---|---|
| Cream/ivory (`#FFFCF7`, `#FDF8F0`) | Product section, cards, drawer background |
| Burgundy (`#7A1E2C`) | Primary CTAs, active chips, price, focus rings |
| Gold/bronze (`#B8860B`, `#D4C4A8`) | Borders, chips, icons, accents |
| Charcoal (`#1E1814`) | Titles, body text |
| Deep green (`#2D5A3D`) | Business/store name trust cue only |
| React-icons (Fi*) | Search, filter, detail, share, drawer actions |
| No emoji | Enforced |

### Files changed (Gate 2A)

- `OfertasLocalesPreviewProductGrid.tsx`
- `OfertasLocalesProductDetailDrawer.tsx`
- `OFERTAS_PRODUCT_DISCOVERY_ITEM_DRAWER_AUDIT.md`
- `scripts/verify-ofertas-product-discovery-item-drawer.mjs`

### Locked files untouched (Gate 2A)

`OfertasLocalesPreviewCard.tsx`, Step 5/7, AI scan, Stripe, admin, dashboard, public results, copy file (no new labels needed)

### Gate 2A TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Gate 2A classified as MICRO PATCH / SCOPED VISUAL POLISH PATCH | TRUE | This section |
| Gate 1.5A desktop layout preserved | TRUE | PreviewCard untouched |
| Gate 2 functionality preserved | TRUE | Same state/logic/handlers |
| Product controls remain inside product section | TRUE | #productos only |
| Product discovery header visually polished | TRUE | Search/filter/count styling |
| Search input uses premium icon treatment | TRUE | FiSearch + rounded-full |
| Category chips visually polished | TRUE | CHIP_ACTIVE/INACTIVE |
| Count/reset row visually cleaned | TRUE | Divider + reset pill |
| Product cards visually polished | TRUE | Gradient cards + hover |
| Product title hierarchy improved | TRUE | font-serif semibold |
| Product price hierarchy improved | TRUE | text-lg bold burgundy |
| No-image state improved without fake image | TRUE | FiImage icon frame |
| SourceCropUrl real-only behavior preserved | TRUE | cropUrl conditional |
| Ver detalle/View details CTA visually polished | TRUE | Rounded-full + icons |
| Professional icons used instead of emoji | TRUE | react-icons/fi only |
| Drawer visual hierarchy improved | TRUE | Source frame + sections |
| Drawer mobile bottom sheet polished | TRUE | Handle pill + safe padding |
| Drawer CTA hierarchy improved | TRUE | Primary separated from grid |
| Future list/save actions remain disabled | TRUE | disabled buttons |
| FUTURE WIRING comments remain | TRUE | Drawer comments |
| No fake online order button added | TRUE | No order UI |
| No fake inventory/availability added | TRUE | No stock UI |
| No fake ratings/stars/counts added | TRUE | No rating UI |
| No fake route/distance/open status added | TRUE | No distance UI |
| Mobile/PWA no-horizontal-overflow considered | TRUE | max-w-full chips |
| Mobile tap targets are safe | TRUE | min-h-11 buttons |
| ES/EN copy preserved | TRUE | Copy file unchanged |
| Language globe compatibility preserved | TRUE | Real DOM text |
| Step 5 untouched | TRUE | Verifier scope |
| Step 7 untouched | TRUE | Verifier scope |
| AI scan/crop untouched | TRUE | Verifier scope |
| Stripe/admin/dashboard untouched | TRUE | Verifier scope |
| Public results page untouched | TRUE | Verifier scope |
| Verifier passed | TRUE | npm run verify |
| npm run build passed | TRUE | npm run build |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate 2A scoped |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| GLOBAL WORKING TREE CLEAN: YES/NO | NO | Gate 2A + unrelated dirty |
| UNRELATED DIRTY FILES PRESENT: YES/NO | YES | bienes-raices files |

---

## Gate 2B/3 — Real Flyer + Leonix Fidelity + Scale Correction

**Task classification:** SCOPED GATED BUILD  
**Date:** 2026-07-07

### Why this gate was needed

Owner feedback: PDF hero showed decorative placeholder instead of real flyer page; CTAs drifted to bubble/pill style; typography/scale needed Leonix fidelity; location needed quick map preview; product cards needed truthful crop/source proof.

### Actual flyer rendering

- `OfertasLocalesPdfFlyerPreview.tsx` renders PDF page 1 via `pdfjs-dist` dynamic import (same pattern as `OfertasClipReviewViewer`)
- Loading + honest fallback states; no fake screenshot
- Image hero unchanged

### CTA design system correction

- Primary/secondary CTAs use `rounded-lg` rectangular Leonix style (not bubble pills)
- WhatsApp uses `#25D366` green via `BTN_WHATSAPP`
- Share behavior preserved (Web Share / clipboard)
- Category chips may remain rounded-full (small badges only)

### Typography / offer card hierarchy

- Offer title scaled to `text-xl/2xl`
- Válido date in burgundy-labeled box
- Address readability improved
- Published-on-Leonix subtle deep-green trust strip

### Location / map preview

- `OfertasLocalesMiniMapPreview.tsx` embeds Google Maps from real `locationLine` query
- Localized iframe title; directions CTA preserved
- No fake distance/route/time

### Product crop / source proof

- `sourceCropUrl` renders only when real
- Missing crop shows `noClipYet` + source page when available
- Drawer shows flyer source proof block with link to full flyer when crop missing

### Owner controls near top

- `OwnerPreviewControls` strip under preview notice
- Bottom owner section preserved; submit gating unchanged

### Deferred

- Full bbox highlight viewer in drawer (ClipReviewViewer integration deferred)

### Gate 2B/3 TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Work classified as SCOPED GATED BUILD | TRUE | This section |
| Actual PDF flyer hero renders real first page | TRUE | PdfFlyerPreview + pdfjs-dist |
| Image flyer hero still works | TRUE | HeroVisual img branch |
| PDF fallback exists if render fails | TRUE | flyerRenderFailed copy |
| No fake flyer screenshot added | TRUE | Canvas render only |
| Step 5 upload/scan/review untouched | TRUE | Verifier scope |
| Step 7 untouched | TRUE | Verifier scope |
| AI scan/crop engine untouched | TRUE | Verifier scope |
| CTAs changed from bubble/pill to Leonix rectangular | TRUE | rounded-lg BTN_* |
| WhatsApp CTA uses green where appropriate | TRUE | BTN_WHATSAPP |
| Share behavior preserved | TRUE | handleShare unchanged |
| Offer title hierarchy improved | TRUE | PreviewCard typography |
| Address readability improved | TRUE | leading-relaxed + map |
| Válido/date line improved | TRUE | bordered valid box |
| Business Hub location has quick map if address exists | TRUE | MiniMapPreview |
| No fake distance/route/open status added | TRUE | embed query only |
| Product card scale normalized at 100% desktop | TRUE | smaller heights/padding |
| Product card no-image state truthful | TRUE | noClipYet label |
| Product cards show sourceCropUrl only when real | TRUE | cropUrl conditional |
| Product source page/proof clearer | TRUE | page chip in no-image |
| Drawer scale normalized | TRUE | smaller title/price/crop |
| Drawer shows crop if real | TRUE | cropUrl branch |
| Drawer shows source proof when crop missing | TRUE | hasSourceProof block |
| Future list/save actions remain disabled | TRUE | disabled + FUTURE WIRING |
| No fake online order/inventory/list/coupon | TRUE | no fake UI |
| Owner controls added near top | TRUE | OwnerPreviewControls |
| Bottom owner controls preserved | TRUE | bottom section |
| Submit review gating preserved | TRUE | disabled when needsReview |
| Mobile/PWA remains usable | TRUE | tap targets + overflow |
| No horizontal overflow on mobile | TRUE | max-w-full |
| ES/EN copy centralized | TRUE | copy file new keys |
| Language globe compatibility preserved | TRUE | DOM text |
| Public results page untouched | TRUE | Verifier |
| Stripe/admin/dashboard untouched | TRUE | Verifier |
| Verifier passed | TRUE | npm run verify |
| npm run build passed | TRUE | npm run build |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate scoped |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| GLOBAL WORKING TREE CLEAN: YES/NO | NO | Gate 2B/3 files dirty |
| UNRELATED DIRTY FILES PRESENT: YES/NO | NO | Only gate-scoped files |

---

## Gate 4B — Item Metadata Extraction + Review Fields

**Task classification:** SCOPED GATED BUILD  
**Date:** 2026-07-07

### Prompt fields added

Gemini flyer extraction prompt now requests optional commerce metadata per tile:
`item_number`, `sku`, `model_number`, `upc`, `coupon_code`, `item_url`, `online_availability`.

Prompt forbids hallucinated numbers/URLs and store-homepage URLs.

### Validator fields added

`OfertaLocalGeminiRawCandidate` extended with commerce fields. Validated candidates carry `commerceMetadata` (`OfertaLocalItemCommerceMetadata`) with length limits and HTTPS-only `itemUrl` when AI-visible.

### Storage location

`extracted_json.commerceMetadata` — no DB migration. Existing `extracted_json` keys (`provider`, `brand`, `salePriceText`, `regularPriceText`, `savingsText`, `rawEvidence`, `priceRepaired`, `needsReviewReason`, `sourceBboxGemini`) preserved on PATCH merge.

### Review UI fields added

Expandable **Datos para compra / búsqueda** / **Shopping / lookup data** section in `OfertasLocalesAiItemReviewPanel` with product URL, item number, SKU, model, UPC, coupon code, and availability select.

### PATCH merge behavior

`validateOfertaLocalItemReviewPatch` accepts `commerceMetadata`. `mapOfertaLocalItemReviewPatchToDbUpdate` merges into existing `extracted_json` without deleting unrelated keys; preserves `metadataNote` and AI `itemUrlSource` when appropriate.

### itemUrl HTTPS validation

Non-HTTPS, relative, `javascript:`, `data:`, `mailto:`, and `tel:` URLs rejected with `invalid_item_url` on owner PATCH. AI extraction clears unsafe URLs with optional metadata note.

### Intentionally not made live

- No shopper **Buy online** / purchase CTAs (Gate 4C)
- No copy-item-number CTA (Gate 4C)
- No shopping list, coupon wallet, or route planner
- Drawer shows read-only metadata only — no clickable product URL CTA yet

### Mobile / PWA review status

Commerce section is collapsible inside each review card to keep compact/workspace modes usable on ~390px.

### Gate 4B TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Gemini prompt asks for item number/SKU/model/UPC/coupon code/item URL | TRUE | ofertasLocalesGeminiPrompt.ts |
| Prompt forbids hallucinated item numbers/URLs | TRUE | Commerce metadata rules in prompt |
| Validator accepts optional commerce metadata | TRUE | commerceMetadata on validated candidate |
| Invalid/non-HTTPS item URL rejected or cleared safely | TRUE | validateOfertaLocalCommerceItemUrl |
| Metadata stored under extracted_json.commerceMetadata | TRUE | Gemini normalizer + PATCH merge |
| Existing extracted_json data preserved on save | TRUE | mergeCommerceMetadataIntoExtractedJson |
| Review view model exposes commerceMetadata | TRUE | mapOfertaLocalItemReviewRowToViewModel |
| Owner review UI exposes commerce fields | TRUE | OfertasLocalesAiItemReviewPanel |
| Review PATCH saves commerce fields through owner/admin route | TRUE | items/[itemId]/route.ts + mapper |
| No DB migration added | TRUE | extracted_json only |
| No fake online-shopping CTA added | TRUE | No buy/order buttons |
| No shopping list/route/coupon wallet made live | TRUE | Unchanged |
| Gate 4A crop/image truth preserved | TRUE | Crop helpers untouched |
| ES/EN labels added | TRUE | applicationCopy + previewCopy |
| Mobile review UI remains usable | TRUE | Collapsible commerce block |
| Checks passed | TRUE | verify + build |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate 4B scoped |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| UNRELATED DIRTY FILES PRESENT: YES/NO | NO | Gate-scoped only |

---

## Gate 4C — Instant Flyer Crop Rendering

**Task classification:** SCOPED GATED BUILD  
**Date:** 2026-07-07

### Root cause

Product cards showed “Recorte en preparación” whenever `source_crop_url` was empty — even though the item already had `source_bbox` and a `source_asset_url` / image flyer. The UI only rendered an `<img>` for the backend crop URL and never used the existing flyer image + bbox to build a visual preview.

### New render priority (cards + drawer)

1. `resolveOfertaLocalItemCropDisplayUrl(item)` — final `source_crop_url` (unchanged first priority).
2. Instant CSS crop from `sourceBbox` + a usable HTTPS image source (`item.sourceAssetUrl` when it is an image, else image hero flyer for page 1). No canvas, no base64, no network fetch.
3. Honest placeholder (`Recorte en preparación`) only when neither is possible.

### Helper / component

- `OfertasFlyerCropPreview.tsx` — absolute-positioned `<img>` sprite crop inside an `overflow-hidden` window; `onError` → `onUnavailable` so the parent falls back to placeholder (no broken icon, no empty box).
- `ofertasLocalesItemReviewMapper.ts`: `getOfertaLocalCssCropStyle` (clamps bbox 0–1, ~8% padding, rejects tiny regions), `resolveOfertaLocalInstantCropImageSource`, `isLikelyOfertaLocalImageAssetUrl`, `canRenderOfertaLocalInstantCrop`.

### PDF limitation

`source_bbox` cannot be cropped from a PDF URL. `isLikelyOfertaLocalImageAssetUrl` rejects `.pdf` sources, and the image-hero fallback is only used when `heroAsset.isImage`. For PDF-only flyers with no per-page image URL in current data, the honest “Recorte en preparación” placeholder remains. The full backend crop pipeline (Gate 4A) still produces `source_crop_url` for PDFs; instant crop is an image-source-only enhancement.

### Safety

- No DB migration. No fake crop URL. Nothing written to DB.
- No shopping list / route planner / coupon wallet / buy CTAs.
- `source_crop_url` remains first priority; Gate 4A/4B behavior preserved.

### Mobile / PWA status

Card crop window is fixed height (`h-28`/`lg:h-24`) → no layout jump; drawer crop larger (`h-44 sm:h-52`). 4-col desktop grid and 390px mobile unchanged.

### QA should verify

Cards render the real clipped flyer region when bbox + image source exist; placeholder only when neither crop URL nor image source is possible; drawer shows the larger instant crop; PDF-only items stay honest.

### Gate 4C TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Product cards still use sourceCropUrl first | TRUE | resolveOfertaLocalItemCropDisplayUrl branch first |
| Product cards render instant crop fallback when bbox + image source exist | TRUE | canRenderOfertaLocalInstantCrop branch |
| Product cards show placeholder only when no crop source is possible | TRUE | final else branch |
| Drawer uses sourceCropUrl first | TRUE | showCropImage branch first |
| Drawer renders instant crop fallback when bbox + image source exist | TRUE | canInstantCrop branch |
| PDF-only assets not falsely rendered as images | TRUE | isLikelyOfertaLocalImageAssetUrl rejects .pdf |
| No base64/image data saved to DB | TRUE | client-only CSS crop |
| No DB migration added | TRUE | helpers/components only |
| No fake crop URLs added | TRUE | no source_crop_url writes |
| No shopping list/route/coupon wallet made live | TRUE | unchanged |
| No buy/order CTAs added | TRUE | none |
| ES/EN copy preserved | TRUE | flyerPreview/previewFromFlyer keys |
| Mobile/PWA layout remains clean | TRUE | fixed crop heights |
| Checks passed | TRUE | verify + build |
| READY TO COMMIT THIS BUILD ONLY: YES/NO | YES | Gate 4C scoped |
| READY TO PUSH THIS BUILD ONLY: YES/NO | YES | After commit |
| UNRELATED DIRTY FILES PRESENT: YES/NO | NO | Gate-scoped only |

---

# Gate 4C Repair — Real PDF Item Crop Rendering + Mobile/PWA Drawer Fix

**Task classification:** SCOPED REPAIR BUILD
**Date:** 2026-07-07

## Previous Gate 4C failure cause

The initial Gate 4C only produced an instant crop when the source asset (or hero flyer)
was an **image** URL. `OfertasFlyerCropPreview` uses a CSS sprite technique on an `<img>`,
which cannot render a page of a **PDF**. Because the real Ofertas Locales source is a PDF
flyer, `resolveOfertaLocalInstantCropImageSource` returned `null`, `canRenderOfertaLocalInstantCrop`
was `false`, and cards/drawer fell back to "Recorte en preparación" / "Recorte del producto en
preparación" even though a renderable PDF page + `sourceBbox` existed.

## Render priority (unified)

1. `sourceCropUrl` (AI-generated crop) — always first.
2. Renderable **image** source + `sourceBbox` → existing `OfertasFlyerCropPreview` (CSS crop).
3. Renderable **PDF** source + `sourceBbox` → new `OfertasPdfItemCropPreview` (pdf.js canvas crop).
4. Honest fallback only when no source can render.

## PDF item crop renderer

`app/(site)/publicar/ofertas-locales/preview/OfertasPdfItemCropPreview.tsx`:
- `"use client"`, dynamic `import("pdfjs-dist/legacy/build/pdf.mjs")` + same unpkg worker
  pattern as `OfertasLocalesPdfFlyerPreview`.
- Renders the correct page (`sourcePage`, default 1, clamped to `numPages`).
- Converts normalized bbox (0–1) into a padded/clamped crop region via
  `getOfertaLocalPaddedNormalizedCrop` (~8% padding, rejects tiny/invalid bbox).
- Renders **only the crop region** into a crop-sized canvas using a viewport translate
  transform `[1,0,0,1,-cropLeft,-cropTop]` (no giant offscreen canvas). Scale is derived
  from container width × DPR and capped (`MAX_CANVAS_PX`) to protect memory.
- Cancels the render task on unmount / dependency change; `onUnavailable` on failure.
- No `toDataURL`, no base64, no DB writes, no fake image. Card variant compact, drawer larger.

Helpers added to `ofertasLocalesItemReviewMapper.ts` (type-safe, pure):
`isLikelyOfertaLocalPdfAssetUrl`, `resolveOfertaLocalInstantCropPdfSource`,
`getOfertaLocalPaddedNormalizedCrop`, `canRenderOfertaLocalPdfCrop`.

## Mobile / PWA drawer fixes

- Bottom sheet clamped to `w-full max-w-[100vw]`; outer wrapper `overflow-hidden` prevents shift.
- Scroll region `overflow-x-hidden` (no content cut off on the right) + safe-area bottom padding
  `pb-[max(2rem,env(safe-area-inset-bottom))]`.
- Top handle + 44px close button preserved; content scrolls inside the drawer.
- Desktop side drawer kept clean (`lg:w-[26rem] lg:max-w-md`).
- Product grid: single column at 390px, wrapping filter chips, no horizontal overflow.

## What was not touched

Flyer hero renderer, map preview, native share/deep link, search/filter/load-more, Gemini
extraction, commerce metadata review, Stripe/auth/admin/dashboard, global header/footer,
DB migrations. No shopping list / coupon wallet / route / buy CTAs added.

## Risks / deferred work

- PDF crops render client-side per view; a future backend `source_crop_url` backfill remains
  the durable path and still takes first priority automatically.
- Very large flyers rely on the render-scale cap for memory safety.

## TRUE/FALSE audit

| Check | Result | Note |
|-------|--------|------|
| Previous CSS-only crop limitation identified | TRUE | image-only source |
| PDF item crop renderer added | TRUE | OfertasPdfItemCropPreview |
| Product cards use sourceCropUrl first | TRUE | resolveOfertaLocalItemCropDisplayUrl |
| Product cards render PDF bbox crop when sourceCropUrl missing | TRUE | canRenderOfertaLocalPdfCrop |
| Drawer renders PDF bbox crop when sourceCropUrl missing | TRUE | canRenderOfertaLocalPdfCrop |
| Fallback only appears when no crop source can render | TRUE | image→pdf→fallback |
| No fake crop URLs/images added | TRUE | pdf.js render only |
| No DB migration/write/base64 added | TRUE | client render, no writes |
| Mobile drawer width/clipping fixed | TRUE | max-w-[100vw] + overflow-x-hidden |
| Mobile/PWA 390px no horizontal overflow considered | TRUE | single col + safe-area |
| Search/filter/load-more preserved | TRUE | unchanged |
| Flyer/map/share preserved | TRUE | unchanged |
| No shopping list/route/buy CTA added | TRUE | none |
| ES/EN copy preserved | TRUE | renderingCrop/cropRenderFailed keys |
| Verifier passed | TRUE | see checks |
| npm run build passed | TRUE | see checks |
| READY TO COMMIT THIS BUILD ONLY | YES | Gate 4C Repair scoped |
| READY TO PUSH THIS BUILD ONLY | YES | after commit |
| UNRELATED DIRTY FILES PRESENT | NO | gate-scoped only |

---

# Leonix Global Mobile/PWA Foundation V1 + Ofertas Apply

**Task classification:** SCOPED GATED BUILD — shared foundation + Ofertas-only apply
**Date:** 2026-07-07

## Components created (`app/(site)/components/mobile/`)

- `LeonixMobileScrollRail.tsx` — generalized horizontal rail: `snap-x`, hidden
  scrollbars, mobile edge fades, arrow controls (live scroll-state), rail dots,
  swipe hint, `desktopMode` = `wrap` | `grid` | `none`, ES/EN aria labels. No
  category content.
- `LeonixMobileBottomSheet.tsx` — portal + body scroll lock + Escape close +
  backdrop close, `role="dialog"`/`aria-modal`, 44px close, handle bar, mobile
  bottom sheet (`w-full max-w-[100vw]`, `max-h-[92dvh]`, internal scroll,
  `env(safe-area-inset-bottom)` padding, `overflow-x-hidden`), desktop right-side
  panel via `placement="right"`.
- `LeonixResponsiveShell.tsx` — `w-full overflow-x-hidden` outer + `mx-auto
  min-w-0` container + optional PWA-safe bottom padding
  (`pb-[calc(4.5rem+env(safe-area-inset-bottom))]`). No global CSS.
- `LeonixStickyActionBar.tsx` — optional shared fixed mobile CTA bar with
  safe-area padding, ≤5 rectangular 44px actions (created for reuse; Ofertas keeps
  its existing in-file sticky bar for now).

## Patterns extracted (behavior only, no brand content)

- **En Venta rail** (`EnVentaHubHorizontalScroll.tsx`): snap-x, hidden scrollbar,
  edge fades, arrows, dots, swipe hint, mobile rail + desktop wrap/grid.
- **Admin drawer** (`AdminMobileNavDrawer.tsx`): portal, body scroll lock, Escape,
  fixed overlay, `overflow-hidden`, `max-w`, 44px close/tap targets.
- **En Venta/Restaurante shell**: `env(safe-area-inset-bottom)` bottom padding.

## Ofertas mobile fixes applied

- **Header:** `min-w-0` + `break-words` on `<h1>`/subtitle; page wrapped in
  `LeonixResponsiveShell` (`overflow-x-hidden`), added a mobile "Mobile optimized
  view" cue. No more title clipping / horizontal overflow at 390px.
- **Section nav:** now `LeonixMobileScrollRail` (`desktopMode="none"`) with swipe
  hint; chips scroll cleanly, no clip.
- **Product filters:** now `LeonixMobileScrollRail` (`desktopMode="wrap"`) — mobile
  rail, desktop wrap; search input stays full width.
- **Product cards:** 1-column at 390px (`grid-cols-1`, 2-col only ≥480px), stable
  crop area, rectangular CTA preserved.
- **Flyer preview:** already `w-full`/`object-contain`; page overflow removed by
  the shell so it fits the mobile width.
- **Product drawer:** refactored to `LeonixMobileBottomSheet` — portal + body
  scroll lock (new), full-width mobile bottom sheet with internal scroll + safe
  bottom padding, desktop right-side panel preserved. No right-side clipping.

## Save/list/coupon truth

Removed all live-looking disabled buttons ("Mi lista", "Guardar cupón", "Ruta
inteligente" cards; drawer "Agregar a mi lista" / "Guardar cupón"). Replaced with a
single non-interactive info card: ES "Próximamente: listas, cupones guardados y
rutas inteligentes." / EN "Coming soon: lists, saved coupons, and smart routes."
Nothing says saved/added; no save/list action is live.

## Future migration plan

Progressively adopt `LeonixMobileScrollRail` / `LeonixMobileBottomSheet` /
`LeonixResponsiveShell` in other category preview/hub pages gate-by-gate. Not a
repo-wide migration in this build.

## Intentionally not touched

Restaurantes, En Venta, Admin drawer behavior, other `clasificados/*`, global
header/footer/nav, Stripe/auth/monetization. No service worker / PWA manifest /
offline caching. No DB migrations. Product crop rendering logic unchanged (layout
integration only).

## QA must verify

Desktop close to accepted layout (flyer left / offer center / right action cards /
Business Hub / 4-col grid / crop cards / side drawer). Mobile 390px: no header
clip, section nav + filters scroll horizontally, flyer fits, 1-col cards, drawer
opens as bottom sheet (not shifted/cut), internal scroll, sticky bar doesn't cover
content, no fake save/list/coupon buttons.

## TRUE/FALSE audit

| Check | Result | Note |
|-------|--------|------|
| En Venta rail pattern inspected | TRUE | EnVentaHubHorizontalScroll |
| Admin mobile drawer pattern inspected | TRUE | AdminMobileNavDrawer |
| Shared Leonix mobile rail created | TRUE | LeonixMobileScrollRail |
| Shared Leonix bottom sheet/drawer created | TRUE | LeonixMobileBottomSheet |
| Shared responsive shell created | TRUE | LeonixResponsiveShell |
| Ofertas uses shared rail for section nav or product filters | TRUE | both |
| Ofertas mobile header no longer clips at 390px | TRUE | shell + break-words |
| Ofertas flyer preview fits mobile width | TRUE | w-full + overflow-x-hidden |
| Ofertas product cards 1-column, no overflow at 390px | TRUE | grid-cols-1 |
| Product drawer behaves as mobile bottom sheet at 390px | TRUE | bottom sheet |
| Drawer has safe bottom padding and internal scroll | TRUE | env(safe-area) |
| Actual product crops preserved | TRUE | crop logic untouched |
| Map/share/flyer/search/filter preserved | TRUE | unchanged |
| Fake/unbacked save/list/coupon buttons removed or neutralized | TRUE | info card |
| No Restaurants/En Venta/Admin behavior changed | TRUE | read-only refs |
| No service worker/PWA manifest/offline caching added | TRUE | none |
| ES/EN copy preserved | TRUE | swipe/close/comingSoon keys |
| Verifier passed | TRUE | see checks |
| Build passed | TRUE | see checks |
| READY TO COMMIT THIS BUILD ONLY | YES | foundation + apply scoped |
| READY TO PUSH THIS BUILD ONLY | YES | after commit |
| UNRELATED DIRTY FILES PRESENT | NO | gate-scoped only |

---

# Ofertas Mobile Density V1 — Final 390px PWA Polish Repair

**Task classification:** SCOPED REPAIR BUILD — mobile density / PWA polish only
**Date:** 2026-07-07

## Mobile QA failures addressed (from live screenshots)

- Layout technically contained but felt like squeezed desktop (desktop padding, nested cards, large type).
- Flyer PDF preview dominated first screen (~420px max height on mobile).
- Sticky bottom CTA bar too tall (large icons, py-2, heavy shadow).
- Product filter area was card-in-card with extra borders/shadows.
- Business Hub accordions used desktop padding (p-4/p-5).
- Section nav had large margins and swipe badge stealing space.
- Drawer CTAs used desktop sizing; bottom spacing tight vs sticky bar.

## What changed (Ofertas-only mobile classes)

- **Header:** `text-[1.6rem]` + tighter subtitle (`text-xs`, `max-w-xs`, lower opacity); removed cluttered mobile chip.
- **Section nav:** compact chips (`min-h-9`), `mb-3`, no swipe hint/arrows on nav rail.
- **Flyer:** `compactMobile` caps PDF/image preview at ~300px on mobile; smaller hero card + stacked CTAs below 400px.
- **Offer card:** `p-4` mobile, smaller title, tighter CTA grid.
- **Product filters:** flat mobile control rail (no nested rounded card); compact search + chips.
- **Product cards:** `h-24` crop, tighter `p-2.5`, `mt-4` grid gap.
- **Drawer:** smaller mobile CTAs, stacked 1-col buttons, extra bottom padding for sticky bar.
- **Sticky bar:** shorter (`min-h-10`, `h-4` icons, `text-[9px]`, lighter shadow, safe-area).
- **Business Hub:** `p-3` mobile, `space-y-2`, compact accordion summaries.
- **Shell:** `safeBottom="compact"` + `py-4` mobile container padding.

## What stayed global (small backward-compatible tweak)

- `LeonixResponsiveShell` accepts `safeBottom="compact"` for shorter bottom padding when sticky bar is denser.

## Desktop preservation

All density changes use `sm:` / `lg:` breakpoints. Desktop flyer heights, grid columns, hub layout, and side drawer unchanged.

## Future tools truth

Verified: no `addToList`, `saveCoupon`, `myList` buttons in preview card or drawer. Only `comingSoonListsRoutes` info text remains.

## 390px visual QA contract

At 390px: no horizontal overflow; header not clipped; flyer compact; filters not over-nested; 1-col cards with crops; drawer bottom sheet with scroll + safe padding; compact sticky bar; compact Business Hub; no fake save/list/coupon actions.

## TRUE/FALSE audit

| Check | Result | Note |
|-------|--------|------|
| Mobile hero/header density improved | TRUE | smaller title/subtitle |
| Section nav rail polished | TRUE | compact chips, no swipe badge |
| Flyer mobile compact mode added | TRUE | compactMobile ~300px cap |
| Product filter controls mobile density improved | TRUE | flat rail, less nesting |
| Product cards remain 1-column at 390px | TRUE | grid-cols-1 |
| Product crops preserved | TRUE | crop logic untouched |
| Drawer mobile CTA/layout polished | TRUE | stacked compact CTAs |
| Sticky bottom CTA bar density improved | TRUE | shorter bar + compact shell |
| Business Hub mobile density improved | TRUE | p-3, space-y-2 |
| No fake save/list/coupon action remains | TRUE | info card only |
| No horizontal overflow expected at 390px | TRUE | shell overflow-x-hidden |
| Desktop layout preserved | TRUE | sm/lg breakpoints |
| Map/share/flyer/search/filter/load-more preserved | TRUE | unchanged behavior |
| No other categories touched | TRUE | Ofertas preview only |
| Verifier passed | TRUE | see checks |
| Build passed | TRUE | see checks |
| READY TO COMMIT THIS BUILD ONLY | YES | density repair scoped |
| READY TO PUSH THIS BUILD ONLY | YES | after commit |
| UNRELATED DIRTY FILES PRESENT | NO | gate-scoped only |

---

# Ofertas Locales Preview Architecture Clean-up

Scoped clean-up of the Ofertas preview composition: flyer-first hero, CTA
consolidation, restructured title/info area, and localized emoji product filter
pills. Not a broad redesign — the Business Hub shell and lower product grid are
preserved.

## Top section re-architecture

- Introduced a single **Title / info section** (`#oferta`) that carries: offer
  type badge(s), a larger/stronger business name, category/market line, a
  validity + address row, the "about this business" excerpt, and a compact
  rewards/membership sub-block (marked with `FiAward`).
- Rewards/membership no longer floats as a separate side box — it is an inline
  compact card inside the title/info section, shown on all breakpoints.
- Removed the duplicated **desktop live action stack** (directions + contact +
  membership + digital-coupon cards) and the duplicated `hidden lg:inline-flex`
  contact button cluster (Llamar / WhatsApp / Sitio web / Cómo llegar) from the
  upper summary. The summary is now informational; only a single non-duplicative
  Share action remains.

## Flyer hero first

- The flyer is now its own full-width **Flyer hero** section (`#volante`),
  centered and enlarged (`max-w-2xl lg:max-w-3xl`) below the title/info area so
  it is the visual star.
- Two clear file actions under the flyer: primary **Ver volante / View flyer**
  and secondary **Descargar volante / Download flyer** (replacing "Abrir
  archivo").
- Download is real: `fetch` → `Blob` → object URL → synthetic `link.download`
  click, with a `window.open` new-tab fallback for cross-origin/CORS failures so
  the label never dead-ends.

## Business Hub content consolidation (no redesign)

- Business Hub shell, tone, and sectioned system are unchanged.
- Contact actions (Llamar / WhatsApp / Sitio web / Correo / Copiar correo) live
  only in **Contactar negocio**; address + map + Cómo llegar in **Nuestra
  ubicación**; social in **Síguenos**; discovery/profile links (Google, Yelp) in
  **Opiniones / Más información**. The upper area no longer duplicates these.

## Localization + curated product filter taxonomy

- New display layer `ofertasLocalesProductTaxonomy.ts` normalizes raw AI/OCR
  categories into a curated, shopper-facing set and renders localized labels via
  `getOfertaProductFilterLabel(key, lang)`.
- Filter chips now obey the page `lang` state in both ES and EN (previously the
  raw English category strings leaked into Spanish). "Todos / All", "Mostrando X
  de Y", filter headings, and flyer CTA labels all follow `lang`.
- Chips restyled as compact **rectangular rounded pills** (`rounded-lg`) with a
  leading emoji cue; selected/unselected states and mobile horizontal-scroll
  wrapping preserved.
- Filtering still works: selection compares the item's normalized taxonomy key,
  counts stay accurate, and "Todos / All" resets correctly.

## Files changed

- `OfertasLocalesPreviewCard.tsx` — title/info restructure, removed duplicated
  CTA cluster + desktop action stack + mobile membership block, flyer hero
  section, rewards/membership inline block.
- `OfertasLocalesPreviewHeroVisual.tsx` — Descargar volante download action with
  safe fallback; view/download icons.
- `OfertasLocalesPreviewProductGrid.tsx` — curated taxonomy keys, normalized
  filtering, localized rectangular emoji chips.
- `ofertasLocalesProductTaxonomy.ts` — new curated localized taxonomy + mapping.
- `ofertasLocalesPreviewCopy.ts` — download labels.
- `scripts/verify-ofertas-product-discovery-item-drawer.mjs` + this audit.

## Risky / manual QA

- Download relies on CORS-enabled asset hosts (Supabase/Blob public URLs allow
  GET); the new-tab fallback covers hosts that block cross-origin fetch.
- Taxonomy mapping is keyword-based; unusual raw categories fall back to
  "Otros / Other" (never dropped).

## Preview Architecture Clean-up — TRUE/FALSE audit

| # | Check | Result |
|---|-------|--------|
| 1 | Business Hub overall design shell preserved | TRUE |
| 2 | Duplicated contact CTA cluster removed from upper summary | TRUE |
| 3 | Title/info area holds business meta + rewards cleanly | TRUE |
| 4 | Flyer is more visually dominant | TRUE |
| 5 | "Abrir archivo" replaced with Descargar volante / Download flyer | TRUE |
| 6 | Download flyer action works | TRUE |
| 7 | Product filter chips obey ES/EN language state | TRUE |
| 8 | Chips use rectangular pill styling with emoji cues | TRUE |
| 9 | Raw categories normalized into cleaner taxonomy | TRUE |
| 10 | Filters still function after normalization | TRUE |
| 11 | Mobile QA checked (390px) | TRUE |
| 12 | Desktop QA checked | TRUE |
| 13 | Unrelated files not changed | TRUE |
| READY TO COMMIT THIS BUILD ONLY | YES |
