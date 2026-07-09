# Magazine DeepL Portuguese Single-Page Smoke

Gate history: Page 3 (`MAGAZINE-DEEPL-PT-SINGLE-PAGE-SMOKE1`), Page 4 (`MAGAZINE-DEEPL-PT-PAGE4-SMOKE2-VISUAL-QA`)

Classification: controlled provider smoke — Portuguese only, one page at a time, local proof folder only.

---

## Page 3 Smoke Result (PASS1)

| Field | Value |
|-------|-------|
| Output path | `.magazine-proof-output/june-2026/pt/page-smoke/page-003/deepl-page-003.pt.pdf` |
| Source page path | `.magazine-proof-output/june-2026/pt/page-smoke/page-003/source-page-003.pdf` |
| Output file size | 17,893,636 bytes (~17.06 MB) |
| Source one-page size | 3,178,401 bytes (~3.03 MB) |
| DeepL status | `done` |
| Billed characters | 1,613 |
| Provider calls | 1 (one-page only) |
| Full magazine submitted | **No** |
| Public serving | **No** |
| Supabase row | **No** |
| Vercel env change | **No** |

---

## Page 4 Smoke Result (PASS2)

| Field | Value |
|-------|-------|
| Output path | `.magazine-proof-output/june-2026/pt/page-smoke/page-004/deepl-page-004.pt.pdf` |
| Source page path | `.magazine-proof-output/june-2026/pt/page-smoke/page-004/source-page-004.pdf` |
| Output file size | 15,957,354 bytes (~15.22 MB) |
| Source one-page size | 2,902,985 bytes (~2.77 MB) |
| DeepL status | `done` |
| Billed characters | 1,373 |
| Provider calls (this gate) | 1 (one-page only) |
| Full magazine submitted | **No** |
| Public serving | **No** |
| Supabase row | **No** |
| Vercel env change | **No** |

---

## Visual QA Notes

### Page 3 (Chuy — reviewed)

- Translation worked into Portuguese.
- Images/branding preserved.
- Layout mostly preserved.
- Some translated text is longer/shorter than Spanish; alignment and line-height need touch-up review in a later polish pass.
- Source artwork still has contact truth issues (e.g. Suite 202 where current public truth should be Suite 201). DeepL inherits source artwork — not fixed by translation.
- **Proof-only — not public-ready.**

### Page 4 (Chuy — manual QA checklist)

Open: `.magazine-proof-output/june-2026/pt/page-smoke/page-004/deepl-page-004.pt.pdf`

- [ ] Did visible Spanish become Portuguese?
- [ ] Did layout stay usable?
- [ ] Did DeepL leave any text unchanged?
- [ ] Did translated text overflow or crop badly?
- [ ] Are CTA labels aligned?
- [ ] Are footer/contact details correct or still inherited from source artwork?
- [ ] Is it good enough to test a full Portuguese magazine local proof?

**Do not publish** either proof PDF or claim a public Portuguese magazine edition.

---

## Local Storage Summary

| Item | Size (after Page 4 gate) |
|------|--------------------------|
| Page 3 source | ~3.03 MB |
| Page 3 translated | ~17.06 MB |
| Page 4 source | ~2.77 MB |
| Page 4 translated | ~15.22 MB |
| **PT page-smoke folder total** | **~38.09 MB** |

All under `.magazine-proof-output/` — **gitignored**, never copied to `public/`.

---

## Next Decision Path

| If Page 4 visual QA is… | Recommended next step |
|-------------------------|----------------------|
| Usable (like Page 3) | Gate for **one controlled full Portuguese local proof** (explicit approval; still not public) |
| Unchanged or poor | Fix Canva export for selectable text and/or prioritize companion reader path |
| Polish-only issues | Document touch-up backlog; do not full-send until artwork truth + layout fixes are scoped |

Full magazine smoke: separate gate with explicit approval only. No Vercel env until local full proof is QA-approved.

---

## Commands

```bash
# Readiness (never prints key)
node scripts/magazine-deepl-readiness-audit.mjs

# Page N dry-run (extract only)
node scripts/magazine/proof-translate-deepl.mjs --target=pt --page=4 --dry-run

# Page N execute (one paid call per run)
node scripts/magazine/proof-translate-deepl.mjs --target=pt --page=4 --execute
```

## Safety

- No public assets changed
- No Supabase rows inserted
- No API key printed
- Proof output gitignored
