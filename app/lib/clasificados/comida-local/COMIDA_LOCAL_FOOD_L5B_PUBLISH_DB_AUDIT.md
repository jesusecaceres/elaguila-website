# Gate FOOD-L5B — Comida Local DB Migration + Publish API + Leonix ID

## 1. Gate title

Gate FOOD-L5B — Comida Local DB Migration + Publish API + Leonix ID

## 2. Preflight status

- `git status --short` at gate start: clean (no unrelated dirty files in Comida Local scope).
- Scope: only `app/lib/clasificados/comida-local/**`, `app/api/clasificados/comida-local/publish/**`, `supabase/migrations/20260604120000_comida_local_public_listings.sql`, `scripts/comida-local-food-l5b-publish-db-audit.ts`, `package.json` (audit script line).

## 3. Prior gate decisions used

| Source | Decision |
|--------|----------|
| FOOD-L5A | Dedicated table `comida_local_public_listings` (Option A); not Restaurantes Premium |
| FOOD-L5A | Leonix ID `COMIDA-YYYY-######`, namespace `comida_local` |
| FOOD-L5A | `payment_status = not_required_for_l5b`; unpaid dev publish with `status = published` |
| FOOD-L3/L4 | Draft shape, city canonical, phone/social normalization; preview mapping unchanged |
| FOOD-L4 | Main photo warning only until upload gate (FOOD-L5C) |

## 4. Files inspected (read-only)

- `app/api/clasificados/restaurantes/publish/route.ts`
- `app/(site)/clasificados/restaurantes/lib/restaurantesLeonixAdId.ts`
- `app/lib/supabase/leonixAdIdsServer.ts`
- `app/lib/supabase/server.ts`
- `app/api/clasificados/servicios/lib/serviciosPublishServerAuth.ts`
- `supabase/migrations/*restaurantes_public_listings*`
- Prior FOOD-L1–L5A audit docs and Comida Local lib modules

## 5. Files changed

- `supabase/migrations/20260604120000_comida_local_public_listings.sql`
- `app/lib/clasificados/comida-local/comidaLocalLeonixAdId.ts`
- `app/lib/clasificados/comida-local/comidaLocalSlug.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublishServerAuth.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublishTypes.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts`
- `app/lib/clasificados/comida-local/comidaLocalPublicListingMapper.ts`
- `app/api/clasificados/comida-local/publish/route.ts`
- `app/lib/clasificados/comida-local/COMIDA_LOCAL_FOOD_L5B_PUBLISH_DB_AUDIT.md`
- `scripts/comida-local-food-l5b-publish-db-audit.ts`
- `package.json` — `comida-local:food-l5b-publish-db-audit` script only

## 6. Migration result

- Table `public.comida_local_public_listings` with analytics-ready columns: `id`, `owner_user_id`, `draft_listing_id`, `leonix_ad_id`, `slug`, `status`, `package_tier`, `payment_status`, normalized food/city/contact fields, image JSONB columns, `listing_json`.
- Unique indexes on `slug`, `leonix_ad_id`, `draft_listing_id`.
- Lookup indexes on `status`, `owner_user_id`, cities, `food_type`, `published_at`, `package_tier`, `payment_status`.
- `BEFORE INSERT` trigger `comida_local_leonix_ad_id_bi` assigns `COMIDA-YYYY-######` when API omits ID (fallback).
- No seed rows.

## 7. RLS/index result

- RLS enabled.
- Public `SELECT` where `status = 'published'` (mirrors Restaurantes public listing pattern).
- Authenticated owner `SELECT` where `owner_user_id = auth.uid()`.
- Inserts/updates via service role in publish API only (no anonymous insert policy).
- `updated_at` set by API on update; no separate trigger (documented; optional later).

## 8. Leonix ID result

- `allocateNextComidaLocalLeonixAdId` → `leonix_allocate_formatted` with `namespace: comida_local`, `prefix: COMIDA`.
- Format validated by `isComidaLocalLeonixAdIdFormat`: `COMIDA-YYYY-######`.
- Publish route allocates before insert; republish preserves existing `leonix_ad_id`.

## 9. Slug result

- `buildComidaLocalSlugBase` from business name + city (+ food type when not `otro`).
- `allocateUniqueSlug` in publish route checks `comida_local_public_listings` and suffixes `-2`, `-3`, …

## 10. Publish validation result

- `parseComidaLocalPublishRequest` / `validateComidaLocalPublishPayload` require business name, food type, canonical city, phone OR WhatsApp, qué vendes.
- Normalizes phone, social URLs, location URL (https only), arrays, images via `sanitizeComidaLocalImageForDb` (rejects data/blob/base64 preview URLs).
- Main photo not required (warning path in client validator only).

## 11. Publish API result

- `POST /api/clasificados/comida-local/publish`
- Parses JSON, rejects heavy media in body, validates server-side, resolves `owner_user_id` from Bearer only.
- Insert or update by `draft_listing_id`.
- Returns `id`, `slug`, `leonix_ad_id`, `status`, `package_tier`, `payment_status`, `category: comida-local`, `publicPath: /clasificados/comida-local/{slug}`.

## 12. Payment status result

- `payment_status = not_required_for_l5b` on new publishes.
- `status = published` for L5B dev unpaid publish (per FOOD-L5A).
- No Stripe/checkout/payment intent calls.

## 13. Image handling result

- Published rows strip `data:`, `blob:`, base64 from image JSONB; only https preview URLs or `storageKey` without unsafe preview.
- No upload pipeline; no placeholder URLs stored.
- Main photo enforcement deferred to FOOD-L5C.

## 14. Analytics readiness result

- Stable `id` (uuid), `leonix_ad_id`, `slug`, `status`, `package_tier`, `owner_user_id`, `listing_json.category` via mapper.
- No analytics event inserts in this gate.

## 15. What is intentionally not implemented

- Stripe / package payment gating (FOOD-L5D)
- Image upload + main photo publish enforcement (FOOD-L5C)
- Public `[slug]` detail route, search/results, cards (FOOD-L6)
- Dashboard/admin ops (FOOD-L7)
- Analytics tracking (FOOD-L8)
- Form/preview UI wiring to publish API (forbidden paths in L5B)
- Seed/fake listings, counters, reviews

## 16. Risks / deferred work

- RLS has no owner `UPDATE` policy yet; edits may need service role or future policy.
- `leonix_allocate_formatted` RPC must exist in deployed DB (shared with other categories).
- Client publish button not wired until a later gate allows `app/(site)/publicar/comida-local/**`.

## 17. Manual QA checklist

1. Apply migration to dev Supabase project.
2. `POST` publish with minimal valid draft JSON (Bearer optional).
3. Confirm response includes `COMIDA-20XX-######` and unique `slug`.
4. Republish same `draftListingId` — same slug/leonix id, updated columns.
5. Send `data:image/...` in `mainPhoto.previewUrl` — stripped/null in DB.
6. Omit auth — `owner_user_id` null; with Bearer — owner set from JWT.
7. Invalid social URL omitted after normalize.
8. `npm run comida-local:food-l5b-publish-db-audit` and `npm run build` pass.

## Requirement audit table

| Requirement | TRUE/FALSE | Evidence |
| ------------------------------------------------------------ | ---------- | -------- |
| FOOD-L5A audit was read and followed | TRUE | `COMIDA_LOCAL_FOOD_L5A_PUBLISH_READINESS_AUDIT.md`; dedicated table + COMIDA ID |
| Comida Local remains separate from Restaurantes Premium | TRUE | Own table/API namespace; no Restaurantes edits |
| Dedicated comida_local_public_listings migration was created | TRUE | `20260604120000_comida_local_public_listings.sql` |
| Migration includes stable id | TRUE | `id uuid primary key` |
| Migration includes owner_user_id | TRUE | column + index |
| Migration includes leonix_ad_id | TRUE | column + unique index + trigger |
| Migration includes slug | TRUE | `slug text not null` + unique index |
| Migration includes status | TRUE | `status` + check constraint |
| Migration includes package/payment fields | TRUE | `package_tier`, `payment_status` |
| Migration includes normalized food/city/contact fields | TRUE | `business_name`, `food_type`, cities, contact, etc. |
| Migration includes listing_json | TRUE | `listing_json jsonb not null` |
| Migration includes analytics-ready fields | TRUE | id, owner, slug, leonix, status, tier |
| RLS was enabled or existing project policy was mirrored | TRUE | public published + owner select policies |
| Indexes were added for key lookup fields | TRUE | status, owner, slug, leonix, cities, food_type, dates |
| COMIDA Leonix ID helper was created | TRUE | `comidaLocalLeonixAdId.ts` |
| Slug helper was created | TRUE | `comidaLocalSlug.ts` |
| Publish types/validation were created | TRUE | `comidaLocalPublishTypes.ts`, `comidaLocalPublishValidation.ts` |
| Publish API route was created | TRUE | `app/api/clasificados/comida-local/publish/route.ts` |
| Publish API does not trust owner_user_id from client | TRUE | `comidaLocalOwnerIdFromBearer` only |
| Publish API validates required fields server-side | TRUE | `parseComidaLocalPublishRequest` |
| Publish API rejects or omits invalid URLs safely | TRUE | normalization in `comidaLocalPublishValidation.ts` |
| Publish API rejects base64/blob/data image URLs | TRUE | `sanitizeComidaLocalImageForDb` + `detectHeavyMedia` |
| Publish API does not call Stripe/payment | TRUE | no payment SDK in route |
| Publish API does not create analytics events | TRUE | no analytics imports |
| Publish API does not create dashboard/admin records | TRUE | only `comida_local_public_listings` |
| No Restaurante files were edited | TRUE | git diff scope |
| No Rentas files were edited | TRUE | git diff scope |
| No Bienes Raíces files were edited | TRUE | git diff scope |
| No Servicios files were edited | TRUE | git diff scope |
| No En Venta/Varios files were edited | TRUE | git diff scope |
| No dashboard/admin files were edited | TRUE | git diff scope |
| No search/results/categoryConfig files were edited | TRUE | git diff scope |
| No fake listings/data/counters/reviews were added | TRUE | no seed in migration |
| Audit script passed | TRUE | `npm run comida-local:food-l5b-publish-db-audit` — OK |
| npm run build passed | TRUE | `npm run build` exit 0 (~170s) |
