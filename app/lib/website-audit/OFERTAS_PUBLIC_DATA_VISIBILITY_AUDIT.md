# Ofertas Public Data Visibility Audit — Approved Flyers + Products Path

**Task classification:** SCOPED DIAGNOSTIC BUILD  
**Phase:** Ofertas Public Data Visibility Audit — Approved Flyers + Products Path  
**Date:** 2026-07-10  
**Status:** COMPLETE (audit-only — no fix implemented)

---

## 1. Git snapshot (Gate 1)

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD | `35ac65caff94404ffc1022e1f45ccd3658724d8e` |
| Staged files | **None** |
| Ofertas dirty files | **None** |
| Unrelated dirty files | Yes (autos, busco, community, magazine, restaurantes, servicios, etc.) |

No code changes were made during this diagnostic gate except this audit file and optional read-only audit-script checks.

---

## 2. Files inspected

- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx`
- `app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx`
- `app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx`
- `app/(site)/clasificados/ofertas-locales/[id]/page.tsx`
- `app/lib/ofertas-locales/ofertasLocalesTypes.ts`
- `app/lib/ofertas-locales/ofertasLocalesPreviewHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts`
- `app/lib/ofertas-locales/ofertasLocalesProductionRowAdapter.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers.ts`
- `app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts`
- `app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts`
- `app/lib/ofertas-locales/ofertasLocalesShoppingList.ts`
- `app/lib/ofertas-locales/ofertasLocalesDbSchema.ts`
- `app/api/ofertas-locales/public-offers/route.ts`
- `app/api/ofertas-locales/public-search/route.ts`
- `app/api/ofertas-locales/publish/route.ts`
- `app/api/ofertas-locales/admin/[id]/review/route.ts`
- `app/api/ofertas-locales/items/[itemId]/route.ts`
- `scripts/ofertas-locales-stack-e-shopping-list-audit.ts`
- `app/lib/website-audit/OFERTAS_LOCALES_RESULTS_MODE_V1_AUDIT.md`

---

## 3. Data architecture map

### 3.1 Application draft path

| Stage | Location | Notes |
|-------|----------|-------|
| Form / wizard | `app/(site)/publicar/ofertas-locales/` | Client draft in session/local persistence |
| Validation | `ofertasLocalesPublishMapper.ts` → `validateOfertaLocalDraftForServerPublish` | Requires business, dates, assets by offer type |
| Submit | `POST /api/ofertas-locales/publish` | Inserts **`status: pending_review`** only — never public |

Evidence: `mapOfertaLocalDraftToInsertPayload` sets `status: "pending_review"` (`ofertasLocalesPublishMapper.ts:227`).

### 3.2 Preview path (not public)

| Data | Location | Notes |
|------|----------|-------|
| Draft + assets | `draft_snapshot`, `flyer_assets` on row or client draft | Preview UI reads draft + in-memory scan results |
| AI-scanned products | `oferta_local_items` (after scan-prep) + review UI | Inserted as `review_status: pending/needs_review`, **`is_active: false`** |
| Approved in preview UI | Filter `reviewStatus === "approved"` in preview client | **Preview-only** — does not bypass public triple gate |
| Bbox / crops | `source_bbox`, `source_crop_url` on `oferta_local_items` | Used in preview clip viewer; **not** exposed in public search item projection |

### 3.3 Publish mapper path

| Step | Function / route | Outcome |
|------|------------------|---------|
| Map draft → DB row | `buildOfertasLocalesProductionInsertRow` / `mapOfertaLocalDraftToInsertPayload` | Parent offer row with flyer/coupon asset JSON, location, `offer_type`, dates |
| Products on publish | **Not bulk-inserted from draft on publish** | Products come from AI scan → `oferta_local_items` tied to `oferta_local_id` |
| Product approval on owner PATCH | `resolveOfertaLocalItemIsActiveOnReviewPatch` | `is_active: true` **only if** `review_status === approved` **and** parent `status === approved` |
| Admin approve parent | `mutateOfertaLocalAdminReview` action `approve` | Parent → `approved`; bulk `is_active: true` on items where `review_status = approved` |

### 3.4 Public results path

| Surface | Source | Query |
|---------|--------|-------|
| Results UI | `OfertasLocalesPublicSearchClient.tsx` | Client-side `fetch` — no server props |
| Offers | `GET /api/ofertas-locales/public-offers` | Supabase **`getAdminSupabase()`** (service role) on `ofertas_locales` |
| Products/items | `GET /api/ofertas-locales/public-search` | Supabase service role on `oferta_local_items` with inner join parent |
| Static/mock | **No** | Real DB only |
| Cupones | Same offer API with surface filter in client | Items query skipped |

### 3.5 Cart / shopping list path

| Need | Source field on `OfertaLocalPublicSearchItem` |
|------|-----------------------------------------------|
| Add to list | `id`, `itemName`, price fields, business/location, `sourceAssetHref` |
| Group by store | `businessName`, `city`, `zipCode` |
| Map handoff | `directionsHref`, address fields |
| Flyer overlay (future) | **`source_bbox` / `source_crop_url` NOT in public item map today** — only generic `boundingBoxNote` |

---

## 4. Public offers query (Gate 3)

**File:** `app/api/ofertas-locales/public-offers/route.ts`

1. **Supabase table:** `ofertas_locales` via service role (not anon RLS).
2. **API route:** yes — client calls `/api/ofertas-locales/public-offers?…`.
3. **Not static/mock.**
4. **No server props** on results page.
5. **Filters applied:**
   - SQL: `.eq("status", "approved")`
   - Post-map: `isOfertaLocalPublicOfferRowEligible` — not expired, has business name + title
   - Query params: `q`, city, state, zip, country, category, marketType, **offerType**, sort (in `filterAndSortOfertaLocalPublicOffers`)
6. **Offers and products queried separately:** yes (two API calls).
7. **Weekly flyer products:** offers with `offer_type = weekly_flyer` appear in offers list only after parent **approved** + valid dates; scan products are separate item rows.
8. **Pending/unapproved excluded:** yes — `status !== approved` never returned.
9. **Approved accidentally excluded:** only if expired, missing title/business name, or filter params mismatch (e.g. wrong `offerType` string).
10. **Production data dependency:** **yes** — empty arrays are honest when no rows pass filters.

If `SUPABASE_SERVICE_ROLE_KEY` missing: API returns `503 supabase_admin_unconfigured` (client shows load error, not silent empty).

If table missing: returns `{ ok: true, offers: [], message: "offers_table_unavailable" }`.

---

## 5. Public products query (Gate 4)

**File:** `app/api/ofertas-locales/public-search/route.ts`

**SQL hard filters (all required):**

```text
review_status = 'approved'
is_active = true
ofertas_locales.status = 'approved'   (inner join)
```

**Post-filter:** `isOfertaLocalPublicSearchRowEligible` — parent not expired, item name present, date eligibility via `canOfertaLocalItemBePubliclyEligible`.

**Client-side query filters:** `q`, city, state, zip, country, category, marketType, offerType, sort in `filterAndSortOfertaLocalPublicSearchItems`.

### Product type / fields

| Concern | Finding |
|---------|---------|
| Product type | `OfertaLocalPublicSearchItem` (`ofertasLocalesTypes.ts`) |
| Card fields | name, price, unit, category, location, dates, `sourceAssetHref` |
| Drawer fields | same public item + membership/coupon/social from parent snapshot |
| Shopping list | `createShoppingListItemFromPublicItem` — needs public item id + business + optional `sourceAssetHref` |
| Flyer overlays (future) | bbox/crop **not** mapped in `mapOfertaLocalPublicSearchRowToItem` |
| Crop URLs public? | Stored on DB row (`source_crop_url`) but **not exposed** in public search API response mapping |
| Searchable by `q`? | yes — matches item name, normalized name, category, tags, location |

### Approval path summary

```text
Scan → oferta_local_items (needs_review, is_active=false)
Owner review → review_status=approved (is_active still false if parent pending_review)
Publish submit → parent pending_review
Admin approve → parent approved + is_active=true on approved items
Owner approve items after parent approved → is_active=true via resolveOfertaLocalItemIsActiveOnReviewPatch
```

**Preview-approved products are NOT public until the triple gate above is satisfied in production DB.**

---

## 6. Offer / flyer card path (Gate 5)

| Question | Answer |
|----------|--------|
| Public offer record | Row in `ofertas_locales` with `status=approved`, mapped to `OfertaLocalPublicOfferCard` |
| weekly_flyer public? | Yes **if** parent approved + not expired + passes filters |
| Flyer thumbnail | `primaryAssetHref` from first `flyer_assets` or `coupon_assets` URL in JSON |
| Business logo/name/location | From parent row + draft_snapshot fallback for country |
| Valid dates | `valid_from`, `valid_until` on card |
| Status blocks display | `pending_review`, `rejected`, `archived`, expired → excluded |
| Result card uses | `OfertasLocalesPublicOfferCard` → links to **`/clasificados/ofertas-locales/[id]?lang=…`** |
| Public Store/Flyer Hub route | **Exists:** `app/(site)/clasificados/ofertas-locales/[id]/page.tsx` via `fetchPublicOfertaLocalDetailById` (approved-only) |
| Preview card adaptation | Preview uses draft + approved AI items in memory; public hub uses approved DB offer — safe to align later, not wired from results grid beyond offer card link today |

---

## 7. Root cause classification (Gate 6)

### Primary: **A + C + E** (with honest empty UI, not renderer failure)

| Code | Verdict | Evidence |
|------|---------|----------|
| **A** | **TRUE (likely)** | Public APIs only return `status=approved` parents. New submits are `pending_review`. Production may have zero approved offers. |
| **B** | Possible secondary | Strict `offerType` / location / `q` filters in helpers can empty results when data exists but params mismatch. |
| **C** | **TRUE** | `POST /api/ofertas-locales/publish` never creates public rows. Preview/scan data stays in draft + `oferta_local_items` until moderation. |
| **D** | Partial | Products **are** included in public query when triple gate passes; query architecture is correct. |
| **E** | **TRUE** | **Field/status mismatch by design:** public items require `review_status=approved` **AND** `is_active=true` **AND** parent `approved`. Owner preview approval alone is insufficient. |
| **F** | **FALSE** | Client fetches both APIs; mode intro + section ordering work; empty state shows when arrays empty. |
| **G** | **FALSE for API routes** | Public routes use **service role** (`getAdminSupabase`), not public anon RLS SELECT. |
| **H** | Possible ops | Missing env → 503 error, not silent empty. Table-missing → empty with message. |
| **I** | — | — |

### Why landing intent routes feel empty

The **UI routing and results mode layer is working**. Emptiness reflects **moderation/publish pipeline state**, not missing client wiring:

1. Seller submits → `pending_review` (not in public offers query).
2. AI items default inactive until parent approved (and owner must approve item review status).
3. Admin must approve offer → activates approved items.
4. Only then do `/public-offers` and `/public-search` return rows.

### Smallest safe next fixes (by layer)

| Fix | Scope | Allowed in micro patch? |
|-----|-------|-------------------------|
| Seed/approve QA offers + items in production/staging via admin queue | Ops + admin | No — not code-only |
| Document admin approve checklist for team | Ops | Yes (docs) |
| Expose `source_bbox`/`source_crop_url` on public items for flyer overlays | API + types + mapper | **No** — locked API files |
| Public Flyer/Store result cards linking to hub | UI gate (next) | Separate build |
| Auto-set `mode=products` on search submit | Client-only UX | Optional tiny UX; **does not create data** |

**Gate 7 decision: STOP — no code fix implemented.** Root cause is pipeline/data state, not a one-line query bug in allowed files.

---

## 8. What was intentionally not touched

- Landing UI shell, results UI shell, floating cart, preview page, product/offer card design, flyer viewer, cart panel
- DB/schema/migrations, RLS/policies, admin/dashboard, Stripe/payment, AI scan/crop engine, other categories
- No fake flyers, products, or partner data

---

## 9. TRUE/FALSE audit

| Check | Result |
|-------|--------|
| Landing shell untouched | TRUE |
| Results shell untouched | TRUE |
| Preview page untouched | TRUE |
| Cart preserved | TRUE |
| Cupones shopping-list hidden preserved | TRUE |
| Public offer query identified | TRUE |
| Public product query identified | TRUE |
| Publish mapper inspected | TRUE |
| Product approval path inspected | TRUE |
| Flyer image/crop path inspected | TRUE |
| Root cause documented | TRUE |
| No fake data created | TRUE |
| No DB/schema touched | TRUE |
| No RLS/policy touched | TRUE |
| No admin/dashboard/auth touched | TRUE |
| No Stripe/payment touched | TRUE |
| No other categories touched | TRUE |
| Build passed (no app code changed) | N/A |
| Audit complete | TRUE |

---

## 10. Recommended next gate

**Data/Policy Fix Required Before UI** — specifically:

### Gate name: **Public Approved Products Publish Connection**

Before **Public Flyer/Store Result Cards V1** or **Clickable Flyer Product Overlay V1**, run an ops + admin gate:

1. Confirm production/staging has rows: `ofertas_locales.status = 'approved'` with valid dates.
2. Confirm paired rows: `oferta_local_items.review_status = 'approved'` AND `is_active = true` for those parents.
3. Use admin workspace approve flow (`POST /api/ofertas-locales/admin/[id]/review` action `approve`).
4. Verify live APIs return data:
   - `GET /api/ofertas-locales/public-offers?lang=es`
   - `GET /api/ofertas-locales/public-search?lang=es`
5. Then proceed to **Public Flyer/Store Result Cards V1** (visual layer on existing data).

Secondary future gate: extend public item projection with bbox/crop fields for clickable flyer overlays (requires API/types change — currently out of scope for allowed files).

---

## 11. QA URLs

- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&offerType=weekly_flyer&mode=flyers
- https://leonixmedia.com/clasificados/ofertas-locales/results?lang=es&q=tomate&mode=products
- https://leonixmedia.com/clasificados/ofertas-locales?lang=es
- https://leonixmedia.com/cupones?lang=es

**Manual verification when data exists:** offer card → `/clasificados/ofertas-locales/{id}`; product card → add to list; APIs return non-empty `offers` / `items` arrays.
