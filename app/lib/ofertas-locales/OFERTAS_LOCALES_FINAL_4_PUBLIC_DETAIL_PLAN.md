# Stack FINAL-4 — Public Detail + Business Hub Lite Full Card

## FINAL-3 verification
- `/dashboard/ofertas-locales` + `[id]` exist
- `ofertas-locales:final-3-seller-dashboard-audit` in package.json
- Owner API + helpers present — **FINAL-3 complete in repo**

## En Venta / Varios inspected
- `app/(site)/clasificados/anuncio/[id]/page.tsx` — shared public detail
- `EnVentaAnuncioLayout` — contact CTAs, media, safe projection

## Servicios inspected
- `app/(site)/clasificados/servicios/[slug]/page.tsx` — `notFound`/unavailable for non-published
- `ServiciosListingResultCard` — links to detail slug route

## Recommended detail route
`/clasificados/ofertas-locales/[id]?lang=es|en`

## Public-safe fields
Offer hero, description, coupon/flyer text, assets (safe URLs only), contact, socials from metadata parse, membership/digital coupon, AI interest note (honest), no featured badge from intent alone

## API
`GET /api/ofertas-locales/public-offers/[id]` — approved + not expired; no `internal_notes`/`owner_id` in JSON

## Files to create/change
- `ofertasLocalesPublicDetailHelpers.ts`
- `OfertaLocalPublicOfferDetail` type
- `public-offers/[id]/route.ts`
- `[id]/page.tsx` + detail view + Business Hub Lite card
- Update offer card → link to detail
- Audit script

## Not built
Payment, route optimization, SMS/email, analytics, fake reviews, full Business Hub profile, admin/dashboard changes

## Next stack
FINAL-5 — Analytics Events Foundation
