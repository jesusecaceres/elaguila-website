# Translate Ad — rollout gates

## Gate 3A (foundation) ✅

- Shared locale/types, masking helpers, session-only cache utilities, and `TranslateAdControl` client component live under `app/lib/translation/` and `app/components/translation/`.
- **No Supabase migration** and **no stored `listing_translations`** yet.
- Pilots pass an optional `requestTranslation` callback (typed as `TranslateAdProviderFn`) — not wired to category pages until T4+.
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
| `GOOGLE_APPLICATION_CREDENTIALS` | When `google` (G3) | Service account JSON path or Vercel GCP integration. |

**Strategic direction:** **Google Cloud Translation Advanced** is the future primary provider (**G3**). DeepL is **optional fallback only**, not the long-term default.

Example (local `.env.local` / Vercel — no real secrets in git):

```bash
# G3 target (not implemented until Gate G3):
# TRANSLATION_PROVIDER=google
# GOOGLE_CLOUD_PROJECT_ID=
# GOOGLE_TRANSLATE_LOCATION=global

# Optional fallback until Google is live:
TRANSLATION_PROVIDER=deepl
DEEPL_API_KEY=
```

| `TRANSLATION_PROVIDER` | Behavior (G2+) |
|---|---|
| *(missing)* | **503** — not configured |
| `google` | **501** — not implemented yet (G3) |
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
  "provider": "deepl",
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

- Google Cloud Translation Advanced implementation (**G3**)
- `translation_records` / `listing_translations` tables
- Category detail wiring changes (T4–T9 behavior unchanged from user perspective)

## Gate T4 (Servicios pilot) ✅

### Wired surfaces

| Surface | Path |
|---|---|
| Public Clasificados detail | `app/(site)/clasificados/servicios/[slug]/page.tsx` → `ServiciosProfileView` or `ServiciosProfessionalProfileShell` |
| Translation layer | `app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx` |
| Payload + API client | `app/(site)/servicios/lib/serviciosTranslateAd.ts` |

- `TranslateAdControl` with `category="servicios"`, `siteLocale` from `?lang=`, `listingKey` = public slug (or engagement id fallback).
- Client `requestServiciosAdTranslation` → `POST /api/translate-ad` (masked fields only; no API keys in the browser).
- **Session cache only** via Gate 3A helpers (`leonix:adTranslate`); no Supabase migration and no `listing_translations` table.

### Translated fields (user prose)

- About body (`description`)
- Specialties line (`customServiceText`)
- Service card titles + secondary lines (`details` — tab-encoded, reapplied by index)
- Business highlight labels (`highlights` — newline-separated)
- First promotion headline (`shareText`)

### Excluded (never sent / never replaced)

- `businessName`, phone, email, website, WhatsApp, address, maps URL, social links, prices, license numbers, raw URLs, contact card fields

### Original language (T4 limitation)

- Listings do not yet store advertiser `original_language`; pilot uses `originalLocale="unknown"` and `sourceLocale: "unknown"` on the API request.
- CTA is shown when translatable prose exists and `siteLocale` is `es` or `en` (Servicios-specific; global `shouldOfferTranslateAd` unchanged).
- Future: persist original locale on publish and pass detected/stored locale for smarter CTA gating.

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
