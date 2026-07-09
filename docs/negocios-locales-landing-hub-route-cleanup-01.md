# Negocios Locales Landing Hub Polish + Route Cleanup

Gate: **NEGOCIOS-LOCALES-LANDING-HUB-ROUTE-CLEANUP-01**

## Purpose

Polish `/negocios-locales` to match the Clasificados landing hub quality and fix key business pipeline front-door routes (Restaurantes, Dealers de Autos).

**URL:** `/negocios-locales?lang=es`

## What changed

### Visual polish (Clasificados-style)

- Reuses `ClasificadosHubCategoryCard` via local `NegociosLocalesBusinessCard` wrapper
- Equal-height sector cards, cream/gold/burgundy styling, 3-column desktop grid
- Both CTAs on every sector card: **Explorar** + **Anunciar/Publicar**

### Launch 25 banner

- Below hero CTAs, above featured Ofertas module
- Opens newsletter in new tab: `source=negocios_locales_launch_25&return=negocios-locales`
- Cautious eligible-website-only copy (no free/print/placement promises)

### Featured Ofertas Locales (business module)

- Title: **Promociona tus Ofertas Locales**
- CTAs: **Ver ofertas** → `/clasificados/ofertas-locales`, **Publicar ofertas locales** → `/publicar/ofertas-locales`
- Ofertas removed from sector grid (featured once at top, like Clasificados)

### Route cleanup (checkpoint-first — follow-up gate)

| Sector | Hub CTA | Checkpoint | Application |
|--------|---------|------------|-------------|
| Restaurantes | `/clasificados/publicar/restaurantes` | checkpoint cards | `/publicar/restaurantes` |
| Dealers de Autos | `/clasificados/publicar/autos` | privado + dealer split | `/publicar/autos/negocios` |

See `docs/checkpoint-first-route-restoration-autos-crash-01.md` for the restored front-door chain.

### Clasificados Restaurantes path (reference)

- Clasificados landing publish CTA: `/publicar/restaurantes` (already correct)
- Optional checkpoint `/clasificados/publicar/restaurantes` forwards to `/publicar/restaurantes` with product params — intentional, unchanged

### Label cleanup

- Visible card label: **Dealers de Autos** (was "Concesionarios de Autos")
- Publish CTA: **Publicar en Dealers de Autos**

## Landing vs checkpoint

| Surface | Audience | CTAs |
|---------|----------|------|
| Negocios Locales | Business owners + browsers | Explorar + Anunciar |
| Publish checkpoints | Category chosen | Publish-only cards |

## Intentionally not touched

- Stripe / checkout / promo validation / redemption
- Supabase schema
- Newsletter backend
- Restaurant/autos form internals
- Admin / dashboard
- Results / detail pages
- Servicios promo fix

## QA URLs

- https://www.leonixmedia.com/negocios-locales?lang=es
- https://www.leonixmedia.com/negocios-locales?lang=en
- https://www.leonixmedia.com/clasificados?lang=es
- https://www.leonixmedia.com/publicar/restaurantes?lang=es
- https://www.leonixmedia.com/publicar/autos/negocios?lang=es

Route QA: Restaurantes → `/publicar/restaurantes`; Dealers de Autos → `/publicar/autos/negocios` (not privado).

## Money-path QA

**PENDING**

## Verification

```bash
npm run verify:negocios-locales-landing-hub
```
