# Stack 11 — AI SQL Foundation Audit

**Script:** `npm run ofertas-locales:stack-11-ai-sql-foundation-audit`

## 1. Stack summary

Supabase database foundation for Ofertas Locales AI Product Search: scan jobs + searchable item rows with owner-only RLS. No scan execution, no public exposure, no APIs.

## 2. Migration created

`supabase/migrations/20260606120000_create_oferta_local_ai_scan_items.sql`

## 3. Tables created

| Table | Purpose |
|-------|---------|
| `oferta_local_scan_jobs` | Document AI scan lifecycle per asset |
| `oferta_local_items` | Extracted item candidates / approved searchable rows |

## 4. Scan job lifecycle

`idle` → `pending` → `processing` → `needs_review` → `reviewed` → `approved` | `failed` | `cancelled`

## 5. Item review lifecycle

`pending` → `needs_review` → `approved` | `rejected`  
Defaults: `review_status = pending`, `is_active = false`

## 6. RLS policies

| Table | Policies |
|-------|----------|
| `oferta_local_scan_jobs` | select_owner, insert_owner, update_owner |
| `oferta_local_items` | select_owner, insert_owner, update_owner_reviewable |

No public SELECT. No admin policies (deferred).

## 7. Public exposure rules

- No public SELECT policies
- `canOfertaLocalItemBePubliclyEligible()` requires `review_status = approved`, `is_active = true`, parent `approved`, active dates
- Public results gate must add explicit public RLS + UI later

## 8. Type/helper files

| File | Role |
|------|------|
| `ofertasLocalesTypes.ts` | `OfertaLocalScanJobDbRow/Insert`, `OfertaLocalItemDbRow/Insert`, `OfertaLocalItemPublicEligibilityInput` |
| `ofertasLocalesAiDbMapper.ts` | DB insert mappers + `canOfertaLocalItemBePubliclyEligible` |
| `ofertasLocalesAiArchitecture.ts` | Re-exports eligibility; `canOfertaLocalItemGoPublic` compat |

## 9. Intentionally not implemented

- Document AI / OpenAI / Gemini API calls
- Scan execution API (`/api/ofertas-locales/scan`)
- Item review API (`/api/ofertas-locales/items`)
- Public search/results/detail pages
- Shopping list + Maps route
- Payment, admin, analytics
- Migration apply (`db push`, `reset`, etc.)

## 10. Supabase apply lock

Migration file only. **Do not** run `supabase db push`, `migration up`, `db reset`, or remote DB commands until an approved apply gate.

## 11. TRUE/FALSE checklist

See stack 11 audit script output / final stack report.

## 12. Recommended next stack

**Stack 12 — Scan job enqueue API (service-role insert only)**  
Wire `POST /api/ofertas-locales/scan` to create `oferta_local_scan_jobs` rows without Document AI execution. Follow with **Stack 13 — Document AI integration** after credentials approval.

## QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
