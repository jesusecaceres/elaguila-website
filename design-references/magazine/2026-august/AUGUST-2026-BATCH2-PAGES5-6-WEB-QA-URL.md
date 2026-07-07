# AUGUST 2026 BATCH 2 PAGES 5–6 WEB QA URLS

Gate: `AUGUST-2026-BATCH2-PAGES5-6-WEB-QA-URL1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF.md`](AUGUST-2026-BATCH2-PAGES5-6-DEEPL-ENGLISH-PROOF.md)

---

## Executive Summary

- Temporary web QA URLs were created for **Page 5** and **Page 6**.
- These are for **Chuy visual QA only**.
- They are **not final**.
- They are **not public magazine launch pages**.
- They are **noindexed** (`index: false`, `follow: false`, `nocache: true`, googleBot `noimageindex: true`).
- They use **isolated `/public/qa/` assets** — nothing under `/public/magazine/` was touched.
- **Printed magazine remains Spanish-only.**
- **Translated editions remain digital-only.**

---

## QA URLs

| Page | URL |
|------|-----|
| **5** | `https://www.leonixmedia.com/magazine/qa/2026-august/page-5-english` |
| **6** | `https://www.leonixmedia.com/magazine/qa/2026-august/page-6-english` |

Route files:
- `app/(site)/magazine/qa/2026-august/page-5-english/page.tsx`
- `app/(site)/magazine/qa/2026-august/page-6-english/page.tsx`

---

## Assets

| Page | Purpose | Source | QA Public Path |
|------|---------|--------|----------------|
| **5** | English proof PDF | `.magazine-proof-output/.../page-005/deepl-page-005.en.pdf` | `public/qa/magazine/2026-august/page-005/deepl-page-005.en.pdf` |
| **5** | Spanish source PNG | `august-2026-005-agenda-de-agosto-master-sample.png` | `public/qa/magazine/2026-august/page-005/source-page-005-spanish.png` |
| **5** | Metadata | `.magazine-proof-output/.../page-005/metadata.json` | `public/qa/magazine/2026-august/page-005/metadata.json` |
| **5** | QA template | `.magazine-proof-output/.../page-005/visual-qa-template.json` | `public/qa/magazine/2026-august/page-005/visual-qa-template.json` |
| **6** | English proof PDF | `.magazine-proof-output/.../page-006/deepl-page-006.en.pdf` | `public/qa/magazine/2026-august/page-006/deepl-page-006.en.pdf` |
| **6** | Spanish source PNG | `august-2026-006-negocios-comunidad-master-sample.png` | `public/qa/magazine/2026-august/page-006/source-page-006-spanish.png` |
| **6** | Metadata | `.magazine-proof-output/.../page-006/metadata.json` | `public/qa/magazine/2026-august/page-006/metadata.json` |
| **6** | QA template | `.magazine-proof-output/.../page-006/visual-qa-template.json` | `public/qa/magazine/2026-august/page-006/visual-qa-template.json` |

All copies are **temporary QA-only** assets isolated under `/public/qa/`. Originals were not modified.

---

## Chuy Decision Options Per Page

- `APPROVED_FOR_DIGITAL_PROOF`
- `FIX_NEEDED`
- `REBUILD_SOURCE_NEEDED`
- `COMPANION_LAYER_NEEDED`

---

## What Chuy Must Check

### Page 5 (HIGH risk — dense agenda/event/card layout)

- Visible English translation
- Agenda/event card readability
- Dates/times/event names preserved
- Crop/overflow on cards
- Brand preservation
- Overall digital direction

### Page 6 (MEDIUM risk — editorial/business community layout)

- Visible English translation
- Headline/body readability
- Business/community terms preserved
- Crop/overflow
- Brand preservation
- Overall digital direction

**Strategic QA rule:** Review both pages in one session, report one decision per page.

---

## Hard Limits

- No homepage wiring
- No main reader wiring
- No sitemap entry
- No public launch claim
- No final PDF
- No FlipHTML5 export
- No new provider call

---

## Next Gate

**`AUGUST-2026-BATCH2-PAGES5-6-CHUY-QA-DECISION1`**

Purpose:

- Chuy reports one decision per page.
- Coach decides whether to continue, fix, rebuild, or use companion layer.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Page 5 QA route created | **TRUE** |
| Page 6 QA route created | **TRUE** |
| Page 5 QA URL documented | **TRUE** |
| Page 6 QA URL documented | **TRUE** |
| QA assets isolated under public/qa | **TRUE** |
| No public magazine registry changed | **TRUE** |
| No homepage changed | **TRUE** |
| No sitemap changed | **TRUE** |
| No provider call | **TRUE** |
| No source originals modified | **TRUE** |
| Ready for Chuy visual QA | **TRUE** |

---

## Final Decision

**AUGUST_BATCH2_PAGES5_6_WEB_QA_URLS_READY**

**READY FOR CHUY QA AT https://www.leonixmedia.com/magazine/qa/2026-august/page-5-english AND https://www.leonixmedia.com/magazine/qa/2026-august/page-6-english: YES**

Chuy QA decision doc: [`AUGUST-2026-BATCH2-PAGES5-6-CHUY-QA-DECISION.md`](AUGUST-2026-BATCH2-PAGES5-6-CHUY-QA-DECISION.md) · Decisions: Page 5 `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES` · Page 6 `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES` · Next gate: `AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH3-PLAN1`
