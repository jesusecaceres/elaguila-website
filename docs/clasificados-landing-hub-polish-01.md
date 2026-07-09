# Clasificados Landing Hub Polish

Gate: **CLASIFICADOS-LANDING-HUB-POLISH-01**

## Purpose

Polish the main Clasificados landing page into a stronger **discovery + publishing hub** — without touching checkout, Stripe, promo logic, publish forms, admin, or results/detail pages.

**URL:** `/clasificados?lang=es` (also `/clasificados?lang=en`)

## What changed

### Launch 25 banner

- One `LeonixLaunchCouponCard` below hero CTAs and above the featured Ofertas module
- CTA opens newsletter in a **new tab**: `/newsletter?lang=…&source=clasificados_landing_launch_25&return=clasificados`
- Cautious copy: eligible website checkout products only; no free posts, print/combo/manual, no placement/ranking/verification guarantee

### Featured Ofertas Locales module

- Horizontal featured card: **Ofertas Locales de la Semana**
- Chips: Cupones, Promos, Descuentos, Negocios locales
- CTAs preserved:
  - **Ver ofertas** → `/clasificados/ofertas-locales`
  - **Publica tus ofertas locales** → `/publicar/ofertas-locales`
- Ofertas no longer duplicated as a small grid card (featured module is the primary Ofertas entry)

### Category card polish

- Local `ClasificadosHubCategoryCard` — premium cream/gold surface, equal-height flex layout
- Every category keeps **both** CTAs:
  - **Explorar** (browse)
  - **Publicar en [category]** (publish entry)
- Category order unchanged (C1.1 hub order + Dealers de Autos)
- No per-card Launch 25 copy; no checkpoint pricing on directory cards

## Landing vs checkpoint pages

| Surface | User intent | CTAs |
|---------|-------------|------|
| **Clasificados landing** (`/clasificados`) | Browse categories | Explorar + Publicar en [category] |
| **Paid publish checkpoint** (`/clasificados/publicar/…`) | Start publishing after category choice | Publish-only cards + Ver más |

## Routes preserved

- Hero: Publicar anuncio, Explorar categorías (anchor to `#categorias`)
- All category browse/publish hrefs unchanged
- Ofertas browse/publish routes unchanged
- Dealers de Autos card preserved at end of grid

## Intentionally not touched

- Stripe checkout / webhooks
- Promo validation / redemption
- Servicios promo-code fix
- Supabase schema
- Newsletter subscribe backend/API
- Category publish application forms
- Paid publish checkpoint pages (design reference only)
- Admin / dashboard
- Public results / detail pages
- Global nav / site tokens

## QA URLs

- https://www.leonixmedia.com/clasificados?lang=es
- https://www.leonixmedia.com/clasificados?lang=en

Visual checks: hero, Launch 25 banner (new tab), featured Ofertas, aligned category cards, both CTAs per card, mobile layout.

## Money-path QA

**PENDING** — no checkout testing in this gate.

## Verification

```bash
npm run verify:clasificados-landing-hub
```
