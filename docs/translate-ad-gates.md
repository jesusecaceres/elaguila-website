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
| Server provider | `app/lib/translation/serverProvider.ts` — `translateAdWithConfiguredProvider()` (`import "server-only"`; never import from client) |

### Environment (server-only)

| Variable | Required | Notes |
|---|---|---|
| `TRANSLATION_PROVIDER` | Recommended | Set to `deepl` (default when omitted). Any other value → route returns **503**. |
| `DEEPL_API_KEY` | **Yes** | DeepL auth key. Free-tier keys ending in `:fx` auto-select the free API host unless `DEEPL_API_URL` is set. |
| `DEEPL_API_URL` | No | Optional override, e.g. `https://api-free.deepl.com/v2/translate` or `https://api.deepl.com/v2/translate` |

Example (local `.env.local` / Vercel — no real secrets in git):

```bash
TRANSLATION_PROVIDER=deepl
DEEPL_API_KEY=
# DEEPL_API_URL=https://api-free.deepl.com/v2/translate
```

If `DEEPL_API_KEY` is missing or `TRANSLATION_PROVIDER` is not `deepl` (when set), the route returns **HTTP 503** with `{ "error": "Translation provider is not configured." }` — no fake success, no key leakage.

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

- API key is read only in `serverProvider.ts` (`import "server-only"`).
- Route does not accept separate raw contact fields.
- Provider errors return generic messages (502/503); no DeepL response bodies or keys in JSON.
- Full ad text and API keys must not be logged.
- **Rate limiting / auth:** not implemented in T3 — TODO in route for T4+.
- **Durable cache / `listing_translations`:** not implemented in T3 — TODO in route; client session cache only (Gate 3A helpers).

### Out of scope (T3)

- No `TranslateAdControl` wiring on category detail pages
- No `listing_translations` table or Supabase migration
- No durable translation storage (session cache on client only via helpers)

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

### Next rollout candidates

1. **Empleos** — job title + description boundary
2. **Autos** — vehicle description / highlights
3. **Viajes** — offer prose
4. **Generic `anuncio/[id]` shell** — after per-category pilots prove the contract

## Later gates

- **Stored `listing_translations`** — durable bilingual rows after product/schema decisions.
- Additional categories after Servicios pilot proves the contract.

## Guardrails (manual review)

- Before implementing wiring: `git status --short` should be clean at session start; keep commits scoped (user commits manually).
- After changes: `npm run build` from a clean tree; if Windows `.next` rename/manifest errors occur, delete `.next` once and rebuild — **do not** patch unrelated app code for artifact issues.
