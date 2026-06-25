# Leonix Translation — Safety Guardrails (Pre–Live Smoke Lock)

**Gate:** TRANSLATION-SAFEGUARD-LOCK1  
**Purpose:** Lock safety rules before paid Google Cloud Translation smoke tests.  
**This document does not authorize live translation by itself** — env must still be set per `docs/translation-env-setup.md`.

Related: `docs/translate-ad-gates.md`, `docs/leonix-translation-architecture.md`, `docs/translation-env-setup.md`

---

## 1. Current pipeline status

| Fact | Detail |
|------|--------|
| Live dynamic API | `POST /api/translate-ad` only |
| Request shape | **`maskedFields`** (not `fields`) + `category`, `listingKey`, `sourceLocale`, `targetLocale` |
| Scope today | Ad/listing translatable fields (title, description, body, …) |
| Not in scope yet | Magazine HTML blocks, application/admin Spanish ops, Negocios Locales profiles, Gemini QA, Vision OCR |
| Active provider path | `app/lib/translation/provider.ts` (cache-first + Google v3 REST `translateText`) |
| Route entry | `app/api/translate-ad/route.ts` imports **`provider.ts`**, not `providers/google.ts` |

---

## 2. Cache-first rule (mandatory)

1. **Lookup** `translation_records` via `lookupCachedTranslations()` before any Google call.  
2. **Send only cache misses** to Google (`translateMaskedFieldsViaGoogle` for miss fields only).  
3. **Write back** fresh provider output with `writeCachedTranslations()` when `TRANSLATION_CACHE_STORAGE=supabase` and service role are set.  
4. **Repeat request** with identical masked content → **`fromCache: true`** on full hit (no Google charge).  
5. **Never** call Google on every public page load — translation is user-triggered (Translate Ad control) + cache-backed.

**Stale rows:** If `stale_at IS NOT NULL`, cache read treats row as miss (`serverCache.ts`).

**Cache key identity:** `(category, listing_key, field_key, source_locale, target_locale, source_text_hash, source_text_version)` — hash is SHA-256 of **masked** source text only.

---

## 3. Required env vars (server-only)

| Variable | Required for live smoke |
|----------|-------------------------|
| `TRANSLATION_PROVIDER=google` | **Yes** — omitted → **503** |
| `GOOGLE_CLOUD_PROJECT_ID` | **Yes** |
| `GOOGLE_TRANSLATE_LOCATION` | Optional (default `global`) |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | **Yes on Vercel** (single-line service account JSON) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local dev only (file path or inline JSON) |
| `TRANSLATION_CACHE_STORAGE=supabase` | **Strongly recommended** before paid smoke (cost control) |
| `NEXT_PUBLIC_SUPABASE_URL` | Required with cache |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes with cache** — server only |
| `GOOGLE_TRANSLATE_GLOSSARY_ID` | Optional — wired in `provider.ts` when set |

---

## 4. Forbidden env / secrets

| Forbidden | Reason |
|-----------|--------|
| `NEXT_PUBLIC_GOOGLE*` | Must never reach browser |
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` | Service role is server-only |
| Raw `AIza…` keys in source | Pipeline uses service account OAuth, not browser API keys |
| `BEGIN PRIVATE KEY` in committed files | Credential leak |
| Service account JSON in git | Credential leak |
| Committed `.env.local` | Credential leak |

**Error responses:** Route returns generic messages only — never env values or credentials.

---

## 5. Protected content

Must be **masked** (`__LEONIX_MASK_n__`) before POST. Route rejects unmasked:

| Category | Enforcement |
|----------|-------------|
| Email | `UNMASKED_EMAIL_RE` in route |
| URL / WhatsApp / maps links | `UNMASKED_URL_RE` |
| Phone (7+ digits) | `UNMASKED_PHONE_RE` |
| Mask placeholders during Google call | `wrapMaskPlaceholdersForGoogleHtml` (`translate="no"`) |

Also protected upstream (mask before API — not re-validated as structured fields):

- Business/person names when masked upstream  
- Addresses, prices, currency, IDs, tracking params, coupon codes  

Never store raw contact data in `translation_records` — only masked-source hash + translated prose.

---

## 6. Smoke test order (do not skip)

1. **Env preflight** — `docs/translation-env-setup.md`; migrations applied; no secrets in git.  
2. **First live smoke** — POST with `maskedFields`; expect `200`, `fromCache: false` (unless already cached).  
3. **Second identical request** — expect `fromCache: true`, no second Google call for cached fields.  
4. **PII rejection test** — unmasked email in `maskedFields` → **400**.  
5. **Tiny all-language smoke** — one field per active target locale (`es`…`pa`); confirm no `ar`/`fa`.  
6. **Build** — production build green before marking smoke complete.

**Example body (correct shape):**

```json
{
  "sourceLocale": "en",
  "targetLocale": "es",
  "category": "smoke",
  "listingKey": "smoke-test-001",
  "maskedFields": {
    "title": "Fresh community market specials",
    "description": "Find local offers this week through Leonix Media."
  }
}
```

---

## 7. Do-not-touch list (during smoke gates)

- No schema changes / new migrations without dedicated gate  
- No `ad_translations` or `listing_translations` tables  
- No public UI changes  
- No provider rewrite (`provider.ts` cache-first path is locked)  
- No Google API calls during guardrail/preflight gates  
- No Supabase writes during guardrail gates  
- No credential commits or secret logging  

---

## 8. Locale guardrails (verified in repo)

| Rule | Evidence |
|------|----------|
| 13 active targets | `localeCodes.ts` `TRANSLATE_AD_TARGET_LOCALE_CODES` |
| `tl` → Google `fil` | `mapTranslateAdLocaleToGoogle` |
| `zh` → Google `zh-CN` | Same |
| DB aliases `tl`/`fil`, `zh`/`zh-CN`/`zh-Hans` | Migration `20260527213000` |
| `ar` / `fa` blocked | Not in target allowlist; `HELD_RTL_TRANSLATE_LOCALE_CODES` |

---

## 9. Cache table guardrails (verified in repo)

| Guardrail | Evidence |
|-----------|----------|
| Table `translation_records` | Migration `20260527210000` |
| RLS enabled, no public policies | Same migration + table comment |
| Service-role only access | `serverCache.ts` via `getAdminSupabase()` |
| Unique cache key | `translation_records_cache_key_unique` |
| `source_text_hash` + version in key | Columns + unique constraint |
| `stale_at` invalidation | `readCachedFieldTranslation` skips when `stale_at !== null` |
| No duplicate cache tables in code | Only `TRANSLATION_RECORDS_TABLE = "translation_records"` |

---

## 10. API guardrails (verified in repo)

| Guardrail | Evidence |
|-----------|----------|
| Allowlisted field keys only | `ALLOWED_FIELD_KEYS` in route |
| `maskedFields` required | `parseTranslateAdRequest` |
| `category` / `listingKey` sanitized | `SAFE_META_RE`, max length |
| Locales validated | `isValidTranslateAdSourceLocale` / `Target` |
| Provider gate before Google | `providerGateResponse()` → **503** |
| Config check in provider | `isTranslationProviderConfigured()` |
| Response includes `fromCache` | `AdTranslationResult` in `provider.ts` |
| Optional glossary | `GOOGLE_TRANSLATE_GLOSSARY_ID` in `provider.ts` |

---

## 11. Next gates (ordered)

| Gate | Purpose |
|------|---------|
| `GOOGLE-SECRETS-PREFLIGHT1` | Env checklist + secret safety audit (completed) |
| **`TRANSLATE-AD-LIVE-SMOKE1`** | First paid Google smoke + cache-hit verification |
| `MAG-COMPANION-LANG1` | Magazine companion translation engine |
| `CLASIFICADOS-LANG1` | Classifieds dynamic translation expansion |
| `PUBLISH-LANG1` | Publish/application translation |
| `NEGOCIOS-LOCALES-TRANSLATION-CACHE1` | Business profile translation cache |

---

## Known tech debt (non-blocking for Translate Ad smoke)

`app/lib/translation/providers/google.ts` is a parallel provider module **without** cache wiring; the live route uses `provider.ts` which is cache-first. Consolidate in a future refactor gate — do not switch the route to the uncached path during smoke.
