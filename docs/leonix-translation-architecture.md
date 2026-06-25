# Leonix Translation Architecture

**Gate:** GOOGLE-TRANSLATION-ARCH-LOCK1  
**Status:** Architecture lock — foundation only; no translation engine, API calls, or migrations in this gate.  
**Canonical language metadata:** `app/lib/leonix/languageMetadata.ts` (`LEONIX_LANGUAGE_METADATA`)  
**Existing provider/cache:** `app/lib/translation/**`, `translation_records` (Supabase)

---

## 1. Product stack

| Layer | Role | Leonix usage |
|-------|------|----------------|
| **Cloud Translation Advanced v3** | Dynamic user/database content | Classifieds listings, Negocios profiles, on-demand Translate Ad fields |
| **Vertex AI Gemini** | Editorial localization, QA, admin summaries | Magazine HTML companion blocks, Media Kit long copy review, application triage summaries |
| **Cloud Vision API** | OCR / visual text extraction | Admin workflows for scanned print assets (coupons, flyers, magazine inserts) — not public runtime |
| **Google Translate Website Mode** | Public fallback helper | `/translate-site` gateway; never the official native renderer |
| **Google Lens (user guidance)** | Print/visual helper | QR translator + magazine print guide — user-side, not server translation |
| **HTML companion** | Multilingual access layer | June 2026 magazine structured HTML; preferred over translating FlipHTML5/PDF layout |

### Do not use now

- **AutoML Translation** — unnecessary cost/complexity at current scale  
- **Google Translate Widget** — pollutes DOM, bypasses Leonix masking/tracking, not brand-safe  
- **Fake translated PDF/FlipHTML5** — visual editions stay Spanish unless separate human-produced assets exist

### Future env names (document only — not set in this gate)

- `TRANSLATION_PROVIDER=google`  
- `GOOGLE_CLOUD_PROJECT_ID`  
- `GOOGLE_APPLICATION_CREDENTIALS_JSON` / `GOOGLE_APPLICATION_CREDENTIALS`  
- `GOOGLE_TRANSLATE_LOCATION` (e.g. `global`)  
- `TRANSLATION_CACHE_STORAGE=supabase`  
- Optional Gemini: `VERTEX_AI_PROJECT`, `VERTEX_AI_LOCATION`, model id per workflow  
- Optional Vision: same GCP project + Vision API enablement

---

## 2. Page strategy

| Surface | Strategy |
|---------|----------|
| Root intro `/` | Native registry only (`ROOT_INTRO_COPY`) — no machine translate |
| Coming Soon | Native registry only (`leonixComingSoonCopy`) |
| Header / footer / forms | Native registry only (`publicChromeCopy`, `publicFormCopy`) |
| QR translator | Native registry only (`qrGuideCopy`) |
| Translate helper `/translate-site` | Native registry + Google Website Mode CTA |
| Media Kit | Native registry + human/Gemini-reviewed long copy |
| Digital magazine HTML | Structured content blocks + reviewed/machine cached translations |
| Classifieds (Clasificados) | Dynamic translation cache on publish or first view |
| Negocios Locales | Dynamic translation cache for descriptive fields |
| Applications / admin | Original submission stored; Spanish operational base + optional English/admin summary |

**Rule:** Marketing/gateway pages never depend on live Google API at request time.

---

## 3. Protected fields

Never send to providers (mask before translate, restore after):

- Business names (unless owner explicitly opts in)  
- Person names  
- Phone numbers  
- Email addresses  
- URLs  
- Physical addresses  
- Prices and currency amounts  
- Dates (except locale formatting)  
- Internal IDs (listing id, order id, user id)  
- Tracking params (`sourcePage`, `sourceCta`, `lang`, UTM)  
- Legal identifiers (EIN, license numbers)

**Implementation today:** `app/lib/translation/contactMask.ts`, `providers/maskPlaceholders.ts`  
**Architecture rule:** All future engines must use the same mask → translate → unmask pipeline.

---

## 4. Recommended future tables

| Table | Purpose |
|-------|---------|
| `translation_records` | **Canonical dynamic cache** (exists — Translate Ad) |
| `translation_glossary_terms` | Brand terms, place names, do-not-translate list |
| `translation_jobs` | Async batch work (applications, magazine blocks, bulk retranslate) |
| `translation_reviews` | Human QA decisions linked to cache rows |
| `content_source_records` | Optional provenance for magazine/admin structured blocks |

**Do not introduce:** `ad_translations`, `listing_translations` (competing caches — rejected in audits).

---

## 5. Recommended record fields

Extend `translation_records` (or parallel job/review tables) toward:

| Field | Purpose |
|-------|---------|
| `sourceType` | e.g. `listing_field`, `magazine_block`, `application_field` |
| `sourceId` | Stable entity id |
| `sourceHash` | SHA-256 of masked source prose |
| `sourceLang` | Detected or declared source locale |
| `targetLang` | Leonix route code |
| `provider` | e.g. `google-cloud-translation` |
| `model` | Provider model id (Gemini vs Translation API) |
| `status` | `pending`, `cached`, `stale`, `reviewed`, `rejected` |
| `translatedJson` | Field-level or block-level payload |
| `protectedFields` | Mask map used for this row |
| `reviewedBy` | Staff user id |
| `reviewedAt` | ISO timestamp |
| `qualityNotes` | Admin/Gemini notes |
| `createdAt` / `updatedAt` | Audit |

**Current table:** `supabase/migrations/20260527210000_create_translation_records.sql` (+ locale expansion migration).

---

## 6. Fallback order

1. **Reviewed translation** (human or Gemini-approved cache row)  
2. **Machine translation cache** (`translation_records` or session cache)  
3. **Native/base source language** with visible disclaimer (e.g. magazine visual truth note)  
4. **Google Translate Website helper** (`/translate-site`)  
5. **Never** claim a PDF/FlipHTML5 is translated when only Spanish visual assets exist

---

## 7. Digital magazine strategy

- **Visual PDF / FlipHTML5:** Remains Spanish unless separate translated visual files are produced and linked explicitly.  
- **HTML companion:** Multilingual access layer — structured blocks, not a pixel translation of the flipbook.  
- **Block types:** `article`, `businessAd`, `classifiedAd`, `contactBlock`, `coupon`, `event`, `recipe`, `qrAction`, `sponsorCard`  
- **Every block:** Preserve CTA `sourcePage` / `sourceCta` / `lang` tracking on outbound links.  
- **Translation path:** Native registry for chrome → cached/reviewed block translations → Gemini for editorial QA → no live API on reader critical path.

---

## 8. Applications / admin strategy

1. Store **original submission** verbatim.  
2. Detect **source language**.  
3. Translate to **Spanish operational base** for staff queues.  
4. Optionally translate to **English** for bilingual admin.  
5. **Gemini** may summarize/classify (category, urgency) — not replace stored originals.  
6. **Protected fields** untouched in all provider payloads.  
7. Prefer **background jobs** (`translation_jobs`) for non-blocking admin UX.

---

## 9. Clasificados strategy

- Original user content stored in listing records.  
- **Translatable fields** separated from protected fields at builder level (`*TranslateAd.ts` pattern).  
- Translation cache generated on **publish** or **first view** (product decision per category).  
- Admin review + user “report bad translation” in later gates.  
- Reuse `translation_records` category/listing_key/field_key — do not fork schema per category.

---

## 10. Negocios Locales strategy

- Business profile has **original/base language**.  
- Translatable: descriptions, services, promotions, hours prose.  
- Protected: business name (default), contact phone/email, address, URLs.  
- QR-driven pages preserve `lang`, `sourcePage`, `sourceCta`, `businessId`.

---

## Language configuration

### Canonical sources

| Concern | File |
|---------|------|
| Route codes, normalization | `app/lib/language.ts` |
| Translation metadata | `app/lib/leonix/languageMetadata.ts` |
| Translate Ad locale allowlist | `app/lib/translation/localeCodes.ts` |
| Google Website Mode targets | `app/lib/googleTranslateWebsite.ts` (helper only) |
| Root intro copy | `app/lib/rootIntroCopy.ts` |

### Active production languages (13)

`es`, `en`, `vi`, `pt`, `tl`, `km`, `zh`, `ja`, `ko`, `hi`, `hy`, `ru`, `pa`

### Held RTL (inactive)

`ar`, `fa` — metadata exists with `status: "held"`, `isActive: false`; hidden from selectors until RTL layout gate.

### Google target mapping

| Leonix route | Google target |
|--------------|---------------|
| `tl` | `fil` |
| `zh` | `zh-CN` |
| Others | Same as route (`PROVIDER_LANGUAGE_CODES`) |

Central function: `mapRouteLangToGoogleTarget()` in `languageMetadata.ts`.

### Adding a future language (toward 23)

1. Add code to `SupportedLang` + `ACTIVE_PUBLIC_LANGS` in `language.ts`.  
2. Add `LanguageMeta` entry in `languageMetadata.ts` (or extend generated registry).  
3. Add native copy registries: `rootIntroCopy`, `publicChromeCopy`, category copy as needed.  
4. Extend `translation_records` locale CHECK constraints via migration when enabling dynamic translate.  
5. Run `npx tsx scripts/verify-leonix-language-metadata.ts`.  
6. TypeScript `Record<SupportedLang, …>` copy maps fail the build if any surface is missing entries.

---

## Validation checklist (Gate C)

Run:

```bash
npx tsx scripts/verify-leonix-language-metadata.ts
```

Confirms:

- [ ] 13 active production codes match `ACTIVE_PUBLIC_LANGS`  
- [ ] `ar` / `fa` inactive with `status: "held"`  
- [ ] Every active language has `googleTargetCode`  
- [ ] `tl` → `fil`, `zh` → `zh-CN`  
- [ ] No duplicate translation tables introduced  
- [ ] Metadata usable for dropdowns and future API mapping

---

## Related docs

- `docs/leonix-global-translation-plan.md` — Translate Ad gates G1–G5  
- `docs/translate-ad-gates.md` — API contract and cache evolution  
- `docs/qa/lang-content-coverage-audit.md` — copy coverage audits
