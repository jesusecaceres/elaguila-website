# Leonix Global Translation — G1 Architecture Plan (design only)

**Status:** G1 design complete; **G2 provider abstraction** ✅; **G3 Google backend** ✅; **SQL1 durable cache migration** ✅ (activate with env + deploy).  
**Primary provider:** Google Cloud Translation API (Advanced) when `TRANSLATION_PROVIDER=google`.  
**DeepL:** Optional fallback only (`TRANSLATION_PROVIDER=deepl`); not the strategic default.

---

## Principles

1. **Never mutate source content** on translate — display overlay + durable cache rows only.
2. **Mask before provider** — emails, phones, URLs, WhatsApp/maps (existing `contactMask.ts`).
3. **Server-only secrets** — no `NEXT_PUBLIC_*` translation keys.
4. **ES + EN base outputs** — canonical bilingual cache for listings; site UI stays dictionary-driven.
5. **User-triggered** for ads (keep `TranslateAdControl`); precompute/cache for scale later.

---

## Keep (from Translate Ad gates T3–T9)

| Layer | Path |
|-------|------|
| UI control | `app/components/translation/TranslateAdControl.tsx` |
| Masking / session cache | `app/lib/translation/helpers.ts`, `contactMask.ts` |
| Client POST | `app/lib/translation/requestAdTranslation.ts` |
| Route shell | `app/api/translate-ad/route.ts` (extend, do not break contract) |
| Category builders | `*TranslateAd.ts`, `use*Translation.ts`, translation layers |
| i18n shell | `?lang=es|en`, `Navbar.switchLang`, `appendLangToPath` |

---

## Provider abstraction (G2) ✅

Implemented layout (G2):

```
app/lib/translation/
  config.ts               # TranslationProviderName, getTranslationProviderConfig()
  errors.ts               # NotConfigured, NotImplemented, Unsupported, Request
  providers/
    index.ts              # translateAdWithConfiguredProvider()
    google.ts             # placeholder — G3
    deepl.ts              # optional fallback
    maskPlaceholders.ts
  serverProvider.ts       # facade for API route
```

G3 ✅ implements `providers/google.ts` (Cloud Translation Advanced v3, server-only).

**Env (server only):**

- `TRANSLATION_PROVIDER=google` (primary)
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` (Vercel) or `GOOGLE_APPLICATION_CREDENTIALS` (local file)
- `GOOGLE_TRANSLATE_LOCATION` (e.g. `global`)
- Optional: `TRANSLATION_PROVIDER_FALLBACK=deepl` + `DEEPL_API_KEY` (off in prod until CFO approves)
- **SQL1 cache:** `TRANSLATION_CACHE_STORAGE=supabase` (after migration applied) + `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`

---

## Database (SQL1 / G5) — `translation_records` ✅

Migration: `supabase/migrations/20260527210000_create_translation_records.sql`

| Column | Purpose |
|--------|---------|
| `category`, `listing_key` | Translate-ad request identity (not raw contact data) |
| `field_key` | Allowlisted translatable field |
| `source_locale`, `target_locale` | `es` / `en` / `unknown` → `es` / `en` |
| `source_text_hash` | SHA-256 of **masked** source prose |
| `source_text_version` | Masking rules version (`v1`) |
| `translated_text` | Provider output only |
| `provider`, `provider_model` | e.g. `google-cloud-translation` |
| `quality_status`, `stale_at` | Future QA / invalidation |

**RLS:** enabled, no public policies — server service role only via `app/lib/translation/serverCache.ts`.

**Activation:** migration apply → `TRANSLATION_CACHE_STORAGE=supabase` → redeploy. Until then, cache adapter no-ops safely.

**Original language (G5):**

- `public.listings.original_language` (`es`|`en`|`unknown`)
- Category tables: `empleos_public_listings.lang` (exists), extend servicios/restaurantes/viajes staged rows
- **Do not overwrite** `title`/`description` columns — store originals in place; translations only in `translation_records` or `*_display` views

**Invalidation:** bump `content_version` on listing edit; hash mismatch → retranslate on next request.

---

## API evolution

- **Phase 1:** `POST /api/translate-ad` unchanged body; server uses Google via abstraction.
- **Phase 2:** `POST /api/translate` with `contentType`, `contentId`, `fields[]` (internal); translate-ad becomes thin wrapper.
- Rate limit + optional auth (G8+).

---

## Language config (G6)

| Tier | Locales | UI | User content |
|------|---------|-----|--------------|
| Launch | `es`, `en` | Static dictionaries (Navbar, Footer, TranslateAdControl labels) | Cached ES/EN via records |
| Phase 2 | `ar`, `fa` | RTL layout tokens + `dir` | On-demand translate + cache |
| Collection | User form | “Request your language” → admin queue, not auto-wire |

**RTL:** `localeConfig[lang].dir`, logical CSS, mirror nav drawer; test Arabic/Farsi on mobile.

---

## Product surfaces

| Surface | G gate | Notes |
|---------|--------|-------|
| Translate Ad (7 categories) | G3, G7 | Provider swap only first |
| Global language selector | G6 | Extend beyond `es`/`en` when dictionaries exist |
| Forms / applications / messages | G8 | Translate display of `message` body; never auto-translate PII fields |
| Magazine / ad pages | G9 | `magazine_issues.title_*`; PDF async pipeline separate |
| QR landing | G9 | Future `/q/{id}` — same cache keys as business profile |
| PDF / documents | G10+ | GCS + Document AI or batch Translate; high cost/risk |

---

## Implementation gates

| Gate | Scope |
|------|--------|
| **G2** | ✅ Provider interface + registry; DeepL isolated; Google placeholder; no category/DB changes |
| **G3** | ✅ Google Cloud Advanced adapter; env docs; `TRANSLATION_PROVIDER=google` |
| **G4 / SQL1** | ✅ Server cache adapter + `translation_records` migration; enable with `TRANSLATION_CACHE_STORAGE=supabase` |
| **G5** | `original_language` + publish pipeline writes |
| **G6** | Language config module + selector UX (ES/EN stable) |
| **G7** | Wire cache lookup into translate-ad + category hooks |
| **G8** | Messages, applications, inquiry bodies |
| **G9** | Magazine metadata + QR/business landing |
| **G10** | Disclaimers, analytics events, cost guards, full QA |

---

## Disclaimers (G10)

- Machine translation notice near `TranslateAdControl` and global footer when `target !== source`.
- “Contact/price shown in original language” for protected fields.

## Analytics (G10)

- `translation_requested`, `translation_served_cache`, `translation_provider_error`, `translation_chars` (aggregated, no raw text).

---

## Risks

See G1 audit report — cost, schema migration, RTL, PDF, category regression, PII logging.
