# AUGUST 2026 PORTUGUESE PROOF BATCH 1 DEEPL

Gate: `AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL1`
Date: 2026-07-08
Owner: Coach (architect / PM / magazine production lead) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-PORTUGUESE-PROOF-PLAN.md`](AUGUST-2026-PORTUGUESE-PROOF-PLAN.md)
Prior decision: `AUGUST_PORTUGUESE_PROOF_PLAN_DONE`

Script: `scripts/magazine/proof-translate-august-portuguese-batch1-deepl.mjs`

---

## Executive Summary

- Portuguese Batch 1 DeepL proof was attempted for pages 12, 6, and 3.
- Target language: PT-BR.
- Max provider calls: 3.
- All three provider calls succeeded.
- Output is local only.
- Output is not public.
- Output is not final.
- Printed magazine remains Spanish-only.
- Portuguese proof requires Chuy/reviewer QA before public use.

Provider success does not equal final public approval. Billed characters > 0 means DeepL processed content, but visual QA is still required.

---

## Source Inputs

| Page | Title | Source Input | Size | Hash | Risk |
|------|-------|--------------|------|------|------|
| 12 | Sé parte del movimiento Leonix | `.magazine-proof-output/2026-august/_inputs/issue-foundation/es/page-012/source-page-012-from-png.pdf` | 2,770,067 bytes | `b0e2aebda343ebd99fa815bb9a4e8549edffc8b008ac5b5560acfd79e175a9ca` | HIGH |
| 6 | Negocios que construyen comunidad | `.magazine-proof-output/2026-august/_inputs/issue-foundation/es/page-006/source-page-006-from-png.pdf` | 2,970,647 bytes | `b308370894384501f80c3ed840ddcd4db37bb7b89a141f12e89a779b690e9a72` | MEDIUM |
| 3 | Cali Bear Tacos full-page ad | `.magazine-proof-output/2026-august/_inputs/issue-foundation/es/page-003/source-page-003-from-png.pdf` | 2,479,554 bytes | `940ee7e7fdbac7547098f7aed8978292455e43472acdc67881c42e60e5e5372d` | HIGH |

All source inputs were local issue-foundation Spanish PDFs. All were under 10 MB. No source originals were modified.

---

## Provider Proof Results

| Page | Provider | Target | Call Number | Status | Output Path | Output Size | Output Hash |
|------|----------|--------|-------------|--------|-------------|-------------|-------------|
| 12 | DeepL | PT-BR | 1 | **done** (1,378 billed chars) | `.magazine-proof-output/2026-august/pt/page-smoke/page-012/deepl-page-012.pt.pdf` | 2,420,359 bytes | `ea6e9c10d76ab072b094da85eb65a7f4906213951355f46d029b6d12c68dea84` |
| 6 | DeepL | PT-BR | 2 | **done** (1,494 billed chars) | `.magazine-proof-output/2026-august/pt/page-smoke/page-006/deepl-page-006.pt.pdf` | 2,555,218 bytes | `1f400961404df9f89d749e97a3661d9c4470aee322e3495a7a987b7beab53778` |
| 3 | DeepL | PT-BR | 3 | **done** (1,135 billed chars) | `.magazine-proof-output/2026-august/pt/page-smoke/page-003/deepl-page-003.pt.pdf` | 2,067,498 bytes | `8094442925a5bfae1ada5479a7cc2c7d97cbe038394fdfc744214ca4d1d05e11` |

**Total provider calls:** 3 (at limit). No retries. API key never printed.

PT-BR target validation initially failed due to case-sensitive code matching in the script; validation was corrected to compare case-insensitively against DeepL's `pt-BR` code before execute. No alternate Portuguese target was used.

---

## Portuguese QA Risks

**Page 12:**
- movement/CTA language
- QR/contact readability
- brand tone
- overflow/crop

**Page 6:**
- editorial/community tone
- business/community language
- CTA readability
- layout usability

**Page 3:**
- Cali Bear Tacos name preservation
- food/menu/offer language
- client ad tone
- contact preservation
- overflow/crop

---

## Digital Doctrine Reminder

- **Print = Spanish-only.**
- **Digital translations = digital-only.**
- **Temporary QA URLs** are not launch pages.
- **No public translated August issue** until final approval.
- **Raw Portuguese DeepL proof is not final brand copy.**

---

## Next Gate

All three pages succeeded:

**`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL1`**

Purpose: create temporary noindex QA URLs for pages 12, 6, and 3 so Chuy/reviewer can compare Spanish source vs Portuguese proof.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Page 12 source input exists | TRUE |
| Page 6 source input exists | TRUE |
| Page 3 source input exists | TRUE |
| PT-BR target used | TRUE |
| Provider calls <= 3 | TRUE (3) |
| Local outputs only | TRUE |
| No public assets | TRUE |
| No full issue | TRUE |
| No Google | TRUE |
| Chuy/reviewer QA deferred until web QA URLs | TRUE |
| Ready for web QA URL gate or triage | TRUE (web QA URL) |

---

## Final Decision

**AUGUST_PORTUGUESE_PROOF_BATCH1_DEEPL_READY_FOR_WEB_QA**

**READY FOR AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL1: YES**

Portuguese Batch 1 web QA URLs created: [`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL.md`](AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL.md) · Next gate: `AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION1`

Portuguese Batch 1 approved for digital proof direction with minor polish notes: [`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md`](AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md)
