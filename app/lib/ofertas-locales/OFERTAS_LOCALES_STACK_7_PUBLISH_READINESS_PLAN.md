# Stack 7 — Ofertas Locales — Publish Readiness Plan (Gate A)

## 1. Existing DB/publish pattern found

| Pattern | Reference | Notes |
|---------|-----------|-------|
| **Dedicated category table** | `empleos_public_listings`, `comida_local_public_listings` | Not generic `listings` |
| **Migration naming** | `YYYYMMDDHHMMSS_description.sql` | e.g. `20260604120000_comida_local_public_listings.sql` |
| **Owner column** | `owner_user_id` (empleos/comida) | Stack 7 uses `owner_id` per product spec |
| **Status lifecycle** | `pending_review` → `approved`/`published` (empleos) | Public select only when published |
| **RLS** | `enable row level security` + owner select + public select deferred | Empleos: no anon insert |
| **Publish API** | `getAdminSupabase()` service role insert | Bearer auth via `getBearerUserId` |
| **Mapper** | `draftToComidaLocalPublicListingInsert` | Sanitize + map draft → row |

**Recommendation:** Dedicated `ofertas_locales` table (not generic listings). Publish API inserts `pending_review` only via service role. **No public SELECT policy** until public results gate.

## 2. Recommended table

**Name:** `public.ofertas_locales`

Columns per Stack 7 spec (owner_id, status default `pending_review`, flyer/coupon assets as `jsonb`).

## 3. Status lifecycle

```
draft → submitted → pending_review → approved → (live in later gate)
                  ↘ rejected / archived / expired
```

Stack 7 insert: **`pending_review`** only. No auto-approve.

## 4. Asset JSON shape

```json
[{
  "id": "uuid",
  "assetType": "flyer_pdf | flyer_image | coupon_pdf | coupon_image | external_url",
  "title": "",
  "note": "",
  "url": "https://...",
  "fileName": "",
  "mimeType": "",
  "storagePath": "ofertas-locales/drafts/...",
  "sizeBytes": 12345,
  "pageNumber": null,
  "sortOrder": 0
}]
```

Metadata only — no File/base64 in DB.

## 5. RLS policies (Stack 7)

| Policy | Rule |
|--------|------|
| `ofertas_locales_select_owner` | `auth.uid() = owner_id` |
| `ofertas_locales_insert_owner` | `auth.uid() = owner_id` |
| `ofertas_locales_update_owner_pending` | owner + status in (`draft`,`submitted`,`pending_review`) |
| **Public select** | **Deferred** — not created in Stack 7 |

Writes also go through service-role publish API (empleos/comida pattern).

## 6. Publish API shape

`POST /api/ofertas-locales/publish`

- Auth: Bearer required (401)
- Body: `{ draft: OfertaLocalDraft }`
- Validate: `validateOfertaLocalDraftForServerPublish`
- Insert: `ofertas_locales` with `status = 'pending_review'`
- Response: `{ ok: true, id, status }`
- No `publicPath`, no Stripe, no analytics, no revalidate public routes

## 7. Security risks

| Risk | Mitigation |
|------|------------|
| Unauthenticated publish | 401 without Bearer |
| Trusting client owner | `owner_id` from JWT only |
| Pending offers public | No public SELECT policy |
| Heavy media in JSON | Reject data URLs / oversized strings in API |
| Fake asset URLs | Require `storagePath` or validated external URL |

## 8. Gate B/C scope

**Gate B:** Migration + `ofertasLocalesPublishMapper.ts` + types

**Gate C:** Publish route + draft submit UI + audit + build

## 9. Pending for later gates

- Public results/browse pages
- Admin moderation dashboard
- Payment / Stripe
- Analytics events
- Approve → live transition
- Leonix ad ID / slug (optional future)

## Gate A STOP condition

**Not triggered.** Empleos + Comida Local patterns are clear and reusable.
