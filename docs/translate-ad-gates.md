# Translate Ad — rollout gates

## Gate 3A (foundation) ✅

- Shared locale/types, masking helpers, session-only cache utilities, and `TranslateAdControl` client component live under `app/lib/translation/` and `app/components/translation/`.
- **No Supabase migration** and **no stored `listing_translations`** yet.
- **No production translation provider** or API route in this gate — pilots pass an optional `requestTranslation` callback later (typed as `TranslateAdProviderFn`).
- Translate Ad must remain **user-triggered** (no auto-translate on render).
- **Do not translate or ship raw contact fields** — emails, phones, URL/WhatsApp/map-like strings are masked before any future provider call; prices and legal copy stay out of the default picked fields.

## Gate T3 (API route + provider contract) ✅

- Server-side API route: `POST /api/translate-ad`
- Accepts `TranslateAdRequest` shape: `{ maskedFields, category, listingKey, sourceLocale, targetLocale }`
- Returns `AdTranslationResult` shape on success.
- **Provider:** DeepL (configured via env variables).
- **Required environment variables** (server-only, never exposed to client):
  - `TRANSLATION_PROVIDER=deepl`
  - `DEEPL_API_KEY=<your-deepl-api-key>`
- **Missing env behavior:** returns HTTP 503 with `"Translation provider is not configured."` — safe, no credentials leaked.
- **Validation:** rejects invalid locales, empty payloads, oversized fields (5000 chars/field, 12000 total).
- **Safety:** mask placeholders (`__LEONIX_MASK_N__`) are wrapped in XML ignore-tags so DeepL preserves them verbatim. Client is responsible for masking before calling (via `maskTranslatableFields`).
- **No Supabase migration** in this gate.
- **No category UI wiring** in this gate.
- **No database-level translation caching** — session cache on client only for now.
- TODO: per-user rate limiting and auth in a future gate.

## Next gates

1. **Servicios pilot** — first category wiring through an existing resolver boundary (`profile_json` / profile view). Wire `TranslateAdControl` with a `requestTranslation` callback that POSTs to `/api/translate-ad`.
2. **Stored `listing_translations`** — durable bilingual rows after product/schema decisions.

## Guardrails (manual review)

- Before implementing wiring: `git status --short` should be clean at session start; keep commits scoped (user commits manually).
- After changes: `npm run build` from a clean tree; if Windows `.next` rename/manifest errors occur, delete `.next` once and rebuild — **do not** patch unrelated app code for artifact issues.
