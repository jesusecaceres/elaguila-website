# Magazine Translation Platform Runbook

Status: `MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1`

Operational guide for Leonix magazine translated visual asset registry, storage, QA, and public serving.

---

## 1. Current Truth

| Fact | Status |
|------|--------|
| Spanish June 2026 PDF exists | Yes — `public/magazine/2026/june/leonix_media_june.pdf` |
| Source SHA-256 hash | `8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986` |
| DeepL Portuguese output | Blocked — requires `DEEPL_AUTH_KEY` outside chat |
| Platform registry table | `public.magazine_visual_assets` (migration `20260630140000`) |
| Translated visual edition public | **No** — no row is QA-approved and publicly available |
| Storage bucket | **Hold** — no Supabase storage bucket migration in repo yet; use service-role upload in a later gate |

---

## 2. End-to-End Flow

```
SOURCE PDF (es)
  → provider output (DeepL/Google document — local/private)
  → .magazine-proof-output/ (gitignored)
  → manual visual QA
  → upload to storage (magazine-visual-assets bucket — future gate)
  → insert/update magazine_visual_assets row
  → QA review (qa_status, qa_approved)
  → approve or reject
  → set publicly_available = true ONLY after approval
  → public reader serves approved asset via registry lookup
```

**Rules:**

- Provider output always starts in ignored local folders.
- No registry row may set `qa_approved = true` without human QA.
- No row may set `publicly_available = true` unless `qa_approved = true` and `qa_status = 'approved'`.
- Spanish source PDF remains the official original — never overwrite or replace.

---

## 3. Approval Checklist

Before setting `qa_approved = true` and `qa_status = 'approved'`:

- [ ] Phone numbers unchanged from source
- [ ] Email addresses unchanged
- [ ] URLs unchanged and valid
- [ ] QR codes scan correctly
- [ ] Advertiser/business names preserved
- [ ] Prices and coupon codes preserved
- [ ] Brand marks and logos preserved
- [ ] No text overflow or layout breaks on mobile
- [ ] Mobile reader CTA works (open Spanish original / open translated when approved / QR helper fallback)

---

## 4. SQL Examples

### Insert planned Portuguese asset

```sql
INSERT INTO public.magazine_visual_assets (
  issue_id,
  year,
  month,
  source_locale,
  target_locale,
  asset_kind,
  source_pdf_hash,
  source_version,
  provider,
  status,
  qa_status,
  qa_approved,
  publicly_available,
  notes
) VALUES (
  '2026-june',
  2026,
  'june',
  'es',
  'pt',
  'translated_pdf',
  '8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986',
  '2026-june-spanish-original-v1',
  'deepl',
  'planned',
  'not_started',
  false,
  false,
  'Planned Portuguese translated PDF — no file uploaded yet.'
);
```

### Insert translated asset pending QA (after provider output + private upload)

```sql
UPDATE public.magazine_visual_assets
SET
  status = 'qa_pending',
  qa_status = 'pending',
  qa_approved = false,
  publicly_available = false,
  provider_job_id = '<provider-job-id>',
  provider_status = 'complete',
  storage_bucket = 'magazine-visual-assets',
  storage_path = '2026-june/pt/translated_pdf/8fa5ec5a9faa/leonix_media_june_pt.pdf',
  file_size_bytes = 12345678,
  mime_type = 'application/pdf',
  page_count = 48,
  fallback_reason = 'Pending visual QA before public serving.',
  updated_at = now()
WHERE issue_id = '2026-june'
  AND target_locale = 'pt'
  AND asset_kind = 'translated_pdf'
  AND source_pdf_hash = '8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986';
```

### Approve asset (after checklist pass)

```sql
UPDATE public.magazine_visual_assets
SET
  status = 'approved',
  qa_status = 'approved',
  qa_approved = true,
  publicly_available = false,
  reviewed_by = 'qa-reviewer@leonixmedia.com',
  reviewed_at = now(),
  approval_notes = 'Phone, URLs, QR, names, prices verified.',
  fallback_reason = null,
  updated_at = now()
WHERE issue_id = '2026-june'
  AND target_locale = 'pt'
  AND asset_kind = 'translated_pdf'
  AND source_pdf_hash = '8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986';
```

### Reject asset

```sql
UPDATE public.magazine_visual_assets
SET
  status = 'rejected',
  qa_status = 'rejected',
  qa_approved = false,
  publicly_available = false,
  reviewed_by = 'qa-reviewer@leonixmedia.com',
  reviewed_at = now(),
  approval_notes = 'URL on page 12 changed — retranslate required.',
  fallback_reason = 'Rejected during QA — not available for public serving.',
  updated_at = now()
WHERE issue_id = '2026-june'
  AND target_locale = 'pt'
  AND asset_kind = 'translated_pdf';
```

### Make asset public (only after QA approval)

```sql
UPDATE public.magazine_visual_assets
SET
  status = 'public',
  publicly_available = true,
  public_url = null,
  updated_at = now()
WHERE issue_id = '2026-june'
  AND target_locale = 'pt'
  AND asset_kind = 'translated_pdf'
  AND qa_approved = true
  AND qa_status = 'approved'
  AND storage_path IS NOT NULL;
```

---

## 5. Safety Rules

| Rule | Enforcement |
|------|-------------|
| No public row unless QA-approved | DB constraint + RLS `USING` clause |
| No public asset unless `publicly_available = true` | RLS + `canServeMagazineVisualAsset()` |
| No DeepL key in git | Never commit `.env.local` or keys |
| No fake PDF/FlipHTML5 claims | Reader uses registry; static registry passes `null` record until approved row exists |
| No source PDF edits | Source remains at `public/magazine/2026/june/leonix_media_june.pdf` |
| Service-role writes only | No anon/authenticated insert/update/delete policies |

---

## 6. Platform Helpers

| Module | Purpose |
|--------|---------|
| `app/lib/magazine/magazineVisualAssetsPlatform.ts` | Types, locale guards, `canServeMagazineVisualAsset`, storage path builder |
| `app/lib/magazine/getApprovedMagazineVisualAsset.ts` | Server-only RLS-gated lookup (fail closed) |
| `app/lib/magazine/languageAssets.ts` | Client-safe static registry; uses platform state for honest fallbacks |

---

## 7. Storage Hold

No `storage.buckets` migration exists in this repository. Do **not** create broad public write policies until a dedicated storage gate defines:

- Bucket name: `magazine-visual-assets` (recommended, private)
- Service-role upload path pattern from `buildMagazineVisualAssetStoragePath()`
- Signed URL or CDN serving for approved assets only

Next storage gate: `MAGAZINE-VISUAL-ASSET-PUBLIC-SERVE1` or dedicated storage migration gate.

---

## 8. Next Gates

| Gate | Purpose |
|------|---------|
| `MAGAZINE-DEEPL-PT-REAL-SMOKE3` | Real DeepL Portuguese document smoke with `DEEPL_AUTH_KEY` |
| `MAGAZINE-VISUAL-ASSET-QA1` | Manual QA workflow for first real provider output |
| `MAGAZINE-VISUAL-ASSET-PUBLIC-SERVE1` | Storage bucket + signed URL + reader wiring for approved assets |
