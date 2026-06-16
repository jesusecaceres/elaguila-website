# Gate OL-7 — Ofertas Locales — AI Scan Action + Extracted Item/Coupon Review Flow

## Current issue (Gate A)

Uploaded flyer/coupon PDFs showed green/saved in Step 5, but AI did not activate because:

1. `getOfertaLocalAiScanReadiness()` required `ofertaLocalId` from Step 7 submit (`requiresSubmittedOffer = true`).
2. `OfertasLocalesApplicationClient` passed `ofertaLocalId={submitSuccess?.id}` — only set after final publish submit.
3. Scan button was disabled during the normal Step 5 application flow despite uploaded assets.

## Current AI architecture

| Layer | Implementation |
|-------|----------------|
| Readiness | `ofertasLocalesAiScanReadiness.ts` — MIME + uploaded URL/storage checks |
| Scan prep | **NEW** `POST /api/ofertas-locales/scan-prep` — insert/update `ofertas_locales` pending_review |
| Scan | `POST /api/ofertas-locales/scan` → `ofertasLocalesScanApiHandler.ts` |
| OCR | Google Document AI via `ofertasLocalesDocumentAiClient.ts` (15 MB scan cap) |
| Normalizer | `normalizeDocumentAiResultToOfertaLocalItems` — deterministic line parser |
| Storage | `oferta_local_scan_jobs`, `oferta_local_items` (existing Stack 11 tables) |
| Review | `OfertasLocalesAiItemReviewPanel` + `GET/PATCH /api/ofertas-locales/items` |

## Scan readiness requirements

- `wantsAiSearchableSpecials === true`
- Uploaded asset with `storagePath` + HTTPS `url` (Vercel Blob)
- MIME: `application/pdf`, `image/jpeg`, `image/jpg`, `image/png` (WebP excluded in readiness)
- External URL assets (`assetType === "external_url"`) **not** scan-ready
- Selected-but-not-uploaded files **not** scan-ready (no storagePath/url)
- Signed-in user
- Core Steps 2–4 fields complete (via `validateOfertaLocalDraftForAiScanPersist`)

## Storage asset requirements

- Client uploads via OL-5 Blob flow; draft stores metadata only (`storagePath`, `url`, `mimeType`, `fileName`, `sizeBytes`)
- Scan API requires non-empty `storagePath` + fetches bytes from uploaded HTTPS URL
- External URLs are rejected at scan API (`missing_storage_path`)

## Scan record ID (ofertaLocalId)

**Before OL-7:** Required Step 7 submit.

**After OL-7:** `scan-prep` creates/updates a `pending_review` row before scan. ID persisted in sessionStorage (`leonix:ofertas-locales:ai-scan-session:v1`) alongside `lastScanJobId`. Step 7 submit reuses the same ID when present.

No migration required — uses existing `ofertas_locales` table.

## Recommended fix (implemented)

1. Add `scan-prep` API + client `ensureOfertaLocalRecordForAiScan`
2. Remove Step 7 blocker from readiness; require persist-eligible draft instead
3. Enhance `OfertasLocalesAiScanPanel` — asset list, per-file scan, honest status labels ES/EN
4. Wire review panel to `effectiveOfertaLocalId` (scan prep or submit)
5. Require `storagePath` in scan API; block external-only URLs
6. Document coupon extraction as partial (product normalizer only)

## Candidate review UI strategy

- Reuse `OfertasLocalesAiItemReviewPanel` (not rebuilt)
- Show after scan when `ofertaLocalId` + items exist
- Editable: itemName, priceText, priceAmount, unit, category, dealType (terms), tags
- Approve / Remove (reject) / Save — no auto-publish
- Count: "Sugerencias encontradas: X" / "Suggestions found: X"
- Coupon lane: honest partial note; map fields to title/offer/terms

## Weekly ad extraction behavior

- Document AI OCR → line parser → product-style candidates
- Fields: product name, sale price text/amount, unit, category, source page, valid dates from parent offer
- Default status: `pending`/`needs_review`, `is_active: false`

## Coupon extraction behavior (partial)

- Same normalizer as weekly ads — no dedicated coupon parser
- Coupon PDF/image can be scanned; candidates appear as product-style rows
- UI labels adapted for coupon lane; no automatic coupon-sheet clipping promise

## What is not implemented

- Dedicated coupon title/offer/terms parser (future gate)
- Automatic coupon-sheet clipping
- Scan files > 15 MB (Document AI cap; OL-5 upload may succeed but scan fails — documented risk)
- WebP AI scan in readiness UI (backend allows webp MIME but readiness excludes it)
- Separate scan-status polling route (scan is synchronous in request)

## QA checklist

- [ ] Step 1: enable AI Searchable Specials
- [ ] Steps 2–4: complete business fields, sign in
- [ ] Step 5: upload flyer PDF → shows "Listo para escanear"
- [ ] Click "Escanear con AI" → "Escaneando archivo..."
- [ ] Real completion or real error (config missing, size, OCR fail)
- [ ] Candidates appear in review panel; count shown
- [ ] Edit fields, Save, Approve, Remove
- [ ] Refresh tab — draft + scan record id + candidates survive (server-side)
- [ ] Public search unchanged — only approved+active items
- [ ] Coupon lane: partial note visible; scan coupon file if uploaded

## Gate A STOP conditions — none triggered

- Google Document AI env verified at scan time (503 if missing — not a code blocker)
- Scan/candidate tables exist in codebase (Stack 11)
- No migration required for scan-prep
- Uploaded Blob URLs accessible server-side via HTTPS fetch
