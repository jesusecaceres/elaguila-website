# LEONIX-I18N-RENTAS-FULL-APPLICATION-COVERAGE2

## Executive Summary

This gate extends the existing `?lang=` i18n foundation (LEONIX-I18N-ENFORCEMENT-ON-CURRENT-FOUNDATION1) so the full Rentas private publish application renders Leonix-controlled UI chrome in **es / en / pt / tl**.

Prior full-page QA had found English Spanish leaks (media, contact, residential highlights), incomplete Portuguese (core form only), and Tagalog incorrectly receiving Portuguese/Spanish because of ES/EN binary collapse (`legacyCopyLang` / `lang === "en" ? … : Spanish`).

Work in this gate: expanded `rentas.*` dictionaries (form + new extras module merged into the single dictionary root), OfficialLocale wiring through the privado application tree, expanded AST audit scope to 18 approved files, and verification that `npm run i18n:check` passes with **0 blockers**.

## Previous Foundation Preserved

- Query-string architecture `?lang=es|en|pt|tl` unchanged (no `/[locale]`, no middleware, no route prefixes).
- Official locale registry ES/EN/PT/TL with Spanish fallback for unknown/hidden langs.
- Single TypeScript dictionary root (`launchUiDictionaries.ts`) — extras live in `rentasLaunchUiExtras.ts` and merge into `rentas`.
- Dictionary verifier + scoped AST audit (expanded, not replaced).
- Server-resolved locale handoff into `RentasPrivadoApplication` / `RentasPrivadoForm`.
- No global client i18n provider.
- No database / auth / Stripe / pricing / publish-behavior changes.

## Full Rentas Component Map

| File | Component/section | Current locale behavior | Leak type (pre-fix) | Edit allowed |
| --- | --- | --- | --- | --- |
| `…/privado/page.tsx` | Route entry | `resolveLocale` → `initialLocale` | none after foundation | yes |
| `…/publicar/rentas/privado/page.tsx` | Alias entry | same handoff | none | yes |
| `RentasPrivadoApplication.tsx` | Shell | passes OfficialLocale | none | yes |
| `RentasPrivadoForm.tsx` | Page/actions/promo/publisher/category/media/contact/residential/highlights/review/draft | was binary ES/EN + hardcoded Spanish | binary + hardcoded | yes |
| `RentasPrivadoPublishShell.tsx` | Publish chrome | in audit scope | chrome | yes if leak |
| `RentasAnuncioFormSection.tsx` + `rentasAnuncioFormCopy.ts` | Listing basics / conditions / pricing / location | dictionary form | mostly covered; plazo labels | yes |
| `RentasShowingTourSection.tsx` | Showings/tours | was ES/EN or Spanish | binary/hardcoded | yes |
| `RentasTipoFlowDetailFields.tsx` | Commercial/land tipo fields | Spanish option chrome | hardcoded labels | yes |
| `Gate12cContactChannelsFields.tsx` | Contact channels | shared; OfficialLocale | ES/EN binary | yes (shared, Rentas-rendered) |
| `ListingRulesConfirmationSection.tsx` | Confirmations | shared; OfficialLocale + dict titles | Spanish title literals / binary | yes |
| `LeonixRealEstateSortablePhotoStrip.tsx` | Photo strip labels | optional locale labels | Spanish defaults | yes |
| `RestauranteSortableMediaTile.tsx` | Tile order/remove labels | optional labels for strip | Spanish defaults | yes (shared tile used by strip) |
| `rentasPublishFormHelpers.ts` / taxonomy / constants | Helpers | non-UI or stable values | N/A | audit only unless UI leak |
| `launchUiDictionaries.ts` + `rentasLaunchUiExtras.ts` | Dictionary | ES/EN/PT/TL | incomplete extras | yes |
| `language.ts` | Registry/helpers | official locales | N/A | audit only |

**STACK 2 EXIT (evidence):** FULL RENTAS PRIVATE COMPONENT TREE IDENTIFIED: YES · ALL ES/EN-ONLY COPY TYPES IDENTIFIED: YES · ALL HARDCODED SECTIONS IDENTIFIED: YES · SAFE TO CONTINUE: YES

## Files Inspected

Entry pages, privado application/form, shared Rentas sections, Gate12c, ListingRules confirmation, photo strip/tile, i18n modules, `scripts/i18n-ast-audit.ts`, verifier scripts, `app/lib/language.ts`.

## Files Changed

| File | Change | Why in scope |
| --- | --- | --- |
| `app/lib/i18n/rentasLaunchUiExtras.ts` | New extras schema + ES/EN/PT/TL copy (page, actions, promo, publisher, category, media, contact, showings, residential, highlights, confirmations, review, draft, tipoFlow, commercial/land labels, etc.) | Dictionary expansion |
| `app/lib/i18n/launchUiDictionaries.ts` | Merge extras; PT accents; TL Tagalog form/services; ES orthography fixes | Single dictionary root |
| `RentasPrivadoForm.tsx` | `getLaunchUiMessages(lang).rentas`; remove ES/EN UI ternaries | Full chrome coverage |
| `RentasAnuncioFormSection.tsx` | Plazo / related labels from dictionary | Form parity |
| `RentasShowingTourSection.tsx` | OfficialLocale + showings dict | Showings |
| `RentasTipoFlowDetailFields.tsx` | Localized tipo/commercial/land UI labels | Residential/commercial/land chrome |
| `Gate12cContactChannelsFields.tsx` | OfficialLocale channel copy | Contact |
| `ListingRulesConfirmationSection.tsx` | Dict-backed titles; OfficialLocale; dialog lang map without binary ternary | Confirmations |
| `LeonixRealEstateSortablePhotoStrip.tsx` | Optional localized strip labels | Media |
| `RestauranteSortableMediaTile.tsx` | Optional order/remove labels | Media tile used by strip |
| `scripts/i18n-ast-audit.ts` | Expanded approved scope (18 files); confirmed blocker strings; remove PrivadoForm baseline exception | Audit expansion |

Unrelated dirty tree (Autos gallery audits, BienesPrivadoForm, `package.json` autos script, `.next`, etc.) was **not** modified for this gate and must not be staged with it.

## Dictionary Expansion

Coverage under `rentas.*` includes equivalents of: page, actions, promo, publisher, category, listing/form, conditions, pricing, availability, services, location, showings, media, contact, residential, highlights, confirmations, review, draft, errors/empty helpers, photoStrip, plazo, condition, listingStatus, tipoFlow, commercial/land type/subtype/highlight maps.

No second dictionary root. No duplicate semantic keys intentionally introduced.

## Locale Wiring Fix

- **Source of truth:** route resolves locale once; `RentasPrivadoForm` receives `initialLocale: OfficialLocale`.
- **PT:** `getLaunchUiMessages("pt")` → Portuguese dictionary (form + extras), not English shell / Spanish core fallback for official keys.
- **TL:** `getLaunchUiMessages("tl")` → Tagalog extras + Tagalog form/services (not PT, not ES fallback for official keys).
- **Removed** Rentas privado UI binary `lang === "en"` / `legacyCopyLang` collapse on the private application path.
- **No** global provider; **no** route migration.

Marketplace **rules dialog** body still uses es/en dialog chrome via map `{ en:"en", es/pt/tl:"es" }` (section titles/checkboxes are fully localized for all four). Documented intentionally; full dialog i18n is out of this gate’s confirmations checkboxes title work.

## English Coverage

Media, contact, residential type/subtype, highlights, confirmations, review/draft chrome wired to EN dictionary strings. Confirmed Spanish UI phrase blockers are dictionary-backed and no longer hardcoded in privado form JSX.

## Portuguese Coverage

Full privado chrome + form strings use Brazilian Portuguese with accents (Título, você, prévia, Condições, Depósito, Serviços, Água, etc.). Incomplete “central section only” state addressed by extras + form wiring.

## Tagalog Coverage

`tl` dictionary is modern Tagalog/Filipino with natural digital loanwords (Mag-post, I-preview, Address, Parking, etc.). Does not reuse Portuguese strings for official keys.

## Spanish Quality Corrections

Targeted orthography only (e.g. Título, números, Depósito, Descripción-style keys in rentas form/extra paths). No broad style rewrite.

## User-Content Protection

No `t(locale, userField)` patterns introduced. User-entered titles, descriptions, addresses, custom services/requirements, social URLs remain raw field values.

## Audit Scope Expansion

Approved scope expanded to the full Rentas privado map (18 files listed in `scripts/i18n-ast-audit.ts`). Parser failures in scope are blockers. PrivadoForm baseline exception removed. Confirmed blocker phrase list includes English/Portuguese/Tagalog leak signatures from Chuy’s QA.

## Verification Results

```
npm run i18n:verify-dictionaries  → PASS (schema parity, types, interpolation, plurals, hidden locales)
npm run i18n:audit                → Files scanned: 18; Blockers: 0; Warnings: 0; Parser failures: 0; Baseline exceptions: 0
npm run i18n:check                → PASS
```

## Typecheck/Build Result

- `npm run typecheck` fails only on **pre-existing unrelated e2e** files:
  - `e2e/autos/autos-a5-recovery-25-child-media-persistence.spec.ts`
  - `e2e/community/community-preview-publish-bar.spec.ts`
  - `e2e/community/community-preview-published-shell-parity.spec.ts`
- Filtered tsc output for rentas/i18n/ListingRules/Gate12c/PhotoStrip/ShowingTour/tipoFlow: **no edited-file errors**.
- `npm run build` **skipped**: existing dirty `.next` export tree + no requirement to churn build artifacts when i18n checks pass and edited-file typecheck is clean under scoped gate rules.

## Remaining Blockers

No known Rentas language blockers remain in the approved full-application scope.

Notes (non-blockers):

- Browser-native file input “No file chosen” remains browser-owned.
- Marketplace rules **dialog** internal body may still be es/en for pt/tl (section UI is localized).
- Final native-speaker review still recommended for PT/TL polish (not claimed as certified).

## Chuy QA Routes

- https://www.leonixmedia.com/clasificados/publicar/rentas/privado?lang=es&propiedad=residencial
- https://www.leonixmedia.com/clasificados/publicar/rentas/privado?lang=en&propiedad=residencial
- https://www.leonixmedia.com/clasificados/publicar/rentas/privado?lang=pt&propiedad=residencial
- https://www.leonixmedia.com/clasificados/publicar/rentas/privado?lang=tl&propiedad=residencial

Code ready. **Browser QA not performed in this Cursor session** — Chuy targeted browser QA required.

## TRUE/FALSE Final Inspection

| Checkpoint | Value |
| --- | --- |
| Objective completed | TRUE |
| Prior ?lang foundation preserved | TRUE |
| Full Rentas component tree covered | TRUE |
| ES/EN/PT/TL complete for approved chrome | TRUE |
| Tagalog no longer receives Portuguese | TRUE |
| Portuguese no longer Spanish/English shell for official keys | TRUE |
| English no longer Spanish chrome leaks (dict-backed) | TRUE |
| Dictionary verifier passes | TRUE |
| Expanded AST audit passes | TRUE |
| No user content translated | TRUE |
| No route migration / middleware / global provider | TRUE |
| No database/auth/payment/unrelated category edits | TRUE |
| Ready for Chuy targeted QA | TRUE |
| Ready to commit | TRUE (owner commit only when asked; not staged here) |

## Commit Decision

COMMIT DECISION: **YES** (criteria met). This gate did **not** stage, commit, or push.
