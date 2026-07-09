# AUGUST 2026 BATCH 3 PAGES 2–4 PNG TO DEEPL PROOF PREP

Gate: `AUGUST-2026-BATCH3-PAGES2-4-PNG-TO-DEEPL-PROOF-PREP1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH3-PLAN.md`](AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH3-PLAN.md)

Script: `scripts/magazine/prepare-august-batch3-pages2-4-png-proof-inputs.mjs`

---

## Executive Summary

- Page 2, Page 3, and Page 4 PNG master samples were converted into local one-page PDF proof inputs.
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
| **2** | `design-references/magazine/2026-august/01-master-samples/august-2026-leonix-house-ad-master-sample.png` | 1046 | 1504 | 0.6955 | 2,343,963 bytes | `2e0bacc684beb4494619442216da9563ee6c05ab29a583a9169af8aa5bd789e9` | **MEDIUM** |
| **3** | `design-references/magazine/2026-august/01-master-samples/august-2026-calibear-tacos-master-sample.png` | 1046 | 1504 | 0.6955 | 2,086,177 bytes | `6e4d7dfea3e281b37ae8979e7ba55811cad36b7323186ad3d44882fac4738911` | **HIGH** |
| **4** | `design-references/magazine/2026-august/01-master-samples/august-2026-elevated-barber-master-sample.png` | 1046 | 1504 | 0.6955 | 2,187,260 bytes | `7c87269dcd7ebedc5878184e19fc60375a1a93f63d61f8a9897a5b8bc88cdc43` | **HIGH** |

All three PNGs are valid, match August standard dimensions (1046 × 1504), and remain outside `public/`.

---

## Local Proof Inputs

| Page | Output PDF Path | Size | Hash | Under 10 MB | Public Asset |
|------|-----------------|------|------|-------------|--------------|
| **2** | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-002/source-page-002-from-png.pdf` | 2,852,346 bytes (~2.72 MB) | `1182245ac8b12c598c6efa046de48867719f45331085b569ff436f674142956f` | **YES** | **NO** |
| **3** | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-003/source-page-003-from-png.pdf` | 2,479,554 bytes (~2.36 MB) | `d23fdafe13887a1f10ea9c97d8a9ad41c3baf5ff7fc583d5d13397686053a149` | **YES** | **NO** |
| **4** | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-004/source-page-004-from-png.pdf` | 2,621,751 bytes (~2.50 MB) | `b84dc8b8f8bef245e33c205a467119b1a3c17d521da3cfc6b05db80fe14383da` | **YES** | **NO** |

Each page folder also contains `metadata.json` and `README.md`.

PDF page size: **576 × 828 pt** (8 × 11.5 in trim).

---

## Business-Critical Translation Risk

| Factor | Assessment |
|--------|------------|
| Source type | Flat PNGs embedded in PDF |
| Extractable text | **Not expected** (`IMAGE_FLATTENED_LIKELY`) |
| Prior precedent | PNG/PDF → DeepL worked for Pages 12, 5, 6 |
| Page 2 risk | **MEDIUM** — Leonix brand voice and CTA language must remain strong |
| Page 3 risk | **HIGH** — Cali Bear Tacos name, menu/food language, offers, contact must be preserved |
| Page 4 risk | **HIGH** — Elevated Barber name, service language, premium tone, contact must be preserved |
| Next gate | Must use **max 3 English provider calls** (one per page) |

Client/ad pages carry higher business risk than editorial pages — business names, offers, and contact blocks must survive translation intact.

---

## Next Gate Limits

| Rule | Value |
|------|-------|
| Gate | `AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF1` |
| Target | **English only** |
| Pages | **2, 3, and 4 only** |
| Max provider calls | **3** (one per page) |
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
| Page 2 source exists | **TRUE** |
| Page 3 source exists | **TRUE** |
| Page 4 source exists | **TRUE** |
| Page 2 proof input created | **TRUE** |
| Page 3 proof input created | **TRUE** |
| Page 4 proof input created | **TRUE** |
| Outputs outside public | **TRUE** |
| All outputs under 10 MB | **TRUE** |
| No provider call | **TRUE** |
| No source PNG modified | **TRUE** |
| Ready for controlled English DeepL proof | **TRUE** |

---

## Final Decision

**AUGUST_BATCH3_PAGES2_4_PNG_TO_DEEPL_PROOF_PREP_DONE**

**READY FOR AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF1: YES**

English DeepL proof result: [`AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF.md`](AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF.md) · Next gate: `AUGUST-2026-BATCH3-PAGES2-4-WEB-QA-URL1`
