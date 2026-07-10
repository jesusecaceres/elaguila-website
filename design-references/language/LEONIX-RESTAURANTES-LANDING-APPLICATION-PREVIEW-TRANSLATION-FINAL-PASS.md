# LEONIX RESTAURANTES LANDING APPLICATION PREVIEW TRANSLATION FINAL PASS

Gate: `LEONIX-RESTAURANTES-LANDING-APPLICATION-PREVIEW-TRANSLATION-FINAL-PASS1`
Date: 2026-07-10
Owner: Coach (architect / PM) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`LEONIX-APPLICATION-TRANSLATION-COVERAGE-AUDIT-AND-FIX.md`](LEONIX-APPLICATION-TRANSLATION-COVERAGE-AUDIT-AND-FIX.md)

---

## Executive Summary

This gate final-passed the Restaurantes landing → application → preview → output translation coverage for launch-quality ES/EN UI chrome. Official languages remain ES / EN / PT / TL. Portuguese/Tagalog preserve route language and use honest English UI fallback via `navCopyLang`. User-generated listing content remains untouched. No DeepL or Google Translate API calls were made.

---

## Screenshot / Visual QA Intake

| Item | Value |
|------|-------|
| Uploaded zip `Landing pages(3).zip` inspected | **FALSE** — not found in workspace |
| Alternative QA assets | **9** screenshots in `qa-final-screenshots/servicios-restaurantes-application-fields-filters-search-local-business-ux-full-wire/` |
| Flow areas represented | Landing (closed/open filters, desktop/mobile), results (closed/open filters, active filter) |
| How screenshots informed audit | Confirmed landing/results filter surfaces and application field density; code audit completed remaining application section helpers |

---

## Flow Coverage Map

| Surface | Files/Components | ES | EN | PT/TL | Status |
|---------|------------------|----|----|-------|--------|
| Landing page | `RestaurantesLandingPage.tsx` | Complete | Complete | EN fallback | Verified clean |
| Landing search/chips | `LeonixCategorySearchCanvas`, discovery grids | Complete | Complete | EN fallback | Verified clean |
| Application entry/header | `RestauranteApplicationClient.tsx`, `restauranteApplicationFormCopy.ts` | Complete | Complete | EN fallback | **Fixed** |
| Section nav | `RestauranteApplicationSectionNav.tsx`, `restauranteApplicationSectionModel.ts` | Complete | Complete | EN fallback | Verified |
| Sections A–K helpers/labels | `restauranteApplicationFormCopy.ts` + client wiring | Complete | Complete | EN fallback | **Fixed** |
| Taxonomy options | `restauranteTaxonomy.ts`, `labelFor*` | Complete | Complete | EN fallback | Verified |
| Schedule/days | `restauranteDayLabel`, `fc.common.closed` | Complete | Complete | EN fallback | **Fixed** |
| Amenities | `RestauranteAmenitiesFormBlock.tsx` | Complete | Complete | EN fallback | Verified |
| External video URLs | `RestauranteExternalVideoUrlsSection.tsx` | Complete | Complete | EN fallback | **Fixed** |
| Preview shell | `RestaurantePreviewClient.tsx` | Complete | Complete | EN fallback | Verified (prior gate) |
| Preview sections/checkout | `restaurantePreviewPageCopy` | Complete | Complete | EN fallback | Verified |
| Results filters (legacy client) | `RestauranteResultsClient.tsx` | Complete | Complete | Route preserved | **Fixed** |
| Results (primary) | `RestaurantesResultsShell.tsx` | Complete | Complete | Route preserved | Prior gate |
| Public card/detail shell | `RestauranteAdStoryPreview`, `RestaurantContactHub`, etc. | Complete | Complete | EN fallback | Prior gate |

---

## Fixes Made

| Surface | Issue | Fix | User Impact |
|---------|-------|-----|-------------|
| Application form | Spanish-only section titles, labels, helpers (e.g. `Cocina principal`) | `restauranteApplicationFormCopy.ts` + full client wiring via `fc` | EN application is fully English chrome |
| Section titles | Hardcoded `A · Identidad del negocio` | `restauranteSectionHeading(letter, key, lang)` | Nav + section headers match lang |
| City autocomplete | `lang="es"` hardcoded | `lang={lang}` | City suggestions match UI language |
| Video URLs block | Spanish-only strings | `tr(lang, es, en)` + lang prop | Bilingual video section |
| Section K event sizes | Wrong `labelForCuisine` on event sizes | `restauranteEventSizeLabel` | Correct EN event size labels |
| Results filter client | `c.labelEs` in filter dropdowns | `labelFor*` helpers + `resolveClasificadosPublishLang` | Filter options translate in EN flow |

---

## Residual Hardcoded String Audit

| Search Term | Remaining Hits | Classification | Follow-Up |
|-------------|----------------|----------------|-----------|
| `labelEs` (rendered) | Taxonomy source data + `labelFor*` internals | Data source, not direct render | OK |
| `Cocina principal` | `restauranteApplicationFormCopy.ts` ES dictionary only | Dictionary ES branch | OK |
| `RESTAURANTE_CONTACT_PLACEHOLDERS` | Example URLs/phones in inputs | User-input examples, not chrome | OK |
| `previewGate` copy | `restaurantePreviewGateCopy` | Already bilingual ES/EN module | OK |
| `publicar/restaurantes/page.tsx` metadata | Spanish-only `<title>` | Server metadata; tab title not route-lang aware | Low — future metadata gate |
| Landing `lang === "en"` | `RestaurantesLandingPage.tsx` copy object | Bilingual pattern (ES/EN branches) | OK |

---

## Preview / Publish Parity

- Preview/edit links use `withClasificadosPublishLang` — route language preserved.
- Preview shell `lang={copyLang}` — chrome follows selected language.
- User draft content unchanged in preview/publish pipeline.
- Publish confirmation uses `PublishCheckoutCheckpoint` with `lang` + bilingual `restaurantePreviewPageCopy`.
- Public output shell components use `lang` prop with ES/EN branches.

---

## Translation Rules Preserved

- UI chrome translates; user listing content does not auto-translate.
- Business/contact info protected (placeholders are examples only).
- Unsupported languages fallback safely via `normalizeLang`.
- PT/TL: honest EN UI fallback; route `?lang=pt|tl` preserved in URLs.

---

## Remaining Gaps

`No known remaining visible Restaurantes landing/application/preview/output UI chrome gaps in the scoped ES/EN pass.`

Minor non-blocking: static Next.js page metadata title on `/publicar/restaurantes` is Spanish-only (browser tab); does not affect in-page UI chrome.

Other categories (Autos, Servicios, etc.) remain in Batch 2 gap register — not touched this gate.

---

## QA Checklist

- [ ] `/clasificados/restaurantes?lang=es`
- [ ] `/clasificados/restaurantes?lang=en`
- [ ] `/clasificados/restaurantes?lang=pt`
- [ ] `/clasificados/restaurantes?lang=tl`
- [ ] `/clasificados/restaurantes?lang=vi`
- [ ] `/publicar/restaurantes?lang=es` (all sections A–K + Final)
- [ ] `/publicar/restaurantes?lang=en` (all sections A–K + Final)
- [ ] `/publicar/restaurantes?lang=pt`
- [ ] `/publicar/restaurantes?lang=tl`
- [ ] `/publicar/restaurantes?lang=vi`
- [ ] `/clasificados/restaurantes/preview?lang=es`
- [ ] `/clasificados/restaurantes/preview?lang=en`
- [ ] Edit/return-to-edit language preservation
- [ ] Publish confirmation ES/EN
- [ ] Public card/detail ES/EN

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Landing audited | TRUE |
| Application audited | TRUE |
| Every application section audited | TRUE |
| Preview audited | TRUE |
| Publish/output chrome audited | TRUE |
| ES/EN UI coverage fixed | TRUE |
| PT/TL fallback honest | TRUE |
| User content untouched | TRUE |
| Residual hardcoded string audit completed | TRUE |
| Ready for route QA | **YES** |

---

## Final Decision

`LEONIX_RESTAURANTES_TRANSLATION_FINAL_PASS_DONE`

**Final line:** `READY FOR RESTAURANTES LANDING APPLICATION PREVIEW ROUTE QA: YES`
