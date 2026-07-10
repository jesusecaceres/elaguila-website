# LEONIX APPLICATION TRANSLATION COVERAGE AUDIT AND FIX

Gate: `LEONIX-APPLICATION-TRANSLATION-COVERAGE-AUDIT-AND-FIX1`
Date: 2026-07-10
Owner: Coach (architect / PM) · Chuy (CEO / final QA owner) · Cursor (crew)

Prior gate: [`LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX.md`](LEONIX-GLOBAL-TRANSLATION-COVERAGE-AUDIT-AND-FIX.md)

---

## Executive Summary

Application translation coverage was audited for launch-critical classified publish flows. Official public languages remain ES / EN / PT / TL. This gate focused on application/form/preview/publish/output UI chrome — not user listing content. Spanish/English coverage improved for Restaurantes application entry, section nav, taxonomy option labels, amenities, preview shell, and publish checkpoint chrome. Portuguese/Tagalog remain official route languages with honest English UI fallback via `navCopyLang`. Remaining category application gaps are documented in [`LEONIX-APPLICATION-TRANSLATION-GAPS-REGISTER.md`](LEONIX-APPLICATION-TRANSLATION-GAPS-REGISTER.md).

---

## Translation Rules

- **UI chrome translates** — step titles, labels, placeholders, helper text, buttons, validation, preview/publish confirmations, taxonomy option labels, CTAs.
- **User listing content does not auto-translate** — business names, descriptions, menu items, contact details stay as typed.
- **Business/contact details are protected** — phone, email, URLs, addresses never overwritten.
- **Unsupported languages fallback safely** — `?lang=vi` → `normalizeLang` → ES default; hidden languages not exposed.
- **PT/TL fallback must not pretend full translation** — route `?lang=pt|tl` preserved; UI copy uses EN via `navCopyLang` until dedicated dictionaries exist.

---

## Files / Areas Audited

| Area | Files/Components | Issue Found | Action |
|------|------------------|-------------|--------|
| Publish lang resolver | `clasificadosPublishLang.ts`, `language.ts` | Already present from global gate | Reused |
| Shared UI chrome | `clasificadosUiChromeCopy.ts` | Preview/publish optional label | Reused `clasificadosPreviewPublishCopy` |
| Restaurantes application | `RestauranteApplicationClient.tsx` | Binary `?lang=en`; `labelEs` taxonomy; Spanish preview gate; hardcoded `DAY_ROWS` | Fixed resolver, taxonomy labels, day rows, preview gate, delete confirm, amenities lang |
| Application UI copy | `restauranteApplicationUiCopy.ts` (new) | No centralized application copy | Added section/day/event/service/preview copy helpers |
| Section nav model | `restauranteApplicationSectionModel.ts` | Spanish-only short titles | `buildRestauranteApplicationSectionNavItems(draft, lang)` |
| Section nav UI | `RestauranteApplicationSectionNav.tsx` | Spanish aria labels | Lang-aware `restauranteApplicationNavCopy` |
| Amenities block | `RestauranteAmenitiesFormBlock.tsx` | `labelEs` only; dual ES/EN titles | Lang prop; single-language group/item labels |
| Restaurantes preview | `RestaurantePreviewClient.tsx` | `lang="es"` hardcoded on shell; binary lang; Spanish loading/empty | `resolveClasificadosPublishLang`, `restaurantePreviewShellCopy`, `restaurantePreviewPageCopy` |
| Restaurantes taxonomy | `restauranteTaxonomy.ts`, `restaurantesTaxonomyUiLabels.ts` | Prior global gate fix | Reused `labelFor*` in application |
| Other categories | Autos, Servicios, Empleos, BR, Rentas, En Venta, Comunidad, Clases | Binary lang patterns widespread | Gap register only — no blind fixes |

---

## Fixes Made

| Area | ES | EN | PT | TL | Notes |
|------|----|----|----|----|-------|
| Restaurantes application lang resolution | Complete | Complete | Route preserved; EN chrome | Route preserved; EN chrome | `resolveClasificadosPublishLang` |
| Section nav short titles | Complete | Complete | EN fallback | EN fallback | `restauranteSectionShortTitle` |
| Taxonomy selects/chips (cuisine, biz, price, lang, highlights, services) | Complete | Complete | EN fallback | EN fallback | `labelFor*` + `restauranteFormServiceOptionLabel` |
| Day-of-week schedule labels | Complete | Complete | EN fallback | EN fallback | `restauranteDayLabel` |
| Amenities form | Complete | Complete | EN fallback | EN fallback | `labelEn` from catalog |
| Preview gate / delete confirm | Complete | Complete | EN fallback | EN fallback | `restaurantePreviewGateCopy` |
| Preview shell (loading/empty) | Complete | Complete | EN fallback | EN fallback | `restaurantePreviewShellCopy` |
| Preview page chrome (sections, session help, checkout) | Complete | Complete | EN fallback | EN fallback | `restaurantePreviewPageCopy` |
| Preview/edit hrefs | Complete | Complete | Route lang in URL | Route lang in URL | `withClasificadosPublishLang` |
| Application section body paragraphs | Partial | Partial | EN fallback | EN fallback | Many inline Spanish helpers remain — see gaps |
| User listing content | N/A | N/A | N/A | N/A | Untouched |

---

## Restaurantes Application Result

- **Application labels:** Entry chrome, nav, taxonomy options, amenities, schedule days, preview gate, and primary CTAs follow `copyLang` (ES/EN).
- **Taxonomy labels:** `labelForCuisine`, `labelForBusinessType`, `labelForPriceLevel`, `labelForLanguage`, `labelForHighlight`, service modes via `restauranteFormServiceOptionLabel`.
- **Preview labels:** Loading, empty state, card/full preview section titles, session help, checkout section — bilingual via `restaurantePreviewPageCopy`.
- **Publish/output labels:** Preview shell passes `lang` to `RestaurantesShellChrome`; ad story preview already accepts `lang`.
- **CTA/contact labels:** Back to edit, continue to payment, preview buttons use ES/EN ternaries or shared copy.
- **Fallback behavior:** `?lang=pt|tl` preserves route; UI uses EN. `?lang=vi` falls back to ES.
- **User content preservation:** Draft fields (name, description, contact, menu) unchanged.
- **Residual:** Deep section helper paragraphs and some field labels (e.g. `Cocina principal`, contact block) still Spanish-only — logged in gap register.

---

## Remaining Gaps

See [`LEONIX-APPLICATION-TRANSLATION-GAPS-REGISTER.md`](LEONIX-APPLICATION-TRANSLATION-GAPS-REGISTER.md).

- Restaurantes: section body/helper paragraph ES-only strings
- Autos, Servicios, Empleos, Bienes Raíces, Rentas, En Venta, Comunidad, Clases: binary lang patterns
- Dedicated PT/TL application dictionaries: not created (honest EN fallback)

---

## QA Checklist

- [ ] Restaurantes application `?lang=es`
- [ ] Restaurantes application `?lang=en`
- [ ] Restaurantes application `?lang=pt` (EN chrome, route preserved)
- [ ] Restaurantes application `?lang=tl` (EN chrome, route preserved)
- [ ] Restaurantes application `?lang=vi` (safe ES fallback)
- [ ] Preview in ES
- [ ] Preview in EN
- [ ] Publish confirmation in ES
- [ ] Publish confirmation in EN
- [ ] Public output/card/detail in ES
- [ ] Public output/card/detail in EN

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Application translation audit completed | TRUE |
| ES/EN application UI improved | TRUE |
| User-generated content untouched | TRUE |
| Business/contact info protected | TRUE |
| PT/TL handled honestly | TRUE |
| Unsupported language fallback preserved | TRUE |
| Gap register created | TRUE |
| Ready for application translation route QA | YES |

---

## Final Decision

`LEONIX_APPLICATION_TRANSLATION_COVERAGE_AUDIT_AND_FIX_DONE`

**Final line:** `READY FOR APPLICATION TRANSLATION ROUTE QA: YES`
