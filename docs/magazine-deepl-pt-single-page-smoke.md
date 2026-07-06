# MAGAZINE-DEEPL-PT-SINGLE-PAGE-SMOKE1

Gate date: 2026-07-06  
Classification: controlled provider smoke — Portuguese page 3 only

## Result

**DEEPL_PT_SINGLE_PAGE_SMOKE_DONE** — one-page DeepL document call succeeded; output saved locally for manual QA.

## Configuration

| Setting | Value |
|---------|-------|
| Source PDF | `public/magazine/2026/june/leonix_media_june.pdf` |
| Selected page | 3 (of 26) |
| Target | `pt` → DeepL `PT-BR` |
| One-page input | `.magazine-proof-output/june-2026/pt/page-smoke/page-003/source-page-003.pdf` (~3.0 MB) |
| Translated output | `.magazine-proof-output/june-2026/pt/page-smoke/page-003/deepl-page-003.pt.pdf` (~17.1 MB) |
| Provider calls | 1 (one-page only; full magazine not submitted) |
| Billed characters (DeepL) | 1613 |
| DeepL status | `done` |

## Manual QA (Chuy)

Open locally:

`.magazine-proof-output/june-2026/pt/page-smoke/page-003/deepl-page-003.pt.pdf`

Compare with Spanish page 3 in the source PDF. Verify:

1. Did visible Spanish text become Portuguese?
2. Did layout stay usable?
3. Did DeepL leave the page unchanged?
4. Is output readable enough to test another page?

**Do not publish** this file or claim a public Portuguese magazine edition.

## Next steps

- If output is usable: consider page 4 or another text-heavy page smoke before full-magazine spend.
- If output is unchanged or poor: fix Canva export for selectable text and/or prioritize companion reader path.
- Full magazine smoke: separate gate with explicit approval only.

## Commands

```bash
node scripts/magazine/proof-translate-deepl.mjs --target=pt --page=3 --dry-run
node scripts/magazine/proof-translate-deepl.mjs --target=pt --page=3 --execute
```

## Safety

- No public assets changed
- No Supabase rows inserted
- No API key printed
- Proof output gitignored
