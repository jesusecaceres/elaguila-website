# Stack FINAL-1D — Public Tab Activation Audit

## Gate A

En Venta/Servicios hub grid + Negocios Locales lanes + publish chooser patterns documented in plan.

## Gate B

- `OfertasLocalesHubCategoryCard` — first card in `/clasificados` category grid
- Promo band on `/clasificados` — shopper + business CTAs
- `ofertas-locales` lane on `/negocios-locales`
- Publish chooser tile on `/clasificados/publicar`

## Gate C — Public safety

- Public offers API: `status=approved` only, no `internal_notes` in select
- Public item search: `review_status=approved`, `is_active=true`, parent `approved`
- No fake listings or counts added

## Labels

| | ES | EN |
|--|----|----|
| Title | Ofertas Locales | Local Deals |
| Browse | Ver ofertas | View deals |
| Publish | Publica tus ofertas locales | Publish your local deals |

## Not touched

Admin, dashboard, Stripe, migrations, route optimizer, Navbar redesign, HubCategoryKey.
