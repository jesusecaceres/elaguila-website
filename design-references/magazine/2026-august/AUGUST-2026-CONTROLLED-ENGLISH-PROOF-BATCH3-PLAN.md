# AUGUST 2026 CONTROLLED ENGLISH PROOF BATCH 3 PLAN

Gate: `AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH3-PLAN1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-BATCH2-PAGES5-6-CHUY-QA-DECISION.md`](AUGUST-2026-BATCH2-PAGES5-6-CHUY-QA-DECISION.md)

---

## Executive Summary

- Batch 2 proved the digital translation proof workflow across pages 5 and 6.
- Page 12, Page 5, and Page 6 validate the workflow across multiple layout types.
- **Batch 3 is planning only** — no provider calls were made in this gate.
- **Do not translate the full issue yet.**
- **Printed magazine remains Spanish-only.**
- **Translated editions remain digital-only.**
- Final public digital magazine release still requires **polish/review**.

---

## Locked Prior Decisions

| Page | Decision |
|------|----------|
| **12** | `TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF` |
| **5** | `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES` |
| **6** | `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES` |

---

## Validated Workflow

**`PNG/PDF → DeepL → local proof → temporary web QA URL → Chuy visual decision`**

Validated page types:

| Page | Layout Type |
|------|-------------|
| **12** | Back-cover / house-ad style |
| **5** | Dense agenda / event-card layout |
| **6** | Editorial / business community layout |

---

## Recommended Batch 3 Pages

| Page | Source File | Layout Type | Why Included | Risk Level |
|------|-------------|-------------|--------------|------------|
| **2** | `august-2026-leonix-house-ad-master-sample.png` | Leonix house ad / brand ad | Tests Leonix ad copy, CTA/contact layout, brand voice, QR/contact blocks | **MEDIUM** |
| **3** | `august-2026-calibear-tacos-master-sample.png` | Client restaurant ad | Tests client business name, food/menu language, offer/CTA/contact preservation | **HIGH** |
| **4** | `august-2026-elevated-barber-master-sample.png` | Client service/barber ad | Tests client business name, service copy, CTA/contact preservation, premium ad tone | **HIGH** |

All three pages have master samples in `design-references/magazine/2026-august/01-master-samples/`.

---

## Why These Pages Next

- They already have master samples.
- They are **client/ad-facing** — higher business risk than general editorial pages.
- They test whether **client names, CTAs, services, and contact blocks** survive translation.
- They are more important to monetize and client trust than general editorial pages.
- They keep provider calls controlled (3 max).
- They avoid pages 7–11 because those pages are not visually ready.

---

## Why Not Full Issue Yet

- Pages 7–11 do **not** have master samples yet.
- Client/ad pages should be proven before scaling.
- DeepL output still needs final polish/review.
- Full issue translation could waste provider cost if ad pages need source rebuild or companion text layer.
- Chuy QA should happen only at strategic decision points.

### Excluded from Batch 3 (future batches)

| Page | Reason deferred |
|------|-----------------|
| **1** | Cover — held for later (see below) |
| **5, 6** | Already proofed and approved in Batch 2 |
| **12** | Already proofed and approved in Page 12 gate |
| **7–11** | No master samples exist yet |
| Full issue | Blocked until ad/client pages prove method |

---

## Why Page 1 Cover Is Held

- Cover has lower text volume.
- Cover may require more manual design/editorial polish.
- Cover should be tested after ad/client pages prove the workflow.
- Cover can be included in a later final proof batch.

---

## Provider-Call Limits for Next Execution Gate

| Rule | Value |
|------|-------|
| Target language | **English only** |
| Pages | **2, 3, and 4 only** |
| Max provider calls | **3 total** (one call per page) |
| Retry loop | **No** — unless gate approves |
| Full issue | **No** |
| Other languages | **No** |
| Public production assets | **No** |
| Output location | Local first under `.magazine-proof-output/` |
| QA web URLs | Only after outputs exist and need real visual decision |

---

## Batch 3 Output Plan

### Future proof input paths (prep gate)

```
.magazine-proof-output/2026-august/_inputs/page-smoke/page-002/
.magazine-proof-output/2026-august/_inputs/page-smoke/page-003/
.magazine-proof-output/2026-august/_inputs/page-smoke/page-004/
```

Expected files per page (mirroring prior batch pattern):

- `source-page-00X-from-png.pdf`
- `metadata.json`
- `README.md`

### Future English proof output paths (execution gate)

```
.magazine-proof-output/2026-august/en/page-smoke/page-002/
.magazine-proof-output/2026-august/en/page-smoke/page-003/
.magazine-proof-output/2026-august/en/page-smoke/page-004/
```

Expected files per page:

- `deepl-page-00X.en.pdf`
- `metadata.json`
- `deepl-status.json`
- `visual-qa-template.json`
- `README.md`

### Temporary QA public assets (web QA gate only — not created in this gate)

```
public/qa/magazine/2026-august/page-002/
public/qa/magazine/2026-august/page-003/
public/qa/magazine/2026-august/page-004/
```

### Future QA URLs (only after proof outputs exist)

- `https://www.leonixmedia.com/magazine/qa/2026-august/page-2-english`
- `https://www.leonixmedia.com/magazine/qa/2026-august/page-3-english`
- `https://www.leonixmedia.com/magazine/qa/2026-august/page-4-english`

---

## Page QA Scoring Model

Each page gets scored on:

| Category | Score Options | Notes |
|----------|---------------|-------|
| Translation | PASS / FIX / FAIL | Did visible Spanish become readable English? |
| Layout | PASS / FIX / FAIL | Crop, overflow, title collisions, broken CTA/contact blocks |
| Contact truth | PASS / FIX / FAIL / N/A | Phone, email, website, social, QR/contact details |
| Brand preservation | PASS / FIX / FAIL | Leonix, Cali Bear Tacos, Elevated Barber, names, slogans |
| CTA preservation | PASS / FIX / FAIL | Offers, calls to action, scan/call/web prompts |
| QR / readability | PASS / FIX / FAIL / N/A | QR zones, small type, cards, coupon/offer blocks |
| Decision | APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES / FIX_NEEDED / REBUILD_SOURCE_NEEDED / COMPANION_LAYER_NEEDED | Final per-page result |

**Client/ad pages:** any business-name corruption or CTA/contact damage should default to **FIX_NEEDED** or **REBUILD_SOURCE_NEEDED**, not approval.

---

## Final-Polish Guardrails

- Typography restoration may be needed where DeepL changes font weight/style.
- Heading/line-break cleanup may be needed.
- English brand voice polish is required before public launch.
- Contact/QR verification is mandatory on every ad page.
- **Client business names must be preserved exactly** (Cali Bear Tacos, Elevated Barber, etc.).
- Offers and CTA language must be reviewed by human editor.
- Proof success does **not** equal final public approval.
- Final public digital magazine needs human editorial/design review.

---

## Strategic QA Rule

- **Do not** ask Chuy to QA every internal artifact.
- Chuy QA is required **only after** Batch 3 web QA URLs exist, or if outputs show a blocker.
- If all three pages technically translate and web QA routes are ready, give Chuy **one QA session** with all clickable Leonixmedia.com URLs.
- If provider fails on any page, triage before asking Chuy to QA.

---

## DeepL / Translation Guardrails

- English first only.
- Controlled pages only (2, 3, 4 in Batch 3).
- No full issue.
- No repeated provider calls without gate approval.
- No public launch claim.
- No production reader wiring.
- No homepage wiring.
- Any layout break becomes **FIX_NEEDED**.
- Any client/business-name/contact corruption becomes **FIX_NEEDED** or **REBUILD_SOURCE_NEEDED**.
- Temporary QA assets must stay under `/public/qa/`.

---

## Recommended Next Execution Gates

### 1. `AUGUST-2026-BATCH3-PAGES2-4-PNG-TO-DEEPL-PROOF-PREP1` — **NEXT**

Purpose:

- Prepare local one-page PDF proof inputs for Page 2, Page 3, and Page 4.
- No DeepL call yet.
- No public assets.
- No QA URLs yet.
- Prove all three inputs are under limits and ready for controlled English proof.

### 2. `AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF1`

Purpose:

- Exactly **3 provider calls max**.
- Page 2, 3, 4 English.
- Local output only.

### 3. `AUGUST-2026-BATCH3-PAGES2-4-WEB-QA-URL1`

Purpose:

- Create clickable Leonixmedia.com QA URLs only if proof outputs exist and need Chuy visual decision.

### 4. `AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION1`

Purpose:

- Chuy reports one decision per page.
- Coach decides whether to continue, fix, rebuild, or use companion layer.

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
| Batch 2 decision used | **TRUE** |
| Page 2 selected | **TRUE** |
| Page 3 selected | **TRUE** |
| Page 4 selected | **TRUE** |
| Page 1 held for later | **TRUE** |
| Pages 7–11 avoided | **TRUE** |
| Full issue avoided | **TRUE** |
| Provider-call limits defined | **TRUE** |
| Client/ad QA risks documented | **TRUE** |
| Final-polish guardrails documented | **TRUE** |
| Strategic QA rule documented | **TRUE** |
| Digital doctrine preserved | **TRUE** |
| Next prep gate defined | **TRUE** |

---

## Final Decision

**AUGUST_CONTROLLED_ENGLISH_PROOF_BATCH3_PLAN_DONE**

**READY FOR AUGUST-2026-BATCH3-PAGES2-4-PNG-TO-DEEPL-PROOF-PREP1: YES**
