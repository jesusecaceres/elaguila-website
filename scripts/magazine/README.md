# Magazine Visual Translation Proof Scripts

These scripts are placeholders for a later provider-smoke gate. They are safe stubs in this gate and must not call DeepL, Google, or any paid API.

## Later Provider Workflow

1. Put the source PDF in a local proof input folder outside committed generated output.
2. Compute `sourcePdfHash`.
3. Optionally run a DeepL document translation smoke on one real magazine PDF.
4. Optionally run a Google document translation smoke on one real magazine PDF.
5. Render PDF pages to WebP or another review format.
6. Create a proof manifest with `qaApproved: false`.
7. Open `/magazine/poc-view?lang=<target>`.
8. QA manually.
9. Only then mark a translated visual track available.

## Safety Rules

- Do not print environment variable values.
- Do not commit heavy generated assets.
- Do not mark translated assets QA-approved from scripts.
- Do not replace production magazine routes.
- Do not claim a translated PDF or translated FlipHTML5 edition until the file exists and QA approves it.

## Stub Commands

These scripts currently exit safely:

- `node scripts/magazine/proof-render.mjs`
- `node scripts/magazine/proof-translate-deepl.mjs`
- `node scripts/magazine/proof-translate-google.mjs`
