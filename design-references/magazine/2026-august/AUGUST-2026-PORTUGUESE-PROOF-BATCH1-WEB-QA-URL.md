# AUGUST 2026 PORTUGUESE PROOF BATCH 1 WEB QA URLS

## Executive Summary

Temporary web QA URLs were created for Portuguese Batch 1 pages 12, 6, and 3. These pages are for Chuy/reviewer visual QA only. They are not final. They are not public launch pages. They are noindexed. They use isolated `/public/qa/` assets. The printed magazine remains Spanish-only. Portuguese remains digital proof only until approved.

---

## QA URLs

| Page | URL |
|------|-----|
| Page 12 | https://www.leonixmedia.com/magazine/qa/2026-august/page-12-portuguese |
| Page 6 | https://www.leonixmedia.com/magazine/qa/2026-august/page-6-portuguese |
| Page 3 | https://www.leonixmedia.com/magazine/qa/2026-august/page-3-portuguese |

---

## Assets

| Page | Purpose | Source | QA Public Path |
|------|---------|--------|----------------|
| 12 | Portuguese proof PDF | `.magazine-proof-output/2026-august/pt/page-smoke/page-012/deepl-page-012.pt.pdf` | `/qa/magazine/2026-august/page-012-pt/deepl-page-012.pt.pdf` |
| 12 | Spanish source PNG | `design-references/magazine/2026-august/01-master-samples/august-2026-012-back-cover-master-sample.png` | `/qa/magazine/2026-august/page-012-pt/source-page-012-spanish.png` |
| 12 | Metadata | `.magazine-proof-output/2026-august/pt/page-smoke/page-012/metadata.json` | `/qa/magazine/2026-august/page-012-pt/metadata.json` |
| 12 | Visual QA template | `.magazine-proof-output/2026-august/pt/page-smoke/page-012/visual-qa-template.json` | `/qa/magazine/2026-august/page-012-pt/visual-qa-template.json` |
| 6 | Portuguese proof PDF | `.magazine-proof-output/2026-august/pt/page-smoke/page-006/deepl-page-006.pt.pdf` | `/qa/magazine/2026-august/page-006-pt/deepl-page-006.pt.pdf` |
| 6 | Spanish source PNG | `design-references/magazine/2026-august/01-master-samples/august-2026-006-negocios-comunidad-master-sample.png` | `/qa/magazine/2026-august/page-006-pt/source-page-006-spanish.png` |
| 6 | Metadata | `.magazine-proof-output/2026-august/pt/page-smoke/page-006/metadata.json` | `/qa/magazine/2026-august/page-006-pt/metadata.json` |
| 6 | Visual QA template | `.magazine-proof-output/2026-august/pt/page-smoke/page-006/visual-qa-template.json` | `/qa/magazine/2026-august/page-006-pt/visual-qa-template.json` |
| 3 | Portuguese proof PDF | `.magazine-proof-output/2026-august/pt/page-smoke/page-003/deepl-page-003.pt.pdf` | `/qa/magazine/2026-august/page-003-pt/deepl-page-003.pt.pdf` |
| 3 | Spanish source PNG | `design-references/magazine/2026-august/01-master-samples/august-2026-calibear-tacos-master-sample.png` | `/qa/magazine/2026-august/page-003-pt/source-page-003-spanish.png` |
| 3 | Metadata | `.magazine-proof-output/2026-august/pt/page-smoke/page-003/metadata.json` | `/qa/magazine/2026-august/page-003-pt/metadata.json` |
| 3 | Visual QA template | `.magazine-proof-output/2026-august/pt/page-smoke/page-003/visual-qa-template.json` | `/qa/magazine/2026-august/page-003-pt/visual-qa-template.json` |

---

## Chuy/Reviewer Decision Options Per Page

Pick exactly one per page:

- `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES`
- `FIX_NEEDED`
- `REBUILD_SOURCE_NEEDED`
- `COMPANION_LAYER_NEEDED`
- `HOLD_FOR_PORTUGUESE_REVIEWER`

---

## What Chuy/Reviewer Must Check

### Page 12

- Visible Portuguese translation
- Movement/CTA language
- QR/contact readability
- Brand tone
- Crop/overflow

### Page 6

- Visible Portuguese translation
- Editorial/community tone
- Business/community language
- CTA readability
- Layout usability
- Crop/overflow

### Page 3

- Visible Portuguese translation
- Cali Bear Tacos name preservation
- Food/menu/offer language
- Contact details
- Client-ad tone
- Crop/overflow

---

## Hard Limits

- No homepage wiring
- No main reader wiring
- No sitemap
- No public launch claim
- No final PDF
- No FlipHTML5 export
- No new provider call

---

## Next Gate

**`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION1`**

Purpose: Chuy/reviewer reports one decision per Portuguese page. Coach decides continue/fix/rebuild/hold.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Page 12 QA route created | TRUE |
| Page 6 QA route created | TRUE |
| Page 3 QA route created | TRUE |
| QA assets isolated under public/qa | TRUE |
| No public magazine registry changed | TRUE |
| No homepage changed | TRUE |
| No sitemap changed | TRUE |
| No provider call | TRUE |
| No source originals modified | TRUE |
| Ready for Chuy/reviewer visual QA | TRUE |

---

## Final Decision

**AUGUST_PORTUGUESE_PROOF_BATCH1_WEB_QA_URLS_READY**

**READY FOR CHUY/REVIEWER QA AT https://www.leonixmedia.com/magazine/qa/2026-august/page-12-portuguese AND https://www.leonixmedia.com/magazine/qa/2026-august/page-6-portuguese AND https://www.leonixmedia.com/magazine/qa/2026-august/page-3-portuguese: YES**

Portuguese Batch 1 QA decision locked: [`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md`](AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md) · Next gate: `AUGUST-2026-TRANSLATION-SAFE-MAGAZINE-DESIGN-SPECS1`
