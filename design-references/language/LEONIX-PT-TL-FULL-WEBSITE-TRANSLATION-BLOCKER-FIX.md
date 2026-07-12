# LEONIX PT/TL FULL WEBSITE TRANSLATION BLOCKER FIX

Gate: `LEONIX-PT-TL-FULL-WEBSITE-TRANSLATION-BLOCKER-FIX1`  
Date: 2026-07-12  
Reporter: Chuy QA screenshots (PT/TL coming-soon mixed English cards)

## Executive Summary

Chuy QA found PT/TL official language routes showing English marketplace card copy on `/coming-soon-v2` (e.g. “Local Deals”, “New category”, “Rentals”, “Private autos”). This was a **launch blocker** because PT/TL are visible in the public language selector.

This gate:
- Fixed PT/TL coming-soon-v2 marketplace card copy in dedicated language files.
- Added `launchUiCopyLang` + `getLaunchUiCopy` for four-language launch-critical dictionaries.
- Updated `navCopyLang` so PT/TL **no longer fall back to English** on legacy binary paths (they map to ES until dedicated app dictionaries land).
- Expanded PT/TL home static copy, footer, clasificados hub, and publish chooser strings.
- Allowed `/home?lang=pt|tl` when site is unlocked (was redirecting to coming-soon).

No DeepL or Google Translate API calls were made.

## Root Cause

1. **Route lang vs copy lang split** — `?lang=pt|tl` preserved route param correctly, but some surfaces used incomplete dictionaries.
2. **Coming-soon partial translation** — `pt.ts` / `tl.ts` had full page copy but `marketplace.featuredCard` and some TL category cards were left in English from an EN template paste.
3. **`navCopyLang` historical behavior** — returned `"en"` for all non-ES langs, causing silent English fallback on binary ES/EN modules.
4. **Home gate** — `/home` redirected PT/TL to coming-soon; production launch lock sends most users to coming-soon-v2 first.
5. **Why EN looked better** — EN dictionary was complete; PT/TL files were ~95% translated with English leftovers in high-visibility cards.

## Screenshot Issues Fixed

| Issue | Fix |
|-------|-----|
| PT coming-soon “Local Deals” / “New category” | `pt.ts` featuredCard → “Ofertas Locais” / “Nova categoria” + PT body |
| TL coming-soon “Local Deals” / “New category” | `tl.ts` featuredCard → “Mga Lokal na Alok” / “Bagong kategorya” + TL body |
| TL cards “Rentals”, “Private autos” | `tl.ts` → “Paupahan”, “Mga kotse (pribado)” |
| TL shell “Promotional products” | `ComingSoonV2Shell.tsx` → “Mga produktong pang-promosyon” |

## Language Readiness Decision

**`PT_TL_PUBLIC_READY_WITH_REVIEW_NOTES`**

PT/TL remain **visible** in the public selector. Launch-critical coming-soon/home/hub/footer surfaces have hand-authored PT/TL. Deep category **application** forms still use ES/EN binary dictionaries (PT/TL route preserved; UI chrome maps to ES via `navCopyLang` until per-category PT/TL app copy lands).

## Launch-Critical Surface Audit

| Surface | ES | EN | PT | TL | Status | Notes |
|---------|----|----|----|----|--------|-------|
| `/` root intro | ✅ | ✅ | ✅ | ✅ | Ready | `ROOT_INTRO_COPY` |
| `/coming-soon-v2` | ✅ | ✅ | ✅ | ✅ | **Fixed** | Dedicated `pt.ts`/`tl.ts` |
| `/home` | ✅ | ✅ | ✅ | ✅ | **Fixed** | Static `HOME_PAGE_COPY` pt/tl; CMS hero uses es/en base |
| Nav/footer | ✅ | ✅ | ✅ | ✅ | **Fixed** | `getPublicFooterCopy` |
| `/clasificados` hub | ✅ | ✅ | ✅ | ✅ | **Fixed** | `CLASIFICADOS_HUB_PAGE_COPY` |
| `/clasificados/restaurantes` landing | ✅ | ✅ | ⚠️ | ⚠️ | Partial | ES/EN complete; PT/TL → ES chrome on binary helpers |
| Category applications | ✅ | ✅ | ⚠️ | ⚠️ | Partial | ES/EN; PT/TL no EN fallback (ES chrome) |
| `/qr/translator` | ✅ | ✅ | ✅ | ✅ | Ready | Prior gate |
| Hidden `?lang=vi` | ✅ safe | — | — | — | Ready | Normalizes to ES |

## Remaining Review Notes

- Native PT reviewer: confirm “Ofertas Locais”, “Nova categoria”, and hub category labels.
- Native TL reviewer: confirm “Mga Lokal na Alok”, “Paupahan”, mixed Tagalog/English loanwords in coming-soon body copy.
- Category application deep forms (Restaurantes, Autos, BR, etc.) need dedicated PT/TL section dictionaries in a follow-up gate.
- `/home` CMS-driven hero blocks still pull ES or EN content for PT/TL until admin adds bilingual CMS fields.

## Rules Locked

- Public language buttons must have public UI coverage on launch-critical surfaces.
- No silent **English** fallback for PT/TL on those surfaces.
- Legacy binary modules: PT/TL → **ES** chrome (not EN) until 4-lang app copy exists.
- Hidden languages remain hidden; `?lang=vi` → safe ES fallback.
- Google Translate/Lens remains helper-only.
- User-generated listing content is not auto-translated.

## QA Checklist

- [ ] `/coming-soon-v2?lang=pt` — no English marketplace cards
- [ ] `/coming-soon-v2?lang=tl` — no English marketplace cards
- [ ] `/home?lang=pt` — static sections in Portuguese (when site unlocked)
- [ ] `/home?lang=tl` — static sections in Tagalog (when site unlocked)
- [ ] `/clasificados?lang=pt|tl` — hub categories in PT/TL
- [ ] `/clasificados/restaurantes?lang=pt|tl` — no obvious English chrome on landing hero
- [ ] `?lang=vi` — hidden; safe ES fallback
- [ ] Language selector shows ES/EN primary + PT/TL in More Languages only

## TRUE/FALSE

- Root cause documented: **TRUE**
- PT screenshot issue fixed: **TRUE**
- TL screenshot issue fixed: **TRUE**
- Public selector truthful: **TRUE**
- Hidden languages preserved: **TRUE**
- No provider/API call: **TRUE**
- Ready for Chuy QA: **YES**

## Final Decision

`LEONIX_PT_TL_FULL_WEBSITE_TRANSLATION_BLOCKER_FIXED`

**Final line:** `READY FOR CHUY LANGUAGE QA: YES`
