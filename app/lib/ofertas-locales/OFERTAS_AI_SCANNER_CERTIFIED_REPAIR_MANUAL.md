# ⚠️ CERTIFIED SCANNER CORE — DO NOT MODIFY WITHOUT EXPLICIT SCANNER-REPAIR AUTHORIZATION

The scanner engine is a protected subsystem. UI may consume and present scanner output, but unrelated UX/globalization work must not alter scanner execution.

This file is the authoritative engineering repair manual for the Ofertas Locales AI flyer scanner. It documents the CURRENT, PRODUCTION-VERIFIED working system — not an aspirational design. Every file, function, table, and column named below was read directly from current source at certification time (2026-08-27); none were inferred or guessed.

---

## 1. CERTIFIED STATUS

**CERTIFIED: TRUE**

Production successfully processed an 8-page Cardenas flyer end-to-end:
- 127 products extracted
- 8/8 pages completed
- highlighted source regions (bbox) displayed for candidates where present
- editable review forms displayed
- product names/prices/categories/descriptions/tags persisted and surfaced
- page-by-page review works

This is the reference known-good result. Any future regression should be compared against this baseline.

---

## 2. DO-NOT-TOUCH DOCTRINE

The scanner's **execution behavior** is locked. This includes:
- readiness gating logic
- scan-prep payload/response contract
- canonical parent (`ofertas_locales`) persistence shape
- the `/scan` route's request/response contract
- provider invocation (Gemini) and fallback (Document AI)
- candidate normalization
- item persistence shape
- the scanner database schema (tables/columns/constraints/indexes/RLS)
- owner/RLS rules governing scanner tables

The **review UX** (layout, styling, CTA copy, page navigation chrome, workspace arrangement) is NOT locked and may be freely rearranged, as long as it continues to call the same contracts documented below without changing their shape.

---

## 3. KNOWN-GOOD USER FLOW

1. User reaches Step 5 of the Ofertas Locales wizard with a package that includes AI (`isOfertaLocalAiIncludedInPackage(draft)` true).
2. User uploads a flyer (PDF/JPG/PNG/WebP) — asset becomes eligible once uploaded with a storage path and URL.
3. `getOfertaLocalAiScanReadiness()` computes `ready: true`.
4. User clicks "Analizar con IA" — `OfertasLocalesAiScanPanel.handleScanAsset`.
5. Client ensures a canonical `ofertas_locales` parent row exists via `POST /api/ofertas-locales/scan-prep`.
6. Client calls `POST /api/ofertas-locales/scan` with the eligible asset's id/kind/url/storagePath/mimeType.
7. Server resolves/creates a source asset version, creates an `oferta_local_scan_jobs` row (`status: "processing"`), downloads the asset bytes, and calls `runOfertaLocalAiScanExtraction`.
8. Gemini multimodal runs first; if it throws or returns zero items, Document AI runs as fallback (only if configured).
9. Normalized candidates are mapped to DB rows and inserted into `oferta_local_items` (`review_status: "needs_review"`, `is_active: false`).
10. `oferta_local_scan_jobs` and `ofertas_locales.ai_scan_status` are updated to `"needs_review"`.
11. Client polls `GET /api/ofertas-locales/items` for review rows and page/job progress.
12. Owner approves/rejects/marks-for-later-review via `PATCH /api/ofertas-locales/items/[itemId]`.

---

## 4. CRITICAL FILE MAP

Exact files, verified against current source (no inferred names):

| # | Concern | File | Key export(s) |
|---|---|---|---|
| 1 | Scan button UI | `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx` | `OfertasLocalesAiScanPanel`, `handleScanAsset` |
| 2 | Readiness | `app/lib/ofertas-locales/ofertasLocalesAiScanReadiness.ts` | `getOfertaLocalAiScanReadiness`, `getOfertaLocalScanEligibleAssets` |
| 3 | Scan-time persistence validation | `app/lib/ofertas-locales/ofertasLocalesAiScanPersist.ts` | `validateOfertaLocalDraftForAiScanPersist`, `canOfertaLocalDraftPersistForAiScan` |
| 4 | Canonical owner/application identity | `app/lib/ofertas-locales/ofertasLocalesDraftIdentity.ts`, `app/lib/ofertas-locales/useOfertasLocalesDraft.ts` | `resolveOfertaLocalDraftLoadDecision` |
| 5 | Eligible asset selection | `app/lib/ofertas-locales/ofertasLocalesDraftAssetHelpers.ts`, `ofertasLocalesAiScanReadiness.ts` | `assetIsAiScanEligible`, `assetHasUploadedWithUrl`, `getOfertaLocalScanEligibleAssets` |
| 6 | `/api/ofertas-locales/scan-prep` | `app/api/ofertas-locales/scan-prep/route.ts` | `POST` |
| 7 | Canonical `ofertas_locales` insert/update | `app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts` | `buildOfertasLocalesScanPrepInsertRow`, `buildOfertasLocalesScanPrepUpdateRow`, `buildOfertasLocalesProductionInsertRow` |
| 8 | Source asset preparation/versioning | `app/lib/ofertas-locales/ofertasLocalesAssetLifecycle.ts` | `createOfertaLocalSourceVersion`, `OFERTAS_LOCALES_SOURCE_ASSET_SELECT` |
| 9 | `/api/ofertas-locales/scan` | `app/api/ofertas-locales/scan/route.ts` → `app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts` | `POST` → `handleOfertaLocalScanPost` |
| 10 | `oferta_local_scan_jobs` creation/update | `ofertasLocalesScanApiHandler.ts`, `app/lib/ofertas-locales/ofertasLocalesScanProgress.ts` | `handleOfertaLocalScanPost`, `updateOfertaLocalScanJobProgress`, `seedOfertaLocalScanPages`, `updateOfertaLocalScanPageProgress` |
| 11 | Gemini provider execution | `app/lib/ofertas-locales/ofertasLocalesGeminiScanPipeline.ts`, `ofertasLocalesGeminiPageExtractor.ts`, `ofertasLocalesGeminiConfig.ts` | `runGeminiMultimodalOfertaLocalScan` |
| 12 | Document AI fallback | `app/lib/ofertas-locales/ofertasLocalesDocumentAiClient.ts`, `ofertasLocalesDocumentAiConfig.ts` | `processOfertaLocalAssetWithDocumentAi`, `isOfertaLocalDocumentAiConfigured` |
| 13 | PDF/page handling | `app/lib/ofertas-locales/ofertasLocalesPdfPageImages.ts` | `prepareOfertaLocalScanPageImages` |
| 14 | Candidate normalization | `app/lib/ofertas-locales/ofertasLocalesAiNormalizer.ts`, `ofertasLocalesGeminiNormalizer.ts`, `ofertasLocalesAiPriceNormalizer.ts`, `ofertasLocalesPriceNormalization.ts` | `normalizeDocumentAiResultToOfertaLocalItems`, `normalizeOfertaLocalPrice` |
| 15 | Item persistence | `ofertasLocalesScanApiHandler.ts`, `app/lib/ofertas-locales/ofertasLocalesAiDbMapper.ts` | `mapOfertaLocalSearchableItemDraftToDbInsert`, insert into `oferta_local_items` |
| 16 | Orchestration / provider fallback gate | `app/lib/ofertas-locales/ofertasLocalesAiScanOrchestrator.ts` | `runOfertaLocalAiScanExtraction`, `runDocumentAiFallback` |
| 17 | Source page / bbox / crop | `app/lib/ofertas-locales/ofertasLocalesScanCropGenerator.ts`, `ofertasLocalesScanProgress.ts` | `applyOfertaLocalScanItemCrops`, `seedOfertaLocalScanPages` |
| 18 | Review item retrieval API | `app/api/ofertas-locales/items/route.ts`, `app/lib/ofertas-locales/ofertasLocalesItemReviewClient.ts` | `GET`, `fetchOfertaLocalReviewItems` |
| 19 | Review item mutation API | `app/api/ofertas-locales/items/[itemId]/route.ts`, `app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts` | `PATCH`, `validateOfertaLocalItemReviewPatch`, `mapOfertaLocalItemReviewPatchToDbUpdate` |
| 20 | Review UI hydration / page review state | `app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanPanel.tsx` (polling), review workbench components | `fetchOfertaLocalReviewItems` polling loop |
| 21 | Owner/admin auth resolution for scanner routes | `app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts` | `resolveOfertasLocalesOwnerOrAdminAuth` |
| 22 | Draft/owner storage reconciliation | `app/lib/ofertas-locales/useOfertasLocalesDraft.ts`, `ofertasLocalesDraftPersistence.ts` | owner-stamp reconciliation (added in `c53c7ce3`) |

---

## 5. CLIENT READINESS CONTRACT

`getOfertaLocalAiScanReadiness(draft, context)` returns `ready: true` only when ALL of:
- `isOfertaLocalAiIncludedInPackage(draft)` — canonical entitlement, catalog-driven, NOT the deprecated `draft.wantsAiSearchableSpecials` flag.
- `getOfertaLocalScanEligibleAssets(draft).length > 0` — at least one uploaded (storage path + URL) PDF/JPG/PNG/WebP asset.
- `context.signedIn !== false`.
- `hasOfertaLocalId || canPersistForScan` — either a canonical record already exists, or `canOfertaLocalDraftPersistForAiScan(draft)` passes (business identity + location + contact + eligible asset — deliberately narrower than final-publish validation; does NOT require `validFrom`/`validUntil`/`couponText`).
- `!context.serverConfigurationMissing`.

Missing-prerequisite messages are field-specific (bilingual), sourced from `validateOfertaLocalDraftForAiScanPersist`'s issue list, not a single generic sentence (fixed in `f036fd64`... — actually `c53c7ce3`).

---

## 6. DRAFT/OWNER IDENTITY CONTRACT

- `applicationSessionId` — client-generated, identifies one browser draft session.
- `owner_id` — Supabase `auth.users.id`, set server-side from the authenticated session on every write; never trusted from the client.
- Browser draft storage (`localStorage`/`sessionStorage`) is **owner-stamped** (`OFERTAS_LOCALES_DRAFT_OWNER_KEY`, added `c53c7ce3`): a different authenticated owner signing in on the same browser resets to a blank draft rather than inheriting another account's draft. An anonymous (unclaimed) draft may still be claimed by the first account that signs in.
- `handleStartFresh()` clears local/session draft storage AND strips the `?id=` URL param (fixed `ccb99549`) — a stale canonical id can no longer force a "continue" decision after an explicit start-over.
- Server-side ownership is enforced independently on every route (`owner_id` equality checks in `scan-prep`, `scan`, `items` PATCH) — client-side identity fixes never weaken this.

---

## 7. ASSET CONTRACT

- Eligibility (`assetIsAiScanEligible` / `getOfertaLocalScanEligibleAssets`): asset must be uploaded (`storagePath` + `url` both non-empty), not an `external_url` type, and MIME type in `{application/pdf, image/jpeg, image/jpg, image/png}` (readiness) or additionally `image/webp` at the scan-panel display layer.
- `assetHasUploadedWithUrl` / `assetHasUploadedStorage` distinguish "uploaded to storage" from "locally selected but not yet uploaded" — a locally-selected-but-unuploaded file is never scan-eligible.
- Source asset **versioning**: `resolveOrCreateScanSourceVersion` (in `ofertasLocalesScanApiHandler.ts`) either resolves an existing `ofertas_local_source_assets` row (if `sourceAssetVersionId` was passed) or creates one via `createOfertaLocalSourceVersion` (in `ofertasLocalesAssetLifecycle.ts`). Every scan job and every item row carries `source_asset_version_id`.

---

## 8. SCAN-PREP CONTRACT

`POST /api/ofertas-locales/scan-prep`:
- Auth required (`getBearerUserId`).
- Validates via `validateOfertaLocalDraftForAiScanPersist` — 422 with field-level issues if invalid.
- Inserts or updates `ofertas_locales` via `buildOfertasLocalesScanPrepInsertRow`/`buildOfertasLocalesScanPrepUpdateRow` (both delegate to `buildOfertasLocalesProductionInsertRow`, filtered to `OFERTAS_LOCALES_PRODUCTION_COLUMN_SET`).
- Returns `{ ok, id, status, created, leonixAdId, submittedAt }`.
- The `.select()` return-column list (`OFERTAS_LOCALES_WRITE_RETURN_COLUMNS`) must exactly match live production columns or PostgREST returns `PGRST204` — see §17.

---

## 9. SCAN ROUTE CONTRACT

`POST /api/ofertas-locales/scan` (handler: `handleOfertaLocalScanPost`):
- Auth + provider-configured + Supabase-admin-configured checks first.
- Body: `{ ofertaLocalId, assetId, assetKind, assetUrl, storagePath, mimeType, sourceAssetVersionId? }`.
- Rejects scanning parents with `status` in `{rejected, archived}`.
- Ownership: non-admin caller's `auth.actorUserId` must equal the parent row's `owner_id`.
- Resolves/creates source asset version → inserts `oferta_local_scan_jobs` (`status: "processing"`) → downloads asset bytes (`fetchAssetBytes`, HTTPS-only, size-limited) → calls `runOfertaLocalAiScanExtraction` with page-progress callbacks (`onPagesPrepared`/`onPageStarted`/`onPageFinished`) that seed `oferta_local_scan_pages` and update `oferta_local_scan_jobs` progress columns in real time.
- On success: inserts `oferta_local_items` rows, updates `oferta_local_scan_jobs` to `status: "needs_review"`, updates `ofertas_locales.ai_scan_status`.
- On any thrown error: marks the scan job `status: "failed"` with `error_message`/`failure_summary`, updates `ofertas_locales.ai_scan_status = "failed"` with `last_scan_error`, returns the real HTTP error to the client — no silent failure.

---

## 10. PROVIDER/FALLBACK CONTRACT

`runOfertaLocalAiScanExtraction` (`ofertasLocalesAiScanOrchestrator.ts`), exact current logic:
1. `resolveOfertasAiExtractionProvider()` picks `"gemini_multimodal"` if `GEMINI_API_KEY` is set, else Document AI if configured, else throws.
2. If Gemini: run `runGeminiMultimodalOfertaLocalScan`. Success is judged **only** by `gemini.items.length > 0`, never by `gemini.ok` alone (fixed `02639b40` — a technically-"ok" Gemini response with zero real candidates, e.g. from PNG-rasterization-unavailable passthrough, is NOT treated as success).
3. If Gemini produced zero items (whether it threw or returned empty) AND Document AI is configured → fall through to `runDocumentAiFallback`.
4. If Gemini produced zero items and Document AI is NOT configured → return Gemini's own (possibly empty) result honestly rather than erroring.
5. If the resolved provider is Document AI directly (Gemini not configured) → `runDocumentAiFallback` runs as the primary path, not a fallback.

`runDocumentAiFallback` calls `processOfertaLocalAssetWithDocumentAi` then `normalizeDocumentAiResultToOfertaLocalItems`.

---

## 11. NORMALIZATION CONTRACT

- Gemini path: normalization happens inside `ofertasLocalesGeminiScanPipeline.ts`/`ofertasLocalesGeminiNormalizer.ts`, producing `OfertaLocalSearchableItemDraft[]` directly.
- Document AI path: `normalizeDocumentAiResultToOfertaLocalItems` (`ofertasLocalesAiNormalizer.ts`) converts raw OCR text/entities into the same `OfertaLocalSearchableItemDraft[]` shape.
- Price truth: `normalizeOfertaLocalPrice` (`ofertasLocalesPriceNormalization.ts`) is applied a second time server-side (`enrichItemRowWithPriceTruth` in `ofertasLocalesScanApiHandler.ts`) immediately before DB insert, deriving `price_amount_cents`, `original_price_text`, `price_parse_status` from whatever the provider/normalizer produced.

---

## 12. DATABASE CONTRACT

All columns below were verified present in production (`xuieateniufcrsfdomwl`) at certification time via direct schema queries — not inferred from migration files alone, since production's actual shape diverges from some migration files' literal text (see §13).

### `public.ofertas_locales`
- **Purpose**: canonical parent record for one Ofertas/Cupones listing (draft → scanned → reviewed → published).
- **PK**: `id uuid`.
- **Owner relation**: `owner_id uuid references auth.users(id)`.
- **Scanner-critical columns**: `ai_scan_status`, `ai_last_scan_job_id`, `last_scan_error`, `flyer_assets`/`coupon_assets` (jsonb), `primary_asset_id`/`primary_asset_url`/`primary_storage_path`/`primary_mime_type`/`primary_file_name`, `active_source_asset_id`, `public_source_asset_id`, `asset_lifecycle_status`, `asset_replacement_required_review`, `wants_ai_searchable_specials` (legacy, superseded by canonical entitlement helper).
- **Status fields**: `status` (`draft|submitted|pending_review|approved|rejected|archived|expired`), `ai_scan_status` (`not_started|processing|needs_review|failed`).
- **FKs**: `partner_assignment_id → ofertas_local_partner_assignments`, `active_source_asset_id`/`public_source_asset_id → ofertas_local_source_assets`.
- **RLS**: enabled; owner-scoped select/insert/update policies; service role bypasses for API routes.

### `public.oferta_local_scan_jobs`
- **Purpose**: one row per scan attempt against one source asset version.
- **PK**: `id uuid`.
- **Owner relation**: `owner_id uuid`, `oferta_local_id → ofertas_locales(id)`.
- **Scanner-critical columns**: `status`, `provider`, `normalizer_provider`, `source_asset_version_id`, `items_extracted_count`, `pages_processed`, `total_pages`, `completed_pages`, `failed_pages`, `current_page`, `current_stage`, `retry_count`, `failure_summary`, `error_message`, `last_activity_at`, `confidence_average`.
- **Status fields**: `status` (`idle|pending|processing|needs_review|reviewed|approved|failed|cancelled`), `current_stage` (`uploading|preparing|rasterizing|scanning|extracting|creating_crops|awaiting_review|failed|complete`).
- **FKs**: `oferta_local_id`, `owner_id`, `source_asset_version_id → ofertas_local_source_assets`.
- **RLS**: enabled; owner-scoped.

### `public.oferta_local_items`
- **Purpose**: one row per extracted candidate product/deal.
- **PK**: `id uuid`.
- **Owner relation**: `owner_id uuid`, `oferta_local_id`, `scan_job_id`.
- **Scanner-critical columns**: `candidate_type`, `regular_price_text`, `source_context`, `source_bbox` (jsonb), `source_bbox_format` (`normalized_0_1`), `source_crop_url`, `review_status`, `is_active`, `source_asset_version_id`, `source_lifecycle_status`, `scan_page_id`, `price_amount_cents`, `regular_price_amount_cents`, `price_parse_status`.
- **Status fields**: `review_status` (`pending|needs_review|approved|rejected`), `source_lifecycle_status` (`active|superseded|removed`), `price_parse_status` (`unknown|parsed|deal_text|manual|invalid`).
- **FKs**: `oferta_local_id`, `scan_job_id → oferta_local_scan_jobs`, `owner_id`, `source_asset_version_id → ofertas_local_source_assets`, `scan_page_id → oferta_local_scan_pages`.
- **RLS**: enabled; owner-scoped select/insert; update limited to reviewable states.

### `public.ofertas_local_source_assets`
- **Purpose**: versioned flyer/coupon source files — one canonical parent may have many versions over time.
- **PK**: `id uuid`.
- **Owner relation**: `owner_id`, `oferta_local_id`.
- **Scanner-critical columns**: `version_number`, `asset_kind`, `storage_path`, `public_url`, `mime_type`, `page_count`, `scan_job_id`, `review_state`, `lifecycle_status`.
- **Status fields**: `lifecycle_status` (`pending_review|active|superseded|removed|scan_failed`), `review_state` (`needs_review|approved|rejected`).
- **FKs**: `oferta_local_id`, `owner_id`, `scan_job_id → oferta_local_scan_jobs`.
- **RLS**: enabled; owner-scoped select.

### `public.oferta_local_scan_pages`
- **Purpose**: page-level scan progress/failure truth (Package 7).
- **PK**: `id uuid`.
- **Owner relation**: `owner_id`, `oferta_local_id`, `scan_job_id`.
- **Scanner-critical columns**: `page_number`, `page_status`, `stage`, `candidate_count`, `item_count`, `crop_count`, `error_message`.
- **Status fields**: `page_status` (`queued|processing|completed|failed|skipped`), `stage` (`queued|rasterizing|scanning|extracting|creating_crops|completed|failed|skipped`).
- **FKs**: `oferta_local_id`, `scan_job_id`, `source_asset_version_id → ofertas_local_source_assets`.
- **RLS**: enabled; owner-scoped select.

### `public.ofertas_local_asset_cleanup_queue`
- **Purpose**: deferred cleanup queue for superseded source/crop artifacts (Package 7/8) — does not imply physical deletion.
- **PK**: `id uuid`.
- **Owner relation**: via `oferta_local_id → ofertas_locales`.
- **Scanner-critical columns**: `cleanup_type`, `status`, `attempt_count`, `processing_lease_id`, `lease_expires_at`, `retry_after_at`, `max_attempts`.
- **RLS**: enabled; owner-scoped select via parent join.

---

## 13. MIGRATION CONTRACT

Canonical dependency chain (all six files read in full at certification time):

```
20260616130000_ofertas_locales_ai_production_bootstrap.sql          (Package 4A)
  → 20260731222500_ofertas_locales_30_day_public_term.sql            (Package 4B)
    → 20260731235500_ofertas_locales_commercial_activation_identity.sql (Package 5)
      → 20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql (Package 6)
        → 20260801013000_ofertas_locales_ai_scan_review_publication.sql (Package 7)
          → 20260801023000_ofertas_locales_renewal_operations_lifecycle.sql (Package 8)
```

**Known caveat — production status vs. migration text**: Package 4A's `create table if not exists` never literally ran against production; the base tables (`ofertas_locales`, `oferta_local_scan_jobs`, `oferta_local_items`) were created by an earlier, untracked bootstrap with a different (evolved) column shape. The app's own `OFERTAS_LOCALES_PRODUCTION_COLUMNS`/`OFERTAS_LOCALES_LEGACY_REMOVED_COLUMNS` contracts in `ofertasLocalesDbSchema.ts` already reflect true production reality, not the migration file text. All 6 packages ARE now fully reflected in live production schema (verified column-by-column, constraint-by-constraint, index-by-index during the reconciliation performed this session) and Packages 5-8 are recorded in Supabase migration history (see §22) — Packages 4A/4B are functionally present but not literally tracked in migration history under their canonical filenames.

**Package 6 production caveat — DO NOT reapply blindly**: production's `listing_analytics_event_type_check` constraint is a strict superset of what Package 6's migration file defines — it also includes `leonix_endorsement_add` and `leonix_endorsement_remove` (added by a later, separately-tracked migration, `leonix_endorsement_votes`). **Never** run Package 6's literal `drop constraint` / `add constraint` block against production; it would silently narrow the live constraint and break endorsement-vote event logging. Any future reconciliation must skip that specific block or first union in the extra values.

**RPC search_path hardening**: `activate_oferta_local_source_version(uuid,uuid,uuid)` and `activate_due_oferta_local_renewal(uuid,uuid)` both carry `SET search_path = public` (applied via a targeted `ALTER FUNCTION`, not baked into the `CREATE OR REPLACE FUNCTION` body). **Never** instruct a future repair agent to blindly re-run the canonical `CREATE OR REPLACE FUNCTION` definitions from the migration files verbatim against production — doing so would silently strip this hardening, since `CREATE OR REPLACE FUNCTION` without an explicit `SET` clause does not preserve a previously-applied `ALTER FUNCTION ... SET` config. If these functions ever need to change, re-apply the `SET search_path = public` clause in the same statement.

---

## 14. REVIEW RETRIEVAL CONTRACT

`GET /api/ofertas-locales/items?ofertaLocalId=...&scanJobId=...` (client: `fetchOfertaLocalReviewItems`):
- Auth required.
- Returns items scoped to the caller's own `owner_id` (or admin), filtered by `ofertaLocalId` and optionally `scanJobId`.
- Also returns scan job summaries (`scanJobs`) used for live progress polling in `OfertasLocalesAiScanPanel` (3.5s interval while `scanning`).

---

## 15. REVIEW STATE CONTRACT

`PATCH /api/ofertas-locales/items/[itemId]` (`validateOfertaLocalItemReviewPatch` / `mapOfertaLocalItemReviewPatchToDbUpdate`):
- Auth + ownership required.
- Allows transitioning `review_status` among `pending|needs_review|approved|rejected` and toggling `is_active`.
- `step5ReviewComplete` (client) requires `totalItems > 0 && needsReviewCount === 0` — a zero-candidate scan can never present as "review complete" (fixed `16f020ba`).

---

## 16. KNOWN NON-FATAL CONDITIONS

- **`source_bbox` present but `source_crop_url` null** — non-fatal. Crop generation (`applyOfertaLocalScanItemCrops`) is a best-effort visual enhancement; a candidate with bbox data but no crop image is still a fully valid, reviewable, persistable item. Do not classify the scanner as broken solely because crops are absent — a dedicated crop-backfill endpoint (`backfillMissingCrops` request shape in `ofertasLocalesScanApiHandler.ts`) exists specifically to retrofit crops after the fact.
- **`"PNG rasterization unavailable; using single-page PDF for Gemini."`** in `error_message`/`raw_ocr_summary` — non-fatal IF the provider still succeeds, `items_extracted_count > 0`, and review rows persist. This is a known historical PDF-rasterization (pdf.worker/sharp) limitation on certain page shapes, not an extraction failure. It's a per-page note, not a job-level error.

---

## 17. FAILURE TREE

**SYMPTOM: "Analizar con IA" is disabled / click does nothing**
Check in this order: `readiness.ready` → `signedIn` → canonical package AI entitlement (`isOfertaLocalAiIncludedInPackage`) → `eligibleAssets` → minimum scan-time fields (`canOfertaLocalDraftPersistForAiScan`) → contact channel → owner identity → draft identity → stale `?id=` → browser draft ownership stamp → scan-prep Network request in devtools. Do NOT touch provider code until scan-prep dispatch is proven to have actually left the browser (check Network tab / server logs, not just DB state).

**SYMPTOM: scan-prep returns PGRST204**
Check the exact missing column named in the error → which migration package defines it → whether that package is actually present in production (query `information_schema.columns`, don't assume) → PostgREST schema cache freshness (`NOTIFY pgrst, 'reload schema'`). Do NOT add one column blindly — audit the whole corresponding package (see §13) and apply it as a unit.

**SYMPTOM: 42703 column does not exist**
Same as above. Check the corresponding package's full object inventory (tables + columns + constraints + indexes), not just the one named column, and check production migration history for whether that package was ever actually applied. Do NOT patch one field at a time.

**SYMPTOM: relation does not exist**
A whole package's tables are missing. Check migration dependency order (§13) — apply predecessor packages first. Re-verify RLS/policies exist immediately after table creation, since `create table if not exists` succeeding does not by itself confirm RLS was enabled or policies were created (check separately).

**SYMPTOM: parent row created but no scan job**
Check the `/scan` request actually fired (Network tab), the asset identity (`assetId`/`storagePath`/`mimeType` all present and valid), owner identity match, and the route's actual HTTP response/server logs — not just DB state.

**SYMPTOM: scan job exists but provider failed**
Check `provider` field on the job row, `error_message`/`failure_summary`, whether Document AI fallback was invoked (`raw_ocr_summary.provider_used`), env configuration state (§5 of this manual — names only), asset URL/storage-path validity, and PDF page-handling errors.

**SYMPTOM: provider returned zero candidates**
Check Gemini's raw candidate response (`raw_ocr_summary`), normalization output, whether Document AI fallback ran, and confirm the item-count-zero state did NOT get marked as review-complete (§15 — `step5ReviewComplete` requires `totalItems > 0`).

**SYMPTOM: items persisted but UI says zero**
Check `ofertaLocalId` used by the client matches the row's actual id, `scan_job_id` filter, the `/items` endpoint's response, review filters, `review_status`, `is_active`, `source_lifecycle_status`, and client-side counters (`aiReviewGate` state in `OfertasLocalesApplicationClient.tsx`).

---

## 18. REPAIR PLAYBOOK

1. Reproduce the exact symptom with the smoke QA account (never invent behavior from memory).
2. Identify the first-zero boundary using §17.
3. Read this manual's relevant contract section (§5-§15) before touching any code.
4. Modify the smallest responsible file — never "fix" by touching multiple layers simultaneously.
5. Run every audit in §19/Gate 13 of the certification task, plus the new baseline audit (§10 manifest).
6. Perform a real, live production QA action (not just DB inspection) before declaring the fix complete.
7. Reseal — update `OFERTAS_AI_SCANNER_SEALED.md`'s known-good result if the fix changes what "known-good" looks like.

---

## 19. GOLDEN QA PROCEDURE

Canonical PASS condition, all 13 required:
1. authenticated owner
2. valid minimum scan-time draft (`canOfertaLocalDraftPersistForAiScan` true)
3. eligible uploaded flyer
4. scan-prep returns 2xx
5. canonical owner-bound `ofertas_locales` row exists
6. scan job exists
7. provider executes (Gemini or Document AI fallback)
8. `items_extracted_count > 0`
9. `oferta_local_items` rows exist > 0
10. review rows load in the UI
11. bbox/highlight data displays where present
12. owner can approve/reject/review-later
13. historical rows (other listings, other scans) remain untouched

Physical `source_crop_url` generation is NOT required for certification (§16).

Reference known-good production result: 8-page Cardenas flyer, 127 extracted products, 8/8 pages, editable review workflow confirmed visible. Exact row/scan-job IDs from that run were not captured in evidence available at certification time and are not invented here.

---

## 20. NEVER-DO LIST

- Never reintroduce `draft.wantsAiSearchableSpecials` as an independent scan-blocking gate — use `isOfertaLocalAiIncludedInPackage(draft)`.
- Never reuse the full final-publish validator (`validateOfertaLocalDraftForFuturePublish`) for scan-time persistence — scan-time and publish-time validation are deliberately separate (`ccb99549`).
- Never let a zero-candidate scan present as "review complete" — `totalItems > 0` is required.
- Never patch a single missing production column in isolation — audit and apply the whole migration package.
- Never re-run Package 6's `listing_analytics_event_type_check` drop/recreate against production verbatim.
- Never re-run `activate_oferta_local_source_version`/`activate_due_oferta_local_renewal`'s `CREATE OR REPLACE FUNCTION` without re-adding `SET search_path = public`.
- Never weaken owner-scoped RLS/ownership checks to "fix" a UX symptom.
- Never let an authenticated owner silently inherit another owner's browser draft (owner-stamp reconciliation must remain intact).
- Never gate wizard step-rail navigation on field validation — navigation is permissive, action validation (scan/publish) is strict.

---

## 21. SAFE UI-ONLY CHANGE BOUNDARY

Safe to change without reopening this certification: review workspace layout, CTA labels/styling, page-navigation chrome, wizard step-rail presentation, bilingual copy, dashboard arrangement — as long as they continue calling the exact contracts in §5-§15 without changing their request/response shape or the DB schema they depend on.

NOT safe without explicit scanner reopen: anything listed in §2 and §20.

---

## 22. CURRENT CERTIFIED COMMITS/MIGRATION HISTORY

Commits (verified present in `integration/ofertas-locales-2026-07` ancestry at certification time):

| SHA | Summary |
|---|---|
| `02639b40` | Wrapped unguarded scan fetches in try/catch; fixed Gemini success-gate to require `items.length > 0` |
| `7cc1b221` | Simplified draft-identity load-decision fallback |
| `23296300` | Draft hydration race fixes, canonical DB recovery, owner-editable-status gating |
| `16f020ba` | Fixed zero-candidate false "review complete" |
| `ca982836` | Replaced deprecated AI flag with canonical entitlement helper (readiness) |
| `ccb99549` | Separated scan-time persistence validation from full publish validation |
| `c53c7ce3` | Owner-scoped browser draft storage; field-specific readiness messaging |
| `f036fd64` | Permissive wizard step-rail navigation (removed forward-nav validation gate) |

Production Supabase (`xuieateniufcrsfdomwl`) migration history entries (recorded, not reapplied):

| Version | Name |
|---|---|
| `20260827161634` | `ofertas_locales_commercial_activation_identity` |
| `20260827170809` | `ofertas_locales_30_day_public_term` |
| `20260827170949` | `ofertas_locales_partner_analytics_asset_lifecycle` |
| `20260827171134` | `ofertas_locales_ai_scan_review_publication` |
| `20260827171252` | `ofertas_locales_renewal_operations_lifecycle` |
| `20260827171444` | `ofertas_locales_partner_analytics_asset_lifecycle_reconciliation_finalize` |
| `20260827171458` | `ofertas_locales_package7_8_rpc_search_path_hardening` |

---

## 23. PRODUCTION RECOVERY CHECKLIST

If the scanner regresses in production:
1. Do NOT touch code until the DB/migration state is verified (§13, §17).
2. Query production directly — never assume migration history matches live schema; production has diverged from migration-file text before (§13).
3. Compare live schema against §12's documented column/constraint/index lists.
4. If a migration package is missing, apply it as a full unit (respecting the Package 6 constraint caveat and the RPC search_path caveat).
5. Reload PostgREST schema cache after any DDL.
6. Re-run the golden QA procedure (§19) with a real account and a real flyer before declaring recovery complete.
7. Update this manual and the sealed document if root cause reveals a gap in documented contracts.

---

## 24. HOW TO HAND THIS FILE TO A FUTURE CLAUDE/AGENT

Point a future agent at this file FIRST, before any Ofertas scanner work. It should:
1. Read this manual in full before touching scanner-adjacent code.
2. Read `app/lib/ofertas-locales/ofertasAiScannerProtectedPaths.ts` to know which files require explicit reopen authorization vs. which are safe UI territory.
3. Read `app/lib/ofertas-locales/OFERTAS_AI_SCANNER_SEALED.md` for the short-form current status.
4. Run `npm run ofertas:ai-scanner-certified-baseline-audit` before and after any change touching a protected path.
5. Never modify a protected-path file without the user explicitly stating they are reopening the scanner certification, per the REOPEN PROCEDURE in `OFERTAS_AI_SCANNER_SEALED.md`.
