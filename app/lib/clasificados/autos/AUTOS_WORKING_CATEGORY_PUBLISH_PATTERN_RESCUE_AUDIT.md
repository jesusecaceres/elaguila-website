# AUTOS WORKING CATEGORY PUBLISH PATTERN RESCUE AUDIT

## Objective

Fix live Autos publish failure on `/publicar/autos/negocios/confirm` where `POST /api/clasificados/autos/listings` hung/cancelled after ~15s with “No pudimos preparar tu anuncio”. Align Autos listing create/update with proven working category publish patterns (Servicios, Empleos) without Stripe/promo wiring.

## Live failure summary

- Symptom: confirm prepare spinner → error “No pudimos preparar tu anuncio”
- Network: `POST /api/clasificados/autos/listings` fails/cancels after long wait (client timeout 15s)
- Root: draft payloads with `data:` / `blob:` image URLs sent to API; missing Node runtime + body guards; generic errors

## Working category pattern table

| Category | API route | Table | Auth pattern | Supabase client | Success JSON | Error JSON | Public lookup | Dashboard lookup | Notes |
|---|---|---|---|---|---|---|---|---|---|
| En Venta / Varios | (inquiry/dev-seed only in repo) | `listings` | Bearer via shared helpers | Service role on writes | varies | `{ ok, error }` | slug/id routes | dashboard listings | No direct publish API in allowed scope |
| Servicios | `POST /api/clasificados/servicios/publish` | `servicios_public_listings` | Bearer owner | Service role | `{ ok, slug, publicUrl }` | `{ ok, error, message }` + 413 heavy media | `/clasificados/servicios/[slug]` | my-listings API | **1MB body cap + heavy media detect + runtime nodejs** |
| Rentas | draft-media-upload + inquiry | rentas tables | Bearer | Service role | — | structured | results/detail | — | Media upload separated from publish |
| Empleos | `POST /api/clasificados/empleos/listings` | `empleos_public_listings` | `getBearerUserId` | Service role upsert | `{ ok, id, slug }` | `{ ok, error }` | `/clasificados/empleos/[slug]` | dashboard empleos | **runtime nodejs** |
| Bienes Raíces | (publish via listings pattern) | `listings` | Bearer | Service role | leonix_ad_id trigger | structured | detail UUID/slug | admin | Shares global listings table |

## Autos current path (before rescue)

| Step | File | Behavior |
|---|---|---|
| Confirm prepare | `AutosPublishConfirmCore.tsx` | PATCH cached or POST create listing |
| Create API | `POST /api/clasificados/autos/listings` | Generic `{ ok, id }` / `{ error: create_failed }` |
| Service | `createAutosClassifiedsListing` | Service role insert + redundant verify read |
| Payload | `autosListingPayloadPersistence.ts` | Only dropped oversized data URLs, not all blob/data |
| Auth | `autosListingBearerAuth.ts` | Service role `getUser(token)` |

## Exact root difference

**B + E (primary):** Autos sent heavy draft media (`data:`/`blob:` URLs) in POST body → JSON parse/hang → client abort at 15s. Missing Servicios-style body cap, heavy-media rejection, and `runtime = "nodejs"`.

**Secondary:** Generic `create_failed` hid Supabase errors; redundant post-insert verify added latency.

Flow **F** was correct (PATCH then POST then checkout bypass) — create step was the blocker.

## Files changed

- `app/lib/clasificados/autos/autosPublishApiContract.ts` (new)
- `app/lib/clasificados/autos/autosListingPayloadPersistence.ts`
- `app/lib/clasificados/autos/autosClassifiedsListingService.ts`
- `app/api/clasificados/autos/listings/route.ts`
- `app/api/clasificados/autos/listings/[id]/route.ts`
- `app/api/clasificados/autos/checkout/route.ts` (QA allowlist missing only)
- `app/api/clasificados/autos/publish-options/route.ts` (runtime)
- `app/(site)/publicar/autos/shared/lib/autosMuxPublishPrepare.ts`
- `app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx`
- `scripts/autos-working-category-publish-pattern-rescue-audit.ts` (new)
- `package.json` (audit script)

## API contract after

**Success (`POST /api/clasificados/autos/listings`):**

```json
{
  "ok": true,
  "id": "uuid",
  "listing": {
    "id": "uuid",
    "leonixAdId": "AUTO-2026-000001",
    "lane": "negocios",
    "status": "draft",
    "publicUrl": "/clasificados/autos/vehiculo/uuid"
  },
  "persistWarnings": []
}
```

**Failure:**

```json
{
  "ok": false,
  "errorCode": "HEAVY_MEDIA_DETECTED",
  "message": "safe user message",
  "details": "safe dev detail"
}
```

## QA bypass contract

**PASS (restored):** `AutosPublishConfirmCore.startCheckout()` → PATCH listing → POST checkout → activate + bundle on bypass. `AUTOS_NEGOCIOS_QA_PUBLISH_ALLOWLIST` unchanged. New `AUTOS_NEGOCIOS_QA_ALLOWLIST_MISSING` when env list empty and Stripe off.

Reference: `AUTOS_A5_SHIP_01_TRUE_PREVIEW_LIVE_PUBLISH_PROOF_AUDIT.md`

## SQL / RLS / storage decision

| Check | Result | Evidence |
|---|---|---|
| SQL REQUIRED | NO (code path) | Migrations define `autos_classifieds_listings`; production must have them applied per `AUTOS_A5_SHIP_01_POST_PUBLISH_SQL.md` |
| RLS BLOCKER | NO | Writes use service role (same as Empleos/Servicios) |
| STORAGE BLOCKER | NO | Non-durable media stripped; no blob upload on create |

If production insert returns `42P01` (relation missing), apply existing migrations — do not fake success.

## Negocios result

**FIXED (code):** Create/update returns fast structured JSON; client strips heavy media before POST; QA allowlist missing surfaced clearly.

## Privado result

**FIXED (code):** Same listing API path; no dealer bundle on Privado checkout.

## Success / public / results / dashboard / admin identity

**PASS (unchanged):** Internal UUID = row `id`; Leonix ID = `leonix_ad_id` trigger; public URL = `/clasificados/autos/vehiculo/[id]`; dashboard/admin read same table.

## Stripe / promo exclusion

- no Stripe wiring added
- no promo code wiring added
- QA bypass only via existing env allowlist

## Build result

`npm run build` — exit 0 (Gate 12).

## Final release decision

READY TO COMMIT AND PUSH: YES (pending Chuy live QA on production Supabase).

Reference audits: `AUTOS_A5_SHIP_01_TRUE_PREVIEW_LIVE_PUBLISH_PROOF_AUDIT.md`, `AUTOS_A5_SHIP_01_POST_PUBLISH_SQL.md`

1. Hard refresh `/publicar/autos/negocios/confirm?lang=es`
2. Click **Intentar de nuevo**
3. If draft invalid, **Volver a editar** and re-submit with https image URLs (not local file blobs)
4. Publish Negocios (QA allowlist or Stripe bypass)
5. Success page shows UUID + Leonix ID
6. Open public detail `/clasificados/autos/vehiculo/[id]`
7. Confirm results/dashboard/admin find listing when `status=active`
8. Repeat Privado flow
9. Confirm no dealer modules in Privado
10. Confirm no fake paid state

## Chuy QA steps
