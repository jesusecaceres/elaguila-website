# MAGAZINE-PDF-DEEPL-COMPATIBILITY-PREFLIGHT1

Preflight date: 2026-07-03  
Gate: `MAGAZINE-PDF-DEEPL-COMPATIBILITY-PREFLIGHT1` (zero-cost; no provider calls)

## Summary Decision

**HOLD_FOR_PDF_TEXT_LAYER_LIMITATION**

Also applies: **HOLD_FOR_SOURCE_ARTWORK_FIX** (Suite 202 / contact truth in magazine artwork must be corrected before any public translated visual release).

**Do not sign up for DeepL solely to run a direct PDF proof on this file yet.** The June 2026 magazine PDF has **no extractable text layer**. DeepL document translation requires machine-readable text; this Canva export is effectively **image-flattened**. A paid PT smoke would likely return an unchanged visual PDF, waste credits, or require OCR/pre-processing not in scope.

**Safer path first:** expand the existing **companion reader / HTML summary layer** (already fail-closed in repo) and fix **source artwork** (Suite 201, canonical phone/address) before spending on visual PDF translation.

Re-run environment readiness (separate gate):

```bash
node scripts/magazine-deepl-readiness-audit.mjs
```

---

## PDF Facts

| Fact | Value |
|------|-------|
| Path | `public/magazine/2026/june/leonix_media_june.pdf` |
| SHA-256 | `8fa5ec5a9faa1c0cb689451b79477f60b2fc2e644048a9176bcc68d8be112986` |
| Page count | **26** |
| File size | **78,395,566 bytes (~74.76 MB)** |
| Avg size / page | ~2.87 MB (image-heavy) |
| Encrypted | **FALSE** |
| Creator / producer | Canva → pdf-lib export chain |
| Page dimensions | 810 × 1050 pt (consistent across pages) |
| Title metadata | `June Magazine with CTA's` |
| Linearized | Not confirmed (not required for preflight) |

### Text layer status

| Check | Result |
|-------|--------|
| Extraction tool | `pdfjs-dist` text content API (all 26 pages) |
| Total extracted characters | **0** |
| Pages with any text | **0 / 26** |
| Pages with substantial text (≥80 chars) | **0 / 26** |
| Binary string search | `info@leonixmedia.com` found once in compressed stream; no selectable text layer; brand strings (Suite 201/202, phone, addresses) **not** present as plain PDF text |
| Classification | **IMAGE_FLATTENED_LIKELY** |

**Conclusion:** DeepL has **no real text to translate** in this PDF as-is. Translation would require OCR, re-export from Canva with live text, or a companion/HTML path — not direct document API on this file.

### Image-flattened likelihood

**Very high (~95%+ confidence)**

Evidence:

- Zero pdfjs text on every page
- ~75 MB for 26 pages (~3 MB/page)
- Full-page Canva design layouts with photos, gradients, QR blocks, and ad grids
- Sample renders (gitignored under `.magazine-proof-output/june-2026/preflight-samples/`) show all typography baked into page images

### DeepL upload size note

**VERIFY_WITH_PLAN** — 74.76 MB exceeds many default document limits. Even with a text layer, confirm DeepL plan document size/page limits before any smoke. With no text layer, size is moot until source format changes.

---

## Page Type Risk Matrix

Sample pages rendered at 35% scale for classification only (6 of 26). Remaining ranges are inferred from layout patterns and Leonix reader/companion structure — **verify visually before production QA**.

| Page(s) | Type (sample / inferred) | Translation risk | QA notes |
|---------|--------------------------|------------------|----------|
| 1 | Cover + promo grid (Leonix brand, La Kaliente, WAR Fitness, QR/lang toggles) | **High** | Full-bleed design; footer shows **275 Coleman Ave, Suite 202** and non-canonical phone; QR + ES/EN/PT toggles are visual only |
| 2 | Leonix brand / mission / founder story | **High** | Dense editorial layout; family photo; religious/copy tone; no text layer |
| 3 | Leonix sales / advertise CTA page | **High** | Mockups + 4 CTAs; footer **871 Coleman Ave, Suite 202**; wrong phone vs site canonical |
| 4–9 *(inferred)* | Client advertisement pages | **High** | Image-heavy ads (phones, addresses, logos, QR); layout breaks if OCR/translate attempted |
| 10 *(sample)* | **Cali Bear Tacos** catering ad | **High** | Client brand, menu lists, phone, address, QR — protect all contact truth |
| 11–19 *(inferred)* | Mixed ads + editorial/community content | **High** | Tables, multi-column event lists, recipe-style pages likely |
| 20 *(sample)* | **Agenda de Verano** resource/event table | **High** | Multi-column dates, venues, URLs; extreme layout sensitivity |
| 21–25 *(inferred)* | Ads, promos, community pages, QR-heavy | **High** | Same flattened pattern |
| 26 *(sample)* | Leonix closing CTA / launch page | **High** | Footer **871 Coleman Ave, Suite 202**; phone **(408) 313-0380**; Media Kit CTAs |

### DeepL path risk summary

| Path | Risk | Notes |
|------|------|-------|
| DeepL direct PDF | **Very high / likely non-viable** | No text layer; likely no meaningful translation |
| DeepL DOCX output | **Very high** | DOCX path still needs extractable source text; flattened PDF does not provide it |
| Companion HTML reader | **Low–medium** | Already exists; honest “Spanish visual original” messaging; best near-term multilingual path |
| Re-export from Canva/source artwork | **Medium** | Fix Suite 201 + contacts first; export with live text if Canva supports; then re-run this preflight |

---

## Protected Terms Draft (future DeepL glossary / do-not-translate)

Use in a future proof gate only — **no glossary API created in this gate**.

### Leonix brand

- Leonix Media
- Leonix Global LLC
- Que ruja el león / Let the Lion Roar
- El Águila (ecosystem reference)
- #SOMOSLEONIX
- #VIVEBIEN
- leonixmedia.com
- flip.leonixmedia.com

### Leonix contact (canonical public site — protect from mistranslation)

- info@leonixmedia.com
- (408) 360-6500
- 871 Coleman Avenue, Suite **201**, San Jose, CA 95110

### Client / partner names (sample pages)

- La Kaliente 1370 AM
- WAR Fitness
- Cali Bear Tacos
- Mt Pleasant Smog Test Center *(verify page presence before QA)*
- Elevated Barber Studio *(verify page presence before QA)*
- Sunny Hair & Nails *(verify page presence before QA)*

### Always protect (pattern)

- Phone numbers (all formats)
- Street addresses
- Email addresses
- Website URLs
- QR code labels and scan CTAs (“Escanea”, “Scan”, etc.) when tied to URLs
- Coupon codes / prices if present
- Social handles (@…)

---

## Known Source Corrections (before public translated release)

Confirmed in **sample page artwork** (visual inspection of rendered pages — not text layer):

| Issue | Found on page(s) | Canonical public truth |
|-------|------------------|------------------------|
| **Suite 202** | 1, 3, 26 (and likely others) | **Suite 201** |
| Wrong Coleman street number on cover | Page 1: **275** Coleman Ave | **871** Coleman Avenue |
| Non-canonical Leonix phones in artwork | Page 1: (408) 350-5100; Page 26: (408) 313-0380 | **(408) 360-6500** |
| Issue date label | Cover shows **MAYO / MAY 2025** | June 2026 issue context |

**Action:** Fix in **Canva source artwork** (`MAGAZINE-SOURCE-ARTWORK-CORRECTION1`) before any translated visual edition or public QA approval. Do not rely on DeepL to fix contact errors in flattened images.

---

## Architecture Recommendation

**COMPANION_READER_FIRST_RECOMMENDED**

Secondary: **SOURCE_ARTWORK_REQUIRED_BEFORE_TRANSLATION**

Rationale:

1. **No text layer** → DeepL direct PDF proof is not a good first spend.
2. Repo already has fail-closed reader + companion HTML (`MagazineTranslatedReader`, `june2026CompanionContent`) that honestly states Spanish visual original.
3. Source PDF contains **Suite 202** and wrong phones — public translated PDF would inherit errors even if translation worked.
4. If Leonix later wants true visual PT PDF, re-export from source with live text (or segment-by-page OCR pipeline) **after** artwork correction, then re-run this preflight.

**Not recommended now:**

- `DEEPL_DIRECT_PDF_PROOF_RECOMMENDED` — blocked by zero text layer
- `DEEPL_DOCX_OUTPUT_PROOF_RECOMMENDED` — same root cause
- `READY_FOR_DEEPL_ACCOUNT_SIGNUP` — hold until source format strategy is chosen

---

## Recommended Next Gate

**MAGAZINE-SOURCE-ARTWORK-CORRECTION1**

Then either:

- **MAGAZINE-COMPANION-READER-BUILD1** (expand PT/other companion copy while visual PDF path is blocked), or
- Re-run **MAGAZINE-PDF-DEEPL-COMPATIBILITY-PREFLIGHT1** after a new text-capable export exists, then **MAGAZINE-DEEPL-ACCOUNT-SIGNUP1** → **MAGAZINE-DEEPL-PT-REAL-SMOKE3**

---

## Cost-Control Proof

| Action | Result |
|--------|--------|
| DeepL called | **FALSE** |
| PDF translated | **FALSE** |
| Full-document OCR | **FALSE** |
| Generated translated output | **FALSE** |
| Public reader behavior changed | **FALSE** |
| Source PDF modified | **FALSE** |
| Sample renders | 6 PNGs in gitignored `.magazine-proof-output/june-2026/preflight-samples/` only |

---

## Inspection methods (this gate)

- File size + existence checks
- `pdfjs-dist` per-page text extraction (26/26 pages)
- `pdf-lib` metadata (encryption, page count, dimensions)
- Binary substring scan (no secrets)
- Sample page render via `pdfjs-dist` + `@napi-rs/canvas` (pages 1, 2, 3, 10, 20, 26 only)

## Related docs

- `docs/magazine-deepl-readiness-audit.md`
- `docs/magazine-translation-platform-runbook.md`
- `scripts/magazine/README.md`
