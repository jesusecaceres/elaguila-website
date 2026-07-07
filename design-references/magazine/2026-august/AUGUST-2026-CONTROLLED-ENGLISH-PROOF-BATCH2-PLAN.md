# AUGUST 2026 CONTROLLED ENGLISH PROOF BATCH 2 PLAN

Gate: `AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-PAGE12-ENGLISH-PROOF-CHUY-DECISION.md`](AUGUST-2026-PAGE12-ENGLISH-PROOF-CHUY-DECISION.md)

---

## Executive Summary

- Page 12 English proof succeeded enough to validate the digital proof direction.
- The workflow still requires polish guardrails before scaling.
- **Batch 2 is planning only** — no provider calls were made in this gate.
- **Do not translate the full issue yet.**
- **Printed magazine remains Spanish-only.**
- **Translated editions remain digital-only.**

---

## Locked Page 12 Decision

| Field | Value |
|-------|-------|
| Decision | `TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF` |
| QA URL reviewed | `https://www.leonixmedia.com/magazine/qa/2026-august/page-12-english` |
| Status | Proof-success — not final production approval |
| Polish notes | Title spacing, font weight, small copy readability need review on every page |

---

## Recommended Batch 2 Pages

| Page | Source File | Layout Type | Why Included | Risk Level |
|------|-------------|-------------|--------------|------------|
| **5** | `august-2026-005-agenda-de-agosto-master-sample.png` | Dense event/card layout | Tests card lists, event blocks, short copy, possible overflow | **HIGH** |
| **6** | `august-2026-006-negocios-comunidad-master-sample.png` | Editorial/business community page | Tests headline/body/card mix with Leonix CTA | **MEDIUM** |

Both pages already have master samples in `design-references/magazine/2026-august/01-master-samples/`.

---

## Why Not Full Issue Yet

- Page 12 worked, but small polish issues remain.
- Pages 5 and 6 test **new layout types** not covered by Page 12 (back cover / contact block).
- Pages 7–11 do **not** have master samples yet — cannot proof what does not exist.
- Full issue translation could waste provider cost if layouts break on card-heavy or editorial pages.
- Chuy QA should happen only at strategic decision points, not on every internal artifact.

### Excluded from Batch 2 (future batches)

| Page | Source | Reason deferred |
|------|--------|-----------------|
| 1 | `august-2026-cover-master-sample.png` | Cover — high brand risk; test after inner pages prove method |
| 2 | `august-2026-leonix-house-ad-master-sample.png` | House ad — Leonix-owned; defer until layout types proven |
| 3 | `august-2026-calibear-tacos-master-sample.png` | Client ad — business names must not corrupt |
| 4 | `august-2026-elevated-barber-master-sample.png` | Client ad — business names must not corrupt |
| 7–11 | Not started | No master samples exist yet |
| Full issue | — | Blocked until Batch 2 proves method across layout types |

---

## Provider-Call Limits for Next Execution Gate

| Rule | Value |
|------|-------|
| Target language | **English only** |
| Pages | **5 and 6 only** |
| Max provider calls | **2 total** (one call per page) |
| Retry loop | **No** — no retry without gate approval |
| Full issue | **No** |
| Other languages | **No** |
| Public production assets | **No** |
| Output location | Local first under `.magazine-proof-output/` |
| QA web URLs | Only after outputs exist and need real visual decision |

---

## Batch 2 Output Plan

### Future proof input paths (prep gate)

```
.magazine-proof-output/2026-august/_inputs/page-smoke/page-005/
.magazine-proof-output/2026-august/_inputs/page-smoke/page-006/
```

Expected files per page (mirroring Page 12 pattern):

- `source-page-005-from-png.pdf` / `source-page-006-from-png.pdf`
- `metadata.json`

### Future English proof output paths (execution gate)

```
.magazine-proof-output/2026-august/en/page-smoke/page-005/
.magazine-proof-output/2026-august/en/page-smoke/page-006/
```

Expected files per page:

- `deepl-page-005.en.pdf` / `deepl-page-006.en.pdf`
- `metadata.json`
- `deepl-status.json`

### Temporary QA public assets (web QA gate only — not created in this gate)

```
public/qa/magazine/2026-august/page-005/
public/qa/magazine/2026-august/page-006/
```

### Future QA URLs (only after proof outputs exist)

- `https://www.leonixmedia.com/magazine/qa/2026-august/page-5-english`
- `https://www.leonixmedia.com/magazine/qa/2026-august/page-6-english`

---

## Page QA Scoring Model

Each page gets scored on:

| Category | Score Options | Notes |
|----------|---------------|-------|
| Translation | PASS / FIX / FAIL | Did visible Spanish become readable English? |
| Layout | PASS / FIX / FAIL | Crop, overflow, title collisions, broken cards |
| Contact truth | PASS / FIX / FAIL / N/A | Suite 201, phone, email, website |
| Brand preservation | PASS / FIX / FAIL | Leonix, names, QR labels, business names |
| QR / readability | PASS / FIX / FAIL / N/A | QR zones, small type, cards |
| Decision | APPROVED_FOR_DIGITAL_PROOF / FIX_NEEDED / REBUILD_SOURCE_NEEDED / COMPANION_LAYER_NEEDED | Final per-page result |

**Page 12 reference scores (locked):** Translation PASS · Layout FIX · Contact PASS · Brand PASS · QR PASS → `APPROVED_FOR_DIGITAL_PROOF`

---

## Strategic QA Rule

- **Do not** ask Chuy to QA every internal artifact.
- Chuy QA is required **only after** Batch 2 web QA URLs exist, or if outputs show a blocker.
- If both pages technically translate and the web QA routes are ready, give Chuy the clickable Leonixmedia.com URLs.
- If provider fails on either page, triage before asking Chuy to QA.
- One QA session for both pages is acceptable if both web QA URLs are ready at the same time.

---

## DeepL / Translation Guardrails

- English first only.
- Controlled pages only (5 and 6 in Batch 2).
- No full issue.
- No repeated provider calls without gate approval.
- No public launch claim.
- No production reader wiring.
- No homepage wiring.
- Any layout break becomes **FIX_NEEDED**.
- Contact info and brand terms must be checked on every contact-bearing page.
- Temporary QA assets must stay under `/public/qa/`.
- Client business names on pages 3–4 must not be translated or corrupted (relevant for future batches).

---

## Recommended Next Execution Gates

### 1. `AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP1` — **NEXT**

Purpose:

- Prepare local one-page PDF proof inputs for Page 5 and Page 6.
- No DeepL call yet.
- No public assets.
- No QA URLs yet.
- Prove both inputs are under limits and ready for controlled English proof.

### 2. `AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1`

Purpose:

- Exactly **2 provider calls max**.
- Page 5 English.
- Page 6 English.
- Local output only.

### 3. `AUGUST-2026-BATCH2-PAGES5-6-WEB-QA-URL1`

Purpose:

- Create clickable Leonixmedia.com QA URLs only if proof outputs exist and need Chuy visual decision.
- Side-by-side Spanish source vs English proof per page.
- Noindex metadata on all QA routes.

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
| Page 12 decision used | **TRUE** |
| Page 5 selected | **TRUE** |
| Page 6 selected | **TRUE** |
| Full issue avoided | **TRUE** |
| Provider-call limits defined | **TRUE** |
| Page scoring model defined | **TRUE** |
| Strategic QA rule documented | **TRUE** |
| Digital doctrine preserved | **TRUE** |
| Next prep gate defined | **TRUE** |

---

## Final Decision

**AUGUST_CONTROLLED_ENGLISH_PROOF_BATCH2_PLAN_DONE**

**READY FOR AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP1: YES**

Batch 2 prep completed: [`AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP.md`](AUGUST-2026-BATCH2-PAGES5-6-PNG-TO-DEEPL-PROOF-PREP.md) · Next gate: `AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF1`
