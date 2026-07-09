# AUGUST 2026 MULTILINGUAL DIGITAL TRANSLATION PIPELINE ARCHITECTURE

Gate: `AUGUST-2026-MULTILINGUAL-DIGITAL-TRANSLATION-PIPELINE-ARCHITECTURE1`
Date: 2026-07-08
Owner: Coach (architect / PM / magazine production lead) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md`](AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md)
Prior locked decision: `AUGUST_BATCH3_PAGES2_4_CHUY_QA_DECISION_LOCKED`

---

## Executive Summary

- The English digital proof workflow is validated.
- Leonix will not continue manual page-by-page prompting as the long-term workflow.
- The next system must translate by issue + language using a manifest.
- Printed August issue remains Spanish-only.
- Translated editions are digital-only.
- Official launch translation languages are English, Portuguese, and Tagalog/Filipino, with Spanish as the source/print language.
- Future languages remain hidden/inactive until Leonix has trusted reviewers.
- Google Translate / Google Lens may be used as a fallback helper, not official Leonix translation support.
- Raw DeepL proof is not final public copy.

---

## Safety Baseline / Site Evaluation

| Check | Result |
|-------|--------|
| Branch | `main` |
| Dirty files | Initial Gate 1 baseline: `AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md`; `AUGUST-2026-MULTILINGUAL-DIGITAL-TRANSLATION-PIPELINE-ARCHITECTURE.md`; `AUGUST-2026-VISUAL-QA-AND-DIGITAL-TRANSLATION-PROOF-PLAN.md` |
| Unrelated dirty files | Initial Gate 1 baseline: none found. Final workspace check later showed unrelated app/newsletter dirty files outside this gate; they were left untouched. |
| Docs-only architecture gate | TRUE |
| Provider call planned | FALSE |
| Public/app change planned | FALSE |
| Existing August docs inspected | TRUE |
| Current master sample page inventory checked | TRUE |

| Required Gate 1 TRUE/FALSE | Value |
|----------------------------|-------|
| Branch reported | TRUE |
| Dirty files listed | TRUE |
| Unrelated dirty files separated | TRUE |
| Docs-only gate confirmed | TRUE |
| No provider call planned | TRUE |
| No public/app change planned | TRUE |
| August docs inspected | TRUE |
| Page inventory checked | TRUE |

---

## Validated Proof Workflow

`PNG/PDF → DeepL → local proof → temporary web QA URL → Chuy visual decision`

Validated page types:

- Page 12 — back-cover / house-ad style
- Page 5 — dense agenda / event-card layout
- Page 6 — editorial / business community layout
- Page 2 — Leonix house ad / brand ad
- Page 3 — client restaurant ad
- Page 4 — client service/barber ad

This validation proves the workflow direction. It does not approve raw provider output as final brand copy, and it does not approve public translated launch pages.

---

## Known August Issue Inventory

| Page | Title / Role | Current Master Sample Status |
|------|--------------|------------------------------|
| 1 | Cover | EXISTS — `august-2026-cover-master-sample.png` |
| 2 | Más que un anuncio / Leonix house ad | EXISTS — `august-2026-leonix-house-ad-master-sample.png` |
| 3 | Cali Bear Tacos full-page ad | EXISTS — `august-2026-calibear-tacos-master-sample.png` |
| 4 | Elevated Barber full-page ad | EXISTS — `august-2026-elevated-barber-master-sample.png` |
| 5 | Agenda de Agosto | EXISTS — `august-2026-005-agenda-de-agosto-master-sample.png` |
| 6 | Negocios que construyen comunidad | EXISTS — `august-2026-006-negocios-comunidad-master-sample.png` |
| 7 | Receta de la comunidad | MISSING SOURCE / MASTER SAMPLE |
| 8 | Familia y bienestar | MISSING SOURCE / MASTER SAMPLE |
| 9 | Finanzas y negocio | MISSING SOURCE / MASTER SAMPLE |
| 10 | Cultura que nos une | MISSING SOURCE / MASTER SAMPLE |
| 11 | Recursos que ayudan | MISSING SOURCE / MASTER SAMPLE |
| 12 | Sé parte del movimiento Leonix | EXISTS — `august-2026-012-back-cover-master-sample.png` |

A true full translated issue cannot be generated until pages 7–11 have final Spanish source pages/master samples.

| Required Gate 2 TRUE/FALSE | Value |
|----------------------------|-------|
| 12-page lineup documented | TRUE |
| Existing page samples documented | TRUE |
| Missing pages 7–11 documented | TRUE |
| Full issue dependency documented | TRUE |

---

## Launch Language Scope

| Language | Role | Launch Status | Reviewer Status | Public Claim |
|----------|------|---------------|-----------------|--------------|
| Spanish | Source/print/base language | ACTIVE | Chuy/team can verify | Official |
| English | Digital translation | ACTIVE | Chuy/team can verify enough | Official |
| Portuguese | Digital translation | ACTIVE NEXT | Close enough for Chuy/team first-pass + later reviewer | Official once proofed |
| Tagalog / Filipino | Digital translation | ACTIVE NEXT | Trusted friend/reviewer available | Official once proofed |

Spanish remains the print/source language. English, Portuguese, and Tagalog/Filipino are the only official Leonix-supported launch translation languages for the digital magazine pipeline.

---

## Hidden Future Language Registry

| Language | Status | Activation Requirement |
|----------|--------|------------------------|
| Vietnamese | HIDDEN / FUTURE | Trusted reviewer/team required |
| Chinese Simplified | HIDDEN / FUTURE | Trusted reviewer/team required |
| Chinese Traditional | HIDDEN / FUTURE | Trusted reviewer/team required |
| Arabic | HIDDEN / FUTURE | Trusted reviewer/team required |
| Punjabi | HIDDEN / FUTURE | Trusted reviewer/team required |
| Farsi / Persian | HIDDEN / FUTURE | Trusted reviewer/team required |
| Japanese | HIDDEN / FUTURE | Trusted reviewer/team required |
| Hindi | HIDDEN / FUTURE | Trusted reviewer/team required |
| Russian | HIDDEN / FUTURE | Trusted reviewer/team required |
| Other community languages | HIDDEN / FUTURE | Demand + reviewer/team required |

Hidden means not deleted. It means inactive until Leonix can verify quality.

---

## Why Scope Languages for Launch

Leonix should launch with trust over vanity and quality over quantity. The public site should not claim support for languages the team cannot verify, because unreviewed language output can damage client trust, business credibility, and community confidence.

Limiting launch scope reduces launch risk, lowers QA burden, prevents provider-cost waste, and allows future rollout one or two languages at a time once trusted reviewers exist.

---

## Source Strategy

Accepted source options:

1. Best source:
   Full designed PDF with selectable text or final production export.

2. Current proven source:
   High-resolution PNG master samples converted into one-page PDFs.

3. Fallback:
   Individual page PNGs if full issue PDF is not available.

The system should support both full-issue PDF splitting and page-PNG manifest inputs. A full issue should not be sent to a provider unless the manifest confirms every page source, page title, page type, risk level, target language, and cost guardrail.

---

## Issue Manifest Strategy

Required future manifest file:

`design-references/magazine/2026-august/august-2026-issue-manifest.json`

Manifest should include:

- issue slug
- issue title
- print/source language
- official launch digital languages
- hidden future languages
- page count
- page number
- page title
- page type
- source path
- source format
- risk level
- translation status per language
- QA URL status per language
- Chuy/team decision per language
- final polish status
- public launch status

Example manifest shape:

```json
{
  "issueSlug": "2026-august",
  "issueTitle": "Leonix Magazine August 2026",
  "sourceLanguage": "es",
  "printLanguage": "es",
  "officialLaunchDigitalLanguages": ["en", "pt", "tl"],
  "hiddenFutureLanguages": ["vi", "zh-Hans", "zh-Hant", "ar", "pa", "fa", "ja", "hi", "ru", "other"],
  "pageCount": 12,
  "languages": {
    "es": { "role": "source/print/base", "launchStatus": "ACTIVE", "publicClaim": "official" },
    "en": { "role": "digital translation", "launchStatus": "ACTIVE", "publicClaim": "official" },
    "pt": { "role": "digital translation", "launchStatus": "ACTIVE_NEXT", "publicClaim": "official once proofed" },
    "tl": { "role": "digital translation", "launchStatus": "ACTIVE_NEXT", "publicClaim": "official once proofed" }
  },
  "pages": [
    {
      "pageNumber": 1,
      "pageTitle": "Cover",
      "pageType": "cover",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-cover-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM",
      "translationStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "NOT_CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "PENDING", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 2,
      "pageTitle": "Más que un anuncio / Leonix house ad",
      "pageType": "house_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-leonix-house-ad-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM",
      "translationStatus": { "en": "PROOFED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED_TEMPORARY_QA", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 3,
      "pageTitle": "Cali Bear Tacos full-page ad",
      "pageType": "client_restaurant_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-calibear-tacos-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "HIGH",
      "translationStatus": { "en": "PROOFED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED_TEMPORARY_QA", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 4,
      "pageTitle": "Elevated Barber full-page ad",
      "pageType": "client_service_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-elevated-barber-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "HIGH",
      "translationStatus": { "en": "PROOFED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED_TEMPORARY_QA", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 5,
      "pageTitle": "Agenda de Agosto",
      "pageType": "agenda_event_cards",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-005-agenda-de-agosto-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM_HIGH",
      "translationStatus": { "en": "PROOFED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED_TEMPORARY_QA", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 6,
      "pageTitle": "Negocios que construyen comunidad",
      "pageType": "editorial_business_community",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-006-negocios-comunidad-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM",
      "translationStatus": { "en": "PROOFED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED_TEMPORARY_QA", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 7,
      "pageTitle": "Receta de la comunidad",
      "pageType": "community_recipe",
      "sourcePath": null,
      "sourceFormat": null,
      "riskLevel": "UNKNOWN_SOURCE_MISSING",
      "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" },
      "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" },
      "decision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" },
      "finalPolishStatus": "BLOCKED_SOURCE_MISSING",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 8,
      "pageTitle": "Familia y bienestar",
      "pageType": "family_wellness",
      "sourcePath": null,
      "sourceFormat": null,
      "riskLevel": "UNKNOWN_SOURCE_MISSING",
      "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" },
      "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" },
      "decision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" },
      "finalPolishStatus": "BLOCKED_SOURCE_MISSING",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 9,
      "pageTitle": "Finanzas y negocio",
      "pageType": "finance_business",
      "sourcePath": null,
      "sourceFormat": null,
      "riskLevel": "UNKNOWN_SOURCE_MISSING",
      "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" },
      "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" },
      "decision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" },
      "finalPolishStatus": "BLOCKED_SOURCE_MISSING",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 10,
      "pageTitle": "Cultura que nos une",
      "pageType": "culture_editorial",
      "sourcePath": null,
      "sourceFormat": null,
      "riskLevel": "UNKNOWN_SOURCE_MISSING",
      "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" },
      "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" },
      "decision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" },
      "finalPolishStatus": "BLOCKED_SOURCE_MISSING",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 11,
      "pageTitle": "Recursos que ayudan",
      "pageType": "community_resources",
      "sourcePath": null,
      "sourceFormat": null,
      "riskLevel": "UNKNOWN_SOURCE_MISSING",
      "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" },
      "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" },
      "decision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" },
      "finalPolishStatus": "BLOCKED_SOURCE_MISSING",
      "publicLaunchStatus": "NOT_READY"
    },
    {
      "pageNumber": 12,
      "pageTitle": "Sé parte del movimiento Leonix",
      "pageType": "back_cover_house_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-012-back-cover-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "HIGH",
      "translationStatus": { "en": "PROOFED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED_TEMPORARY_QA", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "decision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": "NOT_STARTED",
      "publicLaunchStatus": "NOT_READY"
    }
  ]
}
```

---

## Pipeline Stages

| Stage | Purpose | Inputs | Outputs | Gate Decision | TRUE Before Next Stage |
|-------|---------|--------|---------|---------------|------------------------|
| 1. Source inventory | Confirm all source pages exist and are usable | Master samples, full PDF, source layouts | Inventory report | Continue / hold for missing source | Page count, page titles, source paths, and missing pages documented |
| 2. Manifest creation | Lock issue metadata and language scope | Inventory report, language decision | `august-2026-issue-manifest.json` | Manifest approved / revise | Official languages, hidden languages, page metadata, and statuses are complete |
| 3. Input preparation | Convert source assets into provider-ready inputs | Manifest, page PNGs or full PDF | Local input PDFs and metadata | Prepared / blocked | Dry-run passes, sizes acceptable, hashes recorded |
| 4. Per-language provider proof generation | Generate local translation proofs one language at a time | Manifest, prepared inputs, provider approval | Local proof PDFs and provider status files | Success / retry approval / hold | Planned provider call count completed with no unauthorized retries |
| 5. Local proof output | Verify provider files exist before any web QA | Proof outputs, metadata | Local proof checklist | Ready for QA URL / blocked | Outputs exist locally, no public launch claim, no final approval claimed |
| 6. Temporary web QA URL generation | Create visual QA review surface only | Local proof output, Spanish source references | Temporary noindex QA URLs | Ready for Chuy/reviewer QA / blocked | QA assets isolated, temporary URLs noindexed, app/public launch surfaces untouched |
| 7. Chuy/reviewer QA decision | Lock page/language visual decisions | QA URLs, proof checklists | Decision doc or manifest update | Approve proof / fix / rebuild / hold | Every page in the language has a decision or documented hold |
| 8. Editorial/design polish | Convert raw proof into brand-safe public copy | Approved proof decisions, reviewer notes | Polished translated pages | Ready for final assembly / fix | Typography, line breaks, names, offers, CTAs, and contact details reviewed |
| 9. Final digital edition assembly | Assemble language edition after polish | Polished pages, final assets | Final digital edition asset set | Ready for launch wiring / hold | All pages exist, no QA disclaimers remain, final assets are outside `/public/qa/` |
| 10. Public launch wiring | Connect final edition to approved public surfaces | Final digital edition, launch approval | Reader/hub/language/sitemap updates | Launch / hold | Chuy approval, canonical/analytics strategy, and launch checklist complete |
| 11. Analytics/monitoring | Track use and catch issues after launch | Final URLs, analytics plan | Monitoring plan and launch notes | Monitor / rollback if needed | Analytics events and issue ownership documented |
| 12. Future language activation | Add new languages only when review capacity exists | Demand signal, reviewer/team approval | Language activation plan | Activate / keep hidden | Trusted reviewer exists, cost approved, manifest language added intentionally |

---

## Script Architecture

Future scripts are documented here but must not be created in this gate.

| Future Script | Purpose | Allowed Inputs | Allowed Outputs | Cost Guardrails | No-Public-Launch Guardrails |
|---------------|---------|----------------|-----------------|-----------------|-----------------------------|
| `scripts/magazine/create-issue-manifest.mjs` | Create or validate issue manifest from approved inventory | Approved issue docs, source folder inventory | Manifest JSON draft | No provider calls | Writes docs/data only; no routes/assets |
| `scripts/magazine/prepare-issue-translation-inputs.mjs` | Convert page PNGs or full PDF pages into local translation inputs | Manifest, source PNGs/PDF | `.magazine-proof-output/2026-august/_inputs/...` | Dry-run first, size/hash report | Local output only; no `public/` writes |
| `scripts/magazine/translate-issue-deepl.mjs` | Run approved provider proof for one issue language | Manifest, prepared inputs, explicit language approval | `.magazine-proof-output/2026-august/{locale}/...` | One language at a time, planned call count, no retries without approval | Local proof only; no QA routes; no final assets |
| `scripts/magazine/create-issue-web-qa-routes.mjs` | Generate temporary QA review surface after provider success | Local proof outputs, manifest | Temporary noindex QA URLs and isolated QA assets | No provider calls | QA-only routes/assets; no magazine hub, sitemap, or launch registry |
| `scripts/magazine/record-issue-qa-decisions.mjs` | Record Chuy/team/reviewer decisions into manifest/doc | QA decisions, manifest | Updated decision record | No provider calls | Does not publish; only records decisions |
| `scripts/magazine/build-final-digital-language-edition.mjs` | Assemble polished final digital edition after approval | Polished assets, final decisions, manifest | Final language edition package | No provider calls unless separate approved gate | Requires final launch approval before any public wiring |

---

## Provider / Cost Control Rules

- No full issue provider run without manifest.
- No unsupported language provider run without approval.
- No retries without approval.
- Provider call count must be planned before execute.
- Dry-run required before execute.
- Outputs local first.
- Public QA only after provider success.
- Final public edition only after polish/review.
- One language at a time unless explicitly approved.

---

## Language-by-Language Rollout Plan

1. English — already proofed enough to validate workflow.
2. Portuguese — next official digital proof candidate.
3. Tagalog / Filipino — next after reviewer alignment.
4. Future languages — only after reviewer/team exists.

Vietnamese and others should not be active official languages at launch.

---

## Google Translate / Google Lens Fallback Role

- Browser Google Translate can help users translate normal website text.
- Google Lens can help users translate printed/visual pages on their phones.
- Leonix cannot force Chrome’s native translation popup.
- Google fallback should be presented as “additional language help,” not official Leonix translation.
- The website language fallback implementation belongs to:
  `LEONIX-LAUNCH-LANGUAGE-SCOPE-AND-GOOGLE-TRANSLATE-FALLBACK1`
- Do not mix Google fallback with official DeepL magazine proof pipeline.
- Google fallback is a bridge until Leonix has reviewers for more languages.

---

## QA Decision Model

Page/language decisions:

- `APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES`
- `FIX_NEEDED`
- `REBUILD_SOURCE_NEEDED`
- `COMPANION_LAYER_NEEDED`
- `HOLD_FOR_REVIEWER`

Issue-level decisions:

- `ISSUE_LANGUAGE_PROOF_READY_FOR_POLISH`
- `ISSUE_LANGUAGE_NEEDS_PAGE_FIXES`
- `ISSUE_LANGUAGE_HOLD_FOR_REVIEWER`
- `ISSUE_LANGUAGE_READY_FOR_PUBLIC_DIGITAL_LAUNCH`

---

## Final Polish Layer

All final public translated editions need:

- typography restoration
- line-break cleanup
- brand voice polish
- client-name verification
- offer/CTA/contact verification
- QR/contact readability check
- mobile review
- desktop review
- final Chuy approval
- reviewer approval where applicable

---

## Public Launch Rules

Final public translated issue cannot launch until:

- all pages exist
- all language proofs generated
- QA URLs reviewed
- decisions locked
- polish complete
- final digital edition created
- no QA disclaimers remain
- final assets moved out of `/public/qa/`
- magazine hub/language switcher updated
- sitemap/canonical strategy set
- analytics planned
- Chuy approves

---

## Website Language Relationship

Website UI language coverage is a separate project from digital magazine translation.

Next website project:

`LEONIX-LAUNCH-LANGUAGE-SCOPE-AND-GOOGLE-TRANSLATE-FALLBACK1`

Purpose:

- official UI languages ES/EN/PT/TL
- hide unsupported language buttons
- prevent half-translated `?lang=vi`
- add Google Translate / Lens fallback guidance
- ensure `<html lang>` and no anti-translation tags

Do not implement this in the magazine architecture gate.

---

## End-of-Week Roadmap

1. Finish this architecture doc.
2. Create issue manifest gate.
3. Prepare Portuguese proof plan.
4. Prepare Tagalog proof plan.
5. Finish pages 7–11 source/master samples.
6. Build issue-level scripts.
7. Create full English issue proof.
8. Create full Portuguese issue proof.
9. Create full Tagalog issue proof.
10. Create final polish/review gate.
11. Public launch gate.
12. Website language scope/fallback gate.

---

## Open Questions

- Do pages 7–11 exist anywhere else?
- Will final source be a full PDF, page PNGs, or both?
- Who reviews Portuguese?
- Who reviews Tagalog?
- Which language launches first after English?
- What final public reader format will be used: PDF, flipbook, custom reader, or all?
- Should Google fallback live on `/qr/translator` or a dedicated `/translate-help` page?

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| English proof workflow validated | TRUE |
| Launch language scope locked | TRUE |
| Hidden future language registry documented | TRUE |
| Google fallback documented as helper only | TRUE |
| Full issue manifest strategy documented | TRUE |
| Full issue pipeline stages documented | TRUE |
| Provider cost controls documented | TRUE |
| Final polish layer documented | TRUE |
| Public launch rules documented | TRUE |
| Website language fallback separated | TRUE |
| Ready for issue manifest gate | TRUE |

---

## Final Decision

`AUGUST_MULTILINGUAL_DIGITAL_TRANSLATION_PIPELINE_ARCHITECTURE_DONE`

`READY FOR AUGUST-2026-ISSUE-MANIFEST-FOUNDATION1: YES`

Issue manifest/source intake foundation created: [`august-2026-issue-manifest.json`](august-2026-issue-manifest.json) · Result doc: [`AUGUST-2026-ISSUE-MANIFEST-AND-FULL-SOURCE-INTAKE-FOUNDATION.md`](AUGUST-2026-ISSUE-MANIFEST-AND-FULL-SOURCE-INTAKE-FOUNDATION.md) · Next gate: `AUGUST-2026-PORTUGUESE-PROOF-PLAN1`

Portuguese proof plan created with PT-1 recommendation and max 3 provider calls: [`AUGUST-2026-PORTUGUESE-PROOF-PLAN.md`](AUGUST-2026-PORTUGUESE-PROOF-PLAN.md)

Portuguese Batch 1 validated PT-BR proof direction for pages 12, 6, and 3: [`AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md`](AUGUST-2026-PORTUGUESE-PROOF-BATCH1-QA-DECISION.md)

Translation-safe design specs now capture spacing, padding, CTA/QR/contact, source export, and final polish rules: [`AUGUST-2026-TRANSLATION-SAFE-MAGAZINE-DESIGN-SPECS.md`](AUGUST-2026-TRANSLATION-SAFE-MAGAZINE-DESIGN-SPECS.md)
