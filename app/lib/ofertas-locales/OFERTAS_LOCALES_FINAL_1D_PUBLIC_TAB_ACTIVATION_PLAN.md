# Stack FINAL-1D — Public Tab Activation Plan

## Files inspected

### En Venta / Varios
- `app/(site)/clasificados/page.tsx` — hub category grid (`C1_CATEGORY_ORDER`, `CategoryCard`)
- `app/(site)/clasificados/lib/hubUrl.ts` — `HUB_CATEGORY_PATH`, `buildHubCategoryPageUrl`
- `app/(site)/clasificados/config/clasificadosHub.ts` — `HubCategoryKey`
- `app/(site)/clasificados/publicar/PublicarPageClient.tsx` — publish category chooser
- `app/components/Navbar.tsx` — `isActive` uses `pathname.startsWith(href/)` → Clasificados active on `/clasificados/ofertas-locales`

### Servicios
- `app/(site)/clasificados/page.tsx` — servicios in hub grid
- `app/(site)/negocios-locales/page.tsx` — business lane cards (explore + advertise)
- `app/(site)/clasificados/publicar/servicios/page.tsx`

### Ofertas Locales (existing)
- `app/(site)/clasificados/ofertas-locales/page.tsx` — public results
- `app/(site)/publicar/ofertas-locales/page.tsx` — publish wizard
- `app/api/ofertas-locales/public-offers/route.ts` — `status=approved` only

## En Venta activation pattern

Hub grid card with browse (`buildHubCategoryPageUrl`) + publish (`CATEGORY_PUBLISH_PATH`) CTAs, bilingual copy, priority border for key categories.

## Servicios activation pattern

Same hub grid + dedicated lane on Negocios Locales + publish chooser tile + `/clasificados/servicios` public landing.

## Activation plan (no HubCategoryKey change)

Avoid `clasificadosHub.ts` / `categoryConfig` changes (DB hub mapping). Instead:

1. **`OfertasLocalesHubCategoryCard`** — first card in `/clasificados` category grid
2. **Promo band** on `/clasificados` — updated copy (shopper + business CTAs)
3. **`negocios-locales`** — new `ofertas-locales` business lane
4. **`PublicarPageClient`** — dedicated publish chooser tile → `/publicar/ofertas-locales`

## Labels

| Context | ES | EN |
|---------|----|----|
| Title | Ofertas Locales | Local Deals |
| Short | Ofertas | Deals |
| Shopper CTA | Ver ofertas | View deals |
| Business CTA | Publica tus ofertas locales | Publish your local deals |

## Routes

- Public: `/clasificados/ofertas-locales?lang=es|en`
- Publish: `/publicar/ofertas-locales?lang=es|en`

## Public safety

- Public APIs filter `approved` only; no `internal_notes` in public-offers response
- Item search: approved + active + parent approved

## Must not touch

- `app/admin/**`, `app/(site)/dashboard/**`
- `categoryConfig.ts` / `HubCategoryKey` type
- Stripe, analytics, route optimizer
- Navbar global redesign
