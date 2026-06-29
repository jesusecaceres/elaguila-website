# Translation Finish Backlog

Lock document separating **static/native public UI translation** from **dynamic/database content** that must use the cache-first Google translation pipeline.

**Active Leonix UI languages:** es, en, vi, pt, tl, km, zh, ja, ko, hi, hy, ru, pa  
**Held RTL (inactive):** ar, fa

**Last verified:** MAGAZINE-ASSET-CACHE1

---

## 1. Static / native UI — completed pages

These routes/surfaces have typed `Record<SupportedLang, …>` copy registries or equivalent native coverage for all 13 active languages.

| Route / surface | Copy registry / module |
|-----------------|------------------------|
| `/` (root intro) | `app/lib/rootIntroCopy.ts` |
| `/coming-soon-v2` | `app/components/leonix/coming-soon-v2/**` |
| `/translate-site` | `app/lib/googleTranslateWebsite.ts` |
| `/qr/translator` | `app/lib/magazine/qrGuideCopy/**` (hero/truth; some long-form steps still partial EN — see §2) |
| `/magazine` (hub) | `app/lib/magazine/magazineHubPageCopy/**` |
| `/magazine/2026/june/read` | `app/lib/magazine/magazineReaderCopy/**` |
| `/magazine/2026/june/companion` | Chrome: `june2026CompanionChrome.ts`; body: reader sections for community langs via `june2026CompanionContent.ts` |
| `/media-kit` | `app/lib/leonix/mediaKitPageCopy/**` |
| `/contacto` | `app/lib/leonix/publicFormCopy/**` |
| `/newsletter` | `app/lib/leonix/publicFormCopy/**` |
| `/tienda/contacto` | `app/lib/leonix/publicFormCopy/**` |
| `/productos-promocion` | `app/lib/leonix/productosPromocionPageCopy/**` |
| `/clasificados` (hub) | `app/lib/clasificados/clasificadosHubPageCopy/**` |
| `/clasificados/publicar` (chooser shell) | `app/lib/clasificados/publishChooserCopy/**` |
| **Public navbar / header** | `app/lib/leonix/publicNavCopy/**`, `app/lib/publicNavConfig.ts` |
| **Advertise dropdown** | `app/lib/advertiseDropdownConfig.ts` |
| Public header language selector | `app/components/LanguagePreferenceSync.tsx`, `app/lib/language.ts` |
| Footer + cookie consent | `app/lib/leonix/publicChromeCopy/**` |

**Lang carryover:** Priority funnels use `withPublicLangAndTracking`, `replaceLangInHref`, or route-specific helpers preserving `lang`, `sourcePage`, `sourceCta`, and related query params. Google website translation routes through `/translate-site` — not direct `translate.goog` proxy links.

---

## 2. Static / native UI — remaining holds

Honest gaps that require dedicated later gates (not dynamic Google translation):

| Area | Hold reason | Exact files | Suggested gate |
|------|-------------|-------------|----------------|
| **Clasificados category landings / results** | Mixed `navCopyLang()` / ES/EN ternary patterns across category shells | `app/(site)/clasificados/**/landing/**`, `*ShellCopy.ts`, `*LandingPage.tsx` | `CLASIFICADOS-CATEGORY-LANG1` |
| **Publish / application wizards** | Operational form steps, validation, field labels beyond chooser shell | `app/(site)/clasificados/publicar/**`, `app/(site)/publicar/**` | `PUBLISH-LANG1` |
| **Negocios Locales public profiles** | Business profile pages, directory chrome | `app/(site)/negocios-locales/**`, `app/(site)/clasificados/negocios/**` | `NEGOCIOS-LOCALES-LANG1` |
| **Recently viewed section** | ES/EN listing chrome on hub | `app/(site)/clasificados/components/RecentlyViewedSection.tsx` | `CLASIFICADOS-CATEGORY-LANG1` |
| **QR translator long-form blocks** | Some community langs inherit EN card steps via `g()` spread | `app/lib/magazine/qrGuideCopy/community.ts`, `qrGuideCopy/index.ts` (`TRANSLATOR_BY_LANG`) | `QR-GUIDE-LONGFORM-LANG1` |
| **Cookie consent partial community strings** | Some community langs use `fromEn` partials | `app/lib/leonix/publicChromeCopy/index.ts` | Low priority polish |
| **Legal pages** | ES/EN via `navCopyLang` | `app/(site)/legal/page.tsx` | `LEGAL-13LANG1` |

**Visual assets (not UI copy):**

- Original June 2026 **PDF** remains Spanish visual edition.
- **FlipHTML5** flipbook remains Spanish visual edition.
- Do **not** claim full PDF or flipbook translation until separate asset gates.
- `MAGAZINE-VISUAL-TRANSLATION-PROOF1` added architecture guardrails in `docs/magazine-visual-translation-proof.md`.
- `MAGAZINE-ASSET-CACHE1` added static visual asset registry helpers in `app/lib/magazine/magazineVisualTranslationManifest.ts`.
- The registry is not imported into runtime UI; public magazine behavior remains unchanged.
- Actual translated visual assets require future production, storage, source-hash validation, and QA approval before serving.

---

## 3. Dynamic / database content — cache-first translation

These content types are **user-generated or database-sourced**. They must **not** be hand-translated in static copy registries.

### Pipeline rule (mandatory)

1. Use existing **`translation_records`** table — **do not** create `ad_translations` or `listing_translations`.
2. **Check cache first** (Supabase `translation_records` via `app/lib/translation/provider.ts`).
3. **Call Google only on cache miss or stale** (`TRANSLATION_PROVIDER=google`).
4. **Write result once** to cache.
5. **Repeat requests return from cache** — no duplicate Google calls for same source hash + target lang.

### Duplicate table warning

**Do not** introduce parallel translation tables (`ad_translations`, `listing_translations`, etc.). The architecture lock standardizes on **`translation_records`** with content-type + source hash keys.

### Magazine translation architecture lock

Digital magazine translation uses three separate systems:

1. **Text Translation Memory** — use existing `translation_records` first for HTML companion copy, article summaries, recurring sections, recipes, advertiser descriptions, CTA phrases, and reusable business blurbs.
2. **Magazine Visual Asset Cache** — separate from text memory; future cache keys should combine `sourcePdfHash`, `pageHash`, or `adAssetHash` with target language, provider, source version, and QA status.
3. **Reusable Ad Asset Library** — separate from both text memory and visual page cache; stable advertiser ads should be translated and QA-approved once, then reused across issues when the source hash has not changed.

The original PDF and FlipHTML5 magazine remain the Spanish visual edition. The HTML companion is an explanation and summary layer, not a claim that the visual magazine has been translated.

### Language mapping (Google targets only)

- `tl` (Leonix UI) → `fil` (Google target)
- `zh` (Leonix UI) → `zh-CN` (Google target)

See `app/lib/leonix/languageMetadata.ts` and `docs/leonix-translation-architecture.md`.

### Dynamic content inventory

| Content type | Examples | Translation approach |
|--------------|----------|----------------------|
| Classified ads | Titles, descriptions, attributes | `/api/translate-ad` + `translation_records` |
| Public ad / listing pages | Rendered ad body HTML | Cache-first; `ADS-HTML1` |
| Category result listing content | DB listing cards, prices, blurbs | Cache-first per field |
| Business profiles | Negocios Locales descriptions, hours text | Cache-first per field |
| Application submissions | User-entered publish form data | Display-side cache on read |
| Admin review summaries | Internal — out of public sweep scope | Separate admin gate |

---

## 4. Google env blocker

Live Google translation smoke is blocked until these are set locally (`.env.local`) and on Vercel:

| Variable | Required |
|----------|----------|
| `TRANSLATION_PROVIDER` | `google` |
| `TRANSLATION_CACHE_STORAGE` | `supabase` |
| `GOOGLE_CLOUD_PROJECT_ID` | project ID |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` **or** `GOOGLE_APPLICATION_CREDENTIALS` | service account |

Present today (verified): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

See `docs/translation-env-setup.md`.

---

## 5. Next gates (ordered)

| Gate | Purpose |
|------|---------|
| `GOOGLE-TRANSLATION-PREFLIGHT-AND-SMOKE1` | Env preflight + live cache write/read smoke |
| `MAGAZINE-ASSET-CACHE1` | Done: static asset registry helpers; future storage/QA integration still required before serving translated visuals |
| `MAGAZINE-AD-ASSET-LIBRARY1` | Reusable advertiser ad asset library with source-hash reuse rules |
| `MAG-COMPANION-BODY-LANG1` | Stronger magazine companion body copy across active public languages |
| `TRANSLATE-AD-ALL-LANG-SMOKE1` | `/api/translate-ad` all 13 active langs + cache repeat |
| `DYNAMIC-CONTENT-TRANSLATION-CACHE1` | End-to-end cache-first dynamic content |
| `ADS-HTML1` | Public ad page HTML render + translation cache |
| `CLASIFICADOS-CATEGORY-LANG1` | Category landing/results shell 13-lang native UI |
| `PUBLISH-LANG1` | Publish/application operational copy 13-lang |
| `NEGOCIOS-LOCALES-LANG1` | Business profile public pages + directory |
| `QR-GUIDE-LONGFORM-LANG1` | QR translator long-form instruction blocks all langs |

---

## 6. References

- `docs/leonix-translation-architecture.md`
- `docs/magazine-visual-translation-proof.md`
- `docs/translation-env-setup.md`
- `docs/translation-safety-guardrails.md`
- `docs/translate-ad-gates.md`
- `app/lib/translation/provider.ts` — cache-first provider (do not bypass)
- `app/api/translate-ad/route.ts` — ad translation API (do not modify in static sweeps)
