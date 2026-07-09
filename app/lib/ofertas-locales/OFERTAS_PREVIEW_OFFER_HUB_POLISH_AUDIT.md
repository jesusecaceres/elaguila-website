# Ofertas Preview / Public Offer Hub Polish — Premium Flyer + Coupon Page Foundation

**Task classification:** SCOPED LAUNCH POLISH BUILD  
**Date:** 2026-07-02

## Files inspected

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewAssetCards.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`

## Files changed

- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx`
- `app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPreviewCopy.ts`
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewProductGrid.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureShoppingListCard.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureRoutePlannerCard.tsx` (new)
- `app/(site)/publicar/ofertas-locales/preview/OfertasFutureCouponWalletCard.tsx` (new)
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/OFERTAS_PREVIEW_OFFER_HUB_POLISH_AUDIT.md`
- `scripts/verify-ofertas-preview-offer-hub-polish.mjs`
- `package.json` (verifier script only)

## Current preview issue

Preview used `max-w-lg` (~512px) with a vertical stack resembling an admin receipt. Flyer/coupon was buried in asset cards. Products ran in a narrow 2-column grid. Business/contact info lacked premium hierarchy.

## New layout structure

| Zone | Desktop | Mobile |
|------|---------|--------|
| Container | `max-w-[1240px]` centered | full width padded |
| Hero row | 4-col visual + 5-col offer hub + 3-col actions | stacked |
| Products | 1–4 column responsive grid below hero | 1–2 columns |
| Owner controls | separated burgundy panel at bottom | stacked buttons |

## Live features rendered

- Hero flyer/coupon image or PDF card with open links
- Business name, title, category, market, dates, description
- Published on Leonix trust cue
- Phone, WhatsApp, website, email, directions (when data exists)
- Share via Web Share API or clipboard copy
- Social/review/business link pills (valid URLs only)
- Approved AI product grid with real crop images only
- Membership/digital coupon when lane + URL exist
- Submit/back/edit owner controls with AI review gating

## Placeholder modules

| Component | State | Future wiring |
|-----------|-------|---------------|
| `OfertasFutureShoppingListCard` | Disabled, coming soon | Saved shopping list table / dashboard |
| `OfertasFutureRoutePlannerCard` | Disabled, coming soon | Route planner / maps multi-stop |
| `OfertasFutureCouponWalletCard` | Disabled, coming soon | Coupon wallet / saved offers table |

## Future wiring map

- **Mi lista / My list** → `saved_shopping_list` or dashboard saved offers (FINAL-7)
- **Ruta inteligente / Smart route** → maps route planner integration
- **Cupones guardados / Saved coupons** → coupon wallet persistence table

## Product grid behavior

- Responsive `grid-cols-1 sm:2 lg:3 xl:4`
- Shows crop image only when `sourceCropUrl` is valid
- Clean "Sin imagen / No image" state without fake thumbnails
- No fake savings percentages or original prices

## Contact/social/review behavior

- Full social set via existing helpers
- Google/Yelp as direct link pills only — no star ratings
- Email mailto + copy when valid
- Empty fields hidden

## Mobile behavior

- Single-column stack: notice → title → hero → offer hub → action cards → products → owner controls
- 44px min tap targets on CTAs
- No horizontal overflow

## Deferred items

- Public results/detail page parity (locked routes)
- Live shopping list / route / coupon wallet
- Map thumbnail preview
- Open/closed hours badge (no real hours data)
- Google/Yelp rating widgets
- Featured placement active badge

## TRUE/FALSE/PARTIAL audit table

| Check | Result |
|-------|--------|
| Preview no longer uses skinny max-w-lg layout | TRUE |
| Desktop layout has flyer/coupon hero | TRUE |
| Desktop layout has business/offer hub | TRUE |
| Desktop layout has right-side action cards | TRUE |
| Mobile layout stacks cleanly | TRUE |
| Approved products render in responsive grid | TRUE |
| Product cards show real crop image only if available | TRUE |
| Product cards avoid fake image | TRUE |
| Business name renders | TRUE |
| Offer title renders | TRUE |
| Valid dates render | TRUE |
| Location renders if present | TRUE |
| Phone CTA renders only if present | TRUE |
| WhatsApp CTA renders only if present | TRUE |
| Website CTA renders only if present | TRUE |
| Email CTA renders only if present | TRUE |
| Directions CTA renders only if location exists | TRUE |
| Social links render only if present | TRUE |
| Google/Yelp ratings are not faked | TRUE |
| Trust cue says Published on Leonix / Publicado en Leonix | TRUE |
| No fake verified badge added | TRUE |
| No fake save/list live action added | TRUE |
| Shopping list placeholder is disabled/documented | TRUE |
| Route planner placeholder is disabled/documented | TRUE |
| Coupon wallet placeholder is disabled/documented | TRUE |
| Owner preview controls preserved | TRUE |
| Submit gating preserved | TRUE |
| Step 5 untouched | TRUE |
| Step 7 untouched | TRUE |
| Scan/crop engine untouched | TRUE |
| Stripe untouched | TRUE |
| Analytics untouched | TRUE |
| Admin/dashboard untouched | TRUE |
| Other categories untouched | TRUE |
| No Supabase migration added | TRUE |

---

# Ofertas Preview V2.3 — Premium Header + Clickable Flyer + Business Hub Compact Lockup

**Task classification:** SCOPED GATED BUILD — Ofertas Preview V2.3 Premium Preview UX Lockup
**Date:** 2026-07-08
**Card mode:** BUSINESS HUB-LITE / OFFER CONNECTION HUB

## Project intent

Make the owner preview at `/publicar/ofertas-locales/preview?lang=es` feel premium, trusted, and contact-ready without changing DB/Stripe/admin/dashboard/analytics or any generation logic. Preview UX polish only.

## Files inspected

- `OfertasLocalesPreviewCard.tsx`, `OfertasLocalesPreviewClient.tsx`, `OfertasLocalesPreviewHeroVisual.tsx`, `OfertasLocalesFlyerViewerModal.tsx`, `OfertasLocalesPreviewProductGrid.tsx`, `OfertasLocalesProductDetailDrawer.tsx`, `OfertasLocalesPdfFlyerPreview.tsx`, `ofertasLocalesPreviewCopy.ts`, `ofertasLocalesPreviewHelpers.ts`
- `OFERTAS_PREVIEW_OFFER_HUB_POLISH_AUDIT.md`, `scripts/verify-ofertas-preview-offer-hub-polish.mjs`

## Files changed

- `OfertasLocalesPreviewCard.tsx` — premium header, quick actions, membership compacting, flyer gap, Business Hub compact lockup
- `OfertasLocalesPreviewHeroVisual.tsx` — reduced oversized empty-state padding (flyer stays large/centered)
- `OfertasLocalesFlyerViewerModal.tsx` — lane-aware viewer title + honest helper line
- `OfertasLocalesProductDetailDrawer.tsx` — premium cream/gold crop-proof badge (added to scope for Gate 6, confirmed with PM)
- `ofertasLocalesPreviewProductGrid.tsx` — (unchanged render logic; drawer wiring preserved)
- `ofertasLocalesPreviewCopy.ts` — new ES/EN keys (viewer titles/helpers, short membership CTAs, quick-actions label)
- `OFERTAS_PREVIEW_OFFER_HUB_POLISH_AUDIT.md`, `scripts/verify-ofertas-preview-offer-hub-polish.mjs`

## PM diagnosis (screenshot issues addressed)

- **Header/logo:** monogram/logo was 48–56px; now framed 64/80/96px (mobile→desktop) in a gold-bordered ivory block.
- **Title/pills:** business name is now a premium serif anchor (`text-2xl → lg:text-[2.15rem]`); badges unified into gold/cream/burgundy pill discipline (`PILL_PRIMARY/PILL_MUTED/PILL_TRUST`); category/market rendered as pills instead of scattered text.
- **Membership CTA:** kept as a slim ivory/gold mini-row (only with real URL); labels shortened to "Registrarse/Sign up" and "Activar/Activate".
- **Flyer connection:** header→flyer gap reduced (`mt-3/4` → `mt-2/3`); hero empty-state padding trimmed; lane label already coupon/flyer-aware.
- **Clickable viewer:** modal is lane-aware ("Visor del volante" / "Visor del cupón") with an honest helper ("Desliza para ver el volante completo."). No zoom/page-nav/clickable-region features were invented — those do not exist in the current page-1 render and would be new features, not polish.
- **Product drawer:** crop-proof caption ("Vista generada desde el volante") restyled to a premium cream/gold pill; CTA grouping + truthful CTAs preserved.
- **Business Hub spacing:** section padding/top-margin and desktop grid gaps tightened; header divider added; every real item preserved.
- **Leonix brand system:** cream/ivory surfaces, burgundy primary, gold/bronze borders/chips, charcoal text, green only for trust/contact, WhatsApp green only, platform colors only for social icons.

## Header result

- **Desktop:** framed 96px identity block, serif name up to ~2.15rem, gold/cream pill row, compact validity+location line, quick-action row.
- **Mobile:** 64px identity block, wrapped pills, quick actions wrap to two rows if needed, 44px tap targets.
- **Quick CTAs (real-only):** Call (burgundy), WhatsApp (WhatsApp green), Directions (outline+gold pin), Website (outline), Share (outline). Business Hub still holds the full contact center.
- **Trust cue:** "Publicado en Leonix / Published on Leonix" retained, subtle green dot + charcoal-green text.

## Flyer / viewer result

- Flyer/coupon hero remains the star, large + centered, connected tightly under the header.
- Viewer modal: cream/ivory panel, gold eyebrow, lane-aware title, honest helper, compact close/download/open-in-tab controls, Escape + backdrop close, body scroll lock, mobile full-screen, no horizontal overflow.
- Highlight/zoom/page controls: **not present in the product and intentionally not faked** (page-1 render only). Viewer open behavior preserved.

## Product drawer result

- Source crop/proof preserved (sourceCropUrl → instant CSS crop → PDF bbox crop → honest fallback); proof caption now premium cream/gold.
- Product info: serif title, cream category chip, burgundy price, unit/brand/regular price/dates preserved.
- CTA grouping: primary Ver volante/cupón, secondary Compartir producto, Directions/Website (real-only), Ver más ofertas. No fake save/cart/wallet/claim/redeem.
- Mobile: right/bottom sheet, scrolls cleanly, safe-area bottom padding.

## Business Hub result

- Contact (Call/WhatsApp/Website + email + copy), Location (mini map + directions), Follow/Reviews/More info groups all preserved.
- White space reduced: section `lg:p-6→lg:p-5`, `lg:mt-8→lg:mt-6`, grid `lg:gap-6→lg:gap-x-5 lg:gap-y-4`, header divider.
- Social icons keep real platform colors; Google/Yelp only when real URLs; no fake ratings.
- Mobile: collapsible `<details>` groups, 44px targets, no horizontal overflow.

## Brand system result

- cream/ivory → page/card surfaces; burgundy → primary actions; gold/bronze → borders/chips/premium accents; charcoal → text/headings; green → trust/contact only; WhatsApp green → WhatsApp only; platform colors → social icons only. Serif headings, sans labels/buttons/body.

## Mobile / PWA

- No horizontal overflow; sticky mobile action bar preserved (safe-area aware); modal/drawer scroll cleanly; tap targets ≥44px.

## Intentionally NOT touched

- DB/schema/migrations, Stripe/payment, auth, admin, dashboard, analytics.
- AI scan/extraction, product crop generation, Supabase APIs, file upload/storage.
- Public Cupones V1/V1.1 drawer behavior, coupon publish path.
- Other categories; global header/footer; `OfertasLocalesMiniMapPreview`, `OfertasLocalesPdfFlyerPreview`, `ofertasLocalesPreviewHelpers.ts` render logic.
- No new viewer zoom/page-nav/clickable-region features (would be new features, not polish).

## TRUE/FALSE audit (V2.3)

| # | Check | Result |
|---|-------|--------|
| 1 | Header logo/monogram enlarged and premium | TRUE |
| 2 | Business/title hierarchy improved | TRUE |
| 3 | Pills/badges organized and premium | TRUE |
| 4 | Quick CTAs show only real data | TRUE |
| 5 | Membership/digital coupon row compacted | TRUE |
| 6 | Membership/digital coupon hidden without real URL | TRUE |
| 7 | Flyer/coupon visual starts closer to header | TRUE |
| 8 | Flyer/coupon section is lane-aware | TRUE |
| 9 | Viewer button still works | TRUE |
| 10 | Clickable flyer/source viewer polished | TRUE |
| 11 | Highlighted regions remain clickable | N/A (no regions exist; none faked) |
| 12 | Product detail drawer polished | TRUE |
| 13 | Source crop proof preserved | TRUE |
| 14 | Product drawer CTAs are truthful | TRUE |
| 15 | Business Hub content preserved | TRUE |
| 16 | Business Hub white space reduced | TRUE |
| 17 | Social icons remain colored/recognizable | TRUE |
| 18 | Empty contact/social/review items hidden | TRUE |
| 19 | No fake save/cart/wallet/claim/redeem | TRUE |
| 20 | No fake analytics added | TRUE |
| 21 | Leonix brand system applied locally | TRUE |
| 22 | Mobile no horizontal overflow | TRUE |
| 23 | No DB/schema/Stripe/auth/admin/dashboard touched | TRUE |
| 24 | No unrelated categories touched | TRUE |
| 25 | Verifier passed | TRUE |
| 26 | Build passed | TRUE |
| 27 | READY TO COMMIT THIS BUILD ONLY | YES |
| 28 | READY TO PUSH THIS BUILD ONLY | YES |
| 29 | UNRELATED DIRTY FILES PRESENT | YES (pre-existing, unrelated to this build) |
