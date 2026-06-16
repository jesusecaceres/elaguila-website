# Gate OL-7B — Ofertas Locales — Production AI Schema + Scan Candidate Extraction Fix

## Exact blocker confirmed

**Production error:** `Could not find the table 'public.ofertas_locales' in the schema cache`

**Root cause:** Migrations `20260605120000_ofertas_locales.sql` and `20260606120000_create_oferta_local_ai_scan_items.sql` exist in repo but were **never applied to production Supabase**. Vercel deploy does not run SQL migrations.

**Scan flow dependency chain:**
1. `POST /api/ofertas-locales/scan-prep` → insert/update `ofertas_locales`
2. `POST /api/ofertas-locales/scan` → insert `oferta_local_scan_jobs`, fetch Blob asset, Document AI OCR
3. Normalizer → insert `oferta_local_items` candidates
4. `GET /api/ofertas-locales/items` → owner review UI

## Missing/wrong table names

| Expected | Status in repo | Status in production (before fix) |
|----------|----------------|-----------------------------------|
| `public.ofertas_locales` | Migration 20260605120000 | **Missing** |
| `public.oferta_local_scan_jobs` | Migration 20260606120000 | **Missing** |
| `public.oferta_local_items` | Migration 20260606120000 | **Missing** |

No table name mismatch in app code — production simply lacks schema.

## Required schema fix

**New idempotent migration:** `20260616130000_ofertas_locales_ai_production_bootstrap.sql`

Creates all three tables if missing, adds OL-7B extraction columns, sets defaults:
- `oferta_local_items.review_status` default `needs_review`
- `oferta_local_items.is_active` default `false`
- Candidate columns: `candidate_type`, `regular_price_text`, `coupon_title`, `offer_text`, `terms`, `source_context`, `source_bbox`, `extracted_json`
- Scan job columns: `source_storage_path`, `source_mime_type`, `source_asset_kind`, `raw_ocr_summary`

## Scan job model

Uses existing `oferta_local_scan_jobs` + new metadata columns. Status lifecycle: `processing` → `needs_review` | `failed`.

## Candidate model

Uses existing `oferta_local_items` (not a separate candidates table). Maps gate fields:

| Gate field | DB column |
|------------|-----------|
| product_name | `item_name` |
| sale_price | `price_text` / `price_amount` |
| regular_price | `regular_price_text` |
| unit_size | `unit` |
| description | `description` |
| category | `category` |
| coupon_title | `coupon_title` (+ `item_name`) |
| offer_text | `offer_text` (+ `price_text`) |
| terms | `terms` (+ `deal_type`) |
| source_page | `source_page` |
| source_context | `source_context` |
| source_bbox | `source_bbox` (jsonb, normalized OCR box — **not** image clip) |
| candidate_type | `candidate_type` (`product_deal` \| `coupon` \| `promo`) |

## Uploaded asset scan path

1. Step 5 upload → Vercel Blob (`storagePath`, HTTPS `url`)
2. Scan button → `scan-prep` (creates `ofertas_locales` row)
3. Scan → server fetches HTTPS URL bytes → Google Document AI
4. Normalizer extracts real OCR lines (with page + bbox when available)
5. Candidates inserted `needs_review`, `is_active=false`

## Extraction/parser strategy

- **No fake/sample data**
- Document AI page lines + bounding boxes from layout
- Deterministic regex parser (`ofertasLocalesAiNormalizer.ts`)
- Weekly ads: product_deal candidates with price, regular price, unit, category hints
- Coupons: coupon candidates when `assetKind=coupon`
- Zero candidates → honest message: "No se encontraron sugerencias claras"
- **No automatic image clipping** — bbox stored as OCR context only

## Candidate review/edit strategy

- `OfertasLocalesAiItemReviewPanel` — editable fields, Mantener/Quitar/Guardar revisión
- PATCH `/api/ofertas-locales/items/[itemId]`
- Approved items remain inactive until parent offer approved (existing activation logic)

## Public safety strategy

Unchanged: `isOfertaLocalPublicSearchRowEligible` requires `review_status === 'approved'` && `is_active`. No public SELECT RLS on scan tables.

## Deployment/migration checklist

1. **Apply Supabase migration** `20260616130000_ofertas_locales_ai_production_bootstrap.sql` to production
   - Dashboard → SQL Editor → paste/run, OR `supabase db push` linked to production
2. Verify tables: `ofertas_locales`, `oferta_local_scan_jobs`, `oferta_local_items`
3. Confirm Google Document AI env vars on Vercel
4. Deploy Vercel (app code with clearer schema errors + improved parser)
5. Manual QA on `/publicar/ofertas-locales?lang=es`

## QA checklist

- [ ] Migration applied — no schema cache error on scan
- [ ] Upload PDF → scan-ready
- [ ] Escanear con AI → processing → completion or real error
- [ ] Candidates appear with real OCR fields (not samples)
- [ ] Edit/save/keep/remove works
- [ ] Zero-candidate scan shows honest empty message
- [ ] Public search unchanged — no pending items visible
- [ ] Coupon PDF scan produces coupon-type candidates or honest empty

## STOP conditions — none for code

Document AI env must be configured in production separately. Migration must be applied manually.
