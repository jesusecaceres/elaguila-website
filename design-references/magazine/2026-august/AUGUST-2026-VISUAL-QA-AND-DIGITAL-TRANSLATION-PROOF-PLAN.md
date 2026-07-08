# AUGUST 2026 VISUAL QA + DIGITAL TRANSLATION PROOF PLAN

Gate: `AUGUST-2026-VISUAL-QA-AND-DIGITAL-TRANSLATION-PROOF-PLAN1`  
Date: 2026-07-07  
Owner: Coach (architect / PM) · Chuy (visual QA + final approval) · Cursor (crew / docs)  
Prior closeout: [`AUGUST-2026-NIGHTLY-CLOSEOUT.md`](AUGUST-2026-NIGHTLY-CLOSEOUT.md)

---

## Executive Summary

This is the **first full workday plan** for August 2026 Leonix Magazine. It proves whether AI-created master sample PNGs can support a **digital translation workflow** — without claiming public readiness or running providers in this gate.

**Current state:**

- **12-page starter issue** planned
- **7 master samples** exist (pages 1–6, 12)
- **Pages 7–11** still need visual assets
- **Chuy visual QA** still required on all existing samples
- **Nothing** is public, final, print-ready, FlipHTML5-ready, or translation-complete

**This gate:** documentation + strategy only. **No DeepL, no Google, no PNG edits, no public assets.**

---

## Print vs Digital Translation Doctrine

| Channel | Rule |
|---------|------|
| **Print** | **Spanish-only.** The printed Leonix magazine is the official Spanish product. |
| **Digital translated editions** | **Digital-only.** English, Portuguese, and other languages exist only as digital magazine assets — never as a translated print run. |
| **Print + digital bridge** | Printed magazine may include **QR codes** and instructions pointing readers to digital access. |
| **Print reader support** | Print readers may use **Google Lens** (or similar) as a practical translation aid on physical pages — this is support, not a substitute for an approved digital edition. |
| **Homepage / digital section** | Translated **digital** editions may later be promoted on the homepage and digital magazine section — **only after proof + QA approval**. |
| **No translated print** | No translated print edition is required or planned. |
| **No fake claims** | No translated magazine may be claimed public until a **real local proof** is QA-approved. |
| **Public serving** | No registry row, no `public/` asset, no reader wiring until explicit approval gate. |

**June 2026 lesson:** Flattened PDFs blocked reliable full-document DeepL proof. August AI PNGs likely share the same **flattened text** risk — digital proof must be **controlled and experimental** before scaling.

---

## Current August Status

| Area | Status | Notes |
|------|--------|-------|
| Planning chain | **DONE** | Blueprint through nightly closeout |
| 12-page lineup | **DONE** | Starter issue locked |
| Master samples (7 pages) | **EXISTS** | Pages 1–6, 12 — all 1046×1504 |
| Pages 7–11 | **NOT_STARTED** | Batch 2/3 visuals pending |
| Chuy visual QA | **QA_NEEDED** | All 7 pages — CHUY_VISUAL_QA_NEEDED |
| Digital translation proof | **NOT_STARTED** | This plan defines path |
| Print Spanish final | **NOT_STARTED** | Spanish-only print doctrine |
| Public / FlipHTML5 / print PDF | **NOT_STARTED** | Nothing final |

---

## Image Metadata Summary (Verified 2026-07-07)

All under `design-references/magazine/2026-august/01-master-samples/` — **outside `public/`**.

| Page | File | Width | Height | Ratio | Size (bytes) | PNG Valid |
|------|------|-------|--------|-------|--------------|-----------|
| 1 | `august-2026-cover-master-sample.png` | 1046 | 1504 | 0.6955 | 2,404,449 | **YES** |
| 2 | `august-2026-leonix-house-ad-master-sample.png` | 1046 | 1504 | 0.6955 | 2,343,963 | **YES** |
| 3 | `august-2026-calibear-tacos-master-sample.png` | 1046 | 1504 | 0.6955 | 2,086,177 | **YES** |
| 4 | `august-2026-elevated-barber-master-sample.png` | 1046 | 1504 | 0.6955 | 2,187,260 | **YES** |
| 5 | `august-2026-005-agenda-de-agosto-master-sample.png` | 1046 | 1504 | 0.6955 | 2,310,868 | **YES** |
| 6 | `august-2026-006-negocios-comunidad-master-sample.png` | 1046 | 1504 | 0.6955 | 2,316,788 | **YES** |
| 12 | `august-2026-012-back-cover-master-sample.png` | 1046 | 1504 | 0.6955 | 2,167,940 | **YES** |

**Ratio:** 1046 ÷ 1504 ≈ **0.6955** — matches **8 in ÷ 11.5 in** (≈ 0.6957).

---

## Visual QA Checklist — Current Master Samples

| Page | File | Style Family | Padding / Safe Margins | Text Readability | Contact Truth | Translation Risk | QA Status |
|------|------|--------------|------------------------|------------------|---------------|------------------|-----------|
| **1** Cover | `august-2026-cover-master-sample.png` | August cream/green/gold | Chuy check hero + footer margins | Cover copy controlled | Leonix footer if present — Suite 201 | **MEDIUM** | **CHUY_VISUAL_QA_NEEDED** |
| **2** Leonix house ad | `august-2026-leonix-house-ad-master-sample.png` | August family | CTA + contact bar spacing | Ad body + CTA readable | **Leonix contact — HIGH priority** Suite 201 | **MEDIUM** | **CHUY_VISUAL_QA_NEEDED** |
| **3** Cali Bear | `august-2026-calibear-tacos-master-sample.png` | August family | Food/menu block spacing | Menu + client contact | **Client info** — not Leonix canonical | **MEDIUM / HIGH** | **CHUY_VISUAL_QA_NEEDED** |
| **4** Elevated Barber | `august-2026-elevated-barber-master-sample.png` | August family | Service/pricing grid spacing | Pricing readable | **Client info** — verify client contact | **MEDIUM** | **CHUY_VISUAL_QA_NEEDED** |
| **5** Agenda | `august-2026-005-agenda-de-agosto-master-sample.png` | August family | Event card row height | Event cards readable | Disclaimer present; no fake dates | **MEDIUM / HIGH** (dense listings) | **CHUY_VISUAL_QA_NEEDED** |
| **6** Negocios | `august-2026-006-negocios-comunidad-master-sample.png` | August family | Modular card spacing | Short blocks, not essays | Leonix CTA bar — phone/web | **MEDIUM** | **CHUY_VISUAL_QA_NEEDED** |
| **12** Back cover | `august-2026-012-back-cover-master-sample.png` | August family | QR + contact safe zone | CTA + contact block | **Leonix — HIGHEST priority** Suite 201, no 202/275 Coleman | **HIGH** | **CHUY_VISUAL_QA_NEEDED** |

**Chuy owns final APPROVE / FIX NEEDED** on every row.

---

## Digital Translation Proof Strategy

### Problem

Flat **PNG** magazine pages are **raster images with baked-in text**. DeepL document translation (`translateDocument`) works best on **PDFs with extractable text layers**. June 2026 proved flattened sources may return **mostly unchanged** output or fail size limits.

August AI-created PNGs are likely **IMAGE_FLATTENED_LIKELY** — same class of risk as June.

### Recommended first proof target

**Page 12 — `august-2026-012-back-cover-master-sample.png`**

**Why Page 12 first:**

- Contains **canonical Leonix contact truth** — proves whether contact blocks survive translation
- Contains **CTA blocks** and **QR layout** — tests padding/readability after translation
- **Back cover** — high-value Leonix-owned page; failure here blocks digital translation strategy
- Single page, controlled cost — one provider call max in later gate
- If Page 12 translates badly → **editable source rebuild (Option B)** required before more pages

### Proof approach options

| Option | Description | Reliability | When to use |
|--------|-------------|-------------|-------------|
| **A — PNG → one-page PDF → DeepL** | Wrap PNG in local one-page PDF; submit to DeepL in approved provider gate only | **Low–medium** — may not translate flattened image text | **Start here** — controlled experiment |
| **B — Editable source rebuild first** | Rebuild in Canva/Figma; export PDF with text layer; then DeepL | **High** | If Option A fails or text unchanged |
| **C — Companion reader / HTML text layer** | Keep PNG as visual; add translated text companion alongside | **High accessibility** | If image translation never works acceptably |

**Recommendation:** Run **Option A on Page 12** as first experiment → choose **B or C** based on results. Do **not** translate full August issue until Page 12 proof succeeds.

### Existing repo tooling (reference only — not run this gate)

- `scripts/magazine/proof-translate-deepl.mjs` — June PDF page extraction + DeepL (needs August adapter for PNG-sourced one-page PDF)
- `scripts/magazine-deepl-readiness-audit.mjs` — env readiness check
- Output folder pattern: `.magazine-proof-output/` (gitignored)
- Platform rules: `docs/magazine-translation-platform-runbook.md`

**August proof output path (future):** `.magazine-proof-output/2026-august/{locale}/page-smoke/page-012/`

---

## First Translation Proof Candidate

| Field | Value |
|-------|-------|
| **Page** | 12 |
| **File** | `august-2026-012-back-cover-master-sample.png` |
| **Path** | `design-references/magazine/2026-august/01-master-samples/` |
| **Target language (Chuy decides)** | English (`en`) or Portuguese (`pt`) — recommend **English first** for readability QA, then PT if EN succeeds |
| **Provider** | DeepL document API (later gate only) |
| **Public** | **NO** — local proof only |

---

## Today’s Work Checklist

1. **Chuy visually QA pages 5, 6, 12** — APPROVE or FIX NEEDED
2. **Confirm pages 1–4** still match August style family
3. **Confirm Page 12 contact truth** — Suite 201, (408) 360-6500, info@leonixmedia.com, leonixmedia.com
4. **Prepare Page 12 digital translation proof method** — Option A prep gate
5. **Run controlled one-page proof** only after explicit approval (`AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1`)
6. **Decide** whether AI PNG pages need editable source rebuild (Option B)
7. **If proof acceptable** → plan Batch 2 pages 7–11 (`AUGUST-2026-VISUAL-QA-AND-BATCH2-PLAN1`)
8. **If proof fails** → prioritize source rebuild before creating more pages
9. **Keep print Spanish-only**
10. **Keep digital translations separate from print**
11. **Do not move anything into `public/`**
12. **Do not create final PDF yet**

---

## Next Gates (Ordered)

### 1. `AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP1` — **DONE**

Prep result: [`AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP.md`](AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP.md) · Input: `.magazine-proof-output/2026-august/_inputs/page-smoke/page-012/source-page-012-from-png.pdf`

### 2. `AUGUST-2026-PAGE12-DEEPL-DIGITAL-PROOF1` — **NEXT**

Purpose:

- **Exactly one** provider proof call for Page 12 only
- Target: English or Portuguese (Chuy decision)
- Local output under `.magazine-proof-output/2026-august/`
- **Not public** — not QA-approved until Chuy reviews
- **No full issue translation**

### 3. `AUGUST-2026-VISUAL-QA-AND-BATCH2-PLAN1`

Purpose:

- After visual QA + Page 12 proof learnings
- Plan Batch 2 visuals (pages 7, 8, 9) and Batch 3 (10, 11) if proof path acceptable
- If proof fails → defer Batch 2 until source rebuild strategy locked

---

## Do Not Do Yet

- Do not generate or modify PNG files
- Do not call DeepL or Google Translate
- Do not create translated images or public assets
- Do not create final print PDF or FlipHTML5 export
- Do not move files into `public/`
- Do not claim translated August magazine exists
- Do not commit/push (unless Chuy explicitly requests)

---

## Related Docs

- [`AUGUST-2026-NIGHTLY-CLOSEOUT.md`](AUGUST-2026-NIGHTLY-CLOSEOUT.md)
- [`AUGUST-2026-VISUAL-BATCH1-ASSET-QA.md`](AUGUST-2026-VISUAL-BATCH1-ASSET-QA.md)
- [`AUGUST-2026-MAGAZINE-BLUEPRINT.md`](AUGUST-2026-MAGAZINE-BLUEPRINT.md)
- `docs/magazine-translation-platform-runbook.md`
- `scripts/magazine/README.md`

---

## Cost-Control Proof (this gate)

| Action | Result |
|--------|--------|
| Images generated | **FALSE** |
| Images modified | **FALSE** |
| PDF created | **FALSE** |
| DeepL called | **FALSE** |
| Google Translate called | **FALSE** |
| Public assets changed | **FALSE** |

---

## Final Decision

**AUGUST_DIGITAL_TRANSLATION_PROOF_PLAN_DONE**

**READY FOR AUGUST-2026-PAGE12-PNG-TO-DEEPL-PROOF-PREP1: YES**

Page 12 English proof decision locked (`TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF`). Controlled Batch 2 planning is next: `AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN1`. See [`AUGUST-2026-PAGE12-ENGLISH-PROOF-CHUY-DECISION.md`](AUGUST-2026-PAGE12-ENGLISH-PROOF-CHUY-DECISION.md). Batch 2 plan selected pages 5 and 6 for controlled English proof planning — see [`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN.md`](AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH2-PLAN.md). Batch 3 plan selected pages 2, 3, and 4 for controlled English proof planning — see [`AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH3-PLAN.md`](AUGUST-2026-CONTROLLED-ENGLISH-PROOF-BATCH3-PLAN.md). Batch 3 proves client/ad-facing pages can proceed into multilingual pipeline architecture planning — see [`AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md`](AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md).
