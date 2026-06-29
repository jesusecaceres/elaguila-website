# Magazine Visual Translation Proof

Status: `MAGAZINE-ASSET-CACHE1`

This document locks the safe architecture proof and first code-level registry layer for Leonix Media digital magazine translation. It does not translate PDFs, FlipHTML5 books, rendered page images, ads, or live database content. It separates text translation memory, visual asset cache, and reusable advertiser assets so future gates can add real production behavior without creating duplicate caches or false visual translation claims.

## Scope Lock

In scope for this proof:

- Magazine HTML reader and companion translation architecture.
- Future visual asset registry concepts for translated PDFs, rendered page images, translated page images, and advertiser ad assets.
- Static helper functions for visual asset availability/status.
- Cost-control rules for repeated copy and repeated visual ads.
- Honesty rules for the Spanish original PDF and FlipHTML5 edition.

Out of scope for this proof:

- Google API calls or live translation smoke.
- `/api/translate-ad` changes.
- Google provider changes.
- Supabase schema or migration changes.
- New `ad_translations`, `listing_translations`, or duplicate translation memory tables.
- PDF or FlipHTML5 asset edits.
- Clasificados, publish wizards, Negocios Locales, admin auth, or team auth.

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

## Asset Registry Helpers

`app/lib/magazine/magazineVisualTranslationManifest.ts` now exposes a static registry and helper functions:

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

## Future Gates

- `GOOGLE-TRANSLATION-PREFLIGHT-AND-SMOKE1`: verify Google env and cache read/write smoke when credentials are ready.
- `MAG-COMPANION-BODY-LANG1`: improve companion body copy for active public languages.
- `QR-GUIDE-LONGFORM-LANG1`: polish QR translation instructions in all active public languages.
- `MAGAZINE-ASSET-CACHE1`: static registry helpers added; future work must still add real storage/QA integration before serving translated assets.
- `MAGAZINE-AD-ASSET-LIBRARY1`: add reusable advertiser ad asset tracking after product rules are approved.
