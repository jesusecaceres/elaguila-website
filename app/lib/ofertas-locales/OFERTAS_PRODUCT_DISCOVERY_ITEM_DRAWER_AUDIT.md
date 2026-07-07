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
