# Magazine Visual Translation Proof

Status: `MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1`

Provider backend status: `MAGAZINE-DEEPL-PT-REAL-SMOKE2` reached `STOP_HOLD_FOR_DEEPL_ENV`. The June 2026 Spanish source PDF exists and hashes locally to `8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986`. Portuguese (`pt`) remains the locked first document/visual smoke target, but the real DeepL smoke was not run because `DEEPL_AUTH_KEY` is still not present in the local Cursor environment.

Platform registry status: `MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1` added `public.magazine_visual_assets`, RLS public-read-only-for-approved-rows, platform TypeScript helpers, and `docs/magazine-translation-platform-runbook.md`. No translated visual edition is public yet.

Leonix Media's digital and printed magazine is now the flagship multilingual product. Clasificados and Negocios Locales dynamic translation are postponed while magazine visual editions, HTML companions, QR bridge flows, and reusable advertiser assets move first.

This proof locks the foundation for multilingual visual magazine editions. It does not translate PDFs, FlipHTML5 books, rendered page images, ads, or live database content. It separates text translation memory, visual asset cache, and reusable advertiser assets so future gates can add real production behavior without duplicate caches or false visual translation claims.

## Scope Lock

In scope for this proof:

- Magazine HTML reader and companion translation architecture.
- Future visual asset registry concepts for translated PDFs, rendered page images, translated page images, and advertiser ad assets.
- Static helper functions for visual asset availability/status.
- Private proof route for internal evaluation before any public replacement.
- Cost-control rules for repeated copy and repeated visual ads.
- QR print-to-digital bridge strategy.
- Honesty rules for the Spanish original PDF and FlipHTML5 edition.

Out of scope for this proof:

- Google API calls or live translation smoke.
- `/api/translate-ad` changes.
- Google provider changes.
- Supabase schema or migration changes.
- New `ad_translations`, `listing_translations`, or duplicate translation memory tables.
- PDF or FlipHTML5 asset edits.
- Public route replacement.
- Clasificados, publish wizards, Negocios Locales, admin auth, or team auth.

## Current Product Truth

- The current Spanish visual magazine remains available.
- The HTML readable companion remains available as a helper and summary layer.
- FlipHTML5 remains the fallback visual magazine viewer for now.
- A Leonix-owned visual viewer can come later, after proof and QA.
- Translated visual editions require real translated assets and QA approval.
- Do not claim PDF or FlipHTML5 translation unless the translated visual asset exists and is served.

## Provider Proof Rule

DeepL and Google document translation must each be tested with one real magazine PDF before Leonix commits to either provider for visual magazine production. That proof belongs in a later provider-smoke gate.

`MAGAZINE-PROVIDER-BACKEND-SMOKE1` did not call either provider. It added dry-run backend proof tooling under `scripts/magazine/`, ignored local proof output folders, and documented exact setup requirements. No produced translated visual asset exists from this gate.

`MAGAZINE-PROVIDER-SETUP-AND-PT-SMOKE1` updated the local proof tooling to default to Portuguese (`pt`) and refused `ar`, `fa`, and broad/all-language targets. It did not install provider dependencies because no provider env was present. It did not call paid APIs, create translated output, publish assets, or mark any translated visual asset QA-approved.

`MAGAZINE-DEEPL-PT-REAL-SMOKE1` checked for `DEEPL_AUTH_KEY` without printing its value and stopped before installing DeepL or calling any paid API. No translated PDF was produced, no proof manifest was written, and no public route or visual asset registry was changed.

`MAGAZINE-DEEPL-PT-REAL-SMOKE2` rechecked `DEEPL_AUTH_KEY`, reran the source hash and Portuguese dry-run guards, and stopped again before dependency install or provider execution. No translated PDF was produced, no proof manifest was written, and no public route or visual asset registry was changed.

`MAGAZINE-TRANSLATION-PLATFORM-MIGRATION1` added the real platform registry (`public.magazine_visual_assets`), RLS, platform helpers (`magazineVisualAssetsPlatform.ts`, `getApprovedMagazineVisualAsset.ts`), honest fallback wiring in `languageAssets.ts`, and the operational runbook. No provider was called, no translated PDF was generated, no asset was QA-approved, and no translated visual edition is public.

This gate must not:

- Call DeepL.
- Call Google.
- Upload a live magazine to a paid provider.
- Store or print provider credentials.
- Mark a translated visual edition public.

## Language Rules

Active public magazine language targets remain:

`es`, `en`, `vi`, `pt`, `tl`, `km`, `zh`, `ja`, `ko`, `hi`, `hy`, `ru`, `pa`

Held inactive:

`ar`, `fa`

Leonix UI language normalization remains separate from provider targets:

- `fil` normalizes to `tl` for Leonix UI.
- `tl` maps to `fil` only when calling Google Translation.
- `zh`, `zh-CN`, and `zh-Hans` normalize to `zh` for Leonix UI.
- `zh`, `zh-CN`, and `zh-Hans` map to `zh-CN` only when calling Google Translation.
- Unsupported language requests must fall back safely to the default supported route language.

## System 1 - Text Translation Memory

Use this for:

- HTML companion text.
- Article summaries.
- Recurring magazine sections.
- Recipes.
- Advertiser descriptions.
- CTA phrases.
- Reusable business blurbs.

First preference is to reuse or extend the existing Supabase `translation_records` cache. Do not create a duplicate `TranslationMemory` table unless a future reviewed schema gate proves the current cache cannot support the needed fields.

Recommended cache identity:

- `source_locale`
- `target_locale`
- SHA-256 source text hash, or the existing repo hash helper if one is already in use for translation cache keys.
- Stable context key, such as `magazine:2026-june:companion:featured-businesses`.
- `source_text_version` or equivalent source version.
- Provider and quality status.

Cost-control rule: check `translation_records` first and do not call Google for repeated text that already has a fresh approved or acceptable cached result.

## System 2 - Magazine Visual Asset Cache

Use this for:

- Translated visual PDFs if they are truly produced.
- Rendered translated page images.
- Page-level visual assets.
- Approved translated visual pages.

Recommended visual cache identity:

- `sourcePdfHash`, `pageHash`, or `adAssetHash`.
- `targetLang`.
- `provider`.
- `sourceVersion`.
- `qaStatus`.

The current Spanish source PDF and FlipHTML5 edition are registered as `source_ready` source visual assets. Non-Spanish visual assets must stay `planned`, `unavailable`, `translated_pending_qa`, or `rejected` until real files exist and QA approves them.

Do not send entire PDFs to Google or DeepL in this proof. Future production should translate extracted text or approved design source segments, then generate real visual assets through a controlled production path.

Serving rule: do not serve a translated visual PDF, translated FlipHTML5 book, or translated page image until the asset exists, the source hash still matches, and QA status is approved.

Visual PDFs and rendered page images use asset-level caching, not word-level caching. Cache keys should be based on `sourcePdfHash`, `pageHash`, `adAssetHash`, target language, provider, source version, and QA status.

## Asset Registry Helpers

**Database registry (platform):**

- Table: `public.magazine_visual_assets` (migration `20260630140000`)
- Helpers: `app/lib/magazine/magazineVisualAssetsPlatform.ts`
- Server lookup: `app/lib/magazine/getApprovedMagazineVisualAsset.ts`
- Runbook: `docs/magazine-translation-platform-runbook.md`

**Static manifest (proof layer, not DB-backed):**

`app/lib/magazine/magazineVisualTranslationManifest.ts` exposes a static registry and helper functions:

- `getMagazineVisualAssetStatus(issueId, targetLocale, assetKind)`
- `hasQaApprovedMagazineVisualAsset(issueId, targetLocale, assetKind)`
- `getAvailableMagazineVisualAsset(issueId, targetLocale, assetKind)`
- `listMagazineVisualAssetsForIssue(issueId)`
- `listMagazineVisualAssetsForLocale(issueId, targetLocale)`

These helpers are not imported into public magazine UI in this gate. They are a safe integration layer for future gates that need to check whether a real translated visual asset can be served.

`hasQaApprovedMagazineVisualAsset` can only return true when all of these are true:

- `status` is `qa_approved`.
- `qaApproved` is `true`.
- `assetPath` is present.

`getAvailableMagazineVisualAsset` can return:

- The real Spanish source PDF or Spanish source FlipHTML5 record.
- A translated visual asset only after the QA-approved rule above passes.

It must not:

- Invent asset paths.
- Fall back to the Spanish PDF and label it translated.
- Treat the HTML companion as a translated visual PDF or translated flipbook.
- Use text translation memory as proof of a visual asset.

## Registering Future Translated Assets

A future asset-production gate may add a translated visual asset only after the file exists and source identity is known. Required checks:

- Preserve `issueId`, `sourceLocale`, `targetLocale`, `assetKind`, `sourceVersion`, and source hash fields.
- Set `assetPath` to the real translated file or approved translated flipbook URL.
- Keep `status` as `translated_pending_qa` until editorial/visual QA passes.
- Set `status: "qa_approved"` and `qaApproved: true` only after QA approval.
- Reuse an existing approved asset when `sourcePdfHash`, `pageHash`, or `adAssetHash` has not changed for that target language and source version.

## System 3 - Reusable Ad Asset Library

Use this for:

- Stable advertiser ads that repeat month after month.
- Pre-approved translated ad blocks.
- Visual ad images or pages.
- Copy blocks reused across issues.

Recommended identity:

- Advertiser id or stable advertiser slug.
- Issue id or reusable campaign id.
- `adAssetHash`.
- Source locale and target locale.
- Asset kind.
- Status.
- Approved asset path.
- Last source version checked.

Cost-control rule: if an advertiser ad has not changed, do not pay to translate it again. If an approved translated asset already exists for the same source hash, target language, provider, and source version, reuse it.

Most advertiser ads rarely change. Stable ads and pages should be hashed, translated once, QA-approved once, and reused across future issues until the source creative changes. Changed editorial/article/recipe/community pages can be translated per issue without reprocessing stable advertiser pages.

## QR Print-To-Digital Bridge

Printed magazine readers should have a stable language-aware helper route that explains the honest options:

- Open the Spanish visual edition.
- Read the HTML companion in the selected language when available.
- Use Google Lens, Apple Translate, or Google Translate as user-side tools for printed pages.
- Return to Leonix native forms and contact routes for actions.

The QR bridge must preserve language where possible and must not imply that a translated PDF or translated FlipHTML5 edition exists.

## PDF / FlipHTML5 Honesty

The original visual magazine remains the Spanish edition unless a real translated visual asset exists.

The HTML reader and companion can help users understand the magazine in their selected language. They are explanation, summary, and action layers; they do not replace the Spanish PDF or FlipHTML5 visual edition.

Do not claim:

- Translated PDF.
- Translated FlipHTML5.
- Full visual magazine translation.
- OCR-complete magazine translation.

Those claims are only allowed after a future asset gate verifies that real translated visual files exist and are served.

## Registry Manifest

`app/lib/magazine/magazineVisualTranslationManifest.ts` is a static, unimported registry file for future asset cache behavior. It does not call APIs and does not alter runtime behavior.

The registry keeps non-Spanish translated visual assets unavailable until real production assets exist. It is intentionally separate from both text Translation Memory and the existing live `languageAssets.ts` runtime helper, which currently serves Spanish visual originals with honest fallback messaging.

The private proof route at `/magazine/poc-view` may use mock data to show the future product model, but it does not replace `/magazine`, `/magazine/2026/june/read`, or the companion route.

## Future Gates

- `MAGAZINE-DEEPL-PT-REAL-SMOKE3`: real DeepL Portuguese document smoke when `DEEPL_AUTH_KEY` is available.
- `MAGAZINE-VISUAL-ASSET-QA1`: manual QA workflow for first real provider output before registry approval.
- `MAGAZINE-VISUAL-ASSET-PUBLIC-SERVE1`: storage bucket, signed URLs, and reader wiring for approved assets.
- `GOOGLE-TRANSLATION-PREFLIGHT-AND-SMOKE1`: verify Google env and cache read/write smoke when credentials are ready.
- `MAGAZINE-PROVIDER-SMOKE1`: compare one real magazine PDF through DeepL and Google document translation without public serving after backend smoke is ready.
- `MAG-COMPANION-BODY-LANG1`: improve companion body copy for active public languages.
- `QR-GUIDE-LONGFORM-LANG1`: polish QR translation instructions in all active public languages.
- `MAGAZINE-AD-ASSET-LIBRARY1`: add reusable advertiser ad asset tracking after product rules are approved.
