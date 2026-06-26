# Translation Finish Backlog

Lock document separating **static/native public UI translation** (completed in SITE-TRANSLATION-FINAL-SWEEP1) from **dynamic/database content** that must use the cache-first Google translation pipeline in later gates.

**Active Leonix UI languages:** es, en, vi, pt, tl, km, zh, ja, ko, hi, hy, ru, pa  
**Held RTL (inactive):** ar, fa

---

## 1. Static / native UI — completed pages

These routes have typed `Record<SupportedLang, …>` copy registries or equivalent native coverage for all 13 active languages. User-visible chrome, CTAs, and forms are native; dynamic body content may still be Spanish/English or database-sourced (see §3).

| Route / surface | Copy registry / module |
|-----------------|------------------------|
| `/` (root intro) | `app/lib/rootIntroCopy.ts` |
| `/coming-soon-v2` | `app/components/leonix/coming-soon-v2/**` |
| `/translate-site` | `app/lib/googleTranslateWebsite.ts` |
| `/qr/translator` | `app/lib/magazine/qrGuideCopy/**` |
| `/magazine` (hub) | `app/lib/magazine/magazineHubPageCopy/**` |
| `/magazine/2026/june/read` | `app/lib/magazine/magazineReaderCopy/**` |
| `/magazine/2026/june/companion` (chrome) | `app/lib/magazine/june2026CompanionCopy/**` |
| `/media-kit` | `app/lib/leonix/mediaKitPageCopy/**` |
| `/contacto` | `app/lib/leonix/publicFormCopy/**` |
| `/newsletter` | `app/lib/leonix/publicFormCopy/**` |
| `/tienda/contacto` | `app/lib/leonix/publicFormCopy/**` |
| `/productos-promocion` | `app/lib/leonix/productosPromocionPageCopy/**` |
| Public header language selector | `app/components/LanguagePreferenceSync.tsx`, `app/lib/language.ts` |
| Footer + cookie consent | `app/lib/leonix/publicChromeCopy/**`, `cookieConsentCopy.ts` |

**Lang carryover:** Priority funnels use `withPublicLangAndTracking`, `replaceLangInHref`, or route-specific helpers preserving `lang`, `sourcePage`, `sourceCta`, and related query params. Google website translation routes through `/translate-site` — not direct `translate.goog` proxy links.

---

## 2. Static / native UI — remaining holds

Honest gaps that require dedicated later gates (not dynamic Google translation):

| Area | Hold reason | Suggested gate |
|------|-------------|----------------|
| **Navbar nav labels** | `app/lib/publicNavConfig.ts` is ES/EN only; `navCopyLang()` collapses community langs to EN | `NAV-13LANG1` or fold into `CLASIFICADOS-LANG1` |
| **Clasificados hub shell** | `clasificadosHubCopy.ts` — ES/EN only; category cards, hero, trust copy | `CLASIFICADOS-LANG1` |
| **Clasificados category landings / results** | Mixed `lang === "es" ? … : …` patterns; large surface | `CLASIFICADOS-LANG1` |
| **Publish / application flows** | `/clasificados/publicar/**`, `/publicar/**` — operational forms, validation, step copy | `PUBLISH-LANG1` |
| **Negocios Locales public profiles** | Business profile pages, directory chrome | `NEGOCIOS-LOCALES-LANG1` |
| **June companion article body** | `june2026CompanionContent.ts` — ES/EN editorial body; chrome is 13-lang | Document only until CMS/dynamic source |
| **Cookie consent partial community strings** | Some community langs use `fromEn` partials in `cookieConsentCopy.ts` | Low priority polish gate |
| **QR guide community entries** | Some community blocks spread EN for long-form sections | Low priority polish gate |

**Visual assets (not UI copy):**

- Original June 2026 **PDF** remains Spanish visual edition.
- **FlipHTML5** flipbook remains Spanish visual edition.
- Do **not** claim full PDF or flipbook translation until separate asset gates.

---

## 3. Dynamic / database content — cache-first translation

These content types are **user-generated or database-sourced**. They must **not** be hand-translated in static copy registries. Use the existing translation pipeline:

### Pipeline rule (mandatory)

1. Use existing **`translation_records`** table — **do not** create `ad_translations` or `listing_translations`.
2. **Check cache first** (Supabase `translation_records` via `app/lib/translation/provider.ts`).
3. **Call Google only on cache miss or stale** (`TRANSLATION_PROVIDER=google`).
4. **Write result once** to cache.
5. **Repeat requests return from cache** — no duplicate Google calls for same source hash + target lang.

### Language mapping (Google targets only)

- `tl` (Leonix UI) → `fil` (Google target)
- `zh` (Leonix UI) → `zh-CN` (Google target)
- `fil` normalizes to `tl` for Leonix UI
- `zh-CN` / `zh-Hans` normalize to `zh` for Leonix UI

See `app/lib/leonix/languageMetadata.ts` and `docs/leonix-translation-architecture.md`.

### Dynamic content inventory

| Content type | Examples | Translation approach |
|--------------|----------|----------------------|
| Classified ads | Titles, descriptions, attributes | `/api/translate-ad` + `translation_records` |
| Public ad / listing pages | Rendered ad body HTML | Cache-first; `ADS-HTML1` |
| Business profiles | Negocios Locales descriptions, hours text | Cache-first per field |
| Application submissions | User-entered publish form data | Display-side cache on read |
| Magazine companion body | If sourced from CMS/DB later | Cache-first per article |
| Admin review summaries | Internal — out of public sweep scope | Separate admin gate |

### Duplicate table warning

**Do not** introduce parallel translation tables (`ad_translations`, `listing_translations`, etc.). The architecture lock (`GOOGLE-TRANSLATION-ARCH-LOCK1`) standardizes on **`translation_records`** with content-type + source hash keys. Adding duplicate tables risks cache inconsistency and double billing.

---

## 4. Next dynamic gates (ordered)

| Gate | Purpose |
|------|---------|
| `GOOGLE-TRANSLATION-PREFLIGHT-AND-SMOKE1` | Env preflight + live cache write/read smoke (blocked until Google creds in `.env.local` / Vercel) |
| `TRANSLATE-AD-ALL-LANG-SMOKE1` | `/api/translate-ad` all 13 active langs + cache repeat |
| `CLASIFICADOS-LANG1` | Clasificados hub + category shell 13-lang native UI |
| `PUBLISH-LANG1` | Publish/application operational copy 13-lang |
| `NEGOCIOS-LOCALES-LANG1` | Business profile public pages + directory |
| `ADS-HTML1` | Public ad page HTML render + translation cache integration |
| `DYNAMIC-CONTENT-TRANSLATION-CACHE1` | End-to-end cache-first dynamic content across listings/ads/profiles |

---

## 5. References

- `docs/leonix-translation-architecture.md` — language metadata, Google routing
- `docs/translation-env-setup.md` — required env vars
- `docs/translation-safety-guardrails.md` — scope locks, no duplicate tables
- `docs/translate-ad-gates.md` — ad translation gate sequence
- `app/lib/translation/provider.ts` — cache-first provider (do not bypass)
- `app/api/translate-ad/route.ts` — ad translation API (do not modify in static sweeps)

---

*Last updated: SITE-TRANSLATION-FINAL-SWEEP1*
