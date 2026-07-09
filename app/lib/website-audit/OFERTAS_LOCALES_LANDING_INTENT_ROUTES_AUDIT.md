# Ofertas Locales Landing Intent Routes V1 Audit

**Task classification:** SCOPED GATED BUILD  
**Phase:** Ofertas Landing Intent Routes V1 — Surgical Routing + Copy Lock, Same Leonix Shell  
**Date:** 2026-07-09  
**Status:** COMPLETE

---

## 1. Objective

Make the Ofertas Locales landing page route shoppers by intent while preserving the exact current Leonix landing shell. No redesign, no new layout, no magazine-holder pipeline.

---

## 2. Files inspected

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_LOCALES_LANDING_PARTNERS_SPONSOR_STANDARD_V1.md` (reference)

---

## 3. Files changed

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_LOCALES_LANDING_INTENT_ROUTES_AUDIT.md` (this file)

---

## 4. What was locked (unchanged)

- Page width, background/grid, hero/search shell
- Card shell, discovery card styling, spacing, fonts, colors, button style
- Floating cart style and behavior
- Leonix standard category shell (`LeonixCategoryPageShell`, `LeonixCategoryHeroGateway`, etc.)
- Sponsor/visibility card shell (component structure only)
- Mobile layout shell
- Results layout and empty states
- Global `categoryStandardV2` components
- Cupones surface copy and behavior

---

## 5. Discovery card route mapping

| Card | ES label | Route intent |
|------|----------|--------------|
| weekly-flyer | Volante semanal | `offerType=weekly_flyer&mode=flyers` |
| coupon | Cupón | `offerType=coupon&mode=coupons` |
| promotion | Promoción | `offerType=promotion&mode=promos` |
| local-store | Tienda local | `marketType=retail&mode=stores` |
| local-service | Servicio local | `marketType=service&mode=services` |
| food | Comida | `category=food&mode=food` |

All routes use existing `/clasificados/ofertas-locales/results?lang=…` path. `mode` is a harmless future-facing query param; filters still use `offerType`, `marketType`, and `category`. `mode` is preserved when applying filters via `pushSearch`.

---

## 6. Copy changes (Ofertas only)

### ES
- `sponsorEyebrow`: PRINT · DIGITAL · OFERTAS
- `sponsorTitle`: Destacados en Leonix
- `sponsorBody`: Volantes, cupones y especiales… presencia destacada en Leonix
- `sponsorSupport`: …más visibilidad local
- `sponsorChips`: Volantes, Cupones, Especiales semanales, Productos destacados, Lista de compras, Visibilidad local

### EN
- `sponsorEyebrow`: PRINT · DIGITAL · DEALS
- `sponsorTitle`: Featured on Leonix
- `sponsorBody`: Flyers, coupons, and specials… featured visibility on Leonix
- `sponsorSupport`: …stronger local visibility
- `sponsorChips`: Flyers, Coupons, Weekly specials, Featured products, Shopping list, Local visibility

Removed magazine-holder / “Patrocinadores de Leonix” / print-digital magazine pipeline wording from Ofertas sponsor copy. Cupones copy unchanged.

---

## 7. Intentionally deferred

- Results UI modes (flyer card mode, item mode, coupon mode)
- Magazine-holder pipeline
- Partner database / fake sponsor flags
- Fake flyer or product data
- Preview page, publish flow, admin, Stripe, Supabase schema
- Global shell changes
- Visibility strip hardcoded copy (unchanged this gate)

---

## 8. TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Landing shell preserved | TRUE |
| Hero/search shell preserved | TRUE |
| Discovery card UI preserved | TRUE |
| Partner/visibility section shell preserved | TRUE |
| Floating cart preserved | TRUE |
| No global shell touched | TRUE |
| Discovery cards route to intent params | TRUE |
| ES copy updated honestly | TRUE |
| EN copy updated honestly | TRUE |
| No magazine-holder pipeline created | TRUE |
| No fake partner/sponsor claim | TRUE |
| No fake flyer/product data | TRUE |
| Results page still loads | TRUE |
| Cupones regression preserved | TRUE |
| No preview page touched | TRUE |
| No admin/dashboard/auth touched | TRUE |
| No Stripe/payment touched | TRUE |
| No Supabase schema touched | TRUE |
| No other categories touched | TRUE |
| Build passed | TRUE |

---

## 9. QA URLs

- https://leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es
- https://leonixmedia.com/clasificados/ofertas-locales?lang=en
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=en
- https://leonixmedia.com/cupones?lang=es
- https://leonixmedia.com/cupones/resultados?lang=es
