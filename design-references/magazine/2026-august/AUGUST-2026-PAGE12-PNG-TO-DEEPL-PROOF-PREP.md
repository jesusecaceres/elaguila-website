# AUGUST 2026 PAGE 12 PNG TO DEEPL PROOF PREP

Gate: `AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP1`  
Date: 2026-07-07  
Owner: Coach (PM) · Chuy (approval) · Cursor (crew)

Parent plan: [`AUGUST-2026-VISUAL-QA-AND-DIGITAL-TRANSLATION-PROOF-PLAN.md`](AUGUST-2026-VISUAL-QA-AND-DIGITAL-TRANSLATION-PROOF-PLAN.md)

---

## Executive Summary

Page 12 master PNG was converted into a **local one-page PDF proof input** for a future digital translation experiment.

- **Digital translation proof only** — not final, not print-ready, not FlipHTML5-ready
- **DeepL was not called**
- Output lives under `.magazine-proof-output/` — **outside `public/`**
- **Printed magazine remains Spanish-only**
- **Translated editions remain digital-only**

Prep script: `scripts/magazine/prepare-august-page12-png-proof-input.mjs`

---

## Source

| Field | Value |
|-------|-------|
| Source path | `design-references/magazine/2026-august/01-master-samples/august-2026-012-back-cover-master-sample.png` |
| Width | **1046** px |
| Height | **1504** px |
| Ratio | **0.6955** (matches 8 × 11.5 in) |
| Size | **2,167,940** bytes (~2.07 MB) |
| SHA-256 | `1c98cbc4e996b064091d877f0fbdba8c358b86bb439a0fc81438d9c1df73029c` |
| PNG valid | **YES** |
| Outside public | **YES** |
| Source modified | **NO** |

---

## Local Proof Input

| Field | Value |
|-------|-------|
| Output PDF path | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-012/source-page-012-from-png.pdf` |
| Output PDF size | **2,770,066** bytes (~2.64 MB) |
| Output PDF SHA-256 | `787025034cc94952957080e0122175c9df0aad4c11ed8ec8f208633ea36e870a` |
| Page width (points) | **576** (8 in) |
| Page height (points) | **828** (11.5 in) |
| Trim size | **8 × 11.5 in** |
| Under 10 MB | **YES** |
| Provider called | **NO** |
| Public asset | **NO** |
| Metadata | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-012/metadata.json` |
| README | `.magazine-proof-output/2026-august/_inputs/page-smoke/page-012/README.md` |

---

## Translation Risk

| Risk | Detail |
|------|--------|
| Flat PNG source | Text is rasterized in the master sample |
| PDF text layer | **Likely none** — image embedded on page (`extractableTextExpected: false`) |
| Expected DeepL behavior | `IMAGE_FLATTENED_LIKELY` — output may be unchanged or mostly unchanged |
| Purpose of next gate | **Prove or disprove** whether DeepL document API translates visible Spanish on this input |
| If DeepL fails | Pivot to **editable source rebuild** (Canva/Figma + text-layer PDF) or **companion HTML/text layer** |

---

## Digital Doctrine Reminder

- **Print** = Spanish-only official product
- **Digital translations** = digital-only — never translated print runs
- **QR / Google Lens** = practical support for print readers
- **No translated public issue** until local proof + **Chuy QA approval**

---

## Next Gate

**`AUGUST-2026-PAGE12-ENGLISH-PROOF-VISUAL-QA1`** — English DeepL proof **done** (1 call, local output): [`AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF.md`](AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF.md)

Chuy visual QA required before claiming translation success.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Page 12 PNG exists | **TRUE** |
| PNG valid | **TRUE** |
| One-page PDF proof input created | **TRUE** |
| Output outside public | **TRUE** |
| Output under 10 MB | **TRUE** |
| Metadata written | **TRUE** |
| README written | **TRUE** |
| No DeepL/provider call | **TRUE** |
| No source PNG modified | **TRUE** |
| No final PDF created | **TRUE** |
| Ready for one-page DeepL proof | **TRUE** |

---

## Final Decision

**AUGUST_PAGE12_PNG_TO_DEEPL_PROOF_PREP_DONE**

**READY FOR AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1: YES**
