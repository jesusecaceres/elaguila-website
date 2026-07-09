# LEONIX LAUNCH LANGUAGE SCOPE AND GOOGLE TRANSLATE FALLBACK

## Executive Summary

Official launch languages for Leonix public website UI are Spanish, English, Portuguese, and Tagalog/Filipino. Unsupported languages are hidden from public selectors, not deleted. Future languages require trusted reviewers/team activation before public enablement. Browser Google Translate and Google Lens are fallback helpers only — Leonix cannot force Chrome’s native translation popup. This gate prevents half-translated unsupported-language pages from appearing as official Leonix support.

**Registry source of truth:** `app/lib/language.ts` and `app/lib/leonix/languageMetadata.ts`

---

## Official Launch Languages

| Code | Language | Public UI | Launch Supported | Notes |
|------|----------|-----------|------------------|-------|
| `es` | Español | Yes | Yes | Default fallback |
| `en` | English | Yes | Yes | Primary + nav copy fallback |
| `pt` | Português | Yes | Yes | Official launch scope |
| `tl` | Tagalog / Filipino | Yes | Yes | Route `tl`; Google target `fil` |

---

## Hidden Future Languages

| Code | Language | Public UI | Activation Requirement |
|------|----------|-----------|------------------------|
| `vi` | Vietnamese | No | Trusted Vietnamese reviewer/team |
| `zh` | Chinese (Simplified route) | No | Trusted reviewer; aliases `zh-Hans` / `zh-Hant` fallback |
| `km` | Khmer | No | Trusted reviewer/team |
| `ja` | Japanese | No | Trusted reviewer/team |
| `ko` | Korean | No | Trusted reviewer/team |
| `hi` | Hindi | No | Trusted reviewer/team |
| `hy` | Armenian | No | Trusted reviewer/team |
| `ru` | Russian | No | Trusted reviewer/team |
| `pa` | Punjabi | No | Trusted Punjabi reviewer/team |
| `ar` | Arabic | No | RTL layout gate + trusted reviewer |
| `fa` | Farsi / Persian | No | RTL layout gate + trusted reviewer |

---

## URL Language Fallback Rule

**Supported (allowed):** `es`, `en`, `pt`, `tl` (alias `fil` → `tl`)

**Unsupported (fallback to `es`):** `vi`, `ar`, `fa`, `zh`, `zh-Hans`, `zh-Hant`, `ja`, `ko`, `hi`, `hy`, `ru`, `pa`, `km`, and unknown codes

**Behavior:**
- Unsupported `?lang=` does not stay selected in UI
- `normalizeLang()` and `isSupportedLang()` enforce official launch scope
- `LanguagePreferenceSync` clears unsupported URL lang preference and sets truthful `document.documentElement.lang`
- Other query params (cuisine, search, city, zip) are preserved

**Examples:**
- `/?lang=vi` → UI uses Spanish; Vietnamese not shown as selected
- `/clasificados/restaurantes/results?cuisine=mexican&lang=vi` → cuisine preserved; lang falls back to `es`
- `/?lang=pt` → Portuguese allowed
- `/?lang=fil` → normalizes to Tagalog `tl`

---

## Google Translate / Lens Fallback Rule

- **Helper only** — not official Leonix translation support
- **No guarantee** — browser/app controlled; may open app, web, install, or search page
- **No API integration** — no Google Translate API calls from Leonix
- **No overpromise** — Leonix does not claim Vietnamese/Chinese/Arabic/etc. are officially supported UI languages
- **Where shown:**
  - `/qr/translator` — official launch note + device paths
  - Header language dropdown — official scope note + link to `/qr/translator` + Google Translate website helper

---

## Website vs Magazine Translation Separation

| Layer | Scope |
|-------|-------|
| Website UI | Official ES / EN / PT / TL only |
| Magazine DeepL proof | Separate pipeline; print Spanish-only |
| Digital magazine editions | Digital-only; proof QA URLs noindex |
| Unsupported languages | Browser Google Translate / Google Lens guidance until reviewers exist |

---

## QA Checklist

- [ ] Language picker shows only Español, English, Português, Tagalog/Filipino
- [ ] `?lang=vi` does not show Vietnamese selected
- [ ] Unsupported language does not half-translate page UI chrome
- [ ] `/qr/translator` explains fallback honestly
- [ ] No hidden language publicly claimed as official
- [ ] Browser translation not globally blocked (`notranslate` not sitewide)
- [ ] Category result query params preserved when lang falls back

---

## Future Activation Process

1. Identify community demand
2. Secure trusted reviewer/team member
3. Activate language in registry (`status: future` → `production`, add to `OFFICIAL_LAUNCH_LANGUAGES`)
4. Add translation coverage for core pages
5. QA category pages
6. QA magazine/digital content if applicable
7. Launch language publicly in selectors

---

## TRUE/FALSE

| Check | Value |
|-------|-------|
| Official launch languages locked | TRUE |
| Hidden future languages preserved | TRUE |
| Unsupported language UI hidden | TRUE |
| Unsupported URL lang fallback documented | TRUE |
| Google fallback documented as helper only | TRUE |
| Website/magazine separation documented | TRUE |
| Ready for QA | TRUE |

---

## Final Decision

**LEONIX_LAUNCH_LANGUAGE_SCOPE_AND_GOOGLE_TRANSLATE_FALLBACK_DONE**

**READY FOR LANGUAGE SCOPE QA ON HOMEPAGE, NAV, QR TRANSLATOR, AND CATEGORY RESULTS: YES**
