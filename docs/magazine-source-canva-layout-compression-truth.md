# MAGAZINE-SOURCE-CANVA-LAYOUT-COMPRESSION-TRUTH1

Gate date: 2026-07-06  
Classification: scoped gated QA / source artwork correction packet + export acceptance plan  
Owner: Chuy (Canva/source export) · Coach (PM) · Cursor (crew / docs)

---

## Executive Summary

Portuguese single-page proofs on **pages 3 and 4** succeeded locally. DeepL document translation works for Leonix magazine when the upload is provider-compliant.

The **full** Portuguese local proof was **blocked** because the current Spanish source PDF is **~74.76 MB** and DeepL rejects document uploads over **10 MB**.

The fix is **not** public code, reader wiring, or page-by-page translated PDF patching. Chuy must correct **Canva/source artwork** once — contact truth, translation-safe spacing, and export compression — then re-export the corrected Spanish source PDF for replacement QA.

**No public translated magazine exists.** Proof output stays local and gitignored.

---

## Why This Is Needed

| Factor | Current state |
|--------|---------------|
| Source PDF size | **78,395,566 bytes (~74.76 MB)** — `public/magazine/2026/june/leonix_media_june.pdf` |
| DeepL full upload | **Blocked** — `Document exceeds the size limit of 10 MB` |
| Page 3 PT proof | **Worked** — layout mostly preserved; tight areas need font/spacing polish |
| Page 4 PT proof | **Worked better** — more breathing room; cards mostly survive |
| Contact truth in artwork | Footer/source still shows **Suite 202** on reviewed pages; pages 1 and 26 previously flagged |
| Public PT magazine | **None** — no approved registry row, no public serving |

Page 3 proved translation can work but cramped text boxes, line-height, and alignment need production polish before a full edition looks premium in Portuguese (and later languages).

Page 4 showed that pages with more vertical and card spacing survive translation with less manual rework.

**Doctrine:** fix source artwork once → re-export corrected Spanish PDF → replacement QA → re-run full Portuguese proof only if size allows.

---

## Canonical Contact Truth

Use on all **Leonix-owned** contact blocks in magazine artwork:

| Field | Value |
|-------|-------|
| Brand | Leonix Media |
| Legal | Leonix Global LLC |
| Email | info@leonixmedia.com |
| Phone | **(408) 360-6500** |
| Address | **871 Coleman Avenue, Suite 201**, San Jose, CA 95110 |
| Website | leonixmedia.com |

**Wrong for current public Leonix materials — remove/correct wherever Leonix contact appears:**

- **Suite 202** (use Suite **201**)
- **275 Coleman** (use **871 Coleman Avenue**)
- Any non-canonical Leonix phone (e.g. (408) 350-5100, (408) 363-6332, (408) 313-0380 on Leonix blocks)

Do **not** replace client/advertiser contact details with Leonix canonical contact.

---

## Translation-Safe Layout Rules

Production checklist for Canva/source correction:

| Area | Required Adjustment | Why |
|------|---------------------|-----|
| Body copy (tight sections) | Reduce font size modestly (**5–10%**) | Portuguese and other languages often expand line length; smaller body copy prevents overflow without feeling cheap |
| Text boxes | Add **15–25%** more vertical height or padding | Gives translated paragraphs room to breathe; avoids text touching card borders or images |
| Paragraphs / cards | Increase internal spacing between blocks | Page 4 survived better because spacing was looser; replicate that discipline on dense pages |
| Line-height | Tune intentionally (tighten or loosen per block) | Prevents stacked lines from touching after translation expansion |
| CTA labels | Prefer short labels; widen button text area | Translated CTA words need horizontal room; text must not touch icons or borders |
| Footer / contact bar | Expand width/spacing; apply canonical contact truth | Suite 201, correct phone/email/web; room for translated locality labels |
| Image / text boundaries | Keep copy off decorative edges, QR zones, photo crops | Translation must not collide with artwork or scan targets |
| Brand premium feel | Do not shrink text so far it looks budget | Users can zoom, but normal view must still look professional |
| Export compression | Target **under 10 MB** if quality remains acceptable | DeepL full-document proof requires provider-compliant upload size |

---

## Page-Specific Starting Notes

| Page | Issue Type | Correction Needed | Priority |
|------|------------|-------------------|----------|
| **1** | Contact truth (cover footer) | **275 Coleman** / **Suite 202** → **871 Coleman Avenue, Suite 201**; wrong Leonix phone → **(408) 360-6500**; verify June 2026 issue label | **HIGH** |
| **3** | Translation worked; tight layout | Font size / line-height / alignment polish in dense blocks; footer **Suite 202 → Suite 201**; wrong Leonix phone → **(408) 360-6500** | **HIGH** |
| **4** | Translation worked; better spacing | Minor card/body/CTA spacing review; footer **Suite 202 → Suite 201** | **MEDIUM / HIGH** |
| **26** | Contact truth (closing CTA) | **Suite 202 → Suite 201**; wrong Leonix phone → **(408) 360-6500** | **HIGH** |
| **5–25** | NOT_REVIEWED | Review after corrected export + full or batch Portuguese proof | **PENDING** |
| **2** | NOT_REVIEWED (contact scan) | Scan Leonix footers/CTAs for Suite 202, 275 Coleman, wrong phone | **PENDING** |

Reference proofs (local, gitignored):

- Page 3: `.magazine-proof-output/june-2026/pt/page-smoke/page-003/deepl-page-003.pt.pdf`
- Page 4: `.magazine-proof-output/june-2026/pt/page-smoke/page-004/deepl-page-004.pt.pdf`

---

## Export Requirements

1. Export corrected **Spanish source** PDF from Canva/original design tool (26 pages unless intentionally redesigned).
2. **Prefer selectable text** export if Canva allows — re-run compatibility preflight after export.
3. **Compression target:** under **10 MB** if visual quality and QR scan reliability remain acceptable.
4. If under 10 MB is not possible without unacceptable quality loss, document exact file size and reason; use **multi-part / page-range proof strategy** in a later gate (do not patch translated PDFs page-by-page as the primary fix).
5. Re-export `cover.png` if page 1 artwork changes.
6. **Do not** replace `public/magazine/2026/june/leonix_media_june.pdf` in the repo until **`MAGAZINE-SOURCE-PDF-REPLACEMENT-QA1`**.
7. **Do not** publish corrected export or claim public-ready status without QA.

---

## Acceptance Criteria for New Export

| Check | Target |
|-------|--------|
| File exists locally before repo replacement | Required |
| File size | **Under 10 MB preferred**; if over, document exact bytes and why |
| Visual quality | Acceptable at normal view; text not blurry |
| Contact truth | Suite 201, (408) 360-6500, info@leonixmedia.com, leonixmedia.com |
| Translation-safe spacing | Font/spacing adjusted per doctrine above |
| Page count | **26** |
| Cover | Still premium; re-export cover image if page 1 changed |
| Wrong values absent | No Suite 202; no 275 Coleman; no wrong Leonix phone on Leonix blocks |
| Accidental branding | No accidental El Águila references unless intentional historical context |
| Client ads | Unchanged unless approved client correction |

---

## Replacement QA Commands (next gate prep)

Existing scripts cover replacement QA — **no new heavy tool in this gate.**

**PowerShell — source PDF size:**

```powershell
Get-Item "C:\projects\elaguila-website\public\magazine\2026\june\leonix_media_june.pdf" | Select-Object Name, Length
```

**Node — readiness / preflight audit:**

```bash
node scripts/magazine-deepl-readiness-audit.mjs
node scripts/magazine-source-artwork-correction-audit.mjs
node scripts/magazine/hash-source.mjs --write
```

See also `docs/magazine-pdf-deepl-compatibility-preflight.md` and `docs/magazine-source-artwork-correction.md`.

---

## Next Gate After Chuy Re-Exports

**`MAGAZINE-SOURCE-PDF-REPLACEMENT-QA1`**

Purpose:

- Replace `public/magazine/2026/june/leonix_media_june.pdf` (and `cover.png` if needed) after Chuy delivers corrected export
- Verify page count (26)
- Verify file size (document if still over 10 MB)
- Verify contact truth where machine/visual checks can
- Run zero-cost preflight (`hash-source`, artwork correction audit, DeepL readiness)
- Re-run **Portuguese full local proof** (`--full --execute`) **only if** corrected source is under DeepL 10 MB limit

---

## Chuy Action Required

1. Open Canva/source artwork for June 2026 Leonix magazine.
2. Apply font/spacing/contact-truth corrections per tables above.
3. Export corrected Spanish PDF (prefer selectable text).
4. Aim for **under 10 MB** if quality holds; otherwise document size and plan multi-part proof later.
5. **Do not** manually replace repo PDF without **`MAGAZINE-SOURCE-PDF-REPLACEMENT-QA1`**.
6. Bring corrected export back for replacement QA, then full Portuguese re-proof if size allows.

---

## Cost-Control Proof (this gate)

| Action | Result |
|--------|--------|
| DeepL called | **FALSE** |
| Paid smoke run | **FALSE** |
| PDF translated | **FALSE** |
| Source PDF edited/replaced | **FALSE** |
| Public serving changed | **FALSE** |
| Supabase rows changed | **FALSE** |
| Vercel env changed | **FALSE** |
| Secret printed | **FALSE** |

---

## Related Docs

- `docs/magazine-source-artwork-correction.md`
- `docs/magazine-deepl-pt-single-page-smoke.md`
- `docs/magazine-deepl-pt-full-local-proof.md`
- `docs/magazine-translation-platform-runbook.md`
- `scripts/magazine/README.md`
