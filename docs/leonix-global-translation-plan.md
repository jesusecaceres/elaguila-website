# Leonix Global Translation — G1 Architecture Plan (design only)

**Status:** Planning gate G1 — not implemented.  
**Primary provider target:** Google Cloud Translation API (Advanced).  
**DeepL:** Retire as default; keep adapter optional behind feature flag.

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

## Provider abstraction (G2)

```
app/lib/translation/
  providers/
    types.ts              # TranslationProvider, TranslateBatchRequest/Result
    registry.ts           # resolveProvider(env.TRANSLATION_PROVIDER)
    googleCloudAdvanced.ts
    deepl.ts              # optional, disabled by default
  server/
    translateContent.ts   # mask → provider → unmask → cache lookup/write
```

**Env (server only):**

- `TRANSLATION_PROVIDER=google` (primary)
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` or workload identity (Vercel integration)
- `GOOGLE_TRANSLATE_LOCATION` (e.g. `global`)
- Optional: `TRANSLATION_PROVIDER_FALLBACK=deepl` + `DEEPL_API_KEY` (off in prod until CFO approves)

---

## Database (G4–G5) — `translation_records`

```sql
-- design sketch — not migrated in G1
create table public.translation_records (
  id uuid primary key default gen_random_uuid(),
  content_type text not null,        -- listing | servicios_profile | empleos_job | message | application | magazine_issue | site_block | pdf_page
  content_id text not null,          -- listing id, slug, message id, etc.
  field_key text not null,           -- title | description | body | message | ...
  source_locale text not null,       -- es | en | unknown
  target_locale text not null,       -- es | en | ar | fa | ...
  source_text_hash text not null,    -- sha256 of normalized source prose
  provider text not null,            -- google | deepl | human
  provider_model text,
  masked_source text,                -- optional audit (truncated); prefer hash-only in prod
  translated_text text not null,
  quality_status text not null default 'machine'
    check (quality_status in ('machine','reviewed','rejected','stale')),
  content_version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (content_type, content_id, field_key, target_locale, source_text_hash, content_version)
);
```

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
| **G2** | Provider interface + registry; no behavior change |
| **G3** | Google Cloud Advanced adapter; env docs; feature flag |
| **G4** | `translation_records` migration + read/write service |
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
