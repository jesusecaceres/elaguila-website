# AUGUST 2026 PORTUGUESE PROOF PLAN

Gate: `AUGUST-2026-PORTUGUESE-PROOF-PLAN1`
Date: 2026-07-08
Owner: Coach (architect / PM / magazine production lead) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-ISSUE-MANIFEST-AND-FULL-SOURCE-INTAKE-FOUNDATION.md`](AUGUST-2026-ISSUE-MANIFEST-AND-FULL-SOURCE-INTAKE-FOUNDATION.md)
Prior decision: `AUGUST_ISSUE_MANIFEST_AND_FULL_SOURCE_INTAKE_FOUNDATION_DONE`

---

## Executive Summary

- Portuguese is an official launch-scope digital language.
- This is a planning gate only.
- No Portuguese provider calls were made.
- No Portuguese PDFs were created.
- No public assets/routes were created.
- Available source pages are 1–6 and 12.
- Pages 7–11 remain blocked by missing source.
- Portuguese proof should proceed only for available pages unless Chuy decides to wait for all 12.

Portuguese is allowed as the next official digital proof language, but it is not publicly approved yet. Raw provider proof will remain a proof layer only until Chuy/reviewer QA and final polish are complete.

---

## Safety Baseline

| Check | Result |
|-------|--------|
| Branch | `main` |
| Dirty files | Existing unrelated app/package/docs/scripts dirty files were present before this Portuguese plan gate. |
| Unrelated dirty files | App, package, servicios checkout, newsletter, docs, and non-magazine scripts were outside this gate and left untouched. |
| Docs-only gate | TRUE |
| Provider call planned | FALSE |
| Public/app change planned | FALSE |

| Gate 1 TRUE/FALSE | Value |
|-------------------|-------|
| Branch reported | TRUE |
| Dirty files listed | TRUE |
| Unrelated dirty files separated | TRUE |
| Docs-only gate confirmed | TRUE |
| No provider call planned | TRUE |
| No public/app change planned | TRUE |

---

## Foundation Verification

| Check | Result |
|-------|--------|
| Manifest found | TRUE |
| Source inventory found | TRUE |
| Source intake status found | TRUE |
| Available pages confirmed | TRUE — pages 1, 2, 3, 4, 5, 6, 12 |
| Missing pages confirmed | TRUE — pages 7, 8, 9, 10, 11 |
| Full issue PDF exists | FALSE — `NO_FULL_ISSUE_PDF_FOUND` |
| Portuguese not started | TRUE |
| Public Portuguese launch | FALSE |

| Gate 2 TRUE/FALSE | Value |
|-------------------|-------|
| Manifest found | TRUE |
| Source inventory found | TRUE |
| Source intake status found | TRUE |
| Available pages confirmed | TRUE |
| Missing pages confirmed | TRUE |
| Portuguese not started | TRUE |
| No public Portuguese launch | TRUE |

---

## Current Source Readiness

| Page | Title | Source Status | Eligible for Portuguese Proof Now | Notes |
|------|-------|---------------|-----------------------------------|-------|
| 1 | Cover | HELD_FOR_LATER | Conditionally eligible | Local PNG-derived source input exists, but cover was held for later polish sequencing. Include only if Chuy wants available-pages proof to cover all current sources. |
| 2 | Más que un anuncio / Leonix house ad | AVAILABLE | YES | Leonix house ad; good candidate after PT-1 if batch expands. |
| 3 | Cali Bear Tacos full-page ad | AVAILABLE | YES | Client restaurant ad; recommended in PT-1 to test business-name, food/menu, offer, and CTA preservation. |
| 4 | Elevated Barber full-page ad | AVAILABLE | YES | Client service/barber ad; useful for later Portuguese batch after PT-1. |
| 5 | Agenda de Agosto | AVAILABLE | YES | Dense agenda/event-card layout; useful for later Portuguese batch after PT-1. |
| 6 | Negocios que construyen comunidad | AVAILABLE | YES | Recommended in PT-1 to test editorial/community tone. |
| 7 | Receta de la comunidad | MISSING_SOURCE | NO | Missing Spanish source/master sample. |
| 8 | Familia y bienestar | MISSING_SOURCE | NO | Missing Spanish source/master sample. |
| 9 | Finanzas y negocio | MISSING_SOURCE | NO | Missing Spanish source/master sample. |
| 10 | Cultura que nos une | MISSING_SOURCE | NO | Missing Spanish source/master sample. |
| 11 | Recursos que ayudan | MISSING_SOURCE | NO | Missing Spanish source/master sample. |
| 12 | Sé parte del movimiento Leonix | AVAILABLE | YES | Recommended in PT-1 to test house/ad language, CTA, QR/contact, and movement-page tone. |

---

## Recommended Portuguese Scope

### Option A — Controlled Available-Pages Proof

- Translate pages 1–6 and 12 only.
- Max provider calls: 7.
- Purpose: validate Portuguese workflow quickly.
- Risk: not full issue.

### Option B — Wait for Full 12-Page Issue

- Do not run Portuguese until pages 7–11 exist.
- Purpose: avoid partial-language proof.
- Risk: slower progress.

Coach/PM recommendation:

- Use Option A if Chuy wants momentum.
- Use Option B if Chuy wants only complete-issue proof.

---

## Recommended First Portuguese Batch

Batch PT-1:

| Page | Title | Why Included |
|------|-------|--------------|
| 12 | Sé parte del movimiento Leonix | Known back-cover / movement page; tests house/ad language, CTA, QR/contact, and Leonix voice. |
| 6 | Negocios que construyen comunidad | Editorial/community page; tests tone, paragraph flow, and community/business wording. |
| 3 | Cali Bear Tacos full-page ad | Client restaurant ad; tests business-name preservation, food/menu terms, offers, and CTA/contact details. |

This tests:

- house/ad language
- editorial tone
- client ad/business-name preservation
- dense vs premium layouts

Max provider calls for PT-1: 3.

---

## Portuguese Risk Notes

- Portuguese is closer to Spanish than some future languages, but still requires review.
- Machine translation may alter brand voice.
- Client names and offers must be preserved.
- Food/menu terms need review.
- Typography and line breaks may shift.
- No final public launch without polish.

---

## Future Portuguese Execution Gate

Name:

`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL1`

Scope:

- English workflow pattern reused, but target Portuguese.
- Target language should be DeepL Portuguese variant determined safely:
  - Prefer `PT-BR` if supported and aligned with Latino/Bay Area audience.
  - If target support is uncertain, script must dry-run/validate target first.
- Max provider calls: 3.
- No retries.
- Local output only.
- No public routes in provider gate.

Expected local output pattern for future execution gate:

- `.magazine-proof-output/2026-august/pt/page-smoke/page-012/`
- `.magazine-proof-output/2026-august/pt/page-smoke/page-006/`
- `.magazine-proof-output/2026-august/pt/page-smoke/page-003/`

This planning gate does not create those folders or PDFs.

---

## Future Portuguese Web QA Gate

Name:

`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL1`

Purpose:

- create temporary noindex QA URLs
- compare Spanish source vs Portuguese proof
- no provider call
- no public launch

Temporary QA URLs must remain review-only and must not be wired into the magazine hub, sitemap, production reader, or public translated issue claims.

---

## Future Chuy/Reviewer Decision Gate

Name:

`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION1`

Decision options:

- `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES`
- `FIX_NEEDED`
- `REBUILD_SOURCE_NEEDED`
- `COMPANION_LAYER_NEEDED`
- `HOLD_FOR_PORTUGUESE_REVIEWER`

Chuy may make the initial business/visual decision, but Portuguese still needs reviewer or team verification before public launch claim.

---

## Cost Control

- Plan first.
- Dry-run before execute.
- Max 3 calls for PT-1.
- No retry without approval.
- Local output only.
- Public QA only after provider success.
- No hidden languages.
- No full issue until pages 7–11 exist or Chuy explicitly approves partial issue proof.

---

## What This Gate Does Not Do

- Does not translate.
- Does not call DeepL.
- Does not create PDFs.
- Does not create public QA URLs.
- Does not launch Portuguese issue.
- Does not alter website language picker.
- Does not activate hidden languages.

---

## Next Gate Recommendation

If Chuy wants momentum:

`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL1`

If Chuy wants complete issue first:

`AUGUST-2026-PAGES7-11-MASTER-SAMPLES-PLAN1`

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Portuguese proof plan created | TRUE |
| Available pages documented | TRUE |
| Missing pages 7–11 documented | TRUE |
| PT-1 batch recommended | TRUE |
| Provider call budget documented | TRUE |
| No provider call made | TRUE |
| No public asset created | TRUE |
| No source modified | TRUE |
| Ready for Portuguese Batch 1 DeepL gate | TRUE |

---

## Final Decision

`AUGUST_PORTUGUESE_PROOF_PLAN_DONE`

`READY FOR AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL1: YES`

Portuguese Batch 1 DeepL result created: [`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL.md`](AUGUST-2026-PORTUGUESE-PROOF-BATCH1-DEEPL.md) · Next gate: `AUGUST-2026-PORTUGUESE-PROOF-BATCH1-WEB-QA-URL1`
