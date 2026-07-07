# AUGUST 2026 SOURCE LAYOUT GENERATION MAP

Gate: `AUGUST-2026-SOURCE-LAYOUT-GENERATION1`  
Date: 2026-07-06  
Owner: Coach (PM / production lead) · Chuy (approval) · Cursor (crew / docs)  
Parent docs: [`AUGUST-2026-MAGAZINE-BLUEPRINT.md`](AUGUST-2026-MAGAZINE-BLUEPRINT.md) · [`AUGUST-2026-PAGE-PLAN.md`](AUGUST-2026-PAGE-PLAN.md)

---

## Executive Summary

This document turns the **August page plan** into a **production map** for source layout creation across the 12-page starter issue.

The four PNG files in `01-master-samples/` are **master samples only** — visual direction, not final editable or public assets.

**Current state:**

- No final public assets exist
- No print PDF exists
- No FlipHTML5 export exists
- Pages 5–12 have **no visual assets yet**
- Pages 1–4 have master samples but still need **editable source layouts**

This map decides **what layouts to create next**, how to name them, where they live, and which pages carry the highest translation risk — following the August blueprint and page plan.

---

## Production Rules Inherited

- **8 in × 11.5 in** portrait trim — same size for every page and full-page ad
- **No random ad dimensions**
- Master samples remain in `01-master-samples/` — reference only
- Source layouts → `02-source-layouts/`
- Approved Spanish finals → `03-spanish-final/`
- English proof pages → `04-english-proof/`
- Portuguese proof pages → `05-portuguese-proof/`
- Print PDF → `06-print-ready-pdf/`
- FlipHTML5 export → `07-fliphtml5-export/`
- **Suite 201** Leonix contact truth on Leonix-owned pages
- **Translation-safe spacing** required (15–25% extra room in text areas)
- **No public serving** until final approval gate

---

## Existing Master Samples

| Page | Type | File Name | Current Status | Production Meaning |
|------|------|-----------|----------------|--------------------|
| 1 | Cover | `august-2026-cover-master-sample.png` | **MASTER_SAMPLE_READY / NOT_FINAL** | Visual direction approved for planning; editable source + Spanish final still needed |
| 2 | Leonix house ad | `august-2026-leonix-house-ad-master-sample.png` | **MASTER_SAMPLE_READY / NOT_FINAL** | Ad-sales direction locked; source rebuild required before print/public |
| 3 | Client ad | `august-2026-calibear-tacos-master-sample.png` | **MASTER_SAMPLE_READY / NOT_FINAL** | Client ad prototype; verify client contact before final |
| 4 | Client ad | `august-2026-elevated-barber-master-sample.png` | **MASTER_SAMPLE_READY / NOT_FINAL** | Service ad prototype; verify pricing/contact before final |

Location: `design-references/magazine/2026-august/01-master-samples/`

---

## 12-Page Source Layout Matrix

| Page | Working Title | Current Asset | Source Layout Needed | Priority | Translation Risk | Production Notes |
|------|---------------|---------------|----------------------|----------|------------------|------------------|
| **1** | August 2026 Cover | MASTER_SAMPLE_READY | **YES** | **HIGH** | LOW / MEDIUM | Keep cover copy controlled; avoid crowded teasers |
| **2** | Más que un anuncio: presencia que convierte | MASTER_SAMPLE_READY | **YES** | **HIGH** | MEDIUM | Suite 201 contact; media-kit CTA readable |
| **3** | Auténticos tacos callejeros mexicanos | MASTER_SAMPLE_READY | **YES** | **HIGH** | MEDIUM / HIGH | Client contact verified before final; food blocks need room |
| **4** | Precisión en cada corte | MASTER_SAMPLE_READY | **YES** | **HIGH** | MEDIUM | Client pricing/contact verified; service grid readable |
| **5** | Agenda de Agosto | NEEDED | **YES** | **HIGH** | MEDIUM | Event rows roomy; dates/locations verified later |
| **6** | Negocios que construyen comunidad | NEEDED | **YES** | **HIGH** | MEDIUM | Modular cards; spotlight local entrepreneurs |
| **7** | Receta de la comunidad | NEEDED | **YES** | MEDIUM | **HIGH** | Ingredients/steps need spacious layout |
| **8** | Familia y bienestar | NEEDED | **YES** | MEDIUM | **HIGH** | Wellness text modular; no dense paragraphs |
| **9** | Finanzas y negocio | NEEDED | **YES** | MEDIUM | MEDIUM / HIGH | Tips/cards only; avoid legal advice claims |
| **10** | Cultura que nos une | NEEDED | **YES** | MEDIUM | MEDIUM | Arts/culture feature; balance text and images |
| **11** | Recursos que ayudan | NEEDED | **YES** | MEDIUM | **HIGH** | Large table rows; avoid tiny resource text |
| **12** | Sé parte del movimiento Leonix | NEEDED | **YES** | **HIGH** | LOW / MEDIUM | Back cover CTA; QR + Suite 201 contact close |

---

## Recommended Next Visual Creation Batch

| Batch | Pages | Why | Risk Control |
|-------|-------|-----|--------------|
| **Batch 1** — Leonix-owned structure | **5** Agenda de Agosto · **6** Negocios que construyen comunidad · **12** Back cover / Sé parte del movimiento Leonix | Defines issue identity; Leonix-owned; no outside client approval first; completes magazine frame | Medium risk; modular event rows and cards; canonical contact on page 12 |
| **Batch 2** — Editorial utility | **7** Receta · **8** Familia y bienestar · **9** Finanzas y negocio | Adds community value; needs text discipline | HIGH on 7–8; create after Batch 1 so spacing standards stay consistent |
| **Batch 3** — Culture / resources | **10** Cultura que nos une · **11** Recursos que ayudan | Community depth; resource page is highest table risk | HIGH on page 11; large rows; fewer rows per page if needed |
| **Batch 4** — Source-ready rebuild | **1–4** Cover, Leonix house ad, Cali Bear, Elevated Barber | Master samples exist; need editable source before print/public final | Rebuild with translation room; verify client details on 3–4 |

---

## Coach Recommendation

**Recommended next actual visual batch:** **`AUGUST-2026-VISUAL-BATCH1`**

**Pages:**

- **Page 5** — Agenda de Agosto
- **Page 6** — Negocios que construyen comunidad
- **Page 12** — Back cover / Sé parte del movimiento Leonix

**Reason:** This gives the issue a **real editorial frame** (events + business spotlight + closing CTA) before dense resource pages or source rebuilds of existing ad samples. All three are Leonix-owned — no client approval dependency.

---

## Page-by-Page Prompt Notes

### Page 1 — August 2026 Cover

- Master sample exists: `august-2026-cover-master-sample.png`
- Source layout needed later (Batch 4)
- Keep cover copy **controlled** — issue date, brand, minimal teaser text
- Translation risk: **LOW / MEDIUM**
- Avoid crowded teasers or micro-type on cover footer
- Leonix contact on cover footer must use **Suite 201** when included

### Page 2 — Leonix House Ad

- Master sample exists: `august-2026-leonix-house-ad-master-sample.png`
- Source layout needed later (Batch 4)
- Must use **Suite 201** canonical contact truth
- Translation risk: **MEDIUM**
- CTA and contact blocks must be readable at normal view
- Short CTA labels with horizontal expansion room

### Page 3 — Cali Bear Tacos

- Master sample exists: `august-2026-calibear-tacos-master-sample.png`
- Source layout needed later (Batch 4)
- **Client contact details must be verified** before final export
- Translation risk: **MEDIUM / HIGH**
- Food photos and menu/text blocks need generous spacing
- Preserve **client** contact — do not replace with Leonix canonical

### Page 4 — Elevated Barber

- Master sample exists: `august-2026-elevated-barber-master-sample.png`
- Source layout needed later (Batch 4)
- **Client pricing and contact must be verified** before final
- Translation risk: **MEDIUM**
- Service/pricing grid must remain readable after translation

### Page 5 — Agenda de Agosto

- **No asset yet** — create in **Batch 1**
- Community events calendar for August 2026
- Dates and locations must be **verified before print**
- Translation risk: **MEDIUM**
- Event rows must be **roomy** — date | event | location columns with large row height

### Page 6 — Negocios que construyen comunidad

- **No asset yet** — create in **Batch 1**
- Spotlight local entrepreneurs / business movement
- Translation risk: **MEDIUM**
- Use **modular cards**, not long essays
- 2–4 business spotlights with photo + short blurb each

### Page 7 — Receta de la comunidad

- **No asset yet** — create in **Batch 2**
- Community recipe feature
- Translation risk: **HIGH**
- Ingredients and steps need **roomy layout** — numbered steps with 15–25% extra vertical space
- Avoid tiny ingredient lists

### Page 8 — Familia y bienestar

- **No asset yet** — create in **Batch 2**
- Family and wellness editorial
- Translation risk: **HIGH**
- Wellness text must be **modular** — short blocks, not paragraph walls
- Avoid dense paragraph blocks

### Page 9 — Finanzas y negocio

- **No asset yet** — create in **Batch 2**
- Practical business/finance tips for community
- Translation risk: **MEDIUM / HIGH**
- Use **tips/cards** — 4–6 modular tips
- Avoid legal/financial advice claims; keep general educational tone

### Page 10 — Cultura que nos une

- **No asset yet** — create in **Batch 3**
- Arts, music, books, local artists
- Translation risk: **MEDIUM**
- Keep text balanced with images — modular feature blocks

### Page 11 — Recursos que ayudan

- **No asset yet** — create in **Batch 3**
- Community resources directory
- Translation risk: **HIGH**
- Resource rows/tables require **large readable spacing**
- Avoid tiny table text; fewer rows per page if needed

### Page 12 — Sé parte del movimiento Leonix

- **No asset yet** — create in **Batch 1**
- Back cover / closing CTA page
- Translation risk: **LOW / MEDIUM**
- Strong QR, contact, and **advertise with us** close
- Use **canonical Leonix contact truth** (Suite 201, (408) 360-6500, info@leonixmedia.com, leonixmedia.com)

---

## Source Layout Requirements

- **PNG master samples** are visual references — **not** editable source files
- **Long-term best system:** Canva / Figma / InDesign or controlled source-layout workflow in `02-source-layouts/`
- Text should remain **editable as long as possible** — do not flatten until final export
- Exported PNG/PDF is **final output**, not source of truth
- Source layouts must preserve **8 × 11.5 in** ratio
- Source layouts must be built with **translation expansion room** from the start
- Manual copy review required before Spanish final and print

---

## Translation-Proof Requirements

| Page Type | Required Translation Protection |
|-----------|---------------------------------|
| Cover | Short headline block; extra margin on title; controlled teaser count |
| Ad page (house/client) | Wider text boxes; short CTA labels; readable contact; client vs Leonix contact preserved |
| Recipe page | Numbered steps with 15–25% extra vertical space; large ingredient list rows |
| Wellness page | Modular short blocks; no narrow columns; no paragraph walls |
| Finance page | Tip cards with room for expansion; avoid dense bullet stacks |
| Resource page | Large table rows; wide columns; fewer rows if needed; no micro-type |
| Back cover | Short CTA headline; QR in safe zone; spaced contact bar (Suite 201) |

**Universal rules:**

- Leave **15–25% extra room** for body text
- Avoid tiny captions
- CTA text must have room to expand horizontally
- Keep QR/contact text away from trim edge (0.25 in safe margin)
- Resource tables: fewer rows per page if needed for readability
- Do not put critical text over busy image backgrounds

---

## File Naming for Future Source Layouts

| Page | Source Layout Name | Spanish Final Name | English Proof Name | Portuguese Proof Name |
|------|--------------------|--------------------|--------------------|-----------------------|
| 1 | `august-2026-001-cover-source` | `august-2026-001-cover-es.png` | `august-2026-001-cover-en.png` | `august-2026-001-cover-pt.png` |
| 2 | `august-2026-002-leonix-house-ad-source` | `august-2026-002-leonix-house-ad-es.png` | `august-2026-002-leonix-house-ad-en.png` | `august-2026-002-leonix-house-ad-pt.png` |
| 3 | `august-2026-003-calibear-tacos-source` | `august-2026-003-calibear-tacos-es.png` | `august-2026-003-calibear-tacos-en.png` | `august-2026-003-calibear-tacos-pt.png` |
| 4 | `august-2026-004-elevated-barber-source` | `august-2026-004-elevated-barber-es.png` | `august-2026-004-elevated-barber-en.png` | `august-2026-004-elevated-barber-pt.png` |
| 5 | `august-2026-005-agenda-agosto-source` | `august-2026-005-agenda-agosto-es.png` | `august-2026-005-agenda-agosto-en.png` | `august-2026-005-agenda-agosto-pt.png` |
| 6 | `august-2026-006-negocios-comunidad-source` | `august-2026-006-negocios-comunidad-es.png` | `august-2026-006-negocios-comunidad-en.png` | `august-2026-006-negocios-comunidad-pt.png` |
| 7 | `august-2026-007-receta-comunidad-source` | `august-2026-007-receta-comunidad-es.png` | `august-2026-007-receta-comunidad-en.png` | `august-2026-007-receta-comunidad-pt.png` |
| 8 | `august-2026-008-familia-bienestar-source` | `august-2026-008-familia-bienestar-es.png` | `august-2026-008-familia-bienestar-en.png` | `august-2026-008-familia-bienestar-pt.png` |
| 9 | `august-2026-009-finanzas-negocio-source` | `august-2026-009-finanzas-negocio-es.png` | `august-2026-009-finanzas-negocio-en.png` | `august-2026-009-finanzas-negocio-pt.png` |
| 10 | `august-2026-010-cultura-source` | `august-2026-010-cultura-es.png` | `august-2026-010-cultura-en.png` | `august-2026-010-cultura-pt.png` |
| 11 | `august-2026-011-recursos-source` | `august-2026-011-recursos-es.png` | `august-2026-011-recursos-en.png` | `august-2026-011-recursos-pt.png` |
| 12 | `august-2026-012-back-cover-source` | `august-2026-012-back-cover-es.png` | `august-2026-012-back-cover-en.png` | `august-2026-012-back-cover-pt.png` |

**PDF bundles (after all pages approved):**

- Print: `leonix-media-august-2026-print-final.pdf`
- FlipHTML5: `leonix-media-august-2026-fliphtml5.pdf`

---

## Future Output Placement

| Stage | Path |
|-------|------|
| Source layouts | `design-references/magazine/2026-august/02-source-layouts` |
| Spanish finals | `design-references/magazine/2026-august/03-spanish-final` |
| English proof | `design-references/magazine/2026-august/04-english-proof` |
| Portuguese proof | `design-references/magazine/2026-august/05-portuguese-proof` |
| Print final | `design-references/magazine/2026-august/06-print-ready-pdf` |
| FlipHTML5 final | `design-references/magazine/2026-august/07-fliphtml5-export` |

**Batch 1 visual samples** (when created) should land in `01-master-samples/` or `02-source-layouts/` as reference until approved — **not** in `public/`.

---

## Do Not Do Yet

- Do **not** generate Batch 1 visuals in Cursor (this gate)
- Do **not** generate new images from this gate
- Do **not** publish August
- Do **not** upload to FlipHTML5
- Do **not** send to print shop
- Do **not** move files into `public/`
- Do **not** call translated pages complete
- Do **not** create final PDF
- Do **not** mix ad sizes yet

---

## Next Gate

**`AUGUST-2026-VISUAL-BATCH1-ASSET-CREATION`** — Production packet complete: [`AUGUST-2026-VISUAL-BATCH1.md`](AUGUST-2026-VISUAL-BATCH1.md)

Purpose:

- Create visual master samples for pages **5, 6, 12** — **only after Chuy approves visual creation**
- Preserve **8 × 11.5 in**, translation-safe spacing, reference-only status

---

## Related Docs

- [`AUGUST-2026-MAGAZINE-BLUEPRINT.md`](AUGUST-2026-MAGAZINE-BLUEPRINT.md)
- [`AUGUST-2026-PAGE-PLAN.md`](AUGUST-2026-PAGE-PLAN.md)
- `docs/magazine-source-canva-layout-compression-truth.md`

---

## Cost-Control Proof (this gate)

| Action | Result |
|--------|--------|
| Images generated | **FALSE** |
| Images modified | **FALSE** |
| PDF created | **FALSE** |
| DeepL called | **FALSE** |
| Public assets changed | **FALSE** |
