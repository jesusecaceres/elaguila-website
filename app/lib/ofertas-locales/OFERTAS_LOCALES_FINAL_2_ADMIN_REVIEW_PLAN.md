# Stack FINAL-2 — Ofertas Locales Admin Review Queue + Approval Workflow

## En Venta / Varios admin files inspected

| File | Purpose |
|------|---------|
| `app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx` | Thin wrapper → `ListingsCategoryOpsQueuePage` |
| `app/admin/(dashboard)/workspace/clasificados/_components/ListingsCategoryOpsQueuePage.tsx` | Generic listings queue (status, owner, moderation) |
| `app/clasificados/en-venta/admin/EnVentaModerationFields.tsx` | Category-specific moderation fields |
| `app/admin/(dashboard)/workspace/clasificados/page.tsx` | Clasificados hub + cross-category links |
| `app/admin/_lib/listingsAdminSelect.ts` | Listings fetch for admin workspace |

**Pattern:** Dedicated verticals with own tables use `/admin/workspace/clasificados/{slug}/page.tsx`. En Venta uses shared `listings` table via ops queue component.

## Servicios admin files inspected

| File | Purpose |
|------|---------|
| `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` | Full queue UI, pending rows, inspect |
| `app/admin/(dashboard)/workspace/clasificados/servicios/actions.ts` | `requireAdminCookie` + `getAdminSupabase` status updates |
| `app/admin/(dashboard)/workspace/clasificados/servicios/ServiciosAdminClient.tsx` | Client moderation chrome |
| `app/clasificados/servicios/lib/serviciosPublicListingsServer.ts` | Admin queue DB reads |

**Pattern:** Server page + server actions; `listing_status` transitions; `moderation_notes` stored on row.

## Comida Local (secondary reference — dedicated table)

| File | Purpose |
|------|---------|
| `app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx` | Queue/live scope, search, inspect by `?id=` |
| `app/admin/(dashboard)/workspace/clasificados/comida-local/actions.ts` | Admin cookie guard + status update |
| `app/lib/clasificados/comida-local/comidaLocalAdminQueries.ts` | Admin SELECT + list filters |
| `app/lib/clasificados/comida-local/ComidaLocalAdminListings.tsx` | Table + inspect detail card |

**Pattern adopted for Ofertas Locales:** dedicated table, queue/live scopes, inspect detail, approve/reject forms.

## Admin auth / guard pattern

| File | Pattern |
|------|---------|
| `app/admin/(dashboard)/layout.tsx` | `requireAdminCookie` → redirect `/admin/login` |
| `app/lib/supabase/server.ts` | `requireAdminCookie(cookies)` checks `leonix_admin=1` |
| Server actions / API | Re-check `requireAdminCookie` + `getAdminSupabase()` service role |

## Ofertas Locales files inspected

| File | Role |
|------|------|
| `supabase/migrations/20260605120000_ofertas_locales.sql` | Table shape, status check, RLS (owner only) |
| `app/api/ofertas-locales/publish/route.ts` | Inserts `pending_review` only |
| `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts` | Social/AI/featured in `internal_notes` metadata |
| `app/api/ofertas-locales/public-offers/route.ts` | `status=approved` only; no `internal_notes` |
| `app/api/ofertas-locales/public-search/route.ts` | Parent `approved` + item `review_status=approved` |
| `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts` | Public eligibility = `approved` + not expired |
| `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts` | Metadata parser for social links |

## Recommended admin route

`/admin/workspace/clasificados/ofertas-locales` (matches Comida Local / Servicios convention)

- `?scope=live` — approved offers
- `?id={uuid}` — inspect detail
- Default queue — `pending_review`, `submitted`, `draft`

## Recommended admin list fields

business_name, title, offer_type, business_category, city, zip_code, submitted_at, status, valid_from–valid_until, asset count (flyer + coupon), AI intent (`wantsAiSearchableSpecials`), featured intent (`is_featured_requested` + scope), owner_id (truncated UUID), review link

## Recommended review detail fields

All business/offer columns, address/city/state/ZIP, phone/WhatsApp/website/directions, flyer/coupon assets, membership/digital coupon fields, social URLs from metadata, AI + featured intent, internal_notes (admin only), submitted_at/created_at/updated_at, status

## Recommended status transitions

| Action | From | To | Public |
|--------|------|-----|--------|
| approve | `pending_review`, `submitted`, `draft` | `approved` | eligible |
| reject | `pending_review`, `submitted`, `draft` | `rejected` | private |
| archive | `approved`, `pending_review`, `rejected` | `archived` | private |

Admin note on reject/approve/archive: appended as `[admin_review]{...}` in `internal_notes` without removing `[ofertas_locales_metadata]` block.

**No auto-activate AI items** in FINAL-2 (deferred to FINAL-6).

## Public safety rules

- Public offers API: `.eq("status", "approved")`; select excludes `internal_notes`, `owner_id`
- Public search: parent `.eq("ofertas_locales.status", "approved")`; `internal_notes` parsed server-side only
- Pending/rejected/draft/submitted/archived never in public responses
- Featured intent does not imply paid placement on public UI

## DB compatibility status

| Field | Status |
|-------|--------|
| `status` lifecycle | ✅ present (`pending_review`, `approved`, `rejected`, `archived`, …) |
| `internal_notes` | ✅ present |
| `is_featured_requested` | ✅ present |
| `flyer_assets` / `coupon_assets` | ✅ jsonb |
| `reviewed_at` / `approved_at` | ❌ not in migration — use `updated_at` |
| `oferta_local_items` | ✅ separate table (AI items not auto-activated here) |

**No migration required for FINAL-2.**

## Exact files to create/change

| File | Action |
|------|--------|
| `app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts` | Create — queries, metadata parse, VMs |
| `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts` | Create — approve/reject/archive logic |
| `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx` | Create — queue + detail |
| `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx` | Create — table + inspect |
| `app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts` | Create — server actions |
| `app/api/ofertas-locales/admin/[id]/review/route.ts` | Create — POST approve/reject/archive |
| `app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta.ts` | Add `ofertas-locales` case |
| `app/admin/_lib/adminCategoryWorkspaceQueueHref.ts` | Add `ofertas-locales` case |
| `scripts/ofertas-locales-final-2-admin-review-audit.ts` | Create |
| `package.json` | Add audit script |

## What will NOT be built (FINAL-2)

- Advertiser dashboard
- Payment / Stripe
- Route optimization
- SMS / email shopping list
- Analytics dashboard
- Fake approved offers or reviews
- AI item auto-activation
- Supabase migrations
- Public pricing changes

## Recommended next stack

**FINAL-3** — Seller dashboard submission status + manage/edit (En Venta Mis Anuncios + Servicios pattern).
