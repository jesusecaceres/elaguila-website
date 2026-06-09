# Stack FINAL-3 — Seller Dashboard Audit

## Routes

| Route | Auth |
|-------|------|
| `/dashboard/ofertas-locales` | Login redirect + Bearer owner list API |
| `/dashboard/ofertas-locales/[id]` | Ownership verified via API |
| `/api/ofertas-locales/owner` | Bearer + `owner_id` filter |
| `/api/ofertas-locales/owner/[id]` | GET detail + PATCH resubmit |

## Edit safety

- Editable: draft, submitted, pending_review, rejected
- PATCH sets `status: pending_review` only
- Blocks `status`, `owner_id`, `internal_notes` in body
- Approved/archived: 403 on PATCH

## Owner metadata

- Raw `internal_notes` never in API response
- Rejection note: only `[admin_review]` with `action: reject`

## Public safety unchanged

- Public offers: `approved` only, no internal_notes/owner_id

## Out of scope

No payment, analytics, SMS, route optimization, admin changes
