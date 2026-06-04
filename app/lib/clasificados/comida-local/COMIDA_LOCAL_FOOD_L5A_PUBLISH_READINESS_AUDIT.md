# Gate FOOD-L5A — Comida Local Publish + DB + Package Readiness Audit

**Status:** Audit-only — no implementation in this gate.  
**Date:** 2026-06-04

---

## 1. Preflight status

| Class | Result |
|---|---|
| RELATED_ALLOWED | `app/lib/clasificados/comida-local/**`, `scripts/comida-local-food-l5a-publish-readiness-audit.ts`, `package.json` (audit script line only) |
| RELATED_BLOCKING | None |
| UNRELATED_PARALLEL_WORK | Empleos, Bienes Raíces, Rentas, Autos, Servicios preview — **not modified** in FOOD-L5A |

Commands: `git status --short`, `git diff --name-only` — unrelated category edits present; FOOD-L5A touches only allowed paths.

---

## 2. Prior gate decisions used

| Gate | Carry-forward for publish |
|---|---|
| FOOD-L1 | Product **Comida Local**; separate from Restaurantes Premium (~$399); routes `/publicar/comida-local`, `/clasificados/comida-local`, `/clasificados/comida-local/[slug]`; packages Basic ~$99 / Plus ~$149; Leonix ID `COMIDA-YYYY-######`; dedicated table recommended |
| FOOD-L2 | `ComidaLocalDraft` types; `COMIDA_LOCAL_CATEGORY_KEY`; validation helpers; no publish |
| FOOD-L3 | `leonix:comida-local:draft:v1` localStorage; NorCal `cityCanonical`; phone/social formatters; `validateComidaLocalDraftForFuturePublish` |
| FOOD-L4 | `mapComidaLocalDraftToPreviewVm`; preview at `/clasificados/comida-local/preview`; **no fake Leonix ID** on preview; contact CTAs data-driven; images deferred |

**Before publish can safely exist:**

1. Server-side validation mirroring `validateComidaLocalDraftForFuturePublish` + image readiness.
2. Auth: `owner_user_id` from session (same as Restaurantes/Servicios publish routes).
3. Supabase admin configured (`SUPABASE_SERVICE_ROLE_KEY`).
4. Migration + RLS for `comida_local_public_listings`.
5. Leonix ID counter namespace registered in Postgres.
6. Image URLs as HTTPS storage refs (no base64 in API body) — ideally FOOD-L5C before or atomic with FOOD-L5B.
7. Payment policy decided (pay-before-publish vs publish-pending-payment).

---

## 3. Files inspected (read-only)

### Comida Local (current)

- `comidaLocalTypes.ts`, `comidaLocalValidation.ts`, `comidaLocalDraftPersistence.ts`
- `mapComidaLocalDraftToPreviewVm.ts`, `comidaLocalFormatting.ts`, `comidaLocalCity.ts`
- FOOD-L1 through FOOD-L4 audit markdown files

### Restaurantes publish (reference)

- `app/api/clasificados/restaurantes/publish/route.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesLeonixAdId.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesPublicListingMapper.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesSlug.ts`
- `app/api/clasificados/restaurantes/draft-media-upload/route.ts`
- `supabase/migrations/20260408120000_restaurantes_public_listings.sql`
- `supabase/migrations/20260505140000_restaurantes_public_listings_leonix_ad_id.sql`
- `app/(site)/dashboard/restaurantes/page.tsx`
- `app/admin/(dashboard)/workspace/clasificados/restaurantes/page.tsx`

### En Venta / Varios (reference)

- `app/(site)/clasificados/en-venta/publish/enVentaPublishFromDraft.ts` (client Supabase insert into `listings`)
- `app/lib/clasificados/en-venta/*` publish audits (visibility, Leonix ID on `listings.leonix_ad_id`)

### Shared

- `app/lib/supabase/leonixAdIdsServer.ts` (`leonix_allocate_formatted` RPC)
- `app/admin/_lib/classifiedsOpsContract.ts`
- `app/lib/ownerEngagementListingKeys.ts`
- `app/lib/analytics/server/resolveListingAnalyticsIdentity.ts`
- `app/lib/clasificados/CLASIFICADOS_C6_STRIPE_READINESS_ACTIVATION_CONTRACT.md` (read-only pricing patterns)
- `app/(site)/clasificados/config/categoryConfig.ts` (no `comida-local` yet)

---

## 4. Files changed (this gate)

| File | Change |
|---|---|
| `COMIDA_LOCAL_FOOD_L5A_PUBLISH_READINESS_AUDIT.md` | This document |
| `scripts/comida-local-food-l5a-publish-readiness-audit.ts` | Static audit |
| `package.json` | `comida-local:food-l5a-publish-readiness-audit` script |

---

## 5. Existing publish flow findings

### Restaurantes (closest model)

| Aspect | Pattern |
|---|---|
| API | `POST /api/clasificados/restaurantes/publish` — service role, JSON body with draft |
| Validation | `satisfiesRestauranteMinimumValidPreview`, contact path, operating signal, publish image gate |
| Heavy media guard | Rejects data:/blob: in payload (>1MB cap) |
| Table | `restaurantes_public_listings` — indexed columns + `listing_json` full draft |
| Slug | `slugifyRestauranteBusinessName` + collision suffix loop |
| Leonix ID | `allocateNextRestauranteLeonixAdId` → RPC namespace `restaurantes`, prefix `REST`; preserved on republish |
| Update path | Match `draft_listing_id` for idempotent republish |
| Package | `package_tier` free/standard from body; featured/supporter admin-only |
| Images | Pre-upload via `draft-media-upload`; publish stores `hero_image_url` + refs in JSON |
| Dashboard | Dedicated `/dashboard/restaurantes` |
| Admin | `/admin/workspace/clasificados/restaurantes` |
| Public detail | `/clasificados/restaurantes/[slug]` reads published row |

### En Venta / Varios (simpler, different storage)

| Aspect | Pattern |
|---|---|
| Publish | **Client-side** `publishEnVentaFromDraft` → `listings` table insert (no dedicated API route) |
| ID | `listings.leonix_ad_id` with listings category prefix machinery |
| Detail | `/clasificados/anuncio/[id]` generic |
| Moderation | Family safety gate before insert |

**Recommendation:** Comida Local should follow **Restaurantes lane** (dedicated table + server publish API), not generic `listings` insert — food-specific facets, discovery, and admin parity are cleaner.

### Servicios (secondary reference)

- `POST /api/clasificados/servicios/publish` → `servicios_public_listings`
- Draft media upload route exists

---

## 6. Recommended DB strategy

### Option A — `comida_local_public_listings` (RECOMMENDED)

| | |
|---|---|
| **Pros** | Matches FOOD-L1; mirrors Restaurantes ops; typed columns for city/food_type/search; isolated RLS; clear admin/dashboard extension; `listing_json` for forward-compatible draft round-trip |
| **Cons** | New migration; must register in `classifiedsOpsContract`, analytics identity, owner keys |
| **Files later** | `supabase/migrations/*_comida_local_public_listings.sql`, publish API, mapper `comidaLocalPublicListingMapper.ts`, server read for results/detail |
| **Search** | Explicit server queries (FOOD-L6) — not automatic from `listings` |
| **Analytics** | Add case in `resolveListingAnalyticsIdentity` |
| **Rollback** | Drop table policy isolated; feature flag on publish route |

### Option B — generic `public.listings`

| | |
|---|---|
| **Pros** | Reuses En Venta infrastructure, `mis-anuncios` partial support |
| **Cons** | `detail_pairs` encoding for food/service/payment awkward; category filter noise; weaker type safety; conflicts with “separate product” positioning |
| **Rollback** | Harder — rows mixed with Varios |

### Option C — reuse `restaurantes_public_listings`

| | |
|---|---|
| **Pros** | None for this product |
| **Cons** | Violates category firewall; schema mismatch (cuisine vs food_type); SEO and admin confusion |
| **Verdict** | **Reject** |

**Decision: Option A** — dedicated `comida_local_public_listings`.

---

## 7. Proposed table / data model

```sql
-- Conceptual (FOOD-L5B migration — NOT created in FOOD-L5A)
create table public.comida_local_public_listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  owner_user_id uuid references auth.users(id) on delete set null,
  draft_listing_id text,                    -- stable client draft id for republish
  status text not null default 'published'
    check (status in ('draft','published','paused','suspended')), -- tighten in implementation
  package_tier text,                        -- comida_local_basic | comida_local_plus
  payment_status text,                      -- pending | paid | failed | waived (FOOD-L5D)
  leonix_ad_id text unique,
  published_at timestamptz,
  expires_at timestamptz,                   -- optional; product TBD
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  business_name text not null,
  food_type text not null,
  food_type_custom text,
  city_canonical text not null,
  city_display text,
  zone_note text,
  que_vendes text not null,

  phone text,
  whatsapp text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,
  location_note text,
  location_url text,
  availability_note text,

  service_options jsonb not null default '[]',   -- pickup|delivery|in_person
  payment_methods jsonb not null default '[]',
  payment_other_note text,
  price_level text,                            -- 1|2|3
  languages jsonb not null default '[]',

  main_photo_url text,
  logo_image_url text,
  gallery_image_urls jsonb not null default '[]',

  promoted boolean not null default false,       -- Plus / admin only
  listing_json jsonb not null                    -- full ComidaLocalDraft snapshot
);
```

**Indexes (planned):** `(status, published_at desc)`, `(city_canonical)`, `(food_type)`, optional GIN on `listing_json` only if needed later.

**RLS (planned):** public `select` where `status = 'published'`; owner `select` own rows; writes via service role only on publish API.

---

## 8. Publish payload contract

### HTTP

`POST /api/clasificados/comida-local/publish` (FOOD-L5B — not created yet)

### Request body (proposed)

```typescript
type ComidaLocalPublishRequest = {
  /** Full or partial draft; server merges with createEmptyComidaLocalDraft */
  draft: ComidaLocalDraft;
  /** Stable id from client (uuid in localStorage meta or draft field — add in FOOD-L5B) */
  draft_listing_id?: string;
  owner_user_id?: string;       // set server-side from session when possible
  package_tier?: "comida_local_basic" | "comida_local_plus";
  payment_status?: "pending" | "paid";  // FOOD-L5D may override
  lang?: "es" | "en";
  /** Republish existing row by slug or draft_listing_id */
  republish?: boolean;
};
```

### Server processing steps

1. Parse JSON; reject >1MB; reject data:/blob: (copy Restaurantes guard).
2. `mergeComidaLocalDraftFromStorage` semantics on body.draft.
3. Run `validateComidaLocalDraftForFuturePublish` → 422 with field list.
4. Normalize: phone/whatsapp digits; social URLs via `normalizeComidaLocalSocialInput`; city via `resolveComidaLocalCityCanonical` (must be non-empty).
5. Image audit: require `main_photo_url` HTTPS OR `mainPhoto.storageKey` resolved (FOOD-L5C).
6. Build insert via `draftToComidaLocalPublicListingInsert(draft, slug, opts)`.
7. Allocate slug (business name slugify + collision loop).
8. Allocate `leonix_ad_id` on first insert only.
9. Upsert by `draft_listing_id`.
10. Return `{ ok: true, slug, leonix_ad_id, publicUrl }` — no fake engagement counts.

### Required fields at publish

| Field | Rule |
|---|---|
| businessName | min 2 chars |
| foodType OR foodTypeCustom | otro → custom min 2 chars |
| cityCanonical | NorCal canonical required |
| phone OR whatsapp | 10-digit phone or 8+ WA digits |
| queVendes | min 20 chars |
| mainPhoto | **Required at publish** (FOOD-L1); warning-only in preview until FOOD-L5C |

**Not required:** socials, location URL, availability, service/payment chips, logo, gallery (package limits apply when present).

### Response errors

| Code | error |
|---|---|
| 400 | invalid_json, invalid_body, missing_draft |
| 413 | payload_too_large, heavy_media_detected |
| 422 | not_ready + missingFields[] |
| 503 | supabase_admin_unconfigured |
| 500 | db_* failures |

---

## 9. Leonix ID plan

| Item | Plan |
|---|---|
| Format | `COMIDA-2026-000001` (6-digit seq, year from allocator) |
| Generation | `allocateLeonixAdIdViaRpc(supabase, { namespace: "comida_local", prefix: "COMIDA" })` in `comidaLocalLeonixAdId.ts` |
| Migration | Register namespace in `leonix_ad_id_counters` + optional `BEFORE INSERT` trigger (mirror `restaurantes_public_listings_leonix_ad_id`) |
| Collision | RPC atomic counter; unique constraint on column |
| Storage | `comida_local_public_listings.leonix_ad_id` |
| Display | Public detail + dashboard + admin; **never** on draft preview (FOOD-L4 preserved) |
| Republish | Preserve existing `leonix_ad_id` when updating same `draft_listing_id` |
| Downstream | Extend `ownerEngagementListingKeys`, `resolveListingAnalyticsIdentity`, admin search |

**Do not** reuse `REST-` prefix or restaurantes namespace.

---

## 10. Package / pricing plan (documentation only)

### Product tiers (target — not coded)

| Tier | Price | Planned limits |
|---|---|---|
| comida_local_basic | $99 | 1 main + 2 gallery; 2 socials; 60-day listing (TBD); no featured |
| comida_local_plus | $149 | 1 main + 5 gallery; 3 socials; featured flag (admin-gated); renewal discount TBD |

### Flow options (decision needed)

| Model | Description |
|---|---|
| A — Pay then publish | Checkout completes → `payment_status=paid` → publish API succeeds |
| B — Publish pending payment | Row `status=draft` + `payment_status=pending` → hidden from results until paid |
| C — Free preview only | Preview stays free; publish always paid (recommended aligned with Restaurantes paid lanes) |

**FOOD-L1** assumed paid listing. **Recommend Model A** for simpler public surface (no unpaid public rows).

### Stripe / files to touch later (FOOD-L5D only)

- New Stripe Product/Price IDs (env: document names e.g. `STRIPE_COMIDA_LOCAL_BASIC_PRICE_ID`)
- Checkout route: `app/api/clasificados/comida-local/checkout/route.ts` (new)
- Webhook handler extension or category-specific webhook filter
- `CLASIFICADOS_C6_STRIPE_READINESS` patterns for `payment_status`
- **Do not** edit existing Restaurantes/Varios Stripe products

### Upgrade to Restaurante Premium

- Manual or guided migration FOOD-L9+; map shared contact/city/images; no auto in FOOD-L5B.

---

## 11. Image / upload plan

| Phase | Scope |
|---|---|
| FOOD-L5C | `POST /api/clasificados/comida-local/draft-media-upload` mirroring Restaurantes |
| Storage path | `clasificados/comida-local/{ownerId}/{draftListingId}/{slot}.jpg` (confirm bucket policy) |
| Client | Replace FOOD-L4 placeholders; store `storageKey` + `previewUrl` HTTPS only in draft |
| Publish | Body sends URLs/keys only; mapper sets `main_photo_url`, `gallery_image_urls` |
| Limits | Basic: 1+2; Plus: 1+5; logo optional both |
| Rules | No base64 in localStorage (already stripped); rollback: delete orphan storage objects on failed publish (best-effort job) |

**FOOD-L5B** may ship with `main_photo_url` optional in DB if FOOD-L5C immediately follows — product prefers **FOOD-L5C before public launch**.

---

## 12. Dashboard readiness (future FOOD-L7)

**New page:** `app/(site)/dashboard/comida-local/page.tsx` (mirror restaurantes)

**Row card shows:** business name, food type label, city, status, package_tier, leonix_ad_id, published_at, expires_at, edit → `/publicar/comida-local?edit=`, preview link, analytics summary (FOOD-L8)

**Shared files to extend:**

- `app/lib/ownerEngagementListingKeys.ts`
- `app/(site)/dashboard/mis-anuncios/page.tsx` (optional union read)
- `app/(site)/dashboard/lib/dashboardInventory.ts`

---

## 13. Admin readiness (future FOOD-L7)

**New workspace:** `app/admin/(dashboard)/workspace/clasificados/comida-local/page.tsx`

**Capabilities:** list/filter by status, city, food_type; view `listing_json`; moderate approve/pause; search `leonix_ad_id`; payment_status column; link to public URL `/clasificados/comida-local/[slug]`

**Extend:** `app/admin/_lib/classifiedsOpsContract.ts` — new `ClassifiedsOpsKind` value `comida_local` or reuse pattern with `writableTable: "comida_local_public_listings"`, `leonixPrefix: "COMIDA"`

---

## 14. Search / results readiness (future FOOD-L6)

| Item | Later work |
|---|---|
| `categoryConfig.ts` | Add `comida-local` key + `futureFilters: ["location","food_type","service","price"]` |
| `clasificadosCategoryRegistry` / `categoryChooserServer` | Register publish + hub |
| Hub | `app/(site)/clasificados/comida-local/page.tsx` (exists as preview only; add results) |
| Results | `app/(site)/clasificados/comida-local/resultados/page.tsx` |
| Card | `ComidaLocalResultCard.tsx` — reuse VM chip logic |
| Server loader | `fetchComidaLocalPublishedRows({ city, foodType, ... })` |
| Detail | `app/(site)/clasificados/comida-local/[slug]/page.tsx` — reuse `ComidaLocalDetailShell` + DB row |
| SEO | `robots`/sitemap entries for published slugs only |
| Search text | business_name, que_vendes, food_type, food_type_custom, city_display, zone_note |

Publishing does **not** auto-appear in global search until FOOD-L6 wires queries.

---

## 15. Security / validation / abuse guardrails

| Area | Plan |
|---|---|
| Auth | Require authenticated user for publish; bind `owner_user_id` |
| Ownership | Dashboard edit only own rows (RLS + API checks) |
| URLs | Reuse `isValidComidaLocalExternalUrl` + social normalizers server-side |
| Phone/WA | Digit normalization; no `javascript:` hrefs |
| Text limits | Enforce max lengths on server (match or tighten vs client) |
| HTML | Plain text only in stored fields; React text rendering (no `dangerouslySetInnerHTML`) |
| Images | MIME allowlist image/jpeg, image/png, image/webp; size cap per upload route |
| Rate limit | Consider per-owner publish throttle (defer unless platform has shared helper) |
| Moderation | `status` paused/suspended admin-only; no public fake metrics |
| Payload | Restaurantes-style heavy media scan on publish body |

---

## 16. Implementation gates

### FOOD-L5B — Publish API + DB migration + Leonix ID

| | |
|---|---|
| **Scope** | Migration `comida_local_public_listings`; `comidaLocalLeonixAdId.ts`; `comidaLocalPublicListingMapper.ts`; `POST app/api/clasificados/comida-local/publish/route.ts`; `comidaLocalPublishReadiness.ts` server validation; slug helper |
| **Allowed** | `supabase/migrations/*comida_local*`, `app/api/clasificados/comida-local/**`, `app/lib/clasificados/comida-local/**`, publish form wire to API (minimal) |
| **Forbidden** | Stripe, dashboard, admin, search, Restaurantes |
| **Acceptance** | Publish creates row; leonix_ad_id set; republish preserves slug/id; 422 on invalid draft |
| **Audit** | `comida-local-food-l5b-publish-audit.ts` |
| **Build** | `npm run build` required |
| **QA** | API curl with valid draft; DB row inspect; no preview fake ID |
| **Risk** | Migration drift on staging |

### FOOD-L5C — Image upload + storage

| | |
|---|---|
| **Scope** | `draft-media-upload` route; client upload UI; draft fields `storageKey` + HTTPS `previewUrl`; publish requires main photo |
| **Forbidden** | Stripe, results |
| **Acceptance** | Upload → preview shows image → publish persists URLs |
| **Risk** | Orphan blobs if publish fails |

### FOOD-L5D — Payment / package hook

| | |
|---|---|
| **Scope** | Stripe products env; checkout + webhook; `package_tier` + `payment_status` gating publish |
| **Forbidden** | Changing other categories' Stripe IDs |
| **Acceptance** | Cannot publish public row without paid (per chosen model) |
| **Risk** | Webhook latency leaves pending rows |

### FOOD-L6 — Results / search / filter / public detail

| | |
|---|---|
| **Scope** | categoryConfig, hub, resultados, `[slug]` page server load, discovery |
| **Acceptance** | Filter by city + food type; card matches preview shell |

### FOOD-L7 — Dashboard / admin

| | |
|---|---|
| **Scope** | dashboard page, admin workspace, classifiedsOpsContract, owner keys |
| **Acceptance** | Owner sees listing; admin can pause |

### FOOD-L8 — Analytics

| | |
|---|---|
| **Scope** | `comidaLocalAnalytics.ts`; CTA tracking on detail; identity resolver |
| **Acceptance** | Events stored with category `comida-local` |

### FOOD-L9 — QA hardening

| | |
|---|---|
| **Scope** | E2E smoke, launch selftest script, upgrade doc |
| **Acceptance** | Full gate checklist green |

---

## 17. Risks / deferred decisions

1. **Pay-before-publish vs pending row** — blocks FOOD-L5D design.
2. **Listing duration / renewal** — not in schema yet.
3. **mainPhoto required in FOOD-L5B vs FOOD-L5C** — recommend gate order 5C before marketing launch.
4. **`draft_listing_id` on client** — add explicit field in FOOD-L5B (currently only storage key wrapper).
5. **Featured/promoted** — admin-only like Restaurantes.
6. **Upgrade to Restaurantes** — credit policy undefined.

---

## 18. Open questions

1. Confirm **$99 / $149** and duration (30 vs 60 vs 90 days)?
2. Is **Plus featured placement** on homepage/hub or sort boost only?
3. Can **guests** publish or auth required?
4. **Moderation** queue before `published` or instant live?
5. **expires_at** auto-unpublish or manual renew only?
6. Allow **edit after publish** without re-payment?

---

## 19. Manual QA checklist (future publish gates)

- [ ] Publish valid draft → row in `comida_local_public_listings`
- [ ] `leonix_ad_id` matches `COMIDA-YYYY-######`
- [ ] Republish same draft → same slug + leonix_ad_id
- [ ] Missing phone+WA → 422
- [ ] Invalid city → 422
- [ ] data: in body → 413/400
- [ ] Preview still shows no Leonix ID
- [ ] Unpaid checkout blocks publish (FOOD-L5D)
- [ ] Public detail loads after FOOD-L6
- [ ] Dashboard lists row after FOOD-L7

---

## TRUE/FALSE audit table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| FOOD-L1 audit was read and followed | TRUE | §2 |
| FOOD-L2 audit was read and followed | TRUE | §2 |
| FOOD-L3 audit was read and followed | TRUE | §2 |
| FOOD-L4 audit was read and followed | TRUE | §2 |
| Existing Restaurantes publish flow was inspected read-only | TRUE | §5 |
| Existing En Venta/Varios publish flow was inspected read-only | TRUE | §5 |
| Shared publish/package helpers were inspected read-only | TRUE | §5 |
| Comida Local remains separate from Restaurantes Premium | TRUE | §6 Option C rejected |
| No Restaurante files were edited | TRUE | Preflight / script |
| No Rentas files were edited | TRUE | Script |
| No Bienes Raíces files were edited | TRUE | Script |
| No Servicios files were edited | TRUE | Script |
| No En Venta/Varios files were edited | TRUE | Script |
| No Stripe/payment files were edited | TRUE | §10 doc only |
| No Admin/Dashboard files were edited | TRUE | §12–13 doc only |
| No app/api files were edited | TRUE | No publish route |
| No database migrations were created | TRUE | §7 conceptual only |
| No publish API route was created | TRUE | §8 marked FOOD-L5B |
| No search/results/categoryConfig files were edited | TRUE | §14 doc only |
| Recommended DB strategy is documented | TRUE | §6 |
| Proposed table/data model is documented | TRUE | §7 |
| Publish payload contract is documented | TRUE | §8 |
| Leonix ID strategy is documented | TRUE | §9 |
| Package/pricing plan is documented without implementation | TRUE | §10 |
| Image/upload plan is documented without implementation | TRUE | §11 |
| Dashboard readiness is documented | TRUE | §12 |
| Admin readiness is documented | TRUE | §13 |
| Search/results readiness is documented | TRUE | §14 |
| Security/validation guardrails are documented | TRUE | §15 |
| Future implementation gates are documented | TRUE | §16 |
| No fake listings/data/counters/reviews were added | TRUE | — |
| npm run build was not required because this is audit-only | TRUE | — |

---

## Next recommended gate

**FOOD-L5B — Publish API + DB migration + Leonix ID**
