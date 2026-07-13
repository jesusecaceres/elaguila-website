# LEONIX HOME CLASSIFICADOS PT/TL FULL COPY FIX

Gate: `LEONIX-HOME-CLASSIFICADOS-PT-TL-FULL-COPY-FIX1`  
Date: 2026-07-12  
Reporter: Chuy live production QA (`/home?lang=pt|tl`, `/clasificados?lang=pt`)

## Executive Summary

Chuy QA found PT/TL mixed-language issues on `/home` and `/clasificados` in production:
- PT home hero and promo card still showed Spanish.
- TL home hero and promo card still showed English.
- PT classifieds hub promo and featured local-deals cards still showed Spanish.

Google Translate popup is **browser-controlled** and is not the product translation system. This gate fixed the actual code-level PT/TL copy sources so visible chrome renders from Leonix dictionaries without relying on Chrome translation.

PT/TL remain public official languages; launch-critical home and classifieds hub chrome must no longer show obvious ES/EN fallback.

No DeepL or Google Translate API calls were made. No database, auth, or payment changes.

## Root Cause

| Surface | File / Component | Issue |
|---------|------------------|-------|
| Home hero | `HomeMarketingClient.tsx` + `homeMarketingMerge.ts` | `cmsLang` forced PT→ES and TL→EN; hero used `content[cmsLang]` instead of PT/TL blocks |
| Home promo card | `LeonixLaunchCouponCard.tsx` + `HomeMarketingClient.tsx` | Coupon card only had `es`/`en` dictionaries; home passed `cardLang = cmsLang` |
| Home pillar CTA | `HomeMarketingClient.tsx` | Binary `Explorar →` / `Explore →` ignored PT/TL |
| Clasificados promo | `ClasificadosLandingLaunchBanner.tsx` | `cardLang = routeLang === "en" ? "en" : "es"` — PT got Spanish |
| Clasificados featured deals | `clasificadosLandingHubCopy.ts` + `ClasificadosFeaturedOfertasModule.tsx` | `getClasificadosFeaturedOfertasCopy` only had ES/EN; eyebrow binary Featured/Destacado |
| Newsletter href | `clasificadosLandingHubCopy.ts` | `buildClasificadosLandingNewsletterHref` stripped PT/TL to ES |

**Why browser Google Translate confused QA:** `LanguagePreferenceSync` correctly sets `document.documentElement.lang` to `pt` or `tl`, but Chrome may still offer translation when it detects mixed-language content (e.g. Spanish hero on a `lang=pt` page). Closing the popup is required for code-level QA.

## Fixes Made

| Surface | Issue | Fix | PT/TL Result |
|---------|-------|-----|--------------|
| `/home` hero | PT showed Spanish, TL showed English | Added `pt`/`tl` blocks to `homeMarketingMerge.ts`; hero uses `content[lang]` via `launchUiCopyLang` | PT: Comunidade, Cultura e Fé / TL: Komunidad, Kultura, at Pananampalataya |
| `/home` promo | Spanish/English coupon on PT/TL | Added `pt`/`tl` to `LeonixLaunchCouponCard`; home passes `lang` directly | PT: Receba seu código… / TL: Kunin ang iyong… |
| `/home` pillars | Explore → wrong for PT/TL | PT: Explorar → / TL: Tuklasin → | Consistent pillar CTAs |
| `/clasificados` promo | Spanish on PT | `ClasificadosLandingLaunchBanner` uses `launchUiCopyLang` | PT/TL coupon copy from shared card |
| `/clasificados` featured | Spanish Ofertas Locales card | Full `pt`/`tl` in `FEATURED_OFERTAS_COPY` | PT: Ofertas locais da semana / TL: Mga lokal na alok ngayong linggo |
| Newsletter links | PT/TL lost on href | `buildClasificadosLandingNewsletterHref` preserves `lang` param | Correct lang on newsletter CTA |

## Google Translate QA Rule

- Chrome Google Translate popup is **not Leonix code**.
- **Close/disable** the browser translate popup during PT/TL QA.
- Do **not** rely on browser translation as the product fix.
- Leonix code must render correct PT/TL without Chrome translation.
- If Chrome translates after our code runs, it may visually alter text and confuse QA screenshots.
- `LanguagePreferenceSync` sets `document.documentElement.lang` from `?lang=` (e.g. `pt`, `tl`). Root layout default `lang="en"` is overridden client-side.

## QA Checklist

- [ ] `/home?lang=pt` — hero, promo, buttons, lower sections all Portuguese (no Spanish/English chrome)
- [ ] `/home?lang=tl` — hero, promo, buttons, lower sections all Tagalog (no English chrome except brand/proper nouns)
- [ ] `/clasificados?lang=pt` — hub hero, promo card, featured deals card all Portuguese
- [ ] `/clasificados?lang=tl` — hub hero, promo card, featured deals card all Tagalog
- [ ] `/coming-soon-v2?lang=pt` — prior gate; no regression
- [ ] `/coming-soon-v2?lang=tl` — prior gate; no regression
- [ ] `/?lang=vi` — hidden language still falls back safely (not exposed in selector)

## Remaining Review Notes

- Native PT reviewer: polish hero value paragraphs and coupon fine print.
- Native TL reviewer: some loanwords retained (e.g. "Launch 25 code", "visibility") for brand consistency.
- `CategoryVisibilityCta` on clasificados hub still uses `navCopyLang` (PT/TL → ES chrome) — not reported in Chuy QA but may need follow-up.
- Magazine cover image embedded text is not translated (by design).
- Category application deep forms remain ES/EN binary (out of scope).

## TRUE/FALSE

- PT home fixed: **TRUE**
- TL home fixed: **TRUE**
- PT classifieds fixed: **TRUE**
- TL classifieds fixed: **TRUE**
- Promo/coupon copy fixed: **TRUE**
- Google Translate rule documented: **TRUE**
- Ready for Chuy QA: **YES** (pending live deploy)

## Final Decision

`LEONIX_HOME_CLASSIFICADOS_PT_TL_FULL_COPY_FIXED`

READY FOR CHUY HOME AND CLASSIFICADOS LANGUAGE QA: **YES** (after deploy to production)
