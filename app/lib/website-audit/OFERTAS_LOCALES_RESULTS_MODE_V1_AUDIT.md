# Ofertas Locales Results Mode V1 Audit

**Task classification:** SCOPED GATED BUILD  
**Phase:** Ofertas Results Mode V1 — Make Landing Intent Routes Control Results Experience  
**Date:** 2026-07-10  
**Status:** COMPLETE

---

## 1. Objective

Make the Ofertas Locales results page respond clearly to landing-page intent routes via the `mode` query param, without redesigning the landing page or creating fake data.

---

## 2. Files inspected

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_LOCALES_LANDING_INTENT_ROUTES_AUDIT.md`

---

## 3. Files changed

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_LOCALES_RESULTS_MODE_V1_AUDIT.md` (this file)

---

## 4. What was locked (unchanged)

- Landing page UI shell (hero, discovery grid, sponsor, visibility strip, floating cart styling)
- Global `categoryStandardV2` components
- Results shell layout (toolbar, filters, empty-state component shell)
- Product/offer card components
- Shopping list panel and floating cart behavior
- API calls and filter params
- Cupones surface behavior

---

## 5. Result mode parser

`parseOfertasLocalesResultMode(raw)` in `ofertasLocalesPublicSearchCopy.ts`:

| Input | Output |
|-------|--------|
| `flyers`, `coupons`, `promos`, `stores`, `services`, `food`, `products` | Same mode |
| missing, empty, unknown | `all` |

Display mode: when `q` is set and parsed mode is `all`, intro copy uses `products`.

---

## 6. Result mode copy map

Each mode provides: `title`, `helper`, `pill`, `emptyTitle`, `emptyHint`. Products mode also includes `listNote` for shopping-list emphasis.

ES examples:
- flyers → "Volantes semanales"
- products → "Buscar por producto"
- all → "Todas las ofertas locales"

EN equivalents included for all modes.

---

## 7. Result ordering rules

| Condition | Section order |
|-----------|---------------|
| `mode=products` OR `q` present | Items first, then offers |
| flyers, coupons, promos, stores, services, food, all | Offers first, then items |

No API changes. No fake fallback results.

---

## 8. Results intro block

Compact cream/gold strip at top of results content (`data-testid="ofertas-results-mode-intro"`):
- Mode pill label
- Optional search-term pill when `q` is set
- Mode title and helper
- Shopping-list note when product-first mode

Landing page unchanged.

---

## 9. Intentionally deferred

- Featured flyer carousel
- Partner highlight program
- Flipp-style full flyer grid
- Item detail popup from flyer canvas
- Shopping list advanced grouping
- Google Maps multi-stop planning
- Magazine-holder badge pipeline
- Fake featured partners / fake flyer or product data
- New results UI architecture or backend changes

---

## 10. TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Landing UI shell untouched | TRUE |
| Results shell preserved | TRUE |
| Mode parser added safely | TRUE |
| Invalid mode falls back to all | TRUE |
| ES/EN mode copy present | TRUE |
| Results intro explains current mode | TRUE |
| Product/search mode prioritizes items | TRUE |
| Flyer/store/promo modes prioritize offers | TRUE |
| No fake flyer/product data | TRUE |
| Floating cart preserved | TRUE |
| Cupones shopping list hidden | TRUE |
| No global shell touched | TRUE |
| No preview/publish flow touched | TRUE |
| No admin/dashboard/auth/Stripe/Supabase touched | TRUE |
| No other categories touched | TRUE |
| Build passed | TRUE |

---

## 11. QA URLs

- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&offerType=weekly_flyer&mode=flyers
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&offerType=coupon&mode=coupons
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&offerType=promotion&mode=promos
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&marketType=retail&mode=stores
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&marketType=service&mode=services
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&category=food&mode=food
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&q=tomate&mode=products
- https://leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://leonixmedia.com/cupones?lang=es
- https://leonixmedia.com/cupones/resultados?lang=es
