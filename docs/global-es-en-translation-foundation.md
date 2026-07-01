# Global ES/EN Translation Foundation

Status: `GLOBAL-ES-EN-TRANSLATION-FOUNDATION1`

Leonix launch base languages are **Spanish (`es`)** and **English (`en`)**. Other active public languages remain routed but are not falsely marked complete in this gate.

---

## Product Doctrine

| Concept | Rule |
|---------|------|
| **Viewer UI language** | Follows route `?lang=` (`viewerLanguage`) |
| **Source content language** | Seller-entered ad/business content stays in the language the seller wrote |
| **UI chrome** | Labels, placeholders, buttons, validation, preview/publish chrome, dashboard chrome, empty states |
| **Never auto-translate** | Ad title, description, business name, phone, email, URL, address, price, coupon codes |

Future translated ad **views** require a separate source-language/translation architecture (`SOURCE-LANGUAGE-ADS-FOUNDATION1`). This gate does **not** create `ad_translations`, `listing_translations`, or provider calls.

---

## Architecture

| Layer | Module | Role |
|-------|--------|------|
| Route language | `app/lib/language.ts` — `normalizeLang`, `resolveRouteLang`, `navCopyLang` | 13-language routing preserved; ES/EN base for chrome |
| Dashboard chrome | `app/(site)/dashboard/lib/dashboardI18n.ts` | Shell, Mis anuncios list, listing workspace copy |
| Dashboard actions | `app/(site)/dashboard/lib/dashboardMisAnunciosCategoryTools.ts` | Category/listing CTA labels |
| Clasificados UI chrome | `app/lib/clasificados/clasificadosUiChromeCopy.ts` | Shared preview/publish/form field labels |
| Preview shell | `app/clasificados/lib/preview/LeonixPreviewPageShell.tsx` | Optional `lang` → back-to-edit label |
| Public engagement | `LeonixSaveButton`, `LeonixShareButton`, `LeonixEngagementBar` | Already ES/EN via `lang` prop |

---

## Fixes in This Gate

| Area | Change |
|------|--------|
| Dashboard shell | Spanish nav/sidebar labels when `lang=es` |
| Mis anuncios list | Fixed inverted ternary — Spanish route was showing English chrome |
| Mis anuncios detail | Full ES/EN workspace copy via `misAnunciosDetailCopy` |
| Category tools | All CTA label helpers now branch on `lang` |
| RE manage card | View public / edit / pause / restore / archive labels |
| Preview shell | `lang` prop for shared back-to-edit label |

---

## Remaining Holds (Not Falsely Complete)

| Area | Next gate |
|------|-----------|
| Full 13-language category landings | `PUBLIC-WEBSITE-13LANG-EXPANSION1` |
| Per-category application form deep copy | Category-specific lang gates |
| Publish wizard operational steps | `PUBLISH-LANG1` |
| Dynamic seller content translation | `SOURCE-LANGUAGE-ADS-FOUNDATION1` |
| PT/VI community copy partials | Existing registries preserved — not regressed |

---

## Native-Language Ads Doctrine

Sellers may write ads in their native language. The platform UI follows the viewer/seller app `lang`. Listing title, description, business names, and contact values render exactly as stored. Translated ad views are a future layer with cache/QA rules — not part of this gate.

---

## Safety

- No `/api/translate-ad` changes
- No Supabase migrations
- No new translation tables
- No DeepL/Google calls
- Seller content untouched

---

## Next Gates

1. `PUBLIC-WEBSITE-13LANG-EXPANSION1` — expand beyond ES/EN base using copy registry pattern
2. `SOURCE-LANGUAGE-ADS-FOUNDATION1` — source-language display + future translated ad views
3. `PUBLISH-LANG1` — deep publish wizard operational copy
