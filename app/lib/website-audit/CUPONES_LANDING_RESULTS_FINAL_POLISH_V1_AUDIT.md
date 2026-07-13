# Cupones Landing and Results Final Polish V1 — Audit

## 1. Task classification

SCOPED GATED BUILD — Cupones public discovery lane polish without Ofertas product-cart contamination.

## 2. Gate title

Cupones Landing and Results Final Polish V1 — Coupon Discovery, Results Cards, Detail Drawer, No Ofertas Cart, No Stripe

## 3. Branch and HEAD

- Branch: `main`
- HEAD: `45b84d26e1674fa4d3d56608ea74ccd7e22d227d`

## 4. Initial dirty state

At gate start: no staged files. Unrelated dirty files in `app/(site)/servicios/` and `package.json` (servicios repair). Ofertas hub build was committed; Ofertas tree was clean before Cupones edits.

## 5. Files inspected

- `app/(site)/cupones/page.tsx`
- `app/(site)/cupones/resultados/page.tsx`
- `app/(site)/cupones/CuponesPageClient.tsx` (legacy, unused)
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/api/ofertas-locales/public-offers/route.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`

## 6. Files changed

- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/CUPONES_LANDING_RESULTS_FINAL_POLISH_V1_AUDIT.md` (this file)

## 7. Cupones architecture map

| Area | Behavior |
|------|----------|
| Landing | `/cupones` → `OfertasLocalesPublicSearchClient` with `mode="landing"` `surface="cupones"` |
| Results | `/cupones/resultados` → same client with `mode="results"` |
| Data | `/api/ofertas-locales/public-offers` — approved parent offers only; client filters to coupon offer types |
| Products | Cleared on Cupones (`items` not shown; no product grid) |
| Cards | `OfertasLocalesPublicOfferCard` with `surface="cupones"` + `onSelect` opens drawer |
| Drawer | `OfertasLocalesPublicOfferDetailDrawer` with `surface="cupones"` |
| Cart | `floatingShoppingListCart = !isCupones`; item drawer and list panel gated with `!isCupones` |
| ES/EN | `lang` query + `ofertasLocalesPublicSearchCopy(lang, "cupones")` / `CUPONES_COPY` overrides |
| Approval | Server route `.eq("status", "approved")`; no client-only privacy bypass |

## 8. Landing behavior

- Leonix category shell with Cupones hero copy (`CUPONES_COPY`)
- Search/filter shell routes to `/cupones/resultados`
- Discovery quick paths: coupon, promotion, bundle, seasonal (`offerType` query)
- Ofertas-only visibility strip hidden on Cupones landing
- No fake counts, featured coupons, or shopping-list CTAs

## 9. Results behavior

- Results intro block (`cupones-results-intro`) with ES/EN copy
- Offer grid 1–3 columns responsive
- Honest empty states when no approved coupons match filters
- Filters: q, city, state, zip, country, category, marketType, offerType, sort (price_low stripped on Cupones)

## 10. Card design contract

Shows when available: image, business initial, business name, title, offer type badge, category, city/location, valid dates, CTA (Ver cupón / Ver promoción).

Hidden when missing: location, dates, image (honest `couponImageUnavailable` placeholder).

No add-to-list, cart, checkout, wallet, or fake discount fields (card type has no discount field in public API).

## 11. Detail drawer behavior

- Opens from Cupones card tap
- Business identity, title, type badge, image or honest unavailable placeholder
- Valid dates, location/address when present
- Call / website / directions when hrefs exist
- Share coupon (native share or clipboard)
- View original coupon link when asset href exists
- No product list actions, checkout, wallet, barcode, or fake redemption

Note: drawer uses `OfertaLocalPublicOfferCard` fields only; extended description/terms require detail API (not in scope).

## 12. Approval/public safety

Preserved existing server gates on `public-offers` route. No schema/RLS changes. No fake records inserted.

## 13. Cupones/Ofertas separation

| Check | Implementation |
|-------|----------------|
| Floating cart | `!isCupones` before render |
| Shopping list panel | `!isCupones && listOpen` |
| Item detail drawer | `!isCupones && selectedItem` |
| Offer cards on Cupones | button + drawer, not product cards |
| Ofertas product modes | unchanged branches when `surface !== "cupones"` |

## 14. Empty states

ES/EN Cupones-specific `approvedEmptyTitle`, `approvedEmptyBody`, `approvedEmptyHint` in `CUPONES_COPY`.

## 15. ES/EN behavior

`lang` query param; separate ES/EN blocks in `CUPONES_COPY` and `ofertasLocalesCuponesResultsIntroCopy`.

## 16. Mobile/desktop review (code review)

- Drawer: bottom sheet on mobile, centered modal on sm+
- Cards: full-width mobile, 2–3 col grid on larger breakpoints
- `min-h-11` touch targets on drawer actions
- `break-words` / `truncate` on long titles
- Body scroll lock on drawer open
- Escape closes drawer

## 17. Regression findings

No edits to Ofertas landing, results product modes, public flyer hub, item drawer, or shopping list helpers. Shared components branch on explicit `surface="cupones"` / `isCupones`.

## 18. Intentionally untouched areas

Ofertas landing/results/hub, Lista de compras core, admin approval, publish flow, Stripe, DB/schema/RLS, auth, dashboard, global nav, other classified categories, `CuponesPageClient.tsx` legacy CMS page.

## 19. TRUE/FALSE audit

| Row | Result |
|-----|--------|
| Cupones landing polished | TRUE |
| Cupones results polished | TRUE |
| Coupon card template polished | TRUE |
| Promotion card template polished | TRUE |
| Coupon detail drawer polished | TRUE |
| Real coupon data only | TRUE |
| Real promotion data only | TRUE |
| Missing image fallback honest | TRUE |
| Missing logo fallback honest | TRUE |
| Valid dates shown only when real | TRUE |
| Discount shown only when real | TRUE (no discount field on public card type) |
| Terms shown only when real | TRUE (terms not on card type; not fabricated) |
| Parent approval gate preserved | TRUE |
| Pending data remains private | TRUE |
| Rejected data remains private | TRUE |
| No fake coupons created | TRUE |
| No fake promotions created | TRUE |
| No fake counts created | TRUE |
| No fake savings claims created | TRUE |
| Cupones product cart hidden | TRUE |
| Cupones shopping-list panel hidden | TRUE |
| Cupones add-to-list actions absent | TRUE |
| Ofertas product cart preserved | TRUE |
| Ofertas add/remove behavior preserved | TRUE |
| ES/EN preserved | TRUE |
| Mobile safe by code review | TRUE |
| Ofertas landing untouched | TRUE |
| Ofertas results untouched | TRUE |
| Public flyer hub untouched | TRUE |
| Admin approval pipeline untouched | TRUE |
| Publish flow untouched | TRUE |
| No Stripe/payment touched | TRUE |
| No DB/schema/migration/RLS touched | TRUE |
| No auth/dashboard/admin touched | TRUE |
| No other categories touched | TRUE |
| No staged files | TRUE |
| Audit script passed | TRUE (see checks run) |
| Build passed | TRUE (see checks run) |

## 20. Manual QA plan

1. Open `/cupones?lang=es` — hero, search, quick paths, no floating cart
2. Open `/cupones/resultados?lang=es` — grid, filters, empty state if no data
3. Tap coupon card — drawer opens with real fields only
4. Repeat `/cupones?lang=en` and `/cupones/resultados?lang=en`
5. Regression: `/clasificados/ofertas-locales/results?lang=es&q=tomate&mode=products` — cart visible, add/remove works
6. Regression: Ofertas coupon/promo modes still link to detail hub

**Limitation:** Production manual QA requires real approved coupon/promotion records in Supabase.

## 21. Next recommended gate

**Cupones Real Data QA Required** — validate against live approved coupon records once businesses publish.
