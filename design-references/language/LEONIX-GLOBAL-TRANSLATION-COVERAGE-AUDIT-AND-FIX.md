# LEONIX GLOBAL TRANSLATION COVERAGE AUDIT AND FIX

Gate: `LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX1`
Date: 2026-07-09
Owner: Coach (architect / PM) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`LEONIX-LAUNCH-LANGUAGE-SCOPE-QA-AND-DECISION.md`](LEONIX-LAUNCH-LANGUAGE-SCOPE-QA-AND-DECISION.md)

---

## Executive Summary

Official public languages remain ES / EN / PT / TL. Unsupported languages remain hidden. This gate focused on fixing hardcoded website UI text and half-translated public pages in high-priority Clasificados surfaces. Spanish/English are priority-complete on Restaurantes results/landing. Portuguese/Tagalog route as official languages but UI chrome falls back to English via `navCopyLang` until dedicated PT/TL dictionaries exist. Google Translate/Lens remains helper-only. User-generated listing content was not translated.

---

## Files / Areas Audited

| Area | Files/Components | Issue Found | Action |
|------|------------------|-------------|--------|
| Language registry | `app/lib/language.ts`, `clasificadosPublishLang.ts` | PT/TL route lang not mapped to UI copy | Used existing `navCopyLang` + `resolveClasificadosPublishLang` |
| Restaurantes discovery | `restaurantesDiscoveryContract.ts` | `?lang=` parsed as en-only check | Fixed with `normalizeLang` + `navCopyLang`; URL preserves full route lang |
| Restaurantes results | `RestaurantesResultsShell.tsx` | Taxonomy filters/chips always Spanish; inventory banner Spanish-only | ES/EN taxonomy labels + bilingual banner prefixes |
| Restaurantes taxonomy | `restauranteTaxonomy.ts`, `restaurantesTaxonomyUiLabels.ts` | `labelFor*` returned Spanish only | Added EN UI label maps; lang-aware helpers |
| Restaurantes landing | `RestaurantesLandingPage.tsx` | Binary `lang===en` URL parse | Uses `resolveClasificadosPublishLang` + `routeLang` in hrefs |
| Shared chrome copy | `clasificadosUiChromeCopy.ts` | Missing common category strings | Added `clasificadosCategoryChromeCopy` ES/EN keys |
| Category standard V2 | `categoryStandardV2/*` | Inline ES/EN only (no PT/TL) | Documented; acceptable fallback via copy lang |
| Coming soon / header / QR | Prior gates | Already scoped | No change required this gate |
| Listing cards | `RestaurantePublishedListingCard.tsx` | URL lang conflated with copy lang | Added `routeLang` for href building |

---

## Translation Coverage Fixed

| Area | ES | EN | PT | TL | Notes |
|------|----|----|----|----|-------|
| Restaurantes results shell | Complete | Complete | Fallback EN chrome | Fallback EN chrome | Route `?lang=pt` preserved; UI uses English via `navCopyLang` |
| Restaurantes landing | Complete | Complete | Fallback EN chrome | Fallback EN chrome | Same pattern |
| Filter taxonomy labels | Complete | Complete | EN fallback | EN fallback | Cuisine/business/price/highlight/diet/spoken |
| Empty states / CTAs (Restaurantes) | Complete | Complete | EN fallback | EN fallback | Existing `t` object already bilingual |
| Inventory status banner | Complete | Complete | EN fallback | EN fallback | Prefix strings added |
| Shared category chrome dictionary | Complete | Complete | Not added | Not added | PT/TL deferred — honest gap |
| User listing content | N/A | N/A | N/A | N/A | Intentionally not translated |

---

## Hardcoded Strings Removed / Covered

- Restaurantes cuisine filter options (`labelEs` only → `labelForCuisine(key, lang)`)
- Business type, price level, highlight filter options
- Diet filter options (Vegano/Sin gluten → bilingual)
- Spoken-language filter checkboxes
- Active filter chips (cuisine, biz, price, diet, hl, spoken)
- Inventory banner prefixes (`Inventario no disponible` / `Error al cargar listados`)
- URL lang parsing (`sp.get("lang")==="en"` → `normalizeLang` + `navCopyLang`)
- `buildRestaurantesResultsHref` now preserves official route lang (`pt`, `tl`, etc.)

---

## Remaining Translation Gaps

See [`LEONIX-GLOBAL-TRANSLATION-GAPS-REGISTER.md`](LEONIX-GLOBAL-TRANSLATION-GAPS-REGISTER.md).

High-level:
- Other category results pages (autos, servicios, empleos, etc.) — not audited in this gate
- Dedicated Portuguese/Tagalog UI dictionaries — not created; EN fallback used
- `categoryStandardV2` shared components — inline ES/EN only
- Dashboard/admin surfaces — out of scope

---

## Unsupported Language Behavior

| Input | Behavior |
|-------|----------|
| `?lang=vi` | `normalizeLang` → `es`; Vietnamese not shown in picker |
| `?lang=ar` | `normalizeLang` → `es`; Arabic not shown; no RTL official mode |
| `?lang=zh-Hans` | Normalizes to `es` fallback |
| Hidden languages | Not in public picker; registry preserved in `language.ts` |
| Query params | Non-lang params preserved via `buildRestaurantesResultsHref` / `withLang` |

---

## Google Translate / Lens Fallback

- Helper only — browser-controlled, no guarantee
- Not official Leonix language support
- Appears in header language dropdown + `/qr/translator`
- Unchanged this gate; wording remains honest per prior language-scope lock

---

## QA Checklist

| URL | Expected | Status |
|-----|----------|--------|
| `/` | ES default; picker ES/EN/PT/TL | Deferred live (coming-soon shell) |
| `/?lang=es` | Spanish UI | Code-verified |
| `/?lang=en` | English UI | Code-verified |
| `/?lang=pt` | PT route; EN UI chrome fallback | Code-verified |
| `/?lang=tl` | TL route; EN UI chrome fallback | Code-verified |
| `/?lang=vi` | Fallback ES; VI not selected | Code-verified (prior gate + `normalizeLang`) |
| `/qr/translator?lang=en` | Official scope + helper wording | Prior gate PASS |
| `/clasificados/restaurantes/results?cuisine=mexican&lang=es` | Spanish UI + filters | Code-verified |
| `/clasificados/restaurantes/results?cuisine=mexican&lang=en` | English UI + filters | Code-verified |
| `/clasificados/restaurantes/results?cuisine=mexican&lang=vi` | ES/EN fallback; cuisine preserved | Code-verified |

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Official languages preserved | TRUE |
| Hidden languages preserved/inactive | TRUE |
| Hardcoded public UI strings audited | TRUE |
| Spanish/English public UI coverage improved | TRUE |
| Portuguese/Tagalog handled safely | TRUE |
| Google fallback helper preserved | TRUE |
| Unsupported lang fallback preserved | TRUE |
| No magazine proof files touched | TRUE |
| Ready for route QA | TRUE |

---

## Final Decision

**LEONIX_GLOBAL_TRANSLATION_COVERAGE_AUDIT_AND_FIX_DONE**

**READY FOR GLOBAL TRANSLATION ROUTE QA: YES**
