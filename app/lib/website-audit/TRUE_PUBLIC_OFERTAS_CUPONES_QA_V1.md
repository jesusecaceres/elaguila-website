# TRUE Public Ofertas + Cupones QA V1 — Audit

## Task classification
SCOPED GATED BUILD — TRUE PUBLIC QA / BUGFIX ONLY

## Branch / HEAD
- Branch: `main`
- HEAD: `31b96c044e7b0bb06ca19d9369a0aeec93b80a01`

## Initial dirty state
No Ofertas/Cupones dirty files at gate start. Unrelated dirty files in autos, bienes publish, servicios, package.json. Prior accepted gates appear committed on `main`.

## Files inspected
All target Ofertas/Cupones public routes, search client, cards, drawers, shopping list, public detail page, public API routes, approval helpers, prior gate audit docs.

## Files changed (this gate)
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts` (narrow QA doc + payment-language checks)
- `app/lib/website-audit/TRUE_PUBLIC_OFERTAS_CUPONES_QA_V1.md` (this file)

**No product code bugfixes required.**

## Public flow map

| Step | Route / component |
|------|-------------------|
| Ofertas landing | `/clasificados/ofertas-locales` → `OfertasLocalesPublicSearchClient` landing |
| Ofertas results | `/clasificados/ofertas-locales/results` → same client results + shopper modes |
| Flyer/store cards | `OfertasLocalesPublicOfferCard` → `ofertaLocalPublicDetailPath` → `/clasificados/ofertas-locales/[id]` |
| Public hub | `[id]/page.tsx` → `fetchPublicOfertaLocalDetailById` + items fetch |
| Product drawer | `OfertasLocalesPublicItemDetailDrawer` via item card `onSelect` |
| Lista de compras | `useOfertasLocalesShoppingList` + floating cart + panel (`!isCupones`) |
| Cupones landing | `/cupones` → `surface="cupones"` |
| Cupones results | `/cupones/resultados` → `surface="cupones"` |
| Cupones drawer | `OfertasLocalesPublicOfferDetailDrawer` `surface="cupones"` |

## Data availability finding

| Source | Result |
|--------|--------|
| Supabase `ofertas_locales` by status | **7 `pending_review`, 0 `approved`** |
| Supabase approved active items | **0** |
| Production `public-search?q=tomate` | `{ ok: true, items: [], total: 0 }` |
| Production `public-offers` | Timeout from QA runner (no offers confirmed live) |
| Production browser `/clasificados/ofertas-locales` | Redirected to `/coming-soon-v2` (deployment/routing layer) |

**Real-data QA is blocked:** no approved offers or products exist to exercise cards, hub, drawer, or cart with live records. Empty-state and code-path QA only.

## Ofertas landing QA (code + architecture)
- Shell, discovery grid, Destacados, visibility strip preserved on landing only
- Quick paths use `intentResultsHref` with `lang` + mode/offerType/marketType/category
- Floating cart wired for Ofertas (`!isCupones`)

## Ofertas mode QA (code review)

| Mode | Title copy | Composition filter | Empty state |
|------|------------|-------------------|-------------|
| all | Todas las ofertas | offers + items | pipeline / mode empty |
| flyers | Volantes semanales | weekly_flyer offers only | mode-specific |
| products | Productos encontrados | items only | mode-specific |
| coupons | Cupones | coupon offers only | mode-specific |
| promos | Promociones | promotion offers only | mode-specific |
| stores | Tiendas locales | retail/flyer offers | mode-specific |
| food | Comida y mercados | food category offers | mode-specific |

Results: no discovery grid, no partner section, no extra pill rows (landing sections gated).

## Store/Flyer hub QA (code)
- Detail fetch requires `isOfertaLocalPublicOfferRowEligible` (approved + not expired)
- Items triple-gate: `review_status=approved`, `is_active=true`, parent `status=approved`
- No checkout/payment language in detail view
- Clickable flyer product overlay: **not built** → defer to `Clickable Flyer Product Overlay V1`

## Product drawer / list QA (code)
- Add/remove via `shoppingList.addFromPublicItem` / `removeItem`
- Cart badge from `counts.itemCount`
- Panel opens from cart; copy list helpers preserved
- No checkout/wallet/payment strings in Ofertas public surfaces

## Cupones QA (code)
- Separate routes with `surface="cupones"`
- `floatingShoppingListCart`, item drawer, list panel all gated `!isCupones`
- Cupones cards use button + coupon drawer (no product add-to-list)
- No payment/checkout/wallet/redeem language

## Approval / privacy QA
- API: `public-offers` `.eq("status", "approved")`
- API: `public-search` triple gate on items
- Helpers: `PUBLIC_OFFER_STATUSES = approved` only; pending/rejected excluded
- Detail: null return for ineligible rows → unavailable page
- **Confirmed:** 7 pending records in DB are not public

## Mobile / desktop QA
Code review: safe-top on shell, responsive grids, drawer scroll lock, min-h touch targets, break-words on titles, floating cart bottom-safe positioning.

## Bugs found
**None requiring code fix in this gate.**

## Fixes made
None (audit script + audit doc only).

## Remaining blockers
1. **No approved Ofertas/Cupones data in production DB** — cannot complete end-to-end real-card QA until admin approves at least one offer + items.
2. **Production URL browser QA** redirected to coming-soon during automated check — Chuy may need bypass/Vercel preview with approved data.

## Next recommended gate
**Real Ofertas Publish/Admin Approval QA** — approve at least one weekly flyer + products, then re-run browser QA.

## TRUE/FALSE audit

| Row | Result |
|-----|--------|
| Ofertas landing preserved | TRUE |
| Ofertas quick paths valid | TRUE |
| All-offers mode checked | TRUE (code) |
| Weekly flyer mode checked | TRUE (code) |
| Product mode checked | TRUE (code) |
| Coupon mode checked | TRUE (code) |
| Promotion mode checked | TRUE (code) |
| Store mode checked | TRUE (code) |
| Food mode checked | TRUE (code) |
| Mode-specific empty states honest | TRUE |
| No landing sections in results | TRUE |
| No extra results pills | TRUE |
| Flyer cards preserved | TRUE |
| Product cards preserved | TRUE |
| Coupon/promo cards preserved | TRUE |
| Public flyer hub route confirmed | TRUE |
| Public flyer hub approved-only | TRUE |
| Product drawer opens | TRUE (code path; no live data) |
| Add to list works by code review | TRUE |
| Remove from list works by code review | TRUE |
| Cart badge behavior preserved | TRUE |
| Cupones landing checked | TRUE (code) |
| Cupones results checked | TRUE (code) |
| Cupones drawer checked | TRUE (code) |
| Cupones product cart hidden | TRUE |
| Cupones add-to-list absent | TRUE |
| Pending data private | TRUE (7 pending, 0 public) |
| Rejected data private | TRUE (no public leak path) |
| Unapproved products private | TRUE |
| No fake data created | TRUE |
| No fake counts created | TRUE |
| No fake discounts created | TRUE |
| No checkout/payment/wallet language | TRUE |
| No Stripe/payment touched | TRUE |
| No DB/schema/RLS touched | TRUE |
| No auth/dashboard/admin touched | TRUE |
| No publish flow touched | TRUE |
| No other categories touched | TRUE |
| Mobile safe by code review | TRUE |
| Audit script passed | TRUE |
| Build passed | TRUE |
| Ready for real Chuy browser QA | **FALSE** (no approved data + coming-soon redirect observed) |
| Real-data QA complete | **FALSE** |
