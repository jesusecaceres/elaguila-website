# Magazine Storage And Asset Cache

Status: `MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1`

Provider backend status: `MAGAZINE-DEEPL-PT-REAL-SMOKE2` is blocked before paid DeepL execution. The June 2026 source PDF can be hashed locally and Portuguese (`pt`) is the locked first smoke target, but DeepL document translation is not executable until `DEEPL_AUTH_KEY` is present in the local Cursor environment.

Platform registry status: `MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1` added `public.magazine_visual_assets` (migration `20260630140000`), TypeScript platform helpers in `app/lib/magazine/magazineVisualAssetsPlatform.ts`, and a server lookup in `app/lib/magazine/getApprovedMagazineVisualAsset.ts`. No translated visual edition is public yet. Storage bucket creation is held — see `docs/magazine-translation-platform-runbook.md`.

## 1. Translation Memory For HTML Text

Use for readable HTML text only:

- HTML companion sections.
- Article summaries.
- Recipes.
- Community page copy.
- Reusable CTA phrases.
- Advertiser descriptions that render as text.

Recommended identity:

- `sourceTextHash`
- `sourceLocale`
- `targetLocale`
- approved translated text
- provider
- quality status
- source version or context key

First preference is to reuse existing `translation_records` if it supports the needed shape. Do not create duplicate translation memory tables yet. Do not create `ad_translations` or `listing_translations` for this magazine proof.

## 2. Visual Asset Cache

Use for produced visual assets:

- translated PDF URL
- rendered page images
- standard image URL
- high-res image URL
- translated page images
- QA status and fallback reason

Recommended identity (now backed by `public.magazine_visual_assets`):

- `source_pdf_hash`
- `source_page_hash` when caching page-level renders
- `ad_asset_hash` for reusable ad pages
- `target_locale`
- `provider`
- `source_version`
- `storage_path` / `public_url`
- `qa_approved`, `qa_status`, `publicly_available`
- fallback reason

Visual assets are cached at asset level, not word level. If the source PDF hash and target language match a QA-approved translated PDF or page image with `publicly_available = true`, reuse that asset. If the source hash changes, mark the translated track stale or pending QA until rebuilt.

The Spanish source PDF and FlipHTML5 edition remain source assets. A non-Spanish visual edition is unavailable until a real translated asset exists, is registered, and QA approves it.

## 3. Reusable Ad Asset Library

Use for recurring advertiser creative:

- `adAssetHash`
- advertiser name
- stable ad true/false
- translations by language
- QA status
- used-in issue ids
- approved asset paths
- source version

Most advertiser ads rarely change. Stable ad pages should be hashed, translated once, QA-approved once, and reused across future issues. Do not retranslate unchanged advertiser assets.

Recommended future workflow:

1. Extract or register each advertiser creative block.
2. Compute `adAssetHash`.
3. Check for an approved translated asset with the same hash and target language.
4. Reuse approved assets across issues.
5. Translate only changed ad assets or issue-specific editorial pages.
6. Keep unapproved translated ad assets out of public visual editions.

## Fallback Rules

- Missing translated PDF: show Spanish original with an honest fallback message.
- Missing translated page image: show no translated visual page; route users to the companion and QR guide.
- Missing translated ad asset: use the Spanish original or do not include the translated visual edition until QA completes.
- HTML companion text does not prove a translated visual PDF exists.

## Later Provider Proof

Before production provider selection, run a controlled one-PDF proof:

1. Compute `sourcePdfHash`.
2. Test one real PDF with DeepL document translation.
3. Test one real PDF with Google document translation.
4. Render pages to reviewable images.
5. Create a proof manifest with `qaApproved: false`.
6. Review phone numbers, emails, URLs, QR codes, business names, prices, coupon codes, layout, and brand marks.
7. Only after QA should any translated visual track become available.

Current blocker:

- DeepL document smoke requires `@deepl/deepl-node` and `DEEPL_AUTH_KEY`.
- Google document smoke requires `@google-cloud/translate`, `GOOGLE_CLOUD_PROJECT_ID`, and `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`.
- Local proof outputs must stay under ignored folders such as `.magazine-proof-output/june-2026/pt/`.
- Any local proof manifest must remain `qaApproved: false` and must not set a public `assetPath` until manual visual QA approves real output.
- `MAGAZINE-DEEPL-PT-REAL-SMOKE1` did not install DeepL or call the provider because `DEEPL_AUTH_KEY` was missing. No translated output exists from this gate.
- `MAGAZINE-DEEPL-PT-REAL-SMOKE2` repeated the real-smoke readiness check and also stopped because `DEEPL_AUTH_KEY` is missing. No translated output exists from this gate.
- `MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1` added the durable registry table and platform helpers. No storage bucket migration yet. No translated asset is QA-approved or publicly available.
