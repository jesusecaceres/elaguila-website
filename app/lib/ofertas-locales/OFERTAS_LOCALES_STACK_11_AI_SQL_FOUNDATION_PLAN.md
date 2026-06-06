# Stack 11 — Ofertas Locales AI SQL Foundation Plan

## 1. Existing DB/RLS pattern found

| Pattern | Repo convention |
|---------|-----------------|
| Migration naming | `YYYYMMDDHHMMSS_snake_description.sql` (e.g. `20260605120000_ofertas_locales.sql`) |
| Table naming | `snake_case`, plural parent `ofertas_locales`, child prefix `oferta_local_*` |
| Primary key | `uuid primary key default gen_random_uuid()` |
| Owner FK | `owner_id uuid not null references auth.users (id) on delete cascade` |
| Status fields | `text not null` + `check (...)` enum lists |
| Timestamps | `created_at` / `updated_at timestamptz not null default now()` — **no DB trigger**; app sets `updated_at` |
| JSONB | Used on parent (`flyer_assets`, `coupon_assets`); child items use typed columns + `text[]` for tags |
| Indexes | `{table}_{column(s)}_idx` on owner_id, status, FKs, dates |
| RLS | `enable row level security`; policies named `{table}_{action}_{scope}` |
| Auth role | `to authenticated` with `owner_id = auth.uid()` |
| Public read | **Explicitly deferred** — comment in migration, no anon/authenticated public SELECT |
| Admin policies | Not used on `ofertas_locales`; deferred for scan/items |

## 2. Current `ofertas_locales` parent table compatibility

Stack 7 table (`20260605120000_ofertas_locales.sql`) provides:

- `id uuid` — **correct parent FK** for scan jobs and items
- `owner_id` — duplicate on child tables for RLS simplicity (matches repo classifieds pattern)
- `status` — parent must be `approved` for future public item eligibility (enforced in app helpers, not DB)
- Business location fields — copied onto items at extraction time for future search/cards
- No public SELECT policy — children inherit same exposure posture

## 3. Recommended table: `oferta_local_scan_jobs`

Tracks Document AI scan lifecycle per asset. FK `oferta_local_id → ofertas_locales(id) on delete cascade`.  
`owner_id` duplicated for owner RLS without join.

## 4. Recommended table: `oferta_local_items`

Extracted item/deal candidates and approved searchable rows.  
FK `oferta_local_id → ofertas_locales(id) on delete cascade`.  
FK `scan_job_id → oferta_local_scan_jobs(id) on delete set null`.  
Defaults: `review_status = pending`, `is_active = false`.

## 5. Future table placeholders

| Table | Stack |
|-------|-------|
| `oferta_local_shopping_lists` | Stack 14+ (session lists) |
| `oferta_local_route_events` | Stack 15+ (route analytics) |

Document only — no migration in Stack 11.

## 6. Scan job status lifecycle

`idle` → `pending` → `processing` → `needs_review` → `reviewed` → `approved` | `failed` | `cancelled`

## 7. Item review lifecycle

`pending` → `needs_review` → `approved` | `rejected`  
Only `approved` + `is_active = true` + parent approved + active dates → future public eligibility.

## 8. RLS strategy

- Enable RLS on both tables
- Owner SELECT / INSERT / UPDATE on own rows (`owner_id = auth.uid()`)
- Item UPDATE limited to `review_status in (pending, needs_review, rejected)` for row access; WITH CHECK allows transition to `approved`
- **No public SELECT** — deferred to public-results gate
- **No admin policies** — deferred (no clear ofertas_locales admin pattern)

## 9. Index strategy

B-tree on owner_id, oferta_local_id, status/review_status, category, city, zip, dates, scan_job_id, normalized_item_name, sponsorship.  
GIN on `search_tags` (repo supports GIN on arrays/jsonb).

## 10. Public exposure rules

- No public SELECT policies in this stack
- `is_active` defaults `false`
- `review_status` defaults `pending`
- App helper `canOfertaLocalItemBePubliclyEligible()` mirrors future gate rules

## 11. Safety risks

| Risk | Mitigation |
|------|------------|
| Auto-public items | Defaults + no public RLS + helper gate |
| Orphan items after offer delete | CASCADE on `oferta_local_id` |
| Owner mismatch | INSERT WITH CHECK `owner_id = auth.uid()` |
| Post-approval tampering | Item UPDATE policy excludes `approved` rows from USING |

## 12. Gate B/C implementation

- Migration `20260606120000_create_oferta_local_ai_scan_items.sql`
- DB row/insert types + `ofertasLocalesAiDbMapper.ts`
- Stack 11 audit script + audit doc
- `npm run build` once at Gate C end

## 13. Remains pending

- Document AI scan API execution
- Item review UI (owner dashboard)
- Public item search / results / detail pages
- Shopping list + Maps route UI
- Admin moderation policies
- `updated_at` trigger (optional; app-managed like parent table)

## 14. QA URLs

- https://www.leonixmedia.com/publicar/ofertas-locales?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales?lang=en
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=es
- https://www.leonixmedia.com/publicar/ofertas-locales/preview?lang=en
