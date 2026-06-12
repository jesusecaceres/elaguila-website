# Gate OL-4 — Ofertas Locales Step 2–4 Field Logic Cleanup Plan

## Current issues (live QA)

1. Step 2 and Step 3 both collected a main title (`title` + `flyerTitle` / duplicate promotion title).
2. Fresh/restored applications could show partial city text (e.g. `"sa"`) from browser autofill or stale storage.
3. ZIP input used `inputMode="numeric"`, which can block leading-zero ZIPs on some devices.
4. Service ZIPs field invited messy multi-ZIP data not used for current filtering.
5. Separate map/directions URL field duplicated what can be generated from address/city/state/ZIP.

## Title field cleanup plan

- **Step 2:** single main title — `Título de la oferta` (shopping) or `Título de la promoción` (coupons).
- **Step 3:** remove duplicate title inputs; shopping lane shows **Detalles del volante** + description; coupons lane shows **Detalles del cupón** + coupon text.
- **Migration:** on load/save, if `title` empty and `flyerTitle` present, copy to `title`. Publish mapper uses `flyerTitle || title` for `flyer_title` column.

## City default cleanup plan

- `createEmptyOfertaLocalDraft` keeps `city: ""`.
- Clear legacy `localStorage` draft key on session load/save (OL-2 migration guard).
- City input uses `autoComplete="address-level2"`; state uses `address-level1`.
- Persisted city sanitized as plain string only — no hardcoded examples.

## ZIP input fix plan

- `type="text"` string storage via `normalizeOfertaLocalZipInput` (digits only, max 5).
- Removed `inputMode="numeric"` to preserve leading zeros like `07088`.
- Validation remains exactly 5 digits when required.

## Service ZIP removal/hide plan

- Hide **ZIPs de servicio** from Step 4 UI.
- Keep `serviceZipCodes` in draft/types/publish mapper for backward compatibility.
- Not required in validation (already optional).

## Map/directions URL removal/hide plan

- Hide **URL de mapa / direcciones** from Step 4.
- Keep `directionsUrl` in draft/DB for legacy rows.
- Not required by validation (optional URL check only when present).

## Generated directions plan

- `buildOfertaLocalGoogleMapsSearchUrl` in `ofertasLocalesFormatting.ts`.
- Preview/publish prefer generated URL from address fields; legacy `directionsUrl` fallback when no location parts.
- Pattern: `https://www.google.com/maps/search/?api=1&query=...` — no Routes API.

## Persistence protection plan

- OL-2 `sessionStorage` autosave unchanged.
- `migrateOfertaLocalDraftFields` on load/save.
- Hidden fields (`serviceZipCodes`, `directionsUrl`, `flyerTitle`) preserved in JSON.

## Spanish / English copy

See `ofertasLocalesApplicationCopy.ts` — `step2OfferTitleLabel`, `step2PromotionTitleLabel`, lane section titles, description helpers, updated address helper.

## What is not touched

- Step 1 CTAs (OL-3)
- Step 5 upload / AI scan
- Payment, admin, dashboard, public results
- Supabase migrations

## QA checklist

- [ ] Step 2: one title field per lane
- [ ] Step 3: no duplicate title
- [ ] Fresh draft: empty city
- [ ] ZIP accepts `07088`
- [ ] No service ZIP field visible
- [ ] No map URL field visible
- [ ] Preview directions link from address
- [ ] Refresh + preview back-to-edit preserve data

## Deferred

- Multi-location / service-area ZIP targeting (future gate).
