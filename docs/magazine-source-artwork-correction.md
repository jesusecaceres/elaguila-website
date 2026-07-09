# MAGAZINE-SOURCE-ARTWORK-CORRECTION1

Correction manifest date: 2026-07-03  
Gate: `MAGAZINE-SOURCE-ARTWORK-CORRECTION1` (zero-cost; no PDF binary edit in repo)

## Summary Decision

**SOURCE_ARTWORK_REQUIRES_CANVA_UPDATE**

The repo holds a **flattened Canva export only** (`leonix_media_june.pdf` + `cover.png`). There are **no editable page layers, Canva project files, or per-page source artwork** in git. Cursor **cannot** safely correct baked-in contact text inside the PDF without external design source access.

**Current public PDF artwork status:** `HOLD_FOR_SOURCE_ARTWORK_UPDATE` — **not corrected in this gate.**

**Portuguese proof update (2026-07-06):** Pages **3** and **4** single-page DeepL proofs succeeded locally — translation **works**, but source layout must become **translation-safe** (font size, line-height, text-box breathing room) before a full edition looks premium. Footer artwork on reviewed pages still shows **Suite 202**; all Leonix contact blocks must use **Suite 201** and canonical phone/email/web per below. See `docs/magazine-source-canva-layout-compression-truth.md`.

---

## Source asset state (repo)

| Asset | Path | Editable in repo? |
|-------|------|-------------------|
| June 2026 PDF | `public/magazine/2026/june/leonix_media_june.pdf` | **No** — flattened (0 text layer chars) |
| Cover image | `public/magazine/2026/june/cover.png` | **No** — raster export; replace after Canva fix |
| Preflight samples | `.magazine-proof-output/june-2026/preflight-samples/*.png` | Reference only (gitignored) |
| Reader/companion copy | `app/lib/magazine/**` | **Yes** — HTML/metadata only; already June 2026 + canonical site contact |
| Canva project | — | **Not in repo** — update externally |

**Classification:** `FLATTENED_EXPORT_ONLY`

---

## Canonical Leonix public contact

Use on all **Leonix-owned** footer/contact blocks in magazine artwork:

| Field | Value |
|-------|-------|
| Brand | Leonix Media |
| Legal | Leonix Global LLC |
| Tagline | Que ruja el león — Let the Lion Roar |
| Email | info@leonixmedia.com |
| Phone | **(408) 360-6500** |
| Address line 1 | **871 Coleman Avenue, Suite 201** |
| City/state/ZIP | San Jose, CA 95110 |
| Website | leonixmedia.com |

**Use Suite 201, not Suite 202.**

---

## Required visual corrections

Apply in **Canva (or original design source)** on Leonix contact blocks only. Status below reflects **current production PDF** as of preflight sample QA (2026-07-03).

| Page | Current / issue | Correct value | Priority | Status |
|------|-----------------|---------------|----------|--------|
| **1** (cover footer) | **275 Coleman Ave, Suite 202** | **871 Coleman Avenue, Suite 201**, San Jose, CA 95110 | **P0** | **Pending Canva** |
| **1** (cover footer) | Phone **(408) 350-5100** | **(408) 360-6500** | **P0** | **Pending Canva** |
| **1** (cover header) | Issue label **MAYO / MAY 2025 \| VOL. 1 • NO. 1** | **JUNIO / JUNE 2026** (or agreed June 2026 label) | **P1** | **Pending Canva** |
| **3** (Leonix sales footer) | **871 Coleman Ave, Suite 202** | **871 Coleman Avenue, Suite 201** | **P0** | **Pending Canva** |
| **3** (Leonix sales footer) | Phone **(408) 363-6332** (preflight sample) | **(408) 360-6500** | **P0** | **Pending Canva** |
| **26** (closing CTA footer) | **871 Coleman Ave, Suite 202** | **871 Coleman Avenue, Suite 201** | **P0** | **Pending Canva** |
| **26** (closing CTA footer) | Phone **(408) 313-0380** | **(408) 360-6500** | **P0** | **Pending Canva** |
| **2, 4–25** | Scan all Leonix footers/CTAs for Suite 202, wrong Coleman number, wrong Leonix phone | Canonical values above | **P0** | **Pending manual scan in Canva** |

**Email/website on sampled Leonix pages:** `info@leonixmedia.com` / `leonixmedia.com` appear correct in preflight samples — re-verify after export.

**Cover image:** If page 1 artwork changes, re-export `public/magazine/2026/june/cover.png` from the corrected cover.

---

## Do-not-change client info

Do **not** replace client/resource contact details with Leonix canonical contact. Protect as-is unless the **client** requests an update:

| Client / resource | Protect (examples from preflight) |
|-------------------|-----------------------------------|
| La Kaliente 1370 AM | Station branding, phone, URLs on ad block (page 1 grid) |
| WAR Fitness | **(408) 706-2704**, **800 Charcot Ave, San Jose** (page 1) |
| Cali Bear Tacos | **(408) 520-1583**, **1220 Lenzen Avenue, San Jose, CA 95126**, calibeartacos@gmail.com, @calibear_tacos (page 10) |
| Mt Pleasant Smog Test Center | Client ad contact as designed |
| Elevated Barber Studio | Client ad contact as designed |
| Sunny Hair & Nails | Client ad contact as designed |
| Summer event listings (page 20) | Venue names, dates, URLs (San Jose Jazz, The Tech Interactive, Stern Grove, etc.) |
| All other advertiser blocks | Phone, address, email, QR targets, prices, coupon codes |

---

## Re-export requirements (Canva / design tool)

When source artwork is corrected:

1. **Export full PDF** — 26 pages (same page count unless intentionally redesigned).
2. **Prefer selectable text** — unflatten text where Canva allows; re-run compatibility preflight after export.
3. **Compress for web** if possible without destroying QR scan reliability (current file ~74.76 MB).
4. **Re-export cover** if page 1 design changed → `cover.png`.
5. **Keep QR codes scannable** — test ES/EN/PT magazine QR targets after export.
6. **Do not** overwrite Spanish client ad copy unless part of an approved client correction.

---

## Replacement targets (after Chuy exports corrected files)

| File | Path |
|------|------|
| Corrected magazine PDF | `public/magazine/2026/june/leonix_media_june.pdf` |
| Corrected cover (if changed) | `public/magazine/2026/june/cover.png` |

**After replacement, run locally:**

```bash
node scripts/magazine/hash-source.mjs --write
node scripts/magazine-source-artwork-correction-audit.mjs
# Re-run text-layer / compatibility checks from docs/magazine-pdf-deepl-compatibility-preflight.md
node scripts/magazine-deepl-readiness-audit.mjs
```

Update `JUNE_2026_SOURCE_PDF_HASH` in platform docs/registry only after QA confirms the new binary (separate replacement QA gate).

---

## QA checklist after PDF replacement

- [ ] Page count still **26**
- [ ] PDF opens in magazine reader / flipbook flow
- [ ] **No Suite 202** on Leonix contact blocks
- [ ] **No 275 Coleman** on Leonix contact blocks
- [ ] Leonix phone **(408) 360-6500** wherever Leonix contact appears
- [ ] **871 Coleman Avenue, Suite 201**, San Jose, CA 95110 on Leonix blocks
- [ ] **info@leonixmedia.com** correct
- [ ] Cover issue date reflects **June 2026** (if that is the agreed label)
- [ ] QR codes scan to intended Leonix routes
- [ ] Client ads unchanged (spot-check La Kaliente, WAR Fitness, Cali Bear Tacos)
- [ ] No fake translated PDF claim
- [ ] Re-run `docs/magazine-pdf-deepl-compatibility-preflight.md` text-layer check
- [ ] SHA-256 hash updated in proof records / registry workflow

---

## Repo metadata (this gate)

| Area | Status |
|------|--------|
| Magazine reader copy (`June 2026`) | **Already correct** — no change |
| Site canonical contact in app/lib | **Already Suite 201 / (408) 360-6500** — no change |
| Production PDF artwork | **Not corrected** — requires Canva export |

**No repo metadata corrections were required** for Leonix contact strings in magazine TypeScript copy. The mismatch is **only in flattened PDF artwork**.

---

## Recommended next gate

**MAGAZINE-SOURCE-PDF-REPLACEMENT-QA1** — after Chuy uploads corrected export from Canva.

Parallel track (does not require PDF fix): **MAGAZINE-COMPANION-READER-BUILD1**.

**Do not proceed to DeepL account signup for direct PDF translation** until source artwork is corrected **and** a new export shows a usable text layer (re-preflight).

---

## Cost-control proof (this gate)

| Action | Result |
|--------|--------|
| DeepL called | **FALSE** |
| PDF translated | **FALSE** |
| Full-document OCR | **FALSE** |
| Generated translated output | **FALSE** |
| Public reader behavior changed | **FALSE** |
| PDF binary replaced | **FALSE** |
| Hacky PDF text overlay | **FALSE** |

---

## Related docs

- `docs/magazine-pdf-deepl-compatibility-preflight.md`
- `docs/magazine-deepl-readiness-audit.md`
- `docs/magazine-translation-platform-runbook.md`
- `scripts/magazine/README.md`
