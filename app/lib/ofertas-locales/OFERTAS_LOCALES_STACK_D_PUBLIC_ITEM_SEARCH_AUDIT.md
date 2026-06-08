# Stack D — Public Item Search MVP Audit

## Gate A

- Audited item/offer schema, RLS (owner-only), eligibility helper, Stack B `is_active=false` default
- Plan created; public API via admin Supabase (no public RLS yet)

## Gate B

- `GET /api/ofertas-locales/public-search` — approved + active + parent approved filters
- `/clasificados/ofertas-locales` — search shell, filters, item cards

## Gate C

- Clickable cards → client detail drawer with flyer/coupon context, CTAs, honest missing URL state
- No fake bounding box overlay
- Full build at end

## Public safety

- Query hard-filters: `review_status=approved`, `is_active=true`, `ofertas_locales.status=approved`
- Post-filter eligibility + expired parent exclusion
- Never returns: `reviewer_note`, `internal_notes`, `owner_id`, raw `description`
- Approved-but-inactive items hidden until activation (empty results OK)

## QA URLs

- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en

## Recommended next stack

**Stack E — Item activation workflow:** owner/admin `is_active=true` after approve, optional bulk publish, seed QA data.
