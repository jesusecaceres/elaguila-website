# Stack FINAL-2 — Admin Review Queue Audit

## Admin route

- Path: `/admin/workspace/clasificados/ofertas-locales`
- Protected by `app/admin/(dashboard)/layout.tsx` → `requireAdminCookie`
- Queue: `pending_review`, `submitted`, `draft`
- Live: `approved`

## Review workflow

| Action | Auth | From | To |
|--------|------|------|-----|
| approve | admin cookie | pending_review, submitted, draft | approved |
| reject | admin cookie | pending_review, submitted, draft | rejected |
| archive | admin cookie | approved, pending_review, submitted, draft, rejected | archived |

Admin notes appended as `[admin_review]{...}` in `internal_notes`.

## Public safety

- `public-offers` API: `.eq("status", "approved")`; no `internal_notes` or `owner_id` in select
- `public-search` API: parent `approved` + item approved/active
- No fake approved records in codebase

## Out of scope (verified absent)

- Dashboard seller UI
- Stripe / payment
- Route optimization
- SMS / email
- Unrelated category changes

## DB

No migration applied. `reviewed_at` / `approved_at` not required — uses `updated_at`.
