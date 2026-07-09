# AUGUST 2026 TRANSLATION-SAFE MAGAZINE DESIGN SPECS

Gate: `AUGUST-2026-TRANSLATION-SAFE-MAGAZINE-DESIGN-SPECS1`
Date: 2026-07-09
Owner: Coach (architect / PM / magazine production lead) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md`](AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md)
Prior decision: `AUGUST_PORTUGUESE_PROOF_BATCH1_QA_DECISION_LOCKED`

---

## Executive Summary

English and Portuguese digital proof workflows are validated. DeepL is good enough for first-pass digital proof creation. Raw DeepL proof is not final public copy. Future magazine pages must be designed translation-safe from the beginning. This document defines spacing, padding, CTA, QR, contact, typography, and final polish rules. The purpose is to speed up production and stop repeated page-by-page guessing.

**Validated proof inputs reviewed:**

- English Page 12 — back-cover / movement page
- English Pages 5–6 — agenda + editorial
- English Pages 2–4 — house ad + client ads
- Portuguese Pages 12, 6, 3 — movement + editorial + client restaurant ad

**Official launch-scope digital languages:** English, Portuguese, Tagalog/Filipino (Spanish = source/print only)

**Hidden future languages:** Vietnamese, Chinese Simplified/Traditional, Arabic, Punjabi, Farsi/Persian, Japanese, Hindi, Russian — preserved but inactive.

---

## Validated Workflow

`Spanish source page → DeepL proof → local PDF → temporary noindex QA URL → visual QA → manual polish → final digital edition`

**Proof-success does not equal public launch.** Every translated page must pass the final polish checklist before public digital release.

---

## What Worked

- House/back-cover pages (Page 12) — movement message, QR/contact zones survived
- Editorial/community pages (Page 6) — headline and body readable in EN and PT
- Client restaurant ads (Page 3) — Cali Bear Tacos name, offer, CTA, QR, contact survived
- Client service ads (Page 4) — Elevated Barber service language and layout usable
- Leonix house/brand ads (Page 2) — Leonix-owned CTA/contact blocks survived
- Dense event pages (Page 5) — card structure survived with caution; usable for proof direction
- QR/contact zones when cleanly separated from body copy
- Side-by-side QA URLs — clear Spanish vs proof comparison for Chuy/team decisions
- PT-BR proof quality — acceptable digital proof direction (pages 12, 6, 3)
- English proof quality — acceptable digital proof direction (pages 12, 5, 6, 2, 3, 4)
- Controlled batch gates — avoided provider waste and blind full-issue translation

---

## What Did Not Fully Work

- Tight text boxes — overflow/crop risk after translation expansion
- Small copy blocks — readability loss when English/Portuguese runs longer
- Long translated headings — spacing shifts, heavier/plain typography vs Spanish source
- Machine-changed typography feel — DeepL alters font weight/style; premium serif feel lost
- CTA wording — needs human brand voice; raw provider copy not premium enough
- Brand voice — usable but not final luxury-magazine polish
- Line breaks/crop risk — especially on dense agenda cards (Page 5) and large headlines (Page 6)
- Dense layouts — need more manual polish than editorial or back-cover pages
- Browser PDF embed — QA-only surface; not final public reader UX

---

## Translation-Safe Page Layout Rules

1. Leave **15–25% extra text space** compared to Spanish copy length.
2. Avoid placing critical copy in tight boxes.
3. Use **generous padding around headings** — allow 2–3 extra lines of wrap room.
4. Keep **CTA zones separate** from body copy — never stack CTA directly under dense paragraphs.
5. Keep **QR/contact/footer in protected zones** — fixed margins, no overlapping translated text.
6. Keep **client logos/business names protected** — image-lock or non-translatable text layer.
7. Use **clean grids**, not crowded collage text.
8. Avoid **ultra-small copy** for important CTAs — minimum readable size for translated editions.
9. Use **fewer but stronger text blocks** — one headline + one body + one CTA beats five micro-labels.
10. Design for **English/Portuguese/Tagalog expansion** — Tagalog and Portuguese often run longer than Spanish; English can also expand in headlines.

---

## Typography Rules

- Use larger base font for translated editions when possible.
- Avoid tiny all-caps paragraphs — they break first under translation expansion.
- Allow headings to wrap cleanly — design headline boxes with vertical breathing room.
- Use consistent heading hierarchy — H1/H2/body/CTA must be visually distinct.
- Manually restore premium serif/brand style after proof — DeepL will not preserve Leonix luxury feel.
- Do not trust raw provider font choices as final — treat proof typography as placeholder.
- Page 5 lesson: card labels need readable minimum size even after EN expansion.
- Page 6 lesson: huge headlines may shift weight — plan headline zone height generously.

---

## Padding / Spacing Rules

- Heading blocks require **extra vertical breathing room** — minimum 12–16% more than Spanish layout.
- Cards need **internal padding** — event cards (Page 5) and business cards (Page 6) must not touch card edges.
- Footer/contact zones need **safe margins** — Suite 201, phone, email, website verified on every contact page.
- QR codes need **clean space around them** — no translated text within QR scan zone.
- Never place QR too close to translated text — minimum clear band between QR and copy.
- Ad pages need **extra margin around offers and CTA** — Page 3 black/gold layout survived because zones were separated.
- Back-cover movement pages need **protected lower-third** for contact + QR + CTA cluster.

---

## CTA / QR / Contact Rules

- CTA wording must be **manually checked** on every page — provider copy is proof-only.
- QR codes must be **verified after translation** — scan test on proof PDF and final edition.
- Phone/email/web/address must be **checked manually** — contact truth is non-negotiable.
- Addresses must **not be translated incorrectly** — street numbers, suite, city, state protected.
- Social handles must be **protected** — @handles and URLs unchanged.
- Contact blocks should be **recreated or manually polished** if DeepL distorts layout.
- Final public edition must use **verified contact info** — same truth as Spanish print source.
- Page 12 standard: Suite 201, phone, email, website preserved in EN and PT proofs — maintain on all pages.

---

## Client Name / Brand Protection Rules

- Business names should **not be translated** — Cali Bear Tacos, Elevated Barber, Leonix remain as-is.
- Logos should remain **image-protected** — never rely on provider to preserve logo text.
- Brand slogans need **human review** — movement language on Page 12 needs editorial pass.
- Food/menu/service names need **review** — menu items may translate; brand names must not.
- Client offers need **final human polish** — pricing, hours, specials verified against source.
- Leonix-owned pages (2, 12) — Leonix branding, movement CTAs, and house voice require brand pass.

---

## Page Type Specs

| Page Type | Translation Risk | Source Design Rule | Manual Polish Required |
|-----------|------------------|--------------------|------------------------|
| Cover | MEDIUM | Minimal text; hero image-led; title zone with 25% expansion room; hold for later polish sequencing | Title typography, issue date, tagline voice |
| House ad / brand ad | MEDIUM | Protected Leonix CTA zone; generous headline padding; separate contact block | Brand voice, CTA wording, contact verification |
| Client restaurant ad | HIGH | Protected business name/logo; offer zone with extra margin; QR/contact in lower protected band | Client name, menu/offer, CTA, QR scan, contact |
| Client service ad | HIGH | Same as restaurant ad; service terminology zone with expansion room | Service language, premium tone, CTA, contact |
| Editorial/community page | MEDIUM | Large headline zone; body in flexible column; business cards with internal padding | Headline line breaks, quote/body voice, card copy |
| Dense agenda/event page | HIGH | Fewer cards or larger cards; label minimum readable size; event detail zones expandable | Typography restoration, card overflow, event detail accuracy |
| Resource page | MEDIUM | Clean list/grid; avoid micro-copy; protected footer contacts | Link text, org names, contact blocks |
| Recipe/wellness/finance/culture pages | MEDIUM | Editorial layout rules; ingredient/step lists need vertical expansion room | Terminology, instructions, cultural references |
| Back cover / movement CTA page | HIGH | Protected lower-third for QR + contact + CTA; movement headline with wrap room | Movement CTA voice, QR scan, contact truth, brand tone |

---

## Source Export Rules

- **Preferred source:** final designed PDF with high-quality text if available.
- **Fallback source:** high-resolution PNG page converted to one-page PDF (current validated path).
- **Source page size** must remain consistent across all 12 pages — same dimensions for issue assembly.
- **Avoid low-resolution exports** — provider quality degrades on blurry sources.
- **Keep original Spanish source untouched** — proofs output to `.magazine-proof-output/` only.
- **Store master samples outside public** — `design-references/magazine/2026-august/01-master-samples/`.
- **Translation proofs output local first** — no public asset until QA + polish gates approve.
- **Issue inputs** prepared via `prepare-august-issue-source-inputs.mjs` — dry-run first, hash report.

**Current master sample inventory (available):**

| Page | File | Status |
|------|------|--------|
| 1 | `august-2026-cover-master-sample.png` | HELD_FOR_LATER |
| 2 | `august-2026-leonix-house-ad-master-sample.png` | AVAILABLE |
| 3 | `august-2026-calibear-tacos-master-sample.png` | AVAILABLE |
| 4 | `august-2026-elevated-barber-master-sample.png` | AVAILABLE |
| 5 | `august-2026-005-agenda-de-agosto-master-sample.png` | AVAILABLE |
| 6 | `august-2026-006-negocios-comunidad-master-sample.png` | AVAILABLE |
| 7–11 | — | **MISSING_SOURCE** |
| 12 | `august-2026-012-back-cover-master-sample.png` | AVAILABLE |

---

## DeepL Proof Rules

- **One language at a time** — never parallel EN + PT + TL in one gate without explicit approval.
- **Max provider calls planned before execution** — Batch 1 used 3 calls; plan budget per gate.
- **Dry-run first** — validate inputs, sizes, hashes before execute.
- **No retry without approval** — failed call stops gate; triage before retry.
- **Local output only first** — `.magazine-proof-output/2026-august/{locale}/...`
- **Web QA only after proof success** — temporary noindex routes under `/magazine/qa/`.
- **No public launch from raw DeepL** — proof direction approval ≠ public approval.
- **Final polish required** — every page, every language, before public digital edition.
- **PT-BR target** for Portuguese — case-sensitive code validation required.
- **EN target** for English proof batches — validated path.
- **TL target** for Tagalog — requires reviewer path before public claim.

---

## Final Digital Edition Polish Rules

Before public launch, every translated page must have:

- [ ] Typography cleanup — restore premium serif/brand weight
- [ ] Line-break cleanup — headings and card labels
- [ ] Overflow/crop check — dense pages especially
- [ ] CTA review — human brand voice
- [ ] QR scan verification — physical scan test
- [ ] Contact verification — phone, email, web, address, suite
- [ ] Client-name verification — business names unchanged
- [ ] Brand voice pass — Leonix luxury/community tone
- [ ] Mobile review — final reader UX on phone
- [ ] Desktop review — final reader UX on desktop
- [ ] Chuy final approval — CEO sign-off per language edition
- [ ] Reviewer approval — if language requires trusted reviewer (PT, TL)

**Current polish status:** All proofed pages remain `polishStatus: NOT_STARTED` in issue manifest. No page is public-launch ready.

---

## Finish Roadmap

| Stack | Gate | Purpose | Finish Impact |
|-------|------|---------|---------------|
| **A** | `AUGUST-2026-TRANSLATION-SAFE-MAGAZINE-DESIGN-SPECS1` | Lock design specs + finish roadmap | **This gate** — stops random learning; defines repeatable blueprint |
| **B** | `AUGUST-2026-PAGES7-11-MASTER-SAMPLES-PLAN1` | Define missing pages 7–11; set translation-safe design requirements; prepare for source creation | Unblocks full 12-page issue — **primary blocker** |
| **C** | `AUGUST-2026-TAGALOG-PROOF-PLAN1` | Plan Tagalog proof with reviewer path | Third official digital language proof direction |
| **D** | `AUGUST-2026-FULL-ISSUE-SOURCE-COMPLETION1` | Confirm pages 1–12 all exist; prepare full issue source inputs | Enables full-issue DeepL runs and full PDF assembly |
| **E** | `AUGUST-2026-FINAL-DIGITAL-EDITION-POLISH-PLAN1` | Define final public polish workflow for EN/PT/TL | Converts proof PDFs into launch-quality editions |
| **F** | `AUGUST-2026-PUBLIC-DIGITAL-MAGAZINE-LAUNCH-READINESS1` | Public launch gate — only after all source/proofs/polish exist | Final reader wiring, sitemap, hub — public digital magazine |

**PM execution order:** B → D → (parallel C + remaining EN/PT proofs) → E → F

**Do not skip B.** Pages 7–11 are the hard blocker. Tagalog and remaining Portuguese proofs can plan in parallel but cannot complete full issue without B + D.

---

## What Is Still Blocking Full Finish

- **Pages 7–11 master samples/source pages still missing** — Receta de la comunidad, Familia y bienestar, Finanzas y negocio, Cultura que nos une, Recursos que ayudan
- **Full issue PDF does not exist yet** — `NO_FULL_ISSUE_PDF_FOUND` in manifest
- **Tagalog proof not started** — reviewer path defined but no provider runs
- **Portuguese proof incomplete** — only pages 12, 6, 3 proofed; pages 2, 4, 5, 1 not PT-proofed
- **English proof incomplete for full issue** — pages 1, 7–11 not proofed
- **Final public polish layer not performed** — all proofed pages remain proof-only
- **Final digital reader/launch wiring not done** — no public translated issue in hub/reader/sitemap
- **No final translated issue public launch** — `publicTranslatedIssueLaunched: false`

---

## PM Finish Decision

The proof system is **no longer the blocker.**

English and Portuguese workflows are validated across six layout types. DeepL creates usable first-pass digital proofs. The controlled gate system works. Side-by-side QA URLs work. Chuy/Coach decisions are repeatable.

**The remaining blockers are source completion and final polish/public launch workflow.**

Next gate: **`AUGUST-2026-PAGES7-11-MASTER-SAMPLES-PLAN1`** — design and create the five missing pages using these translation-safe specs from day one.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| English workflow validated | TRUE |
| Portuguese workflow validated | TRUE |
| Translation-safe design rules captured | TRUE |
| CTA/QR/contact rules captured | TRUE |
| Source export rules captured | TRUE |
| Final polish rules captured | TRUE |
| Finish roadmap documented | TRUE |
| Pages 7–11 blocker documented | TRUE |
| Ready for pages 7–11 master samples plan | TRUE |

---

## Final Decision

**AUGUST_TRANSLATION_SAFE_MAGAZINE_DESIGN_SPECS_DONE**

**READY FOR AUGUST-2026-PAGES7-11-MASTER-SAMPLES-PLAN1: YES**
