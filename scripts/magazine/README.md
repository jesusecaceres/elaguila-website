# Magazine Provider Proof Scripts

Status: `MAGAZINE-TRANSLATION-NIGHTLY-CLOSEOUT1`

**Handoff:** [`docs/magazine-translation-nightly-closeout.md`](../docs/magazine-translation-nightly-closeout.md) — recommended next: `MAGAZINE-COMPANION-READER-READINESS1`. Do not run paid DeepL smoke until corrected Canva export + explicit approval.

These scripts prepare a backend/provider smoke path for the digital magazine without publishing assets or forcing paid API calls. They default to dry-run behavior and must not print secret values.

## Source Asset

Expected source PDF:

`public/magazine/2026/june/leonix_media_june.pdf`

Current local `sourcePdfHash` from Gate B:

`8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986`

Compute again any time the source PDF changes:

```bash
node scripts/magazine/hash-source.mjs --dry-run
node scripts/magazine/hash-source.mjs --write
```

The `--write` command stores a local proof record under `.magazine-proof-output/june-2026/pt/`, which is ignored by git.

## Local Proof Output

Allowed local-only proof folders:

- `.magazine-proof-output/`
- `tmp/magazine-proof/`
- `.tmp-magazine-proof/`

Do not move generated translated PDFs, rendered images, or provider output into `public/`. Do not commit generated proof output.

## DeepL Document Smoke

Blocked until both are true:

- Install dependency: `npm install deepl-node` (official npm package; completed in `MAGAZINE-DEEPL-ENV-SETUP1`)
- Set `DEEPL_AUTH_KEY` in local `.env.local` (never commit; never paste into chat)

Add locally in `.env.local`:

```env
# DeepL document translation API key. Do not commit real values.
DEEPL_AUTH_KEY=
```

Re-check readiness (prints TRUE/FALSE only; never prints the key):

```bash
node scripts/magazine-deepl-readiness-audit.mjs
```

When the script reports `decision=READY_FOR_REAL_PT_SMOKE`, the next gate is `MAGAZINE-DEEPL-PT-REAL-SMOKE3` (first paid provider call — requires intentional approval).

Safe preflight (zero cost):

```bash
node scripts/magazine/proof-translate-deepl.mjs --dry-run --target=pt
```

Execution remains held until dependency/env are present and the DeepL document API call is implemented and reviewed. This gate is Portuguese-only; the script refuses non-`pt` targets, broad/all-language targets, and held inactive `ar`/`fa`.

## Google Document Smoke

Blocked until all are true:

- Install dependency: `npm install @google-cloud/translate`
- Set `GOOGLE_CLOUD_PROJECT_ID`
- Set `GOOGLE_APPLICATION_CREDENTIALS_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`
- Optionally set `GOOGLE_TRANSLATE_LOCATION`; use the provider-required location for document translation

Safe preflight:

```bash
node scripts/magazine/proof-translate-google.mjs --dry-run --target=pt
```

The existing `app/lib/translation/provider.ts` path is a text `translateText` provider for `/api/translate-ad`; do not reuse or modify it for magazine document smoke in this gate.

## Rendering And Manifest

Rendering is held until implementation review:

```bash
node scripts/magazine/proof-render.mjs --dry-run
```

After a real local provider output exists, create local proof metadata:

```bash
node scripts/magazine/proof-manifest-from-output.mjs --write --target=pt --provider=deepl
```

The proof manifest is local-only and must keep:

- `status: "translated_pending_qa"`
- `qaApproved: false`
- `publicAssetPath: null`

## QA Before Availability

Before any manifest/public asset update:

1. Confirm `sourcePdfHash` still matches the Spanish source PDF.
2. Review phone numbers, emails, URLs, QR codes, business names, prices, coupon codes, layout, and brand marks.
3. Render pages for visual inspection.
4. Keep the HTML companion available while visual assets are pending.
5. Keep the original Spanish PDF and FlipHTML5 edition honest as the only current visual edition.
6. Update `app/lib/magazine/magazineVisualTranslationManifest.ts` only after real files exist and QA approves them.

Do not mark any translated visual asset QA-approved from these scripts.
