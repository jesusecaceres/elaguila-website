# AUGUST 2026 LEONIX MAGAZINE BLUEPRINT

Gate: `MAGAZINE-AUGUST-2026-BLUEPRINT1`  
Date: 2026-07-06  
Owner: Coach (PM / production lead) · Chuy (approval) · Cursor (crew / docs)

---

## Executive Summary

This is the **official production blueprint** for the **August 2026** Leonix Media magazine. It defines one consistent system for page size, print readiness, FlipHTML5 digital export, translation-safe layout, file naming, and monthly reuse.

The four PNG files in `01-master-samples/` are **master visual prototypes** — design references only. They are **not** final public website assets, **not** final print-shop files, and **not** editable translation source files.

**Goals:**

- Same page size on every page (cover, editorial, ads, resources)
- Print-ready export discipline
- FlipHTML5-ready page order and dimensions
- Translation-safe spacing so Portuguese/English proofs do not require manual rescue
- Client ad consistency within the Leonix magazine system

This blueprint should be **reused and adapted** for future monthly issues (September 2026 and beyond).

**Related June 2026 lessons:** See `docs/magazine-source-canva-layout-compression-truth.md` — June proved translation works but tight layouts and oversized PDF exports blocked full DeepL proof. August design must be spacious from the start and export-conscious.

---

## Folder Structure

Root: `design-references/magazine/2026-august/`

| Folder | Purpose |
|--------|---------|
| `01-master-samples` | Visual prototypes / approved look-and-feel references (current PNGs). Not final assets. |
| `02-source-layouts` | Editable source files (Canva/Figma/InDesign exports, layered working files). Primary translation source when available. |
| `03-spanish-final` | Approved Spanish page exports per page — production Spanish masters before translation proofs. |
| `04-english-proof` | English visual proofs for layout/translation QA (local or design-tool export). |
| `05-portuguese-proof` | Portuguese visual proofs for layout/translation QA. |
| `06-print-ready-pdf` | Final high-quality PDF for print shop submission only after approval. |
| `07-fliphtml5-export` | Approved final PDF or consistent page images for FlipHTML5 upload. Separate from print if compression differs. |

**Rule:** Keep all working and reference assets under `design-references/`. Do **not** move master samples or proofs into `public/` until a dedicated public-serving gate approves it.

---

## Master Sample Files

| Page Type | File Name | Purpose | Status |
|-----------|-----------|---------|--------|
| Cover | `august-2026-cover-master-sample.png` | Issue cover visual prototype — brand, date, hero layout | **MASTER_SAMPLE_READY** |
| Leonix house ad | `august-2026-leonix-house-ad-master-sample.png` | Leonix promotional full-page ad — canonical contact, CTA, QR | **MASTER_SAMPLE_READY** |
| Cali Bear Tacos (client ad) | `august-2026-calibear-tacos-master-sample.png` | Client full-page ad reference | **MASTER_SAMPLE_READY** |
| Elevated Barber (client ad) | `august-2026-elevated-barber-master-sample.png` | Client full-page ad reference | **MASTER_SAMPLE_READY** |

Location: `design-references/magazine/2026-august/01-master-samples/`

---

## Page Size Standard

| Rule | Value |
|------|-------|
| Target print trim size | **8 in × 11.5 in** |
| Orientation | **Portrait only** |
| Page consistency | Every magazine page and full-page ad uses the **same page size** |
| Random dimensions | **Not allowed** — no one-off ad or editorial sizes inside the issue |
| Scale | Consistent page scale across cover, editorial, ads, and resource pages |

**Digital working ratio:** Maintain a consistent portrait ratio in Canva/Figma/InDesign so exports align page-to-page.

**Print export target:** High resolution (300 DPI equivalent for raster elements where applicable; vector text preferred in source).

**FlipHTML5 target:** One page per PDF page or one consistent image per page — same dimensions throughout.

---

## Bleed / Safe Margin Rules

| Rule | Guidance |
|------|----------|
| Safe margin | Keep important text, logos, phone, email, and QR **at least 0.25 in inside trim** |
| Bleed (if print shop requests) | **0.125 in** on all sides — decorative background only in bleed; no critical text |
| Edge protection | Leave enough margin for print trimming variance |
| Contact / QR placement | Never place tiny contact text or QR codes in the bleed area |
| QR scan reliability | QR must remain fully inside safe area with quiet zone |

---

## Translation-Safe Layout Rules

August must avoid June’s cramped-layout rework. Design for translation **before** export.

| Area | Rule | Reason |
|------|------|--------|
| Body text boxes | Leave **15–25% extra vertical space** vs minimum fit | Portuguese/English often expands line count |
| Body copy density | Slightly smaller type and **less crowded** than June tight pages | Readable at normal view after translation |
| Narrow boxes | Avoid long paragraphs in narrow columns | Expansion causes overflow and ugly wraps |
| Text structure | Use **modular text blocks**, not dense text walls | Easier to adjust one block without breaking page |
| CTA buttons | Extra horizontal room for translated labels | “Ver más” → longer PT/EN strings |
| Footer / contact bars | Extra width and line spacing | Translated address labels and legal lines need room |
| Image boundaries | Do not place text flush against photo edges or card borders | Translation reflow must not collide with art |
| Captions | Avoid ultra-small captions | Becomes unreadable after translation or print |
| Language variance | Plan for expansion **and** contraction | PT/EN length differs page to page |
| Design goal | Page must survive translation **without manual rescue** | Fix source once, not translated PDF patches |

---

## Typography Rules

- **Large headline hierarchy** — one dominant headline per page or section
- **Short subheads** — support the headline; do not duplicate body copy
- **Body copy** must remain readable at normal magazine view (avoid “fine print” body)
- **Font count** — limit styles per page; avoid decorative font stacking
- **Minimum size** — no ultra-small text for essential information
- **Bold** — hierarchy only (headlines, subheads, key labels), not every sentence
- **Preference** — clean typography over crowded decoration

---

## CTA / QR / Contact Rules

- **Visual CTAs** on image/flattened pages are design elements — they are **not** website-clickable unless rebuilt in linked PDF or web reader
- **QR blocks** must be large enough to scan on phone at arm’s length
- **QR placement** inside safe margin with adequate quiet zone
- **One clear action** per business ad (call, visit, scan, or coupon — not five competing buttons)
- **Avoid CTA clutter** — one primary CTA per ad page when possible
- **Contact info** (phone, email, address, web) readable at normal view without zoom

---

## Leonix Contact Truth

Use on all **Leonix-owned** pages (cover footer, house ads, editorial footers, closing pages):

```
Leonix Media
Leonix Global LLC
871 Coleman Avenue, Suite 201
San Jose, CA 95110
(408) 360-6500
info@leonixmedia.com
leonixmedia.com
```

**Canonical rules:**

- **Suite 201** is correct
- **Suite 202** is **not** current public truth
- **275 Coleman** is **not** current public truth
- **Non-canonical Leonix phone numbers** must not appear on Leonix house pages

**Client ads** keep **client** contact truth (Cali Bear, Elevated Barber, etc.) — do not replace with Leonix canonical contact.

---

## Ad Size Rules

- **Full-page ads** must use the **same page size** as editorial pages (**8 in × 11.5 in** trim)
- **No random ad sizes** inside the magazine system
- **August master samples** are **full-page only**
- Client ads default to full-page unless a future grid system is defined
- Half-page / quarter-page ads require a **separate template gate** later — not in August starter set

---

## Print-Shop Export Rules

1. Export **final print PDF** only after **all pages are approved** (Spanish final + QA)
2. Prefer **high-quality PDF** export from source tool — not flattened screenshots
3. **Confirm print shop bleed requirements** before final submission (bleed may differ by vendor)
4. Keep **source PNGs/design files separate** from final print PDF
5. Do **not** use low-quality compressed screenshots for print final
6. **Page-by-page check** before sending: size, bleed, contact truth, QR scan, client ad accuracy
7. Store approved print PDF in `06-print-ready-pdf/`

---

## FlipHTML5 Export Rules

1. FlipHTML5 receives the **approved final PDF** or **consistent page images** — same size every page
2. **Page order locked** before upload (numbered file names or single ordered PDF)
3. **File names must sort correctly** (see File Naming Standard)
4. Do **not** upload master samples as the final issue unless explicitly approved for preview
5. Keep a **separate** FlipHTML5 export in `07-fliphtml5-export/` (may differ in compression from print PDF)
6. Test flip view on mobile after upload

---

## Translation Workflow

1. **Create Spanish master page** in editable source (Canva/Figma/InDesign) with translation-safe spacing
2. **Keep text controlled and spacious** — apply layout rules above
3. **Export Spanish final** to `03-spanish-final/`
4. **Create English proof** → `04-english-proof/`
5. **Create Portuguese proof** → `05-portuguese-proof/` (DeepL or design export — local QA only until approved)
6. **QA each page visually** — overflow, contact truth, QR, client info
7. **Fix source layout** if text breaks — do not patch translated PNGs as primary fix
8. **Only then** export final translated PDF/assets for print/FlipHTML5

**Important:**

- **Flat PNGs are not editable text source** — they are visual references only
- **Best long-term system:** editable Canva/Figma/InDesign source in `02-source-layouts/`
- **PNG master samples** = prototypes / references in `01-master-samples/`
- **All generated/translated text** must be reviewed manually before print or public serving

**Platform reference:** `docs/magazine-translation-platform-runbook.md`

---

## File Naming Standard

### Per-page exports (Spanish source)

| Page | Example file name |
|------|-------------------|
| Cover | `august-2026-001-cover-es.png` |
| Leonix house ad | `august-2026-002-leonix-house-ad-es.png` |
| Cali Bear Tacos | `august-2026-003-calibear-tacos-es.png` |
| Elevated Barber | `august-2026-004-elevated-barber-es.png` |

Pattern: `august-2026-{NNN}-{slug}-es.{ext}`

### Translated page exports

- English: `august-2026-001-cover-en.png`
- Portuguese: `august-2026-001-cover-pt.png`

Pattern: `august-2026-{NNN}-{slug}-{locale}.{ext}`

### Master samples (reference only — current)

- `august-2026-cover-master-sample.png`
- `august-2026-leonix-house-ad-master-sample.png`
- `august-2026-calibear-tacos-master-sample.png`
- `august-2026-elevated-barber-master-sample.png`

Suffix `-master-sample` distinguishes prototypes from production `-es`/`-en`/`-pt` files.

### PDF bundles

| Purpose | Example file name |
|---------|-------------------|
| Print final | `leonix-media-august-2026-print-final.pdf` |
| FlipHTML5 | `leonix-media-august-2026-fliphtml5.pdf` |

---

## August Starting Page Plan

Initial starter lineup (expand in next gate):

| Page | Type | Working Title | Current Sample | Status |
|------|------|---------------|----------------|--------|
| 1 | Cover | August 2026 Cover | `august-2026-cover-master-sample.png` | **MASTER_SAMPLE_READY** |
| 2 | Leonix house ad | Leonix Media house ad | `august-2026-leonix-house-ad-master-sample.png` | **MASTER_SAMPLE_READY** |
| 3 | Client ad | Cali Bear Tacos | `august-2026-calibear-tacos-master-sample.png` | **MASTER_SAMPLE_READY** |
| 4 | Client ad | Elevated Barber Studio | `august-2026-elevated-barber-master-sample.png` | **MASTER_SAMPLE_READY** |

Full issue page count, editorial pages, and resource pages are **TBD** in `AUGUST-2026-PAGE-PLAN1`.

---

## Approval States

| State | Meaning |
|-------|---------|
| **MASTER_SAMPLE_READY** | Visual prototype approved as direction; not production final |
| **SOURCE_LAYOUT_NEEDED** | Editable source file required in `02-source-layouts/` |
| **SPANISH_FINAL_READY** | Approved Spanish page export in `03-spanish-final/` |
| **ENGLISH_PROOF_READY** | English proof QA passed in `04-english-proof/` |
| **PORTUGUESE_PROOF_READY** | Portuguese proof QA passed in `05-portuguese-proof/` |
| **PRINT_QA_READY** | Print PDF checked in `06-print-ready-pdf/` |
| **FLIPHTML5_READY** | FlipHTML5 export checked in `07-fliphtml5-export/` |
| **PUBLIC_READY** | Approved for `public/` and reader serving (separate gate) |

**Current master samples:** **MASTER_SAMPLE_READY** only.

---

## Do Not Do Yet

- Do **not** move these files to `public/`
- Do **not** treat master samples as final print files
- Do **not** claim translation is complete
- Do **not** upload to FlipHTML5 yet
- Do **not** send to print shop yet
- Do **not** replace June 2026 magazine in repo
- Do **not** publish August magazine on the website yet

---

## Next Gate

**`AUGUST-2026-SOURCE-LAYOUT-GENERATION1`** — Page plan complete: [`AUGUST-2026-PAGE-PLAN.md`](AUGUST-2026-PAGE-PLAN.md)

Purpose:

- Create **source layout plan** and page prompts for pages 5–12
- Convert master samples 1–4 into editable source in `02-source-layouts/`
- Preserve **8 × 11.5 in** and translation-safe rules

---

## Related Docs

- `docs/magazine-source-canva-layout-compression-truth.md` — June translation-safe + compression lessons
- `docs/magazine-translation-platform-runbook.md` — platform QA and serving rules
- `docs/translation-finish-backlog.md` — ordered magazine gates

---

## Cost-Control Proof (this gate)

| Action | Result |
|--------|--------|
| Images generated | **FALSE** |
| Images modified | **FALSE** |
| PDF created | **FALSE** |
| DeepL called | **FALSE** |
| Public assets changed | **FALSE** |
| June PDF touched | **FALSE** |
