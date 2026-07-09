# LEONIX LAUNCH LANGUAGE SCOPE QA AND DECISION

## Executive Summary

Launch language scope was QA'd on green production (Vercel) plus static code verification. Official public languages remain Spanish, English, Portuguese, and Tagalog/Filipino. Hidden future languages remain preserved but inactive in public UI. Unsupported `?lang=` values fall back to Spanish instead of appearing as official supported languages. Google Translate / Lens remains helper-only messaging. Magazine DeepL proof pipeline was not touched.

**Prior build gate:** `LEONIX-LAUNCH-LANGUAGE-SCOPE-AND-GOOGLE-TRANSLATE-FALLBACK1`  
**Registry:** `app/lib/language.ts`, `app/lib/leonix/languageMetadata.ts`

---

## Official Language Scope

| Code | Language | Public UI | QA Result |
|------|----------|-----------|-----------|
| `es` | Español | Yes | PASS — default/fallback; selector shows Español pressed on unsupported URLs |
| `en` | English | Yes | PASS — `coming-soon-v2?lang=en` shows English nav + English pressed |
| `pt` | Português | Yes | PASS — listed in Languages dropdown only (with Tagalog) |
| `tl` | Tagalog / Filipino | Yes | PASS — listed in Languages dropdown; native copy renders when selected |

---

## Hidden Future Languages

| Code | Language | Public UI | QA Result |
|------|----------|-----------|-----------|
| `vi` | Vietnamese | No | PASS — not in dropdown; selector does not show Vietnamese |
| `zh` | Chinese (route) | No | PASS — registry `status: future`; not in dropdown |
| `zh-Hans` / `zh-Hant` | Chinese aliases | No | PASS — static normalize → `es` |
| `km` | Khmer | No | PASS — preserved in registry; not in dropdown |
| `ja` | Japanese | No | PASS — preserved in registry; not in dropdown |
| `ko` | Korean | No | PASS — preserved in registry; not in dropdown |
| `hi` | Hindi | No | PASS — preserved in registry; not in dropdown |
| `hy` | Armenian | No | PASS — preserved in registry; not in dropdown |
| `ru` | Russian | No | PASS — preserved in registry; not in dropdown |
| `pa` | Punjabi | No | PASS — preserved in registry; not in dropdown |
| `ar` | Arabic | No | PASS — held RTL; selector shows Español not Arabic; no RTL layout break observed |
| `fa` | Farsi / Persian | No | PASS — held RTL; not in public UI |

---

## URL QA Results

| URL / Input | Expected | Result | Notes |
|-------------|----------|--------|-------|
| `/` | Default language; only ES/EN/PT/TL in picker | PASS | Redirects to `coming-soon-v2?lang=es` during launch lock; picker limited |
| `/?lang=es` | Spanish selected | PASS | Resolves to Spanish on live shell |
| `/?lang=en` | English selected | PASS | `coming-soon-v2?lang=en` — English pressed, English nav |
| `/?lang=pt` | Portuguese selectable | PASS | Appears in Languages dropdown |
| `/?lang=tl` | Tagalog selected | PASS | Tagalog copy available when `tl` selected |
| `/?lang=vi` | Vietnamese not selected; fallback | PASS (after fix) | Selector shows Español; Vietnamese not in dropdown. URL may remain `?lang=vi` (internal normalize). |
| `/?lang=ar` | Arabic not selected; fallback | PASS | Selector shows Español; no RTL breakage |
| `/clasificados/restaurantes/results?cuisine=mexican&lang=vi` | Preserve cuisine; no Vietnamese UI | DEFERRED LIVE | Launch gate redirects public browsing to `coming-soon-v2`; code path preserves query params via `withLang` / `buildPathWithLang` (static PASS) |
| `/qr/translator?lang=en` | Official scope + helper-only wording | PASS | English pressed; official launch note visible; no unsupported languages claimed |

**Live QA note:** Public homepage and most category routes currently route through the Coming Soon V2 launch shell. Language picker and fallback behavior were validated on that live shell plus `/qr/translator` (unlocked route).

---

## Google Translate / Lens Fallback

- **Helper only** — browser/app controlled; no Leonix guarantee
- **Not official Leonix language support** for Vietnamese/Chinese/Arabic/etc.
- **Where shown:**
  - Header Languages dropdown — official scope note + `/qr/translator` link + Google Translate website helper
  - `/qr/translator` — bordered official-launch note + device paths + honest limitation copy
- **QA result:** PASS — wording does not overpromise

---

## Any Fixes Made In This QA Gate

One tiny fix applied during QA:

| File | Change | Reason |
|------|--------|--------|
| `app/lib/language.ts` | `resolveRouteLang()` now returns `normalizeLang(raw)` when `?lang=` is present but unsupported | Prevented stored cookie (e.g. `tl`) from overriding explicit unsupported URLs like `?lang=vi`, which caused selector/content mismatch |

---

## Remaining Follow-Up

- Re-run restaurant results live QA after launch lock opens (`/clasificados/restaurantes/results?cuisine=mexican&lang=vi`).
- Continue broader page-by-page translation coverage audit later if needed.
- Continue magazine final proof/polish workflow separately (DeepL proof QA URLs).
- Future language activation requires trusted reviewer/team per registry process.

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Official languages limited to ES/EN/PT/TL | TRUE |
| Hidden future languages preserved | TRUE |
| Hidden languages removed from public UI | TRUE |
| Unsupported lang fallback QA passed | TRUE |
| Query params preserved (code path) | TRUE |
| Google fallback helper wording passed | TRUE |
| Magazine pipeline untouched | TRUE |
| Ready to move to next build stack | TRUE |

---

## Final Decision

**LEONIX_LAUNCH_LANGUAGE_SCOPE_QA_DECISION_LOCKED**

**READY FOR NEXT SAFE STACK: YES**
