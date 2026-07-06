# MAGAZINE-DEEPL-PT-FULL-LOCAL-PROOF1

Gate date: 2026-07-06  
Classification: controlled full Portuguese local proof + visual QA inventory

## Executive Summary

Pages 3 and 4 single-page smokes proved the DeepL document workflow produces translated Portuguese visual proofs locally. This gate added explicit `--full` mode and attempted **one** full-source DeepL document call.

**Result: BLOCKED** — DeepL rejected the upload: *Document exceeds the size limit of 10 MB.* The June 2026 source PDF is **74.76 MB** (26 pages). No full translated PDF was generated.

This output would **not** be public or QA-approved even if successful. Chuy should continue page-by-page QA using existing single-page proofs and the inventory below until a provider-compliant full proof path exists.

---

## Output Paths

Full PT proof (not generated — API size limit):

`C:\projects\elaguila-website\.magazine-proof-output\june-2026\pt\full-local\leonix_media_june.pt.pdf`

Metadata:

`C:\projects\elaguila-website\.magazine-proof-output\june-2026\pt\full-local\metadata.json`

DeepL status (on failure, may be absent):

`C:\projects\elaguila-website\.magazine-proof-output\june-2026\pt\full-local\deepl-status.json`

Visual QA template (26 pages, pre-filled where known):

`C:\projects\elaguila-website\.magazine-proof-output\june-2026\pt\full-local\visual-qa-template.json`

Existing single-page proofs (for reference QA):

- Page 3: `C:\projects\elaguila-website\.magazine-proof-output\june-2026\pt\page-smoke\page-003\deepl-page-003.pt.pdf`
- Page 4: `C:\projects\elaguila-website\.magazine-proof-output\june-2026\pt\page-smoke\page-004\deepl-page-004.pt.pdf`

---

## Provider Result

| Item | Result | Notes |
|------|--------|-------|
| DeepL called | **Yes** (1 attempt) | Full `--execute` |
| Target | PT-BR | |
| Full source PDF submitted | **Yes** | 78,395,566 bytes (~74.76 MB) |
| Output exists | **No** | API rejected upload |
| Output size | N/A | |
| Status | **Failed** | `Bad request: Document exceeds the size limit of 10 MB` |
| Billed characters | N/A | No completed translation |
| qaApproved | **false** | |
| Public serving | **No** | |

---

## Page-by-Page Visual QA Inventory

Canonical Leonix contact truth (for QA notes):

- Leonix Media / Leonix Global LLC
- Email: info@leonixmedia.com
- Phone: (408) 360-6500
- Address: **871 Coleman Avenue, Suite 201**, San Jose, CA 95110
- **Not current truth:** Suite 202, 275 Coleman

| Page | Chuy QA Status | Translation Worked? | Layout Usable? | Text Overflow/Crop? | Contact Truth Issue? | Notes |
|------|----------------|---------------------|----------------|---------------------|----------------------|-------|
| 1 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 2 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 3 | REVIEWED (partial) | Yes (single-page smoke) | Mostly | Some alignment/line-height risk | Yes — Suite 202 should be Suite 201 | Proof-only; polish needed |
| 4 | REVIEWED (partial) | Yes (single-page smoke) | Mostly (more space) | Minor spacing risk | Yes — Suite 202 should be Suite 201 | Proof-only; card spacing polish |
| 5 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 6 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 7 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 8 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 9 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 10 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 11 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 12 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 13 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 14 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 15 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 16 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 17 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 18 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 19 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 20 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 21 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 22 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 23 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 24 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 25 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |
| 26 | NOT_REVIEWED | TBD | TBD | TBD | TBD | |

Until full proof exists, run additional single-page smokes for pages needing inspection:

```bash
node scripts/magazine/proof-translate-deepl.mjs --target=pt --page=N --execute
```

---

## Source Artwork Fix Doctrine

1. Do **not** manually patch generated PDF pages one-by-one first.
2. Use single-page proofs + this inventory to identify broken pages.
3. Fix Canva/source layout and **contact truth once** (Suite 201, canonical address).
4. Re-export source PDF — ideally under DeepL’s 10 MB document limit if full-document translation is required.
5. Re-run Portuguese proof (page-by-page or full when size-compliant).
6. Only then consider public storage/serving (`MAGAZINE-VISUAL-ASSET-PUBLIC-SERVE1` with explicit approval).

---

## Manual QA Checklist for Chuy

- [ ] Open page 3 proof PDF and confirm Portuguese + layout notes above
- [ ] Open page 4 proof PDF and confirm Portuguese + layout notes above
- [ ] For other pages, run single-page smoke as needed (`--page=N --execute`)
- [ ] Mark each page in the inventory table
- [ ] Note overflow/crop, CTA alignment, footer/contact truth
- [ ] Do **not** publish
- [ ] Do **not** call public-ready

---

## Decision After QA

| Condition | Next Gate |
|-----------|-----------|
| Most pages usable, minor issues only | MAGAZINE-DEEPL-PT-FULL-LOCAL-QA-POLISH1 |
| Many pages overflow/crop | MAGAZINE-SOURCE-CANVA-LAYOUT-CORRECTION1 |
| Contact truth errors remain | MAGAZINE-SOURCE-CONTACT-TRUTH-CORRECTION1 |
| Full PT proof fails (size limit) | **HOLD_FOR_DEEPL_FULL_DOCUMENT_FIX** — re-export smaller PDF or approved chunk strategy |
| Full PT proof good enough for internal preview only | MAGAZINE-PT-INTERNAL-PREVIEW-PACKAGE1 |
| Ready for public storage later | MAGAZINE-VISUAL-ASSET-PUBLIC-SERVE1 (explicit approval only) |

---

## Commands

```bash
node scripts/magazine/proof-translate-deepl.mjs --target=pt --full --dry-run
node scripts/magazine/proof-translate-deepl.mjs --target=pt --full --execute
node scripts/magazine/proof-translate-deepl.mjs --target=pt --page=3 --execute
```

## Safety

- No public assets changed
- No Supabase rows inserted
- No API key printed
- Proof output gitignored
- qaApproved: false
