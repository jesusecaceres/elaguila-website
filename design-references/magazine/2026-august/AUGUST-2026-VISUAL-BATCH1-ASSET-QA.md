# AUGUST 2026 VISUAL BATCH 1 ASSET QA

Gate: `AUGUST-2026-VISUAL-BATCH1-ASSET-CREATION`  
Placement verification gate: `AUGUST-2026-VISUAL-BATCH1-ASSET-PLACED-QA`  
Date: 2026-07-06  
Owner: Coach (PM / production lead) · Chuy (asset placement + QA approval) · Cursor (crew / docs)  
Parent packet: [`AUGUST-2026-VISUAL-BATCH1.md`](AUGUST-2026-VISUAL-BATCH1.md)

---

## Executive Summary

This file controls **placement and QA** for Visual Batch 1 assets in the August 2026 Leonix Media magazine.

**Batch 1 pages:** 5, 6, and 12

- **Page 5** — Agenda de Agosto
- **Page 6** — Negocios que construyen comunidad
- **Page 12** — Sé parte del movimiento Leonix

**This is not:**

- Public approval
- Print approval
- FlipHTML5 approval

**Current Batch 1 status (after placement verification):** **ASSET_PLACED** — **QA_NEEDED** (all three pages)

Chuy placed all three required PNGs with exact filenames in `01-master-samples/`. Automated checks passed (existence, folder, dimensions, PNG validity). **Chuy visual QA decision still required.**

---

## Batch 1 Asset Targets

| Page | Working Title | Required Master Sample File | Expected Folder | Current Status | QA Status |
|------|---------------|-----------------------------|-----------------|----------------|-----------|
| **5** | Agenda de Agosto | `august-2026-005-agenda-de-agosto-master-sample.png` | `design-references/magazine/2026-august/01-master-samples` | **ASSET_PLACED** | **QA_NEEDED** |
| **6** | Negocios que construyen comunidad | `august-2026-006-negocios-comunidad-master-sample.png` | `design-references/magazine/2026-august/01-master-samples` | **ASSET_PLACED** | **QA_NEEDED** |
| **12** | Sé parte del movimiento Leonix | `august-2026-012-back-cover-master-sample.png` | `design-references/magazine/2026-august/01-master-samples` | **ASSET_PLACED** | **QA_NEEDED** |

---

## Batch 1 Placement Verification Result

Gate: `AUGUST-2026-VISUAL-BATCH1-ASSET-PLACED-QA` · Verified: 2026-07-06

| Page | Required File | Exists | Folder Correct | Outside Public | PNG Valid | Dimensions | Current Status | QA Status |
|------|---------------|--------|----------------|----------------|-----------|------------|----------------|-----------|
| **5** | `august-2026-005-agenda-de-agosto-master-sample.png` | **YES** | **YES** | **YES** | **YES** | 1046 × 1504 (0.6955) | **ASSET_PLACED** | **QA_NEEDED** |
| **6** | `august-2026-006-negocios-comunidad-master-sample.png` | **YES** | **YES** | **YES** | **YES** | 1046 × 1504 (0.6955) | **ASSET_PLACED** | **QA_NEEDED** |
| **12** | `august-2026-012-back-cover-master-sample.png` | **YES** | **YES** | **YES** | **YES** | 1046 × 1504 (0.6955) | **ASSET_PLACED** | **QA_NEEDED** |

**Existing older master samples (unchanged):** cover, Leonix house ad, Cali Bear, Elevated Barber — all present at same 1046 × 1504 dimensions.

**Ratio note:** 1046 ÷ 1504 ≈ **0.6955** — matches **8 in ÷ 11.5 in** (≈ 0.6957) and all seven August master samples share identical dimensions.

**Placement note:** Chuy renamed prior working filenames to canonical names (e.g. community-events → `005-agenda-de-agosto`, businesses-build-community → `006-negocios-comunidad`, local-advertising-vision-design → `012-back-cover`). Cursor did **not** rename or modify image binaries.

---

## Image Metadata (Automated Check)

| Page | File | Width | Height | Ratio | Size (bytes) | PNG Valid | Notes |
|------|------|-------|--------|-------|--------------|-----------|-------|
| **5** | `august-2026-005-agenda-de-agosto-master-sample.png` | 1046 | 1504 | 0.6955 | 2,310,868 | **YES** | Portrait; matches August sample set |
| **6** | `august-2026-006-negocios-comunidad-master-sample.png` | 1046 | 1504 | 0.6955 | 2,316,788 | **YES** | Portrait; matches August sample set |
| **12** | `august-2026-012-back-cover-master-sample.png` | 1046 | 1504 | 0.6955 | 2,167,940 | **YES** | Portrait; matches August sample set |

---

## Cursor Preview Notes (Not OCR — Chuy Is Final QA Owner)

Automated preview only. **No full text extraction.** Chuy must confirm visually.

### Page 5 — Agenda de Agosto

- **PÁG. 05** visible in header ribbon
- Six event-style cards with general timeframes (no specific unverified dates/venues)
- Disclaimer **“Fechas y detalles sujetos a confirmación”** present in footer area
- QR / community event submission area present
- Style consistent with August cream/green/gold family
- **Chuy check:** event-card readability, spacing, translation room

### Page 6 — Negocios que construyen comunidad

- **PÁG. 06** visible in header ribbon
- Editorial/community tone — generic categories (restaurantes, servicios, comercios, emprendedores), no fabricated named client
- Modular value cards + quote callout
- CTA **“Anuncia tu negocio con Leonix”** in footer bar
- **Chuy check:** modular blocks, no long essays, Leonix phone (408) 360-6500 in ad bar

### Page 12 — Sé parte del movimiento Leonix

- **PÁG. 12** visible in header
- Back-cover CTA layout with three benefit blocks (revista impresa, presencia digital, conexión comunidad)
- Large QR zone present
- Contact block shows **871 Coleman Avenue, Suite 201**, **(408) 360-6500**, **info@leonixmedia.com**, **leonixmedia.com**
- **“Que ruja el león.”** present
- Preview did **not** show Suite 202 or 275 Coleman
- **Chuy check:** confirm contact truth character-by-character; QR size; CTA readability

---

## Exact Placement Instructions For Chuy

Generated or downloaded PNGs must be placed here:

```
C:\projects\elaguila-website\design-references\magazine\2026-august\01-master-samples
```

**Required exact filenames:**

1. `august-2026-005-agenda-de-agosto-master-sample.png` — **PLACED**
2. `august-2026-006-negocios-comunidad-master-sample.png` — **PLACED**
3. `august-2026-012-back-cover-master-sample.png` — **PLACED**

**Do not put them in:**

- `C:\projects\elaguila-website\public`
- `C:\projects\elaguila-website\public\magazine`
- `C:\projects\elaguila-website\app`
- `C:\projects\elaguila-website\components`

---

## Batch 1 QA Checklist

| QA Item | Page 5 | Page 6 | Page 12 | Notes |
|---------|--------|--------|---------|-------|
| File exists in `01-master-samples` | ☑ | ☑ | ☑ | Verified 2026-07-06 |
| Exact filename used | ☑ | ☑ | ☑ | Canonical names |
| Outside `public` | ☑ | ☑ | ☑ | Under `design-references/` |
| 8 × 11.5 portrait ratio or approved matching ratio | ☑ | ☑ | ☑ | 1046×1504 all samples |
| Same visual scale as existing August samples | ☐ | ☐ | ☐ | **Chuy visual check** |
| Text readable at normal PDF/page view | ☐ | ☐ | ☐ | **Chuy visual check** |
| Translation-safe spacing | ☐ | ☐ | ☐ | **Chuy visual check** |
| No tiny footer/contact text | ☐ | ☐ | ☐ | **Chuy visual check** |
| Safe margins respected | ☐ | ☐ | ☐ | **Chuy visual check** |
| Page marker present | ☑ PÁG. 05 | ☑ PÁG. 06 | ☑ PÁG. 12 | Preview only |
| Not final/public | ☑ | ☑ | ☑ | Master sample only |
| Not print approved | ☑ | ☑ | ☑ | |
| Not FlipHTML5 approved | ☑ | ☑ | ☑ | |

---

## Page 5 — Agenda de Agosto QA

- Must feel **useful, warm, community/event focused**
- Must **not** claim exact unverified real dates or venues
- Event cards must be **roomy** — 4 to 6 maximum
- Include *“Fechas y detalles sujetos a confirmación”* or equivalent disclaimer
- Include page marker **PÁG. 05**
- **No tiny table text**
- **No public approval** until Chuy marks **MASTER_SAMPLE_APPROVED**

---

## Page 6 — Negocios que construyen comunidad QA

- Must feel like a **business/community editorial page**, not a fake client ad
- Must **not** invent named businesses unless Chuy provides them
- Must use **modular business/value cards**
- Must include CTA direction like **“Anuncia tu negocio con Leonix”**
- Include page marker **PÁG. 06**
- **Avoid long paragraphs**
- **No public approval** until Chuy marks **MASTER_SAMPLE_APPROVED**

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
- **No public approval** until Chuy marks **MASTER_SAMPLE_APPROVED**

---

## Chuy Visual QA Required

1. Open each image in `01-master-samples/`
2. Confirm **page marker** is correct (PÁG. 05, 06, 12)
3. Confirm **text readability** at normal magazine view
4. Confirm **page 12 contact truth** — Suite 201, correct phone/email/web
5. Confirm **no Suite 202** / **no 275 Coleman** on page 12
6. Confirm **style matches** August cover + Leonix house ad family
7. Decide per page: **MASTER_SAMPLE_APPROVED** or **QA_FIX_NEEDED**

**Next decision labels after Chuy review:**

- **MASTER_SAMPLE_APPROVED** — proceed toward source rebuild / Batch 2
- **QA_FIX_NEEDED** — revise visual and re-place with same filename
- **SOURCE_REBUILD_NEEDED** — after master approval, create editable source in `02-source-layouts/`

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

**Current Batch 1 status:** **ASSET_PLACED** / **QA_NEEDED** (pages 5, 6, 12)

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

**`AUGUST-2026-VISUAL-BATCH1-CHUY-QA-DECISION`**

Purpose:

- Chuy completes visual QA on pages 5, 6, 12
- Mark each page **MASTER_SAMPLE_APPROVED** or **QA_FIX_NEEDED**
- If approved, decide: continue **Batch 2** visuals or begin **source rebuild** for Batch 1 + pages 1–4

---

## Related Docs

- [`AUGUST-2026-VISUAL-BATCH1.md`](AUGUST-2026-VISUAL-BATCH1.md) — production briefs and prompt notes
- [`AUGUST-2026-MAGAZINE-BLUEPRINT.md`](AUGUST-2026-MAGAZINE-BLUEPRINT.md) — production standards
- [`AUGUST-2026-PAGE-PLAN.md`](AUGUST-2026-PAGE-PLAN.md) — 12-page lineup

---

## Cost-Control Proof (placement verification gate)

| Action | Result |
|--------|--------|
| Images generated | **FALSE** |
| Images modified by Cursor | **FALSE** |
| PDF created | **FALSE** |
| DeepL called | **FALSE** |
| Public assets changed | **FALSE** |
| OCR / full text extraction | **FALSE** |
