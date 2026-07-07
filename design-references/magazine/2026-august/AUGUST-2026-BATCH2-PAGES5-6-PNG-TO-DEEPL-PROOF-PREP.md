# AUGUST 2026 BATCH 2 PAGES 5–6 PNG TO DEEPL PROOF PREP

Gate: `AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN.md`](AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN.md)

Script: `scripts/magazine/prepare-august-batch2-pages5-6-png-proof-inputs.mjs`

---

## Executive Summary

- Page 5 and Page 6 PNG master samples were converted into local one-page PDF proof inputs.
- This is for **digital English translation proof only**.
- **DeepL was not called.**
- Outputs are **outside public**.
- **Printed magazine remains Spanish-only.**
- **Translated editions remain digital-only.**
- These PDFs are **not final**, **not print-ready**, **not FlipHTML5-ready**.

---

## Source Pages

| Page | Source Path | Width | Height | Ratio | Size | Hash | Risk |
|------|-------------|-------|--------|-------|------|------|------|
| **5** | `design-references/magazine/2026-august/01-master-samples/august-2026-005-agenda-de-agosto-master-sample.png` | 1046 | 1504 | 0.6955 | 2,310,868 bytes | `dc9d23592b963276df4b1e7be024a1baf0eb22ce4808b4881436051e16577f0c` | **HIGH** |
| **6** | `design-references/magazine/2026-august/01-master-samples/august-2026-006-negocios-comunidad-master-sample.png` | 1046 | 1504 | 0.6955 | 2,316,788 bytes | `0fb591fa4860a6dcf0735679f3042f2208243727960b07ba507a810f0c690c6b` | **MEDIUM** |

Both PNGs are valid, match August standard dimensions (1046 × 1504), and remain outside `public/`.

---

## Local Proof Inputs

| Page | Output PDF Path | Size | Hash | Under 10 MB | Public Asset |
|------|-----------------|------|------|-------------|--------------|
| **5** | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-005/source-page-005-from-png.pdf` | 2,853,520 bytes (~2.72 MB) | `c9270f6280ddc89be50c0f9e3aba9cae6086b95aae3434f5b3ddbc9548e97ab0` | **YES** | **NO** |
| **6** | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-006/source-page-006-from-png.pdf` | 2,970,647 bytes (~2.83 MB) | `f06b0ec33fc90ce806409e5b50ebf83fe91ec2a5397fa5c797be2a7e24bb2d7f` | **YES** | **NO** |

Each page folder also contains `metadata.json` and `README.md`.

PDF page size: **576 × 828 pt** (8 × 11.5 in trim).

---

## Translation Risk

| Factor | Assessment |
|--------|------------|
| Source type | Flat PNGs embedded in PDF |
| Extractable text | **Not expected** (`IMAGE_FLATTENED_LIKELY`) |
| Page 12 precedent | PNG/PDF → DeepL worked for English proof on Page 12 |
| Page 5 risk | **HIGH** — dense card/event layout; text may shift or overflow after translation |
| Page 6 risk | **MEDIUM** — editorial/business card layout; headline/body text may shift |
| Next gate | Must use **max 2 English provider calls** (one per page) |

Both layouts must be tested individually — Page 12 success does not guarantee card-heavy or editorial pages will translate equally well.

---

## Next Gate Limits

| Rule | Value |
|------|-------|
| Gate | `AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1` |
| Target | **English only** |
| Pages | **5 and 6 only** |
| Max provider calls | **2** (one per page) |
| Retries | **No** — unless gate approves |
| Full issue | **No** |
| Output | Local only under `.magazine-proof-output/2026-august/en/page-smoke/` |
| Public assets | **No** |
| QA URLs | **Not yet** — only after proof outputs exist |

---

## Strategic QA Rule

No Chuy QA for this prep gate. Chuy QA happens only after English proof outputs exist and clickable Leonixmedia.com QA URLs are created, unless there is a blocker.

---

## Digital Doctrine Reminder

- **Print = Spanish-only.**
- **Digital translations = digital-only.**
- **QR / Google Lens** supports print readers.
- **Temporary QA URLs** are not launch pages.
- **No public translated August issue** until final approval.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Page 5 source exists | **TRUE** |
| Page 6 source exists | **TRUE** |
| Page 5 proof input created | **TRUE** |
| Page 6 proof input created | **TRUE** |
| Outputs outside public | **TRUE** |
| Both outputs under 10 MB | **TRUE** |
| No provider call | **TRUE** |
| No source PNG modified | **TRUE** |
| Ready for controlled English DeepL proof | **TRUE** |

---

## Final Decision

**AUGUST_BATCH2_PAGES5_6_PNG_TO_DEEPL_PROOF_PREP_DONE**

**READY FOR AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1: YES**

English DeepL proof result: [`AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF.md`](AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF.md) — both pages succeeded (2 calls). Next gate: `AUGUST-2026-BATCH2-PAGES5-6-WEB-QA-URL1`.
