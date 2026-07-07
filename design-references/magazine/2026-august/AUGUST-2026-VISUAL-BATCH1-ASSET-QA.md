# AUGUST 2026 VISUAL BATCH 1 ASSET QA

Gate: `AUGUST-2026-VISUAL-BATCH1-ASSET-CREATION`  
Date: 2026-07-06  
Owner: Coach (PM / production lead) · Chuy (asset placement + QA approval) · Cursor (crew / docs)  
Parent packet: [`AUGUST-2026-VISUAL-BATCH1.md`](AUGUST-2026-VISUAL-BATCH1.md)

---

## Executive Summary

This file controls **placement and QA** for Visual Batch 1 assets in the August 2026 Leonix Magazine.

**Batch 1 pages:** 5, 6, and 12

- **Page 5** — Agenda de Agosto
- **Page 6** — Negocios que construyen comunidad
- **Page 12** — Sé parte del movimiento Leonix

**This is not:**

- Public approval
- Print approval
- FlipHTML5 approval

**This gate does not generate images.** It prepares verification for when Chuy places the generated/downloaded visual files into the correct folder with exact filenames.

**Current Batch 1 status:** **AWAITING_ASSET** (all three pages)

---

## Batch 1 Asset Targets

| Page | Working Title | Required Master Sample File | Expected Folder | Current Status | QA Status |
|------|---------------|-----------------------------|-----------------|----------------|-----------|
| **5** | Agenda de Agosto | `august-2026-005-agenda-de-agosto-master-sample.png` | `design-references/magazine/2026-august/01-master-samples` | **AWAITING_ASSET** | **NOT_REVIEWED** |
| **6** | Negocios que construyen comunidad | `august-2026-006-negocios-comunidad-master-sample.png` | `design-references/magazine/2026-august/01-master-samples` | **AWAITING_ASSET** | **NOT_REVIEWED** |
| **12** | Sé parte del movimiento Leonix | `august-2026-012-back-cover-master-sample.png` | `design-references/magazine/2026-august/01-master-samples` | **AWAITING_ASSET** | **NOT_REVIEWED** |

---

## Exact Placement Instructions For Chuy

Generated or downloaded PNGs must be placed here:

```
C:\projects\elaguila-website\design-references\magazine\2026-august\01-master-samples
```

**Required exact filenames:**

1. `august-2026-005-agenda-de-agosto-master-sample.png`
2. `august-2026-006-negocios-comunidad-master-sample.png`
3. `august-2026-012-back-cover-master-sample.png`

**Do not put them in:**

- `C:\projects\elaguila-website\public`
- `C:\projects\elaguila-website\public\magazine`
- `C:\projects\elaguila-website\app`
- `C:\projects\elaguila-website\components`

---

## Batch 1 QA Checklist

| QA Item | Page 5 | Page 6 | Page 12 | Notes |
|---------|--------|--------|---------|-------|
| File exists in `01-master-samples` | ☐ | ☐ | ☐ | Exact path under `design-references/` |
| Exact filename used | ☐ | ☐ | ☐ | See asset targets table |
| Outside `public` | ☐ | ☐ | ☐ | Must remain reference-only |
| 8 × 11.5 portrait ratio or approved matching ratio | ☐ | ☐ | ☐ | Same proportion as existing August samples |
| Same visual scale as existing August samples | ☐ | ☐ | ☐ | Compare to cover + Leonix house ad |
| Text readable at normal PDF/page view | ☐ | ☐ | ☐ | No micro-type |
| Translation-safe spacing | ☐ | ☐ | ☐ | 15–25% extra room in text areas |
| No tiny footer/contact text | ☐ | ☐ | ☐ | Especially page 12 |
| Safe margins respected | ☐ | ☐ | ☐ | 0.25 in safe zone |
| Page marker present | ☐ PÁG. 05 | ☐ PÁG. 06 | ☐ PÁG. 12 | |
| Not final/public | ☐ | ☐ | ☐ | Master sample only |
| Not print approved | ☐ | ☐ | ☐ | |
| Not FlipHTML5 approved | ☐ | ☐ | ☐ | |

---

## Page 5 — Agenda de Agosto QA

- Must feel **useful, warm, community/event focused**
- Must **not** claim exact unverified real dates or venues
- Event cards must be **roomy** — 4 to 6 maximum
- Include *“Fechas y detalles sujetos a confirmación”* or equivalent disclaimer
- Include page marker **PÁG. 05**
- **No tiny table text**
- **No public approval** until reviewed in `AUGUST-2026-VISUAL-BATCH1-ASSET-PLACED-QA`

---

## Page 6 — Negocios que construyen comunidad QA

- Must feel like a **business/community editorial page**, not a fake client ad
- Must **not** invent named businesses unless Chuy provides them
- Must use **modular business/value cards**
- Must include CTA direction like **“Anuncia tu negocio con Leonix”**
- Include page marker **PÁG. 06**
- **Avoid long paragraphs**
- **No public approval** until reviewed

---

## Page 12 — Sé parte del movimiento Leonix QA

- Must feel like a **premium back cover / closing CTA**
- Must include **canonical Leonix contact truth:**

```
Leonix Media
871 Coleman Avenue, Suite 201
San Jose, CA 95110
(408) 360-6500
info@leonixmedia.com
leonixmedia.com
```

- Must **not** use **Suite 202**
- Must **not** use **275 Coleman**
- Must include **“Que ruja el león.”**
- Include page marker **PÁG. 12**
- Contact block must be **readable**
- QR placeholder must be **large** (inside safe margin)
- **No public approval** until reviewed

---

## Canonical Contact Truth

Use on Leonix-owned pages (especially Page 12):

```
Leonix Media
Leonix Global LLC
871 Coleman Avenue, Suite 201
San Jose, CA 95110
(408) 360-6500
info@leonixmedia.com
leonixmedia.com
```

**Rules:**

- **Suite 201** is correct
- **Suite 202** is wrong for current public Leonix materials
- **275 Coleman** is wrong for current public Leonix materials
- **Non-canonical phone numbers** must not appear on Leonix-owned pages

---

## Status Labels

| Label | Meaning |
|-------|---------|
| **AWAITING_ASSET** | File not yet placed in `01-master-samples/` |
| **ASSET_PLACED** | File placed; QA not started |
| **QA_NEEDED** | File placed; ready for visual QA |
| **QA_FIX_NEEDED** | QA failed; revision required |
| **MASTER_SAMPLE_APPROVED** | Visual master sample approved for reference |
| **SOURCE_REBUILD_NEEDED** | Editable source required in `02-source-layouts/` |
| **SPANISH_FINAL_READY** | Approved Spanish export in `03-spanish-final/` |
| **PRINT_READY** | Approved for `06-print-ready-pdf/` |
| **FLIPHTML5_READY** | Approved for `07-fliphtml5-export/` |
| **PUBLIC_READY** | Approved for `public/` serving (separate gate) |

**Current Batch 1 status:** **AWAITING_ASSET** (pages 5, 6, 12)

---

## Do Not Do Yet

- Do **not** generate images in Cursor
- Do **not** modify existing PNGs
- Do **not** move assets to `public/`
- Do **not** create final PDF
- Do **not** upload to FlipHTML5
- Do **not** call assets print-ready
- Do **not** call assets public-ready
- Do **not** translate pages
- Do **not** call DeepL
- Do **not** commit/push (unless Chuy explicitly requests later)

---

## Next Gate

**`AUGUST-2026-VISUAL-BATCH1-ASSET-PLACED-QA`**

Purpose:

- Run **after** Chuy places the three generated/downloaded PNGs into `01-master-samples/`
- Verify exact filenames
- Verify dimensions/ratio if possible
- Verify files remain outside `public/`
- QA contact truth and readability (especially page 12)
- Decide whether Batch 1 is **MASTER_SAMPLE_APPROVED** or **QA_FIX_NEEDED**

---

## Related Docs

- [`AUGUST-2026-VISUAL-BATCH1.md`](AUGUST-2026-VISUAL-BATCH1.md) — production briefs and prompt notes
- [`AUGUST-2026-MAGAZINE-BLUEPRINT.md`](AUGUST-2026-MAGAZINE-BLUEPRINT.md) — production standards
- [`AUGUST-2026-PAGE-PLAN.md`](AUGUST-2026-PAGE-PLAN.md) — 12-page lineup

---

## Cost-Control Proof (this gate)

| Action | Result |
|--------|--------|
| Images generated | **FALSE** |
| Images modified | **FALSE** |
| PDF created | **FALSE** |
| DeepL called | **FALSE** |
| Public assets changed | **FALSE** |
