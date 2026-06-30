# Site Translation Word-By-Word Smoke

Status: `SITE-TRANSLATION-WORD-BY-WORD-SMOKE1`

This gate separates Leonix UI language from seller-created source content. The public UI should follow the selected `lang` route parameter where a native copy registry exists. Seller-entered titles, descriptions, business names, phone numbers, emails, URLs, addresses, prices, coupon codes, and uploaded assets must stay exactly as entered until a later reviewed translation/cache gate exists.

## Product Rule

- `viewer_language`: the visitor-selected UI language from `?lang=`.
- `source_content_language`: the language the seller, advertiser, or business owner used when entering content.
- `translated_content_language`: a future optional translated view of source content, backed by cache and QA rules.
- Native-language ads are a feature, not a bug. Leonix is a bridge between cultures, not a system that silently rewrites seller content.
- Source-language filters and cached ad translations come later.
- Do not create `ad_translations`, `listing_translations`, duplicate translation memory tables, or Supabase migrations for this UI smoke.
- Do not claim that a seller ad, translated PDF, translated flipbook, or full visual magazine translation exists unless real approved assets exist.

## Gate A Audit Summary

| Area | ES UI Clean | EN UI Clean | PT Acceptable | VI Acceptable | Lang Carryover | Dynamic Content Protected | Notes |
|---|---:|---:|---:|---:|---:|---|
| Root / coming soon | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Coming Soon uses a 13-language page registry; this gate fixed PT/VI launch signup field chrome and active-language CTA labels. |
| Public nav/header/footer | TRUE | TRUE | PARTIAL | PARTIAL | TRUE | TRUE | Main nav uses active language helpers; some legacy footer/cookie copy still uses intentional fallback. |
| Translate-site | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | `app/lib/googleTranslateWebsite.ts` has native PT/VI page copy and route-safe Google Websites helper text. |
| QR translator | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | QR translator has PT/VI copy; long-form depth for some non-priority community languages remains a later hold. |
| Media Kit | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Media Kit page copy is registered for all active public languages. PDF labels remain honest about Spanish/English assets. |
| Magazine hub/reader/companion/proof | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Magazine copy registries support active languages and preserve visual-asset honesty. |
| Clasificados hub | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Hub registry includes PT/VI; seller listing content remains source language. |
| Publicar chooser | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | Chooser registry includes PT/VI; deeper publish flows remain separate holds. |
| Category landing/results shell | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | Many category shells still use ES/EN ternaries or dirty in-progress files; defer to `CLASIFICADOS-SOURCE-LANGUAGE-AUDIT1`. |
| Publish/application entry shell | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | Operational form steps/validation across publish flows still need a dedicated gate. |
| Preview/publish chrome | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | Preview chrome has ES/EN patterns; seller preview data is protected. |
| Public detail chrome | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | Contact/save/share/report labels vary by category; no ad body translation was added. |
| User dashboard ad card chrome | PARTIAL | PARTIAL | PARTIAL | PARTIAL | TRUE | TRUE | Dashboard uses ES/EN patterns in several places; not expanded in this scoped pass. |

## Fixes Applied

| File / Route | Change | Languages Covered | Mobile/PWA Result | Issues |
|---|---|---|---|---|
| `app/components/leonix/coming-soon-v2/ComingSoonLaunchSignupForm.tsx` | Added PT/VI visible field labels, placeholders, audience options, and success/error copy by selected `lang`; other community languages intentionally fall back to EN for this local form only. | ES, EN, PT, VI priority | Existing tap targets and layout preserved. | Lead validation internals still use the existing ES/EN location component constraint. |
| `app/components/leonix/coming-soon-v2/ComingSoonV2Shell.tsx` | Replaced ES/EN-only promotional-products CTA and visual catalog aria label with active-language labels. | 13 active public languages | Short CTA labels; no layout or animation changes. | Some source marketing terms like `Media Kit`, `QR`, and `Negocios Locales` remain proper/product names. |

## Word-By-Word Smoke Matrix

| Route | ES Expected | EN Expected | PT Expected | VI Expected | Dynamic Content Rule | Status | Notes |
|---|---|---|---|---|---|---|---|
| `/coming-soon-v2?lang=es` | Spanish hero, CTAs, signup labels, consent, language selector | N/A | N/A | N/A | No seller content on page | PASS-CODE | Check mobile CTA wrapping and newsletter form. |
| `/coming-soon-v2?lang=en` | N/A | English hero, CTAs, signup labels, consent, language selector | N/A | N/A | No seller content on page | PASS-CODE | Check promotional products and Media Kit CTAs. |
| `/coming-soon-v2?lang=pt` | N/A | N/A | Portuguese hero, CTAs, signup labels, consent, language selector | N/A | No seller content on page | PASS-CODE | Confirm no obvious English form placeholders except proper names like Media Kit. |
| `/coming-soon-v2?lang=vi` | N/A | N/A | N/A | Vietnamese hero, CTAs, signup labels, consent, language selector | No seller content on page | PASS-CODE | Confirm no obvious English form placeholders except proper names. |
| `/magazine/2026/june/read?lang=pt` | N/A | N/A | Portuguese reader chrome; Spanish visual original remains honest | N/A | Magazine source PDF stays Spanish | PASS-CODE | No translated PDF claim. |
| `/qr/translator?lang=pt` | N/A | N/A | Portuguese device instructions and Google Lens/Translate path | N/A | Printed/PDF visual stays original | PASS-CODE | Check Android/iPhone tabs and native-form warning. |
| `/translate-site?lang=pt` | N/A | N/A | Portuguese Google Websites helper steps | N/A | Website helper only, not ad translation | PASS-CODE | Confirm `leonixmedia.com` copy button and Google CTA. |
| `/media-kit?lang=pt` | N/A | N/A | Portuguese page summary and advertising request CTA | N/A | PDF assets stay honest | PASS-CODE | Check Spanish/English PDF labels. |
| `/clasificados?lang=es` | Spanish hub labels and publish/explore CTAs | N/A | N/A | N/A | Listing titles/descriptions stay source language | PASS-CODE | Check category card CTAs preserve `lang`. |
| `/clasificados?lang=en` | N/A | English hub labels and publish/explore CTAs | N/A | N/A | Listing titles/descriptions stay source language | PASS-CODE | Check category card CTAs preserve `lang`. |
| `/clasificados?lang=pt` | N/A | N/A | Portuguese hub labels and publish/explore CTAs | N/A | Listing titles/descriptions stay source language | PASS-CODE | Some category names may remain brand/category names. |
| `/clasificados/publicar?lang=es` | Spanish chooser title, back link, continue labels | N/A | N/A | N/A | Form-entered listing content remains source language | PASS-CODE | Deeper category forms are later gate. |
| `/clasificados/publicar?lang=en` | N/A | English chooser title, back link, continue labels | N/A | N/A | Form-entered listing content remains source language | PASS-CODE | Deeper category forms are later gate. |
| `/clasificados/publicar?lang=pt` | N/A | N/A | Portuguese chooser title, back link, continue labels | N/A | Form-entered listing content remains source language | PASS-CODE | Deeper category forms are later gate. |

## Manual Checklist For Chuy

- Confirm page title and first hero/section title match selected `lang`.
- Confirm primary CTA labels are in selected `lang`.
- Confirm form labels, placeholders, preview buttons, publish buttons, and back links are in selected `lang` on covered routes.
- Confirm language selector preserves `?lang=`.
- Confirm route links preserve `lang`, and where present, `sourcePage` and `sourceCta`.
- Confirm seller/ad titles, descriptions, business names, phone, email, URL, address, prices, and coupon codes remain unchanged.
- Confirm there is no claim that ads, source listings, translated PDFs, or translated flipbooks were automatically translated.

## Remaining Holds

- `CLASIFICADOS-SOURCE-LANGUAGE-AUDIT1`: audit category results/detail/dashboard chrome and source-language display without translating seller content.
- `PUBLISH-LANG1`: expand operational publish/application form copy across category-specific flows.
- `QR-GUIDE-LONGFORM-LANG1`: finish deeper long-form QR copy for non-priority community languages.
- `MAGAZINE-DEEPL-PT-REAL-SMOKE3`: retry only after `DEEPL_AUTH_KEY` is present locally.
