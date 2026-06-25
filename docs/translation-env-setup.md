# Leonix Translation — Environment Setup (Preflight)

**Gate:** GOOGLE-SECRETS-PREFLIGHT1  
**Scope:** Environment variable readiness for `/api/translate-ad` — no secrets in git, no `NEXT_PUBLIC_*` Google keys.

Related: `docs/translate-ad-gates.md`, `docs/leonix-translation-architecture.md`, `docs/leonix-global-translation-plan.md`

---

## Before you set keys

1. Apply Supabase migrations `20260527210000_create_translation_records.sql` and `20260527213000_expand_translation_records_locale_constraints.sql` in the target project.
2. Confirm the service account has **Cloud Translation API** enabled (Advanced v3 REST).
3. Never commit `.env.local`, service account JSON files, or paste keys into source/docs.
4. Pipeline is **cache-first**: identical masked payloads should hit `translation_records` before Google is billed again.

---

## Required — Google provider (Production / Vercel)

| Variable | Example shape | Notes |
|----------|---------------|-------|
| `TRANSLATION_PROVIDER` | `google` | **Required.** Omitted or `disabled` → route returns **503**. `deepl` is not active on the live route path. |
| `GOOGLE_CLOUD_PROJECT_ID` | `my-gcp-project` | GCP project id (not display name). |
| `GOOGLE_TRANSLATE_LOCATION` | `global` | Optional; defaults to `global` in code if omitted. |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | single-line JSON | **Vercel/production:** paste full service account JSON as one line. |

---

## Required — Google provider (Local dev)

| Variable | Notes |
|----------|-------|
| `TRANSLATION_PROVIDER` | `google` |
| `GOOGLE_CLOUD_PROJECT_ID` | Same as production project or a dev project. |
| `GOOGLE_TRANSLATE_LOCATION` | Optional; default `global`. |
| `GOOGLE_APPLICATION_CREDENTIALS` | **Local file path** to service account JSON **or** inline JSON string (if value starts with `{`). |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Alternative to file path — single-line JSON (works locally too). |

**JSON formatting warning:** Invalid JSON in `GOOGLE_APPLICATION_CREDENTIALS_JSON` causes **503** (configured check fails). Escape newlines in private key or use Vercel’s secret UI — do not commit the file.

---

## Required — Supabase durable cache (optional but recommended)

| Variable | Server-only | Notes |
|----------|-------------|-------|
| `TRANSLATION_CACHE_STORAGE` | Yes | Set to `supabase` to enable read/write of `translation_records`. Any other value → cache skipped safely; Google still works. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public URL only | Already used site-wide; not a secret. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes — server only** | Required with `TRANSLATION_CACHE_STORAGE=supabase`. Never prefix with `NEXT_PUBLIC_`. |

Without both cache env **and** service role, responses still translate but **`fromCache: false`** on every request.

---

## Optional

| Variable | Purpose |
|----------|---------|
| `GOOGLE_TRANSLATE_GLOSSARY_ID` | Cloud Translation glossary id (suffix only). Wired in `app/lib/translation/provider.ts` when set. |

---

## Forbidden

| Pattern | Why |
|---------|-----|
| `NEXT_PUBLIC_GOOGLE*` | Would expose credentials or provider config to the browser. **Not used in this repo.** |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | Service role must never reach the client. **Not used.** |
| `AIza…` API keys in source | Translate Ad uses **service account OAuth**, not browser API keys. |
| Committed `.env.local` / `*.json` service accounts | Git history leak risk. |

---

## Active languages (Translate Ad)

**Supported targets:** `es`, `en`, `vi`, `pt`, `tl`, `km`, `zh`, `ja`, `ko`, `hi`, `hy`, `ru`, `pa`  
**Held (rejected at API):** `ar`, `fa`

Google mapping (central): `tl` → `fil`, `zh` → `zh-CN` (`app/lib/translation/localeCodes.ts`).

---

## Smoke test shape (POST `/api/translate-ad`)

Use **`maskedFields`**, not `fields`. Contact data must be masked (`__LEONIX_MASK_n__` placeholders) before POST.

```json
{
  "category": "en-venta",
  "listingKey": "smoke-test-listing-1",
  "sourceLocale": "es",
  "targetLocale": "vi",
  "maskedFields": {
    "title": "Título de prueba",
    "description": "Descripción de prueba sin teléfono ni correo."
  }
}
```

**Expected when configured:**

- First call: `200`, `fromCache: false` (unless row already exists), `provider`: `google-cloud-translation`
- Second identical call (with cache env set): `200`, `fromCache: true`, no Google charge for cached fields

**Expected when not configured:**

- `503` — `{ "error": "Translation provider is not configured." }` (no env values in body)

**Rejected:**

- Unmasked email/phone/URL in `maskedFields` → `400`
- `ar` / `fa` as `targetLocale` → `400`
- Empty `maskedFields` → `400`

---

## Repo evidence map

| Concern | File |
|---------|------|
| Env gate / missing vars | `app/lib/translation/config.ts`, `app/lib/translation/provider.ts` |
| Cache-first orchestration | `app/lib/translation/provider.ts` → `serverCache.ts` |
| Google v3 REST | `app/lib/translation/provider.ts` (`translateText` REST, not widget) |
| Route validation | `app/api/translate-ad/route.ts` |
| Locale allowlist | `app/lib/translation/localeCodes.ts` |
| DB table | `supabase/migrations/20260527210000_create_translation_records.sql` |

---

## Not in scope for Translate Ad smoke

- Magazine HTML block translation engine  
- Application/admin Spanish operational pipeline  
- Negocios Locales profile translation  
- Vertex AI Gemini review/summarization  
- Cloud Vision OCR  

See `docs/leonix-translation-architecture.md` for future gates.
