# Stack FINAL-AI-1 — Ofertas Locales AI Scan + Public Items + Shopping List Map V1

## 1. Current AI readiness status

| Area | Status |
|------|--------|
| `oferta_local_scan_jobs` table | Migration `20260606120000_create_oferta_local_ai_scan_items.sql` — apply manually in Supabase SQL Editor if missing |
| `oferta_local_items` table | Same migration |
| Document AI env | `GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON`, `PROJECT_ID`, `PROCESSOR_LOCATION`, `OCR_PROCESSOR_ID` — server-only |
| Scan API | `POST /api/ofertas-locales/scan` + `POST /api/ofertas-locales/[id]/scan` |
| Item review API | `GET/PATCH /api/ofertas-locales/items`, `PATCH /api/ofertas-locales/items/[itemId]` |
| Public item search | `GET /api/ofertas-locales/public-search` + `/clasificados/ofertas-locales` UI |
| Shopping list | localStorage V1 in `ofertasLocalesShoppingList.ts` |
| Open Map V1 | `buildOfertaLocalShoppingListGoogleMapsDirUrl` → `google.com/maps/dir` |

## 2. Scan job lifecycle

`pending` → `processing` → `needs_review` | `failed`

- Job created on scan start (`processing`)
- Document AI runs server-side
- Candidates inserted inactive (`is_active: false`, `review_status: pending|needs_review`)
- Job completes `needs_review` or `failed`

## 3. Item candidate schema

`oferta_local_items`: name, price, category/tags, source asset/page, confidence, `review_status`, `is_active`, parent `oferta_local_id`, `scan_job_id`.

## 4. Document AI behavior

- Processor via `ofertasLocalesDocumentAiClient.ts`
- HTTPS asset download only
- Normalizer extracts line-based candidates — no fake data
- Never inserts `approved` + `is_active: true` directly from scan

## 5. Owner/admin review

- `OfertasLocalesAiItemReviewPanel` — publish wizard, owner dashboard, admin inspect
- Edit title/price/category/tags; approve/reject/save
- `is_active: true` only when item `approved` AND parent `approved`
- Admin offer approve activates already-approved items

## 6. Public item eligibility

Parent `status = approved` + item `review_status = approved` + `is_active = true` + valid dates (if set). No `internal_notes`, `owner_id`, or scan raw data in public API.

## 7. Item-to-flyer context

Public search drawer shows source asset link, page, bounding box note (no fake highlight).

## 8. Shopping list V1

Client-only list of public-safe fields; add/remove, qty, note, copy, group by store.

## 9. Google Maps URL V1

`https://www.google.com/maps/dir/?api=1` with destination + waypoints (max 5 stores). Not Routes API `computeRoutes`.

## 10. Deferred to FINAL-AI-2

- Email/SMS share token
- Server-side saved shopping list
- Google Routes API `https://routes.googleapis.com/directions/v2:computeRoutes` optimizedWaypointOrder
- Route optimizer page

## 11. Files changed (FINAL-AI-1)

- `app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts`
- `app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesShoppingList.ts`
- `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts`
- `app/api/ofertas-locales/scan/route.ts`
- `app/api/ofertas-locales/[id]/scan/route.ts`
- `app/api/ofertas-locales/items/route.ts`
- `app/api/ofertas-locales/items/[itemId]/route.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/dashboard/ofertas-locales/[id]/page.tsx`
- `app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerAiManageSection.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx`
- `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminAiItemReviewSection.tsx`
- `app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx`
- `scripts/ofertas-locales-final-ai-1-audit.ts`

## 12. Production QA URLs

Base: `https://www.leonixmedia.com`

| Flow | URL |
|------|-----|
| Publish | `/publicar/ofertas-locales?lang=es` |
| Admin queue | `/admin/workspace/clasificados/ofertas-locales` |
| Owner dashboard | `/dashboard/ofertas-locales?lang=es` |
| Owner manage + AI review | `/dashboard/ofertas-locales/{id}?lang=es` |
| Public search | `/clasificados/ofertas-locales?lang=es` |
| Public offer detail | `/clasificados/ofertas-locales/{offerId}?lang=es` |
| Item detail | Drawer on public search (no separate URL) |
| Shopping list + map | Public search → Lista → Abrir mapa |
