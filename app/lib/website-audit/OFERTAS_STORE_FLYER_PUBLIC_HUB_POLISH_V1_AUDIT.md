# Ofertas Store/Flyer Public Hub Polish V1 Audit

## 1. Task classification

**SCOPED GATED BUILD** — Public flyer/store detail hub at `/clasificados/ofertas-locales/[id]`

## 2. Gate title

Ofertas Store/Flyer Public Hub Polish V1 — Public Flyer Page, Product Grid, Contact Hub, No Stripe

## 3. Branch and HEAD

- Branch: `main`
- HEAD: recorded at Gate 13 run

## 4. Initial dirty state

Unrelated dirty files (servicios/dashboard/revenue) present; no Ofertas files dirty before this gate.

## 5. Files inspected

All target files from task brief plus `OfertasLocalesBusinessHubLiteCard.tsx`, scan review runtime (read-only), preview flyer viewer audit (read-only).

## 6. Files changed

- `app/(site)/clasificados/ofertas-locales/[id]/page.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicDetailCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `OFERTAS_STORE_FLYER_PUBLIC_HUB_POLISH_V1_AUDIT.md`

## 7. Current detail-page architecture

| Layer | Behavior |
|-------|----------|
| Route | `[id]/page.tsx` receives id + lang |
| Offer fetch | `fetchPublicOfertaLocalDetailById` — approved + eligible only |
| Items fetch | `fetchPublicOfertaLocalItemsForOfferId` — approved + active + parent approved |
| View | Client `OfertasLocalesPublicDetailView` with flyer viewer, contact hub, product grid |
| Drawer | `OfertasLocalesPublicItemDetailDrawer` |
| List | `useOfertasLocalesShoppingList` + floating cart + panel |

## 8. Approval/public-data rules

- Parent: `isOfertaLocalPublicOfferRowEligible` (status=approved, not expired)
- Items: server query filters + `isOfertaLocalPublicSearchRowEligible`
- No pending/rejected leakage
- No admin notes rendered

## 9–11. Design contracts

**Header:** Logo or initial, business name, title, offer type, valid dates, location, public-approved badge.

**Flyer viewer:** Real assets only; image inline with controlled max-height; PDF opens in new tab; multi-asset prev/next when multiple hrefs exist.

**Products:** Reuses `OfertasLocalesPublicItemCard`; honest empty state ES/EN.

**Contact:** Compact card — call, SMS, WhatsApp, website, directions, share; social when present; hidden when missing.

## 12. Flyer viewer sizing

| Viewport | Rule |
|----------|------|
| Desktop | max-height ~380px, object-contain, cream frame |
| Mobile | max-height min(52vh, 420px), full width, no overflow |
| Missing | Honest placeholder copy |
| PDF | Open PDF CTA — no fake inline render in this gate |

## 13. Multi-page behavior

When `flyerAssets` + `couponAssets` yield multiple hrefs: prev/next + page count. Single asset: no fake pagination.

## 14–15. Clickable-coordinate findings

**Real fields:** `source_bbox` (xMin/yMin/xMax/yMax) on DB items; exposed as `sourceBbox` on `OfertaLocalPublicDetailHubItem` for detail page only.

**CLICKABLE FLYER OVERLAY BUILT FROM REAL COORDINATE DATA: YES (partial)**

- Image flyers only (not PDF)
- Items with valid `sourceBbox` matching current page
- Uses `mapOfertaLocalSourceBboxToDisplayRect`
- Opens same product detail drawer as grid
- No fabricated coordinates

**Limitation:** Object-contain letterboxing may affect overlay precision on some aspect ratios — future gate may refine scaling.

## 16–19. Product / list / contact behavior

- Grid: approved products only
- Drawer: preserved add/remove/open list
- Cart badge + panel on detail page
- Contact: tel, sms, WhatsApp, website, directions, share — real fields only

## 20. Empty states

- Flyer unavailable: ES/EN honest copy
- No products: ES/EN approved-product messaging
- Offer unavailable: existing unavailable view

## 21. Mobile/desktop review

Responsive grid, touch-safe CTAs (min-h-11), overflow-x-hidden, ES/EN copy.

## 22. Cupones regression

Cupones not edited; product cart remains gated off Cupones surface in search client.

## 23. Intentionally not touched

Landing, results cards, admin approval, Stripe, DB/RLS, auth, Cupones redesign, other categories.

## 24. TRUE/FALSE audit

See Gate 12 rows — all TRUE unless Gate 13 build fails.

## 25. Manual QA checklist

1. Open `https://leonixmedia.com/clasificados/ofertas-locales/[REAL_APPROVED_ID]?lang=es`
2. Confirm business header, dates, flyer viewer
3. Confirm product grid or honest empty
4. Open drawer, add to list, confirm badge
5. Test contact CTAs when data exists
6. Regression: results, Cupones (no product cart)

**REAL APPROVED OFERTAS ID REQUIRED FOR MANUAL QA** unless available in production admin.

## 26. Next recommended gate

- **Real Ofertas Publish/Admin Approval QA** if no approved data
- **Clickable Flyer Product Overlay V1** for PDF.js inline + precise letterbox scaling
