# Bienes Raíces — launch arrangement (ordering, lanes, renew)

This document is the **product contract** for how Leonix BR behaves at launch. Implementation lives in `resultados/lib/brResultsFilters.ts`, `resultados/BienesRaicesResultsClient.tsx`, `landing/buildBrLandingInventorySections.ts`, and dashboard `LeonixRealEstateListingManageCard.tsx`.

## Default ordering (resultados grid)

1. **Primary sort** (URL `sort`): `reciente` (default), `precio_asc`, `precio_desc`.
2. **`reciente`**: uses publish time (`demoPublishedAtMs` in dev fixtures; `published_at` / equivalent when mapped from Supabase rows).
3. **Fairness tie-break** (same price or same publish tick): **`privado` before `negocio`**, then stable `id` (`compareBrListingFairness`). This keeps private sellers from being buried when timestamps or prices tie.

## Business vs private

- **Same filters and same grid** for discovery. No pay-to-win **grid** ranking.
- **Negocios spotlight band**: a **limited editorial lane** (top of page) for business listings that pass spotlight selection (`pickNegociosSpotlight`). It is **not** a substitute for the full marketplace grid and does not remove private listings from the main results.
- **Badges / labels**: cards use `sellerKind` + human copy (`sellerKindLabels`) so buyers see **Privado** vs **Negocio** clearly.

## Renew / republish / “boost”

- **Launch naming**: prefer **publicar / republicar / frescura** over “boost” for BR. The En Venta–style **paid boost** semantics do **not** define BR grid ordering.
- **Operational meaning**: editing and **republishing** updates freshness and therefore **reciente** placement. Legacy `boost_expires` / `Leonix:promoted` flags may exist in data; dashboard copy for BR states they **do not** grant BR ranking advantage.

## Demo vs production inventory

- **`brShouldMergeDemoInventoryWithLive()`**: in local `next dev`, demo rows may merge with live reads for UX; **production builds** use **live-only** inventory on landing and resultados unless that helper explicitly allows merge (see `bienes-raices/lib/brPublicInventoryMode.ts`).
- **Copy**: `getBrResultsCopy(lang, { useDevInventoryCopy: mergeDemo })` — production surfaces avoid “demo inventory” wording when merge is off.

## Proof

- `npm run verify:br` → `scripts/br-launch-selftest.ts` (URL state, machine facets, filters, fairness tie-break).
- `npm run verify:br:launch-gate` → typecheck + `lint:br` + selftest.
