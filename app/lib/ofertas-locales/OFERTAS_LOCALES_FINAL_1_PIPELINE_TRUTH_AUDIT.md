# Stack FINAL-1 — Pipeline Truth Audit

## Gate A

Pipeline verified: publish auth, pending_review insert, upload auth, migrations sufficient, no public RLS.

## Gate B

- Publish API returns `submittedAt`
- Wizard review step shows not-public-until-reviewed copy
- Success state without public listing link

## Gate C

- `GET /api/ofertas-locales/public-offers` — approved offers only
- Public landing enhanced: hero, offers grid, item search, pipeline empty state
- Clasificados hub card links to public + publish routes

## Public safety

Offers: `status = approved`, not expired, no internal_notes in API response.  
Items: approved + active + parent approved (existing public-search).

## QA URLs

See plan doc.

## Remains for admin/dashboard

- Approve/reject offers (pending_review → approved)
- Activate searchable items (`is_active = true`)
- Owner listing management UI
