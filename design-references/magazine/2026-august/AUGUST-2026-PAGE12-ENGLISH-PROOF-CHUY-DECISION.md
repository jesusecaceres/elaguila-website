# AUGUST 2026 PAGE 12 ENGLISH PROOF CHUY DECISION

Gate: `AUGUST-2026-PAGE12-ENGLISH-PROOF-CHUY-DECISION1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gates:
- [`AUGUST-2026-PAGE12-ENGLISH-PROOF-VISUAL-QA.md`](AUGUST-2026-PAGE12-ENGLISH-PROOF-VISUAL-QA.md)
- [`AUGUST-2026-PAGE12-ENGLISH-PROOF-WEB-QA-URL.md`](AUGUST-2026-PAGE12-ENGLISH-PROOF-WEB-QA-URL.md)

---

## Executive Summary

- Chuy reviewed the clickable Leonixmedia.com QA page.
- The English proof worked well enough to prove the digital translation direction.
- The decision is **`TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF`**.
- This is **proof-success**, not final translated magazine approval.
- Minor polish issues remain before scaling or final use.
- **Printed magazine remains Spanish-only.**
- **Translated editions remain digital-only.**

---

## QA URL Reviewed

`https://www.leonixmedia.com/magazine/qa/2026-august/page-12-english`

---

## Final Chuy Decision

**`TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF`**

Chuy feedback summary:

- The English translation proof is **almost perfect**.
- It **works**.
- There are **little things here and there** that need perfection.
- The workflow should **not scale blindly**.
- Coach/PM must define guardrails and constraints before more DeepL proofing.

---

## What Worked

- Visible Spanish became English on the proof page.
- Layout mostly survived the translation pass.
- Source and proof are comparable side-by-side on the QA page.
- Contact block appears preserved (Suite 201, phone, email, website).
- QR / contact area remains visible and readable.
- English proof is good enough to validate digital translation testing as a viable direction.

---

## What Still Needs Polish

- Title / heading spacing can shift after translation.
- Font weight / style can differ from the Spanish source.
- Small card / body copy needs readability review on every page.
- Overflow / crop must be checked on every page type.
- Final digital reader UX cannot rely only on browser PDF embed.
- QA-approved proof does **not** equal public launch approval.

---

## DeepL Scaling Guardrails

| Guardrail | Rule |
|-----------|------|
| Scope | Translate controlled batches only — not full issue blindly |
| Language | English first for QA speed |
| Output | Local / QA only until approval |
| Public assets | Use `/public/qa/` only for temporary QA URLs |
| Production assets | Do not move to production reader until approved |
| Contact truth | Suite 201, phone, email, website must be checked on every contact-bearing page |
| Layout | Any crop, overflow, title collision, or broken card = **FIX NEEDED** |
| Brand | Leonix, business names, QR labels, phone / email / URL must not be corrupted |
| Cost | No repeated provider calls unless a gate approves it |
| QA | Chuy QA required only at real decision points |

---

## Page QA Scoring Model

Each future proofed page gets scored on:

| Dimension | Score |
|-----------|-------|
| Translation | PASS / FIX / FAIL |
| Layout | PASS / FIX / FAIL |
| Contact truth | PASS / FIX / FAIL / N/A |
| Brand preservation | PASS / FIX / FAIL |
| QR / readability | PASS / FIX / FAIL / N/A |

**Decision labels:**

- `APPROVED_FOR_DIGITAL_PROOF`
- `FIX_NEEDED`
- `REBUILD_SOURCE_NEEDED`
- `COMPANION_LAYER_NEEDED`

**Page 12 scores (initial):**

| Dimension | Score | Notes |
|-----------|-------|-------|
| Translation | **PASS** | Spanish became English; minor polish needed |
| Layout | **FIX** | Title spacing / font weight differences observed |
| Contact truth | **PASS** | Suite 201, phone, email, website preserved |
| Brand preservation | **PASS** | Leonix branding intact |
| QR / readability | **PASS** | QR zone visible and readable |
| Decision | **`APPROVED_FOR_DIGITAL_PROOF`** | Proof-success; not final production approval |

---

## Scaling Recommendation

**Do not translate all 12 pages yet.**

The Page 12 English proof proves the PNG/PDF → DeepL path can work for digital proofing, but it is not final-production-perfect. Scaling must be controlled, page-type by page-type, with QA at each decision point.

**Next best move:**

**`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN1`**

Purpose:

- Choose a controlled next batch.
- Prefer pages **5** and **6** first (Batch 1 master samples already exist), then remaining layout types.
- Prove more page types before full issue translation.
- Avoid spending provider calls blindly.
- Define page-level QA URLs only when a real decision point exists.

---

## Digital Doctrine Reminder

- **Print = Spanish-only.**
- **Digital translations = digital-only.**
- **QR / Google Lens** supports print readers.
- **No public translated issue** until proof + Chuy QA approval.
- **Temporary QA URLs** are not public magazine launch pages.

---

## Next Gate

**`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN1`**

Purpose:

- Plan the next controlled English translation proof batch.
- Choose which pages to test next.
- Define provider-call limits.
- Define QA URL rules.
- Define page scoring rules before execution.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Chuy decision recorded | **TRUE** |
| Proof-success but not final approval documented | **TRUE** |
| Minor polish issues documented | **TRUE** |
| DeepL scaling guardrails documented | **TRUE** |
| QA scoring model documented | **TRUE** |
| Print Spanish-only doctrine preserved | **TRUE** |
| Digital-only translation doctrine preserved | **TRUE** |
| Next controlled batch planning gate defined | **TRUE** |

---

## Final Decision

**AUGUST_PAGE12_ENGLISH_PROOF_DECISION_LOCKED**

**READY FOR AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN1: YES**

Controlled Batch 2 plan: [`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN.md`](AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN.md) · Next gate: `AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP1`
