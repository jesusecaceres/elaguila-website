# Autos classifieds publish lifecycle (internal reference)

## Data store

- Table: `autos_classifieds_listings` (Supabase, service role from API routes).
- Payload: `listing_payload` → `AutoDealerListing` (shared shape for **privado** and **negocios** lanes via `autosLane` / row `lane`).

## Status enum (source of truth)

See `autosClassifiedsTypes.ts` and helpers in `autosClassifiedsVisibility.ts`.

| status             | Meaning                                      | Public API (`/api/clasificados/autos/public/listings`) |
| ------------------ | -------------------------------------------- | ------------------------------------------------------ |
| `draft`            | Saved, editable                              | Hidden                                                 |
| `pending_payment`  | Stripe Checkout session created            | Hidden                                                 |
| `payment_failed`   | Recoverable; user can PATCH and retry       | Hidden                                                 |
| `active`           | Paid (or internal bypass) and live           | **Included**                                           |
| `cancelled`        | Terminal / not used in all paths           | Hidden                                                 |
| `removed`          | Owner unpublished                            | Hidden                                                 |

## Flow

1. **Draft** — User edits `/publicar/autos/privado` or `/publicar/autos/negocios` (IndexedDB + optional resume). Confirm page `POST /api/clasificados/autos/listings` creates DB row `draft`.
2. **Review** — `/publicar/autos/{lane}/confirm` loads draft, syncs `PATCH` if session cache id exists.
3. **Publish CTA** — `POST /api/clasificados/autos/checkout`:
   - **Production:** Stripe Checkout → `pending_payment` → on success webhook / `GET checkout/verify` → `active` + `published_at`.
   - **Internal (non-prod only):** If `AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1` and `VERCEL_ENV !== production`, activates to `active` without Stripe and redirects to `pago/exito?internal=1&listing_id=…`.
4. **Public read** — `GET /api/clasificados/autos/public/listings` returns rows with `status === "active"` mapped via `mapAutosClassifiedsToPublic.ts`.
5. **Detail** — `/clasificados/autos/vehiculo/[id]` → `GET /api/clasificados/autos/public/listings/[id]` (active only).

## Dashboards

- **Mis anuncios** — `AutosLeonixPaidListingsSection` reads owner `GET /api/clasificados/autos/listings`.
- **Borradores** — Generic `listings` drafts + `DashboardAutosPaidDraftsBand` for pre-publish Autos rows.
- **Admin** — `/admin/workspace/clasificados/autos` lists all `autos_classifieds_listings` with lane, status, visibility.

## Known gaps / product follow-ups

- Internal bypass must never be enabled on Vercel Production (`VERCEL_ENV=production` blocks it in code).
- `listings` category `autos` (free legacy) is separate from this paid table; do not mix analytics without an explicit join strategy.
