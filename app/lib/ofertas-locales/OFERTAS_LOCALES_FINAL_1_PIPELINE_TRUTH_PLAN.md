# Stack FINAL-1 — Pipeline Truth Plan

## 1. Current pipeline status

| Step | Status |
|------|--------|
| `/publicar/ofertas-locales` | Exists |
| `/publicar/ofertas-locales/preview` | Exists |
| `POST /api/ofertas-locales/assets/upload` | Auth required |
| `POST /api/ofertas-locales/publish` | Auth + validation + `pending_review` insert |
| Wizard submit for review | Wired via `submitOfertaLocalDraftForReview` |
| Public `/clasificados/ofertas-locales` | Exists (Stack D item search) |

**Blocker class:** pipeline complete, needs public offers surface + landing polish + hub link.

## 2. DB/migration status

Migration `20260605120000_ofertas_locales.sql` — table + owner RLS, **no public SELECT**.  
Migration `20260606120000_create_oferta_local_ai_scan_items.sql` — items table, owner RLS.  
**No new migration required** for FINAL-1 — use admin API routes for public reads.

## 3. Publish API status

- Requires bearer auth
- Server validates via `validateOfertaLocalDraftForServerPublish`
- Inserts `status: pending_review` only
- Stores flyer/coupon asset metadata, social/featured in `internal_notes` prefix (not public)

## 4. Upload status

Vercel Blob upload with owner auth — no DB write on upload.

## 5. Public visibility rules

**Offers public:** `status = approved` only; exclude pending_review, rejected, draft, archived, expired; not expired by dates; no `internal_notes` in response.

**Items public (search):** `review_status = approved`, `is_active = true`, parent `approved`.

## 6. Public landing/results route plan

Enhance `/clasificados/ofertas-locales`:
- Hero + value proposition
- Offer results grid via `GET /api/ofertas-locales/public-offers`
- Item keyword search (existing public-search)
- Honest empty states
- Business CTA → publish flow

## 7. Nav/tab/CTA plan

Add Ofertas Locales card on `/clasificados` hub (Gate C) — no HubCategoryKey type change.

## 8. What will not be touched

Admin, dashboard, Stripe, route optimizer, analytics, unrelated categories.

## 9. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://www.leonixmedia.com/clasificados/ofertas-locales?lang=en
