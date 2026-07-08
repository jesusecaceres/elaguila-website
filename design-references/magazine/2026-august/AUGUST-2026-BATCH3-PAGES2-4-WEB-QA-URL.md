# AUGUST 2026 BATCH 3 PAGES 2–4 WEB QA URLS

Gate: `AUGUST-2026-BATCH3-PAGES2-4-WEB-QA-URL1`
Date: 2026-07-07
Owner: Coach (PM) · Chuy (visual QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF.md`](AUGUST-2026-BATCH3-PAGES2-4-DEEPL-ENGLISH-PROOF.md)

---

## Executive Summary

- Temporary web QA URLs were created for Page 2, Page 3, and Page 4.
- These are for **Chuy visual QA only**.
- They are **not final**.
- They are **not public magazine launch pages**.
- They are **noindexed** (`index:false`, `follow:false`, `nocache:true`, googleBot `noimageindex:true`).
- They use **isolated `/public/qa/` assets** — not `/public/magazine/`.
- **Printed magazine remains Spanish-only.**
- **Translated editions remain digital-only.**

---

## QA URLs

- **Page 2:** `https://www.leonixmedia.com/magazine/qa/2026-august/page-2-english`
- **Page 3:** `https://www.leonixmedia.com/magazine/qa/2026-august/page-3-english`
- **Page 4:** `https://www.leonixmedia.com/magazine/qa/2026-august/page-4-english`

---

## Assets

| Page | Purpose | Source | QA Public Path |
|------|---------|--------|----------------|
| 2 | English proof PDF | `.magazine-proof-output/2026-august/en/page-smoke/page-002/deepl-page-002.en.pdf` | `public/qa/magazine/2026-august/page-002/deepl-page-002.en.pdf` |
| 2 | Spanish source PNG | `design-references/magazine/2026-august/01-master-samples/august-2026-leonix-house-ad-master-sample.png` | `public/qa/magazine/2026-august/page-002/source-page-002-spanish.png` |
| 2 | Metadata | `.magazine-proof-output/2026-august/en/page-smoke/page-002/metadata.json` | `public/qa/magazine/2026-august/page-002/metadata.json` |
| 2 | Visual QA template | `.magazine-proof-output/2026-august/en/page-smoke/page-002/visual-qa-template.json` | `public/qa/magazine/2026-august/page-002/visual-qa-template.json` |
| 3 | English proof PDF | `.magazine-proof-output/2026-august/en/page-smoke/page-003/deepl-page-003.en.pdf` | `public/qa/magazine/2026-august/page-003/deepl-page-003.en.pdf` |
| 3 | Spanish source PNG | `design-references/magazine/2026-august/01-master-samples/august-2026-calibear-tacos-master-sample.png` | `public/qa/magazine/2026-august/page-003/source-page-003-spanish.png` |
| 3 | Metadata | `.magazine-proof-output/2026-august/en/page-smoke/page-003/metadata.json` | `public/qa/magazine/2026-august/page-003/metadata.json` |
| 3 | Visual QA template | `.magazine-proof-output/2026-august/en/page-smoke/page-003/visual-qa-template.json` | `public/qa/magazine/2026-august/page-003/visual-qa-template.json` |
| 4 | English proof PDF | `.magazine-proof-output/2026-august/en/page-smoke/page-004/deepl-page-004.en.pdf` | `public/qa/magazine/2026-august/page-004/deepl-page-004.en.pdf` |
| 4 | Spanish source PNG | `design-references/magazine/2026-august/01-master-samples/august-2026-elevated-barber-master-sample.png` | `public/qa/magazine/2026-august/page-004/source-page-004-spanish.png` |
| 4 | Metadata | `.magazine-proof-output/2026-august/en/page-smoke/page-004/metadata.json` | `public/qa/magazine/2026-august/page-004/metadata.json` |
| 4 | Visual QA template | `.magazine-proof-output/2026-august/en/page-smoke/page-004/visual-qa-template.json` | `public/qa/magazine/2026-august/page-004/visual-qa-template.json` |

---

## Chuy Decision Options Per Page

- `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES`
- `FIX_NEEDED`
- `REBUILD_SOURCE_NEEDED`
- `COMPANION_LAYER_NEEDED`

---

## What Chuy Must Check

**Page 2 (MEDIUM — Leonix house ad / brand ad):**
- visible English translation
- Leonix brand voice
- CTA/contact blocks
- QR/contact zones
- crop/overflow
- overall digital direction

**Page 3 (HIGH — Cali Bear Tacos client restaurant ad):**
- visible English translation
- Cali Bear Tacos name preservation
- food/menu language
- offers/CTA/contact details
- crop/overflow
- premium client-ad direction

**Page 4 (HIGH — Elevated Barber client service ad):**
- visible English translation
- Elevated Barber name preservation
- service language
- premium ad tone
- CTA/contact details
- crop/overflow
- overall digital direction

---

## Hard Limits

- no homepage wiring
- no main reader wiring
- no sitemap
- no public launch claim
- no final PDF
- no FlipHTML5 export
- no new provider call

---

## Next Gate

`AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION1`

Purpose:
- Chuy reports one decision per page.
- Coach decides whether to continue, fix, rebuild, use companion layer, or move into pipeline architecture.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Page 2 QA route created | **TRUE** |
| Page 3 QA route created | **TRUE** |
| Page 4 QA route created | **TRUE** |
| Page 2 QA URL documented | **TRUE** |
| Page 3 QA URL documented | **TRUE** |
| Page 4 QA URL documented | **TRUE** |
| QA assets isolated under public/qa | **TRUE** |
| No public magazine registry changed | **TRUE** |
| No homepage changed | **TRUE** |
| No sitemap changed | **TRUE** |
| No provider call | **TRUE** |
| No source originals modified | **TRUE** |
| Ready for Chuy visual QA | **TRUE** |

---

## Final Decision

**AUGUST_BATCH3_PAGES2_4_WEB_QA_URLS_READY**

**READY FOR CHUY QA AT https://www.leonixmedia.com/magazine/qa/2026-august/page-2-english AND https://www.leonixmedia.com/magazine/qa/2026-august/page-3-english AND https://www.leonixmedia.com/magazine/qa/2026-august/page-4-english: YES**
