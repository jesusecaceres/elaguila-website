# Translate Ad — rollout gates

## Gate 3A (foundation) ✅

- Shared locale/types, masking helpers, session-only cache utilities, and `TranslateAdControl` client component live under `app/lib/translation/` and `app/components/translation/`.
- **Durable server cache** (`public.translation_records`) active in production after **SQL1 + SQL2D** — see **Gate ROLL1** below.
- Translate Ad must remain **user-triggered** (no auto-translate on render).
- **Do not translate or ship raw contact fields** — emails, phones, URL/WhatsApp/map-like strings are masked before any provider call; prices and legal copy stay out of the default picked fields.

## Gate T3 (API route + provider contract) ✅

### Route

| Item | Value |
|---|---|
| Path | `POST /api/translate-ad` |
| Implementation | `app/api/translate-ad/route.ts` |
| Server provider | `app/lib/translation/providers/` — `translateAdWithConfiguredProvider()` (facade: `serverProvider.ts`; `import "server-only"`; never import from client) |

### Environment (server-only)

| Variable | Required | Notes |
|---|---|---|
| `TRANSLATION_PROVIDER` | **Yes** | `google` (future primary, **G3**), `deepl` (optional fallback), or `disabled`. **Omitted → 503** (no default provider). |
| `DEEPL_API_KEY` | When `deepl` | DeepL auth key (optional / fallback only). Free-tier `:fx` keys use free API host unless `DEEPL_API_URL` is set. |
| `DEEPL_API_URL` | No | Optional DeepL endpoint override. |
| `GOOGLE_CLOUD_PROJECT_ID` | When `google` (G3) | Google Cloud project — placeholder in G2. |
| `GOOGLE_TRANSLATE_LOCATION` | No | Default `global` (G3). |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | When `google` | Vercel-safe service account JSON (single-line env). |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local optional | File path to service account JSON (local dev). |

**Strategic direction:** **Google Cloud Translation Advanced** is the **primary** provider when `TRANSLATION_PROVIDER=google` (**G3**). DeepL is **optional fallback only**, not the long-term default.

Example (local `.env.local` / Vercel — no real secrets in git):

```bash
# Primary provider (G3):
TRANSLATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS_JSON=

# Optional fallback only:
# TRANSLATION_PROVIDER=deepl
# DEEPL_API_KEY=
```

| `TRANSLATION_PROVIDER` | Behavior (G3+) |
|---|---|
| *(missing)* | **503** — not configured |
| `google` + valid Google env | **200** on valid masked payload |
| `google` without project/credentials | **503** |
| `deepl` + valid `DEEPL_API_KEY` | **200** on valid masked payload |
| `deepl` without key | **503** |
| unsupported value | **503** — not supported |

No fake success, no key leakage in JSON responses.

There is **no** `.env.example` in this repo; configure the variables above in Vercel / local `.env.local` only.

### Request shape

```json
{
  "maskedFields": {
    "title": "string (optional)",
    "description": "string (optional)",
    "serviceLabel": "string (optional)",
    "customServiceText": "string (optional)",
    "details": "string (optional)",
    "highlights": "string (optional)",
    "body": "string (optional)",
    "shareText": "string (optional)"
  },
  "category": "safe-string slug",
  "listingKey": "safe-string id or slug",
  "sourceLocale": "es" | "en" | "unknown",
  "targetLocale": "es" | "en"
}
```

- Client must call `maskTranslatableFields()` first so `__LEONIX_MASK_N__` placeholders replace contact/URL/phone fragments.
- Route rejects unmasked email/URL/phone patterns, empty payloads, oversized text (5000 chars/field, 12000 total), and invalid meta strings.

### Response shape (success)

```json
{
  "translated": { "...": "same keys as maskedFields" },
  "sourceLocale": "es" | "en" | "unknown",
  "targetLocale": "es" | "en",
  "provider": "google-cloud-translation",
  "translatedAt": "ISO-8601 timestamp",
  "fromCache": false
}
```

Compatible with `AdTranslationResult` in `app/lib/translation/types.ts`.

### Safety

- API keys are read only under `app/lib/translation/providers/` and `config.ts` (`import "server-only"`).
- Route does not accept separate raw contact fields.
- Provider errors return generic messages (502/503); no DeepL response bodies or keys in JSON.
- Full ad text and API keys must not be logged.
- **Rate limiting / auth:** not implemented in T3 — TODO in route for T4+.
- **Durable cache / `listing_translations`:** not implemented in T3 — TODO in route; client session cache only (Gate 3A helpers).

### Out of scope (T3)

- No `TranslateAdControl` wiring on category detail pages
- No `listing_translations` table or Supabase migration
- No durable translation storage (session cache on client only via helpers)

## Gate T3G (Google Cloud Translation Advanced — primary provider) ✅

**Scope:** Replace DeepL-first provider with Google Cloud Translation Advanced as the sole active backend. No category wiring, no DB storage, no migrations.

### What changed

| Item | Path |
|---|---|
| Server provider | `app/lib/translation/provider.ts` — `translateAdWithConfiguredProvider()` (Google only; import server fns from API route only) |
| API route | `app/api/translate-ad/route.ts` — delegates to `provider.ts` |
| Provider id | `"google-cloud-translation"` in `AdTranslationResult.provider` |

### Environment (server-only)

| Variable | Required | Notes |
|---|---|---|
| `TRANSLATION_PROVIDER` | **Yes** | Must be `google`. DeepL is **disabled by default** (returns **503**). |
| `GOOGLE_CLOUD_PROJECT_ID` | **Yes** | Google Cloud project id. |
| `GOOGLE_TRANSLATE_LOCATION` | No | Default `global`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | **Yes** (local) | Service account JSON file path, or inline JSON string. |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Vercel alt | Single-line service account JSON (also supported). |
| `GOOGLE_TRANSLATE_GLOSSARY_ID` | No | Future glossary / protected terms (optional). |

Example (Vercel / `.env.local` — no secrets in git):

```bash
TRANSLATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS=
# GOOGLE_TRANSLATE_GLOSSARY_ID=
```

| Condition | HTTP |
|---|---|
| Missing / invalid payload | **400** |
| Missing Google env / `TRANSLATION_PROVIDER` not `google` | **503** — `Translation provider is not configured.` |
| `TRANSLATION_PROVIDER=deepl` or other unsupported value | **503** — not supported / not configured |
| Google upstream failure | **502** |

### Response shape (success)

```json
{
  "translated": { "...": "same keys as maskedFields" },
  "sourceLocale": "es" | "en" | "unknown",
  "targetLocale": "es" | "en",
  "provider": "google-cloud-translation",
  "translatedAt": "ISO-8601 timestamp",
  "fromCache": false
}
```

### Out of scope (T3G)

- No `TranslateAdControl` category wiring (Servicios pilot remains next after env is aligned)
- No Supabase migration
- No `listing_translations` / `translation_records` table

## Gate G4 (translation cache adapter) ✅

**Scope:** Server-side cache lookup/write adapter before/after Google calls. No migration, no category wiring.

### What changed

| Item | Path |
|---|---|
| Server cache module | `app/lib/translation/serverCache.ts` — cache keys, SHA-256 source hash, read/write adapter |
| Provider integration | `app/lib/translation/provider.ts` — cache lookup → Google for misses only → cache write |
| Config | `app/lib/translation/config.ts` — `serverCacheStorageAvailable` flag |

### Cache key parts

Per translatable field:

- `category` (content type)
- `listingKey` (content id)
- `fieldKey` (`title`, `description`, …)
- `sourceLocale` / `targetLocale`
- `sourceTextHash` — SHA-256 of **masked** source text (never logged)
- `version` — `v1` (masking/payload version)

### Cache behavior

| Storage | Behavior |
|---|---|
| **Unavailable** (current — no `translation_records` table) | Skip read/write; call Google; `fromCache: false` |
| **Available** (future migration gate) | Read before Google; full hit → `fromCache: true`; miss → Google + write; partial hit translates misses only |

Enablement: set `TRANSLATION_CACHE_STORAGE=supabase` **after** applying migration `20260527210000_create_translation_records.sql` and redeploying with `SUPABASE_SERVICE_ROLE_KEY` present. Without both, provider still works but durable cache stays off (`fromCache: false`).

### Response `fromCache`

- **Full cache hit:** `fromCache: true` (no Google call)
- **Any cache miss:** `fromCache: false` (Google called for missing fields)

### Out of scope (G4)

- ~~No Supabase migration / `translation_records` table~~ → **SQL1 ✅**
- No category UI wiring — **Servicios pilot (T4)** is next after provider + env alignment

## Gate SQL1 (Supabase durable `translation_records` cache) ✅

**Scope:** Migration + wire `serverCache.ts` to Supabase service role. No category UI, no TranslateAdControl changes.

### Migration

| Item | Value |
|---|---|
| File | `supabase/migrations/20260527210000_create_translation_records.sql` |
| Table | `public.translation_records` |
| RLS | Enabled — **no** anon/authenticated policies (service role only) |
| Unique cache key | `(category, listing_key, field_key, source_locale, target_locale, source_text_hash, source_text_version)` |

### Environment (server-only)

| Variable | Required | Notes |
|---|---|---|
| `TRANSLATION_CACHE_STORAGE` | For durable cache | Set to `supabase` in Production after migration is applied. Omit or any other value → cache reads/writes skipped safely. |
| `NEXT_PUBLIC_SUPABASE_URL` | When cache enabled | Existing project URL (not used for writes alone). |
| `SUPABASE_SERVICE_ROLE_KEY` | When cache enabled | Server-only secret — **never** expose as `NEXT_PUBLIC_*`. |

Provider env (`TRANSLATION_PROVIDER`, Google credentials) unchanged — cache is additive cost control, not a second provider.

### Cache behavior (when storage active)

| Case | Behavior |
|---|---|
| Full hit (all fields, `stale_at` null) | No Google call; `fromCache: true` |
| Partial hit | Google only for misses; merge cached + fresh; `fromCache: false` |
| Miss / stale row | Google + upsert; `fromCache: false` |
| Storage unavailable | Skip read/write; Google as today; `fromCache: false` |
| Cache write failure | Log safe metadata only (category, listingKey, fieldKey, locale, error code) — API still succeeds |

### Production activation (manual)

1. Apply migration in Supabase (`supabase db push` or SQL editor).
2. Set `TRANSLATION_CACHE_STORAGE=supabase` in Vercel Production (with existing `SUPABASE_SERVICE_ROLE_KEY`).
3. Redeploy.
4. Run **SQL2** cache smoke — production cache is **not** active until steps 1–3 complete.

## Gate ROLL1 (cache active + rollout/magazine audit) ✅

**Status:** Durable Supabase cache **active in production** (confirmed 2026-06-06).

### Production proof

| Request | `fromCache` | Notes |
|---|---|---|
| First identical POST (`roll1-cache-proof-v1`) | `false` | Cold miss — Google called |
| Second identical POST | **`true`** | Durable cache hit — no repeat Google charge |

Required env: `TRANSLATION_CACHE_STORAGE=supabase`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`.

### Rollout surface (audit only — no new wiring in ROLL1)

| Surface | TranslateAdControl | Server cache |
|---|---|---|
| Servicios public profile | ✅ T4 pilot | ✅ |
| Autos vehiculo detail | ✅ | ✅ |
| Empleos job detail | ✅ | ✅ |
| Viajes offer detail | ✅ | ✅ |
| Rentas listing detail | ✅ | ✅ |
| Generic `/clasificados/anuncio/[id]` | ✅ T7 (en-venta, bienes-raices, mascotas, …) | ✅ |
| Restaurantes shell/preview | ✅ | ✅ |
| Restaurantes live `[slug]` | ❌ not wired | n/a |

### Magazine (audit only)

- Spanish flipbook/PDF remain original visual assets.
- June 2026 **structured HTML reader** exists in ES/EN/VI via `issueContent.ts` (hand-authored copy, not Google cache).
- Full visual flipbook translation requires separate EN/VI assets (Level 3) or content extraction (Level 2 / **MAG1**).

### Next gates

- **ROLL2** — enable/verify Translate Ad on next category surface (e.g. Restaurantes live public).
- **MAG1** — structured extraction of magazine ad/article text from PDF for cache-backed translation.

### Out of scope (ROLL1)

- No new category wiring
- No magazine asset changes
- No new API routes
- No future languages beyond es/en/vi audit scope

## Gate G2 (provider abstraction pivot) ✅

**Scope:** Provider architecture only — no Google SDK, no Supabase migration, no category UI changes.

### What changed

| Item | Path |
|---|---|
| Provider registry | `app/lib/translation/providers/index.ts` — `translateAdWithConfiguredProvider()` |
| Config | `app/lib/translation/config.ts` — `TranslationProviderName`, `getTranslationProviderConfig()` |
| DeepL (optional fallback) | `app/lib/translation/providers/deepl.ts` |
| Google placeholder (future primary) | `app/lib/translation/providers/google.ts` — throws until **G3** |
| Typed errors | `app/lib/translation/errors.ts` |
| API route | `app/api/translate-ad/route.ts` — validation + safety only; delegates to provider layer |
| Facade | `app/lib/translation/serverProvider.ts` re-exports providers (backward compatible) |

### HTTP mapping (G2+)

| Condition | Status |
|---|---|
| Invalid payload / unmasked contact | **400** |
| `TRANSLATION_PROVIDER` missing / `disabled` / DeepL without key | **503** |
| Unsupported `TRANSLATION_PROVIDER` value | **503** |
| `TRANSLATION_PROVIDER=google` | **501** (not implemented until G3) |
| Provider upstream failure | **502** |

### Strategic direction

- **Google Cloud Translation Advanced** = future primary (`TRANSLATION_PROVIDER=google` in **G3**).
- **DeepL** = optional fallback only when explicitly enabled (`TRANSLATION_PROVIDER=deepl` + `DEEPL_API_KEY`).
- **No implicit default** — omitting `TRANSLATION_PROVIDER` fails safely (**503**).

### Out of scope (G2)

- ~~Google Cloud Translation Advanced implementation (**G3**)~~ → **G3 ✅**
- `translation_records` / `listing_translations` tables
- Category detail wiring changes (T4–T9 behavior unchanged from user perspective)

## Gate G3 (Google Cloud Translation Advanced backend) ✅

**Scope:** Server-side Google provider only — no Supabase migration, no category UI changes, no durable cache yet.

### What changed

| Item | Path |
|---|---|
| Google provider (primary) | `app/lib/translation/providers/google.ts` — Cloud Translation v3 via `googleapis` (dynamic import) |
| Mask protection (HTML) | `app/lib/translation/providers/maskPlaceholders.ts` — `translate="no"` spans for `__LEONIX_MASK_N__` |
| Config | `app/lib/translation/config.ts` — `GOOGLE_APPLICATION_CREDENTIALS_JSON` + `isImplemented: true` for Google |
| Provider registry | `app/lib/translation/providers/index.ts` — Google configured → live translation |
| API route | `app/api/translate-ad/route.ts` — removed G2 **501** gate for Google |

### Vercel env (no secrets in git)

```bash
TRANSLATION_PROVIDER=google
GOOGLE_CLOUD_PROJECT_ID=
GOOGLE_TRANSLATE_LOCATION=global
GOOGLE_APPLICATION_CREDENTIALS_JSON=
```

Local dev may use `GOOGLE_APPLICATION_CREDENTIALS` (file path) instead of JSON env.

### Active locales (G3)

- `es`, `en` only — G6 will add zh, fil/tl, vi, ko, hi, fa, ar, hy, ru, pt, pa, ja after verification.

### HTTP mapping (G3+)

| Condition | Status |
|---|---|
| Invalid payload / unmasked contact | **400** |
| Provider missing / Google or DeepL env incomplete | **503** |
| Unsupported `TRANSLATION_PROVIDER` | **503** |
| Google or DeepL upstream failure | **502** |

### Out of scope (G3)

- `translation_records` / durable cache (**G4**)
- Category UI wiring changes
- Supabase migrations
- Source listing/ad content mutation

## Gate T4 (Servicios pilot) ✅

**Scope:** First category wired to `TranslateAdControl` + `POST /api/translate-ad`. No Supabase migration; no other categories in this gate.

### Wired surfaces

| Surface | Path |
|---|---|
| Public Clasificados detail | `app/(site)/clasificados/servicios/[slug]/page.tsx` → `ServiciosProfileView` or `ServiciosProfessionalProfileShell` |
| Translation layer | `app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx` |
| Payload + API client | `app/(site)/servicios/lib/serviciosTranslateAd.ts` → `requestAdTranslation` → `/api/translate-ad` |

- `TranslateAdControl` with `category="servicios"`, `siteLocale` from `?lang=`, `listingKey` = public slug (`analyticsListingSlug`).
- **Client session cache** via Gate 3A helpers (`leonix:adTranslate`); **server cache adapter** (G4) when `translation_records` storage lands.
- **Provider:** Google Cloud Translation Advanced (`TRANSLATION_PROVIDER=google` + Google env). Missing env → **503** → control shows friendly error (no page crash).
- **No Supabase migration** and **no `listing_translations` table**.

### Placement

- Standard shell: above About / main column content (`ServiciosProfileView`).
- Professional shell: top of overview section, before service chips (`ServiciosProfessionalProfileShell`).
- Contact CTAs / Business Hub panel unchanged and not inside translate control.

### Translated fields (user prose)

- Hero category line (`title`)
- About body (`description`)
- Specialties line (`customServiceText`)
- Service card titles + secondary lines (`details` — tab-encoded, reapplied by index)
- Business highlight labels (`highlights` — newline-separated)
- First promotion headline (`shareText`)

### Excluded (never sent / never replaced)

- `businessName`, owner name, phone, email, website, WhatsApp, address, maps URL, social links, prices, license numbers, raw URLs, contact card fields

### Original language (T4 limitation)

- Listings do not yet store advertiser `original_language`; pilot uses `originalLocale="unknown"` and `sourceLocale: "unknown"` on the API request.
- CTA shown when translatable prose exists and (`shouldOfferTranslateAd` passes **or** `originalLocale === "unknown"` for current `siteLocale`).
- Future: persist original locale on publish (G5+) for smarter CTA gating.

### Next gate

- **T5 — QA Servicios pilot + next category** (likely Empleos or Autos, per rollout plan).

## Gate T5 (Empleos + Autos) ✅

### Wired surfaces

| Category | Path / components |
|---|---|
| Empleos legacy detail | `EmpleoPublicDetailClient.tsx` + `EmpleosJobTranslationLayer` |
| Empleos lane shells (quick / premium / feria) | `EmpleosPublicLaneDetailClient.tsx` → remapped lane data from translated `EmpleosJobRecord` |
| Empleos helpers | `app/(site)/clasificados/empleos/lib/empleosTranslateAd.ts` |
| Autos live vehicle | `AutosLiveVehicleClient.tsx` + `AutosListingTranslationLayer.tsx` |
| Autos helpers | `app/(site)/clasificados/autos/lib/autosTranslateAd.ts` |
| Shared client API | `app/lib/translation/requestAdTranslation.ts` → `POST /api/translate-ad` |

- **Session cache only** (Gate 3A helpers); no Supabase migration; no `listing_translations`.
- **Stored listing `lang`:** `empleos_public_listings.lang` passed from `[slug]/page.tsx`; Autos public API `lang` on listing payload.
- CTA hidden when `sourceLocale === targetLocale` (via `shouldOfferTranslateAd`); unknown listing lang falls back to Servicios-style pilot rule (prose + site `es`/`en`).

### Empleos — translated vs excluded

| Translated | Excluded |
|---|---|
| Job title, summary, description, requirements, benefits, schedule label, custom category, industry line | Company name, salary/pay, phone, email, website, apply URL, address, city/state, modality/job-type codes, IDs |

### Autos — translated vs excluded

| Translated | Excluded |
|---|---|
| Seller description, other equipment notes, custom equipment lines; custom `vehicleTitle` only when not YMM-only | Make/model/trim/year, VIN, mileage, price, dealer/seller name, contact, specs/features checklist values, financing numbers |

## Gate T6 (Viajes) ✅

### Wired surfaces

| Surface | Path |
|---|---|
| Public offer detail | `app/(site)/clasificados/viajes/oferta/[slug]/page.tsx` |
| Layout + translation | `ViajesOfferDetailLayout.tsx`, `ViajesOfferTranslationLayer.tsx` |
| Helpers | `app/(site)/clasificados/viajes/lib/viajesTranslateAd.ts` |
| Staged lang | `resolveViajesOfferDetailFromStagedServer.ts` → `listingLang` from `viajes_staged_listings.lang` |

- `lang` is passed explicitly from `pickLang(searchParams)` (not inferred from UI copy inside the layout).
- `TranslateAdControl` with `category="viajes"`, `requestAdTranslation` → `POST /api/translate-ad`.
- **Session cache only**; no Supabase migration; no `listing_translations`.
- Publish preview routes omit `listingKey` — translation layer skipped on previews.

### Translated vs excluded

| Translated | Excluded |
|---|---|
| Title, description, includes[], whoItsFor[], notes, trustNote | Destination, priceFrom, duration, departureCity, dateRange, partner name/CTAs/hrefs, contact channels, main booking CTA, image URLs, slugs/IDs |

## Gate T7 (Generic `anuncio/[id]`) ✅

### Wired surfaces

| Surface | Path / modules |
|---|---|
| Generic public detail | `app/(site)/clasificados/anuncio/[id]/page.tsx` |
| Helpers + hook | `app/lib/translation/anuncioTranslateAd.ts`, `useAnuncioListingTranslation.ts` |
| Control | `TranslateAdControl` with `category="anuncio"`, `version="anuncio-t7-v1"` |
| Client API | `requestAdTranslation` → `POST /api/translate-ad` |

- **No Supabase migration**; `public.listings` has no `original_language` column yet.
- **Unknown-source strategy:** `sourceLocale` / `originalLocale` = `"unknown"` on every request; CTA shows when translatable prose exists and `siteLocale` is `es` or `en` (does not guess Spanish/English as source).
- **Session cache only** (Gate 3A helpers); no `listing_translations` table or durable storage.
- Single `useAnuncioListingTranslation` instance in the page drives both `TranslateAdControl` and `proseListing` display (title, blurb, prose `detailPairs`).
- Inherited branch shells (Busco quick, Comunidad/Clases WYSIWYG, En Venta / Bienes Raíces `EnVentaAnuncioLayout`) receive translated title/blurb/detail prose via props; contact/price/city/IDs stay on the original `listing` object.
- `ContactActions`, saved/guardado rail, and `LeonixShareButton` hub are unchanged; CTA is placed above prose blocks, not inside contact/share rails.

### Translated vs excluded

| Translated | Excluded |
|---|---|
| Title, description/blurb, user-authored `detailPairs` values (human labels only; `Leonix:*` and contact/spec labels filtered) | Phone, email, website, WhatsApp, URLs, address/map links, price, dates/times, city/state, category/status codes, business/seller/company names, Leonix ad id, structured specs (bed/bath/VIN/mileage/sqft), legal disclaimers |

### Follow-up

- Add `original_language` on `public.listings` (migration + publish pipeline) and pass stored locale instead of `"unknown"`.
- Per-branch polish where delegated layouts still render untranslated nested prose.

## Gate T9 (Rentas + Restaurantes dedicated) ✅

### Wired surfaces

| Category | Path / modules |
|---|---|
| Rentas dedicated detail | `rentas/listing/[id]/RentasListingDetailClient.tsx` |
| Rentas helpers | `rentas/lib/rentasTranslateAd.ts`, `useRentasListingTranslation.ts` |
| Restaurantes dedicated detail | `restaurantes/[slug]/page.tsx` → `RestauranteAdStoryPreview.tsx` |
| Restaurantes helpers | `restaurantes/lib/restaurantesTranslateAd.ts`, `useRestauranteShellTranslation.ts` |

- **Display-only** overlay; original listing/shell data unchanged in memory until user clicks Translate Ad; **Show original** restores.
- **Session cache only**; no Supabase migration; no `listing_translations`.
- **`sourceLocale: "unknown"`** on both categories until `original_language` is stored on publish rows.
- CTA when translatable prose exists and site lang is `es` or `en`.
- Contact/share/save/order rails untouched; CTA placed above main prose blocks.

### Rentas — translated vs excluded

| Translated | Excluded |
|---|---|
| Title, description, lease conditions, requirements, availability note, shared-space preferences, services included, business description (bio), filtered `flowExtensionRows` prose | `rentDisplay`, deposit/fees, address, city/state, beds/baths/sqft, phone/email/SMS/WhatsApp, website/social, map/video URLs, `businessMarca`, `businessAgentName`, Leonix ad id, structured property specs |

### Restaurantes — translated vs excluded

| Translated | Excluded |
|---|---|
| `aboutBody`, `summaryShort`, menu `supportingLine` only (dish names stay original), stack section prose values, hours special/temporary notes, trust summary line | `businessName`, cuisine/taxonomy chips, contact block, hours time rows, menu prices, primary CTAs/hrefs, ratings counts, IDs/slugs |

### Next step

- **Final manual browser QA** across all wired categories (T4–T9).
- Future DB gate: `original_language` on publish + optional durable `listing_translations`.

### Remaining polish (non-blocking)

1. **En Venta** generic branch nested layout prose
2. **Bienes Raíces** dedicated/preview polish

## Later gates

- **Stored `listing_translations`** — durable bilingual rows after product/schema decisions.
- Additional categories after Servicios pilot proves the contract.

## Guardrails (manual review)

- Before implementing wiring: `git status --short` should be clean at session start; keep commits scoped (user commits manually).
- After changes: `npm run build` from a clean tree; if Windows `.next` rename/manifest errors occur, delete `.next` once and rebuild — **do not** patch unrelated app code for artifact issues.
