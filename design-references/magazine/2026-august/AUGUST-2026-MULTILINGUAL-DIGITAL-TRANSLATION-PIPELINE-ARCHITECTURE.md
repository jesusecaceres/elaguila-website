# AUGUST 2026 MULTILINGUAL DIGITAL TRANSLATION PIPELINE ARCHITECTURE

Gate: `AUGUST-2026-MULTILINGUAL-DIGITAL-TRANSLATION-PIPELINE-ARCHITECTURE1`
Date: 2026-07-08
Owner: Coach (architect / PM / magazine production lead) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md`](AUGUST-2026-BATCH3-PAGES2-4-CHUY-QA-DECISION.md)

---

## Executive Summary

- The English digital proof workflow is validated across multiple August 2026 magazine page types.
- Leonix will not continue manual page-by-page prompting as the long-term workflow.
- The next system must translate by issue + language using a manifest.
- Printed August issue remains Spanish-only.
- Translated editions are digital-only.
- Official launch translation languages are English, Portuguese, and Tagalog / Filipino, with Spanish as the source/print language.
- Future languages remain hidden/inactive until Leonix has trusted reviewers.
- Google Translate / Google Lens may be used as a fallback helper, not official Leonix translation support.
- Raw DeepL proof is not final public copy.

This architecture moves Leonix from proof experiments into a repeatable full-issue pipeline without overpromising languages, wasting provider cost, or launching unpolished client-facing translations.

---

## Validated Proof Workflow

Validated workflow:

`PNG/PDF → DeepL → local proof → temporary web QA URL → Chuy visual decision`

Validated page types:

| Page | Layout Type | Status |
|------|-------------|--------|
| 12 | Back-cover / house-ad style | Validated |
| 5 | Dense agenda / event-card layout | Validated |
| 6 | Editorial / business community layout | Validated |
| 2 | Leonix house ad / brand ad | Validated |
| 3 | Client restaurant ad | Validated |
| 4 | Client service/barber ad | Validated |

Locked doctrine:

- Temporary QA URLs are not launch pages.
- DeepL proof success does not equal final public approval.
- Final translated public magazine requires polish/review before launch.

---

## Current August Page Inventory

Known August 2026 issue structure:

| Page | Title | Current Master Sample Status |
|------|-------|------------------------------|
| 1 | Cover | Exists: `august-2026-cover-master-sample.png` |
| 2 | Más que un anuncio / Leonix house ad | Exists: `august-2026-leonix-house-ad-master-sample.png` |
| 3 | Cali Bear Tacos full-page ad | Exists: `august-2026-calibear-tacos-master-sample.png` |
| 4 | Elevated Barber full-page ad | Exists: `august-2026-elevated-barber-master-sample.png` |
| 5 | Agenda de Agosto | Exists: `august-2026-005-agenda-de-agosto-master-sample.png` |
| 6 | Negocios que construyen comunidad | Exists: `august-2026-006-negocios-comunidad-master-sample.png` |
| 7 | Receta de la comunidad | Missing source/master sample |
| 8 | Familia y bienestar | Missing source/master sample |
| 9 | Finanzas y negocio | Missing source/master sample |
| 10 | Cultura que nos une | Missing source/master sample |
| 11 | Recursos que ayudan | Missing source/master sample |
| 12 | Sé parte del movimiento Leonix | Exists: `august-2026-012-back-cover-master-sample.png` |

A true full translated issue cannot be generated until pages 7-11 have final Spanish source pages/master samples.

---

## Launch Language Scope

| Language | Role | Launch Status | Reviewer Status | Public Claim |
|----------|------|---------------|-----------------|--------------|
| Spanish | Source/print/base language | ACTIVE | Chuy/team can verify | Official |
| English | Digital translation | ACTIVE | Chuy/team can verify enough | Official |
| Portuguese | Digital translation | ACTIVE NEXT | Close enough for Chuy/team first-pass + later reviewer | Official once proofed |
| Tagalog / Filipino | Digital translation | ACTIVE NEXT | Trusted friend/reviewer available | Official once proofed |

Launch scope means Leonix can talk about these as official supported directions only after the relevant proof, review, polish, and Chuy approval gates are complete.

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

Leonix should prioritize trust over vanity and quality over quantity. Public claims for languages the team cannot verify create client risk, reader confusion, and brand damage.

Keeping launch languages focused:

- prevents public claims for languages Leonix cannot verify
- reduces launch risk
- reduces QA burden
- protects client/business trust
- supports realistic sales conversations
- allows future rollout one or two languages at a time

---

## Source Strategy

Accepted source options:

### 1. Best Source

Full designed PDF with selectable text or final production export.

This is the preferred future source because translation providers can work from real text layers, and the full issue can be split and tracked by manifest.

### 2. Current Proven Source

High-resolution PNG master samples converted into one-page PDFs.

This is the current proven August path for controlled proofing. It has worked enough for digital proof direction, but it still carries flattened-image risk and final-polish requirements.

### 3. Fallback

Individual page PNGs if full issue PDF is not available.

The system should support both full-issue PDF splitting and page-PNG manifest inputs.

---

## Issue Manifest Strategy

Required future manifest file:

`design-references/magazine/2026-august/august-2026-issue-manifest.json`

The manifest should include:

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
  "hiddenFutureLanguages": ["vi", "zh-Hans", "zh-Hant", "ar", "pa", "fa", "ja", "hi", "ru"],
  "pageCount": 12,
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
      "chuyDecision": { "en": "PENDING", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    },
    {
      "pageNumber": 2,
      "pageTitle": "Más que un anuncio / Leonix house ad",
      "pageType": "house_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-leonix-house-ad-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM",
      "translationStatus": { "en": "PROOF_APPROVED_WITH_MINOR_POLISH_NOTES", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "chuyDecision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    },
    {
      "pageNumber": 3,
      "pageTitle": "Cali Bear Tacos full-page ad",
      "pageType": "client_restaurant_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-calibear-tacos-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "HIGH",
      "translationStatus": { "en": "PROOF_APPROVED_WITH_MINOR_POLISH_NOTES", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "chuyDecision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    },
    {
      "pageNumber": 4,
      "pageTitle": "Elevated Barber full-page ad",
      "pageType": "client_service_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-elevated-barber-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "HIGH",
      "translationStatus": { "en": "PROOF_APPROVED_WITH_MINOR_POLISH_NOTES", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "chuyDecision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    },
    {
      "pageNumber": 5,
      "pageTitle": "Agenda de Agosto",
      "pageType": "agenda",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-005-agenda-de-agosto-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM_HIGH",
      "translationStatus": { "en": "PROOF_APPROVED_WITH_MINOR_POLISH_NOTES", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "chuyDecision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    },
    {
      "pageNumber": 6,
      "pageTitle": "Negocios que construyen comunidad",
      "pageType": "editorial_business",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-006-negocios-comunidad-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "MEDIUM",
      "translationStatus": { "en": "PROOF_APPROVED_WITH_MINOR_POLISH_NOTES", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "chuyDecision": { "en": "APPROVED_FOR_DIGITAL_PROOF_WITH_MINOR_POLISH_NOTES", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    },
    { "pageNumber": 7, "pageTitle": "Receta de la comunidad", "pageType": "community_recipe", "sourcePath": null, "sourceFormat": null, "riskLevel": "UNKNOWN", "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" }, "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "chuyDecision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" }, "finalPolishStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" } },
    { "pageNumber": 8, "pageTitle": "Familia y bienestar", "pageType": "family_wellness", "sourcePath": null, "sourceFormat": null, "riskLevel": "UNKNOWN", "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" }, "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "chuyDecision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" }, "finalPolishStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" } },
    { "pageNumber": 9, "pageTitle": "Finanzas y negocio", "pageType": "finance_business", "sourcePath": null, "sourceFormat": null, "riskLevel": "UNKNOWN", "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" }, "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "chuyDecision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" }, "finalPolishStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" } },
    { "pageNumber": 10, "pageTitle": "Cultura que nos une", "pageType": "culture", "sourcePath": null, "sourceFormat": null, "riskLevel": "UNKNOWN", "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" }, "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "chuyDecision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" }, "finalPolishStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" } },
    { "pageNumber": 11, "pageTitle": "Recursos que ayudan", "pageType": "resources", "sourcePath": null, "sourceFormat": null, "riskLevel": "UNKNOWN", "translationStatus": { "en": "BLOCKED_SOURCE_MISSING", "pt": "BLOCKED_SOURCE_MISSING", "tl": "BLOCKED_SOURCE_MISSING" }, "qaUrlStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "chuyDecision": { "en": "PENDING_SOURCE", "pt": "PENDING_SOURCE", "tl": "PENDING_SOURCE" }, "finalPolishStatus": { "en": "BLOCKED", "pt": "BLOCKED", "tl": "BLOCKED" }, "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" } },
    {
      "pageNumber": 12,
      "pageTitle": "Sé parte del movimiento Leonix",
      "pageType": "back_cover_house_ad",
      "sourcePath": "design-references/magazine/2026-august/01-master-samples/august-2026-012-back-cover-master-sample.png",
      "sourceFormat": "png",
      "riskLevel": "HIGH",
      "translationStatus": { "en": "PROOF_VALIDATED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "qaUrlStatus": { "en": "CREATED", "pt": "NOT_CREATED", "tl": "NOT_CREATED" },
      "chuyDecision": { "en": "TRANSLATION_WORKED_ENOUGH_FOR_DIGITAL_PROOF", "pt": "PENDING", "tl": "PENDING" },
      "finalPolishStatus": { "en": "NOT_STARTED", "pt": "NOT_STARTED", "tl": "NOT_STARTED" },
      "publicLaunchStatus": { "en": "NOT_READY", "pt": "NOT_READY", "tl": "NOT_READY" }
    }
  ]
}
```

---

## Pipeline Stages

| Stage | Purpose | Inputs | Outputs | Gate Decision | TRUE Before Next Stage |
|-------|---------|--------|---------|---------------|------------------------|
| 1. Source inventory | Confirm every page source exists and is usable | Master samples, full PDF, source folders | Page inventory | Continue / hold for missing pages | All required pages listed with source status |
| 2. Manifest creation | Lock issue/language/page metadata | Source inventory, language scope | `august-2026-issue-manifest.json` | Manifest approved / revise | Page count, source paths, languages, and risk levels complete |
| 3. Input preparation | Create provider-ready local inputs | Manifest, PNGs/PDF | Local one-page PDFs or split PDFs | Inputs ready / fix inputs | Inputs exist, size limits checked, hashes recorded |
| 4. Per-language provider proof generation | Generate one language proof at controlled cost | Approved inputs, provider config, target language | Local proof PDFs/status files | Proof success / fail / retry hold | Planned call count honored and outputs local |
| 5. Local proof output | Verify provider outputs before web exposure | Provider outputs | Local proof folder + metadata | Promote to QA URL / hold | All expected files exist and failures documented |
| 6. Temporary web QA URL generation | Create Chuy/reviewer visual QA surfaces | Local proofs, source references | Noindexed QA URLs/assets | QA ready / hold | URLs are temporary, isolated, and not launch pages |
| 7. Chuy/reviewer QA decision | Record page/language decision | QA URLs, reviewer notes | Decision record | Approve / fix / rebuild / hold | Every page has a decision for that language |
| 8. Editorial/design polish | Convert proof into brand-ready public copy | Approved proofs, notes | Polished translated pages | Ready for final assembly / fix | Typography, line breaks, names, CTAs, contacts reviewed |
| 9. Final digital edition assembly | Build full translated issue | Polished pages, manifest | Final digital language edition | Assembly approved / fix | No missing pages and no proof disclaimers remain |
| 10. Public launch wiring | Wire approved public edition | Final assets, registry plan | Public reader/hub/sitemap changes | Launch / hold | Chuy approves and public rules are satisfied |
| 11. Analytics/monitoring | Track usage and issues | Public edition, analytics plan | Monitoring signals | Monitor / iterate | Analytics and error checks are active |
| 12. Future language activation | Add new official languages responsibly | Demand, reviewer/team availability | New active language gate | Activate / keep hidden | Reviewer exists and proof plan approved |

---

## Script Architecture

Future scripts are defined here only. Do not create them in this gate.

| Script | Purpose | Allowed Inputs | Allowed Outputs | Cost Guardrails | No-Public-Launch Guardrails |
|--------|---------|----------------|-----------------|-----------------|-----------------------------|
| `scripts/magazine/create-issue-manifest.mjs` | Build initial issue manifest from source inventory | Approved issue folder, page metadata | Manifest draft under August docs | No provider calls | Docs/design references only |
| `scripts/magazine/prepare-issue-translation-inputs.mjs` | Prepare split PDFs or page-PNG-derived PDFs | Approved manifest, source PNG/PDF files | Local inputs under `.magazine-proof-output/` | Dry-run size/hash report required | No `public/` writes |
| `scripts/magazine/translate-issue-deepl.mjs` | Generate provider proof for one issue/language | Approved manifest, one target language, prepared inputs | Local proof outputs/status | One language at a time, planned calls, no unsupported language without approval, no retries without approval | Local output only |
| `scripts/magazine/create-issue-web-qa-routes.mjs` | Create temporary QA pages/assets after provider success | Local proof outputs, source references, manifest | Temporary QA URLs/assets | No provider calls | Must remain noindexed and isolated from production reader |
| `scripts/magazine/record-issue-qa-decisions.mjs` | Record Chuy/team/reviewer page and issue decisions | QA notes, manifest, decision tokens | Updated decision record/manifest | No provider calls | Cannot mark public ready without polish fields |
| `scripts/magazine/build-final-digital-language-edition.mjs` | Assemble final polished digital edition for one language | Approved polished pages, manifest | Final edition assets | No provider calls unless separate gate approves | Cannot publish/wire routes by itself |

Existing proof scripts may inform naming and patterns, but this architecture does not modify them.

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
- Raw DeepL output is proof material, not final brand copy.
- API keys, provider secrets, and env values must never be printed in docs or logs.

---

## Language-by-Language Rollout Plan

Recommended sequence:

1. English — already proofed enough to validate workflow
2. Portuguese — next official digital proof candidate
3. Tagalog / Filipino — next after reviewer alignment
4. Future languages — only after reviewer/team exists

Vietnamese and other hidden languages should not be active official languages at launch.

---

## Google Translate / Google Lens Fallback Role

- Browser Google Translate can help users translate normal website text.
- Google Lens can help users translate printed/visual pages on their phones.
- Leonix cannot force Chrome's native translation popup.
- Google fallback should be presented as "additional language help," not official Leonix translation.
- The website language fallback implementation belongs to:
  `LEONIX-LAUNCH-LANGUAGE-SCOPE-AND-GOOGLE-TRANSLATE-FALLBACK1`
- Do not mix Google fallback with official DeepL magazine proof pipeline.
- Google fallback is a bridge until Leonix has reviewers for more languages.

This gate does not implement Google fallback.

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

Decision records must identify the page, language, reviewer/owner, date, QA URL reviewed, and remaining polish notes.

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

Raw DeepL output remains a proof layer until this polish layer is complete.

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

Public launch wiring must be a separate explicit gate. This architecture gate does not change routes, readers, registries, sitemap, public assets, or homepage surfaces.

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

1. Finish this architecture doc
2. Create issue manifest gate
3. Prepare Portuguese proof plan
4. Prepare Tagalog proof plan
5. Finish pages 7-11 source/master samples
6. Build issue-level scripts
7. Create full English issue proof
8. Create full Portuguese issue proof
9. Create full Tagalog issue proof
10. Create final polish/review gate
11. Public launch gate
12. Website language scope/fallback gate

---

## Open Questions

- Do pages 7-11 exist anywhere else?
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
| English proof workflow validated | **TRUE** |
| Launch language scope locked | **TRUE** |
| Hidden future language registry documented | **TRUE** |
| Google fallback documented as helper only | **TRUE** |
| Full issue manifest strategy documented | **TRUE** |
| Full issue pipeline stages documented | **TRUE** |
| Provider cost controls documented | **TRUE** |
| Final polish layer documented | **TRUE** |
| Public launch rules documented | **TRUE** |
| Website language fallback separated | **TRUE** |
| Ready for issue manifest gate | **TRUE** |

---

## Final Decision

`AUGUST_MULTILINGUAL_DIGITAL_TRANSLATION_PIPELINE_ARCHITECTURE_DONE`

`READY FOR AUGUST-2026-ISSUE-MANIFEST-FOUNDATION1: YES`
