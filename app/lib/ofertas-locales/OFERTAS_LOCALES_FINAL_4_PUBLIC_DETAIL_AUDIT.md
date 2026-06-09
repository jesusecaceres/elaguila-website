# Stack FINAL-4 — Public Detail Audit

## Routes
- List: `/clasificados/ofertas-locales`
- Detail: `/clasificados/ofertas-locales/[id]?lang=es|en`
- API: `GET /api/ofertas-locales/public-offers/[id]`

## Public safety
- Detail fetch: `isOfertaLocalPublicOfferRowEligible` (approved + not expired)
- Unavailable UI for pending/rejected/private ids (same as not found)
- `internal_notes` parsed server-side only; never in API JSON
- No `owner_id` in public detail type

## Business Hub Lite
Contact + social CTAs only when URLs exist; no fake reviews/ratings

## Not built
Route optimization, payment, analytics, SMS/email, featured badge from intent
