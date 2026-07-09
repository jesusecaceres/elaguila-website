# CATEGORY-STANDARD-V2-COMMUNITY-SIMPLE-LANDINGS-CONTAINMENT-FIX-V1

**Date:** 2026-07-08  
**Type:** Micro containment patch  
**Scope:** Isolate Comunidad / Busco / Mascotas compact landing styling from shared `CategoryRecentListings`

---

## Objective

The prior community landing cleanup applied V2 compact styling to `CategoryRecentListings.tsx`, which is also consumed by **Clases**. This patch reverts the shared component and moves Comunidad compact styling to a category-local component.

---

## Files inspected

- `app/(site)/clasificados/components/categoryLanding/CategoryRecentListings.tsx`
- `app/(site)/clasificados/comunidad/page.tsx`
- `app/(site)/clasificados/busco/page.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/page.tsx`
- `app/(site)/clasificados/busco/BuscoLandingRecentListings.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosLandingRecentListings.tsx`
- `app/(site)/clasificados/clases/page.tsx` (read-only — confirm still uses shared component)

---

## Files changed

| File | Change |
|------|--------|
| `app/(site)/clasificados/components/categoryLanding/CategoryRecentListings.tsx` | Reverted to pre-V2 shared styling (restores Clases appearance) |
| `app/(site)/clasificados/comunidad/ComunidadLandingRecentListings.tsx` | **Added** — category-local compact V2 recent events block |
| `app/(site)/clasificados/comunidad/page.tsx` | Switched import from shared `CategoryRecentListings` to `ComunidadLandingRecentListings` |

**Unchanged (already local / clean):**

- `app/(site)/clasificados/busco/page.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/page.tsx`
- `app/(site)/clasificados/busco/BuscoLandingRecentListings.tsx`
- `app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosLandingRecentListings.tsx`

---

## Shared component containment

| Check | Result |
|-------|--------|
| `CategoryRecentListings` used by Clases | **TRUE** — `clases/page.tsx` imports shared component |
| `CategoryRecentListings` used by Comunidad after fix | **FALSE** — Comunidad now uses local component |
| Shared V2 visual change reverted | **TRUE** — reverted to `e762ebf0` styling |
| Compact styling localized | **TRUE** — `ComunidadLandingRecentListings.tsx` only |

---

## Clases protection

Clases continues to import `CategoryRecentListings` with the original shared markup (uppercase eyebrow headings, gold link, legacy section borders). No edits under `clases/**`.

---

## What stayed cleaned

### Comunidad

- V2 lane wrapper (`px-3.5 pb-8 sm:px-5 lg:px-6`)
- Hero with tagline + helper
- Quick filter chips
- Compact recent events / empty state via **local** `ComunidadLandingRecentListings`
- No orphan “Volver a Clasificados” link

### Busco

- V2 compact shell (unchanged)
- Compact info/warning strip
- Quick filters
- Recent solicitudes via `BuscoLandingRecentListings` (local, capped at 4)
- No orphan back link

### Mascotas y Perdidos

- V2 compact shell (unchanged)
- Quick filters by notice type
- Recent avisos with image cards via `MascotasPerdidosLandingRecentListings` (local, capped at 4)
- No orphan back link

---

## Out of scope confirmation

- Results / resultados routes: untouched
- Publish / publicar routes: untouched
- Admin / dashboard / auth / API / Supabase / Stripe: untouched
- Other category landings (Autos, En Venta, Empleos, etc.): untouched

---

## Build

`npm run build` — run at patch completion.

---

## TRUE / FALSE audit

| Item | Result |
|------|--------|
| Only containment-relevant landing files changed | TRUE |
| `CategoryRecentListings` shared impact found | TRUE (was affecting Clases) |
| `CategoryRecentListings` reverted or localized | TRUE |
| Clases protected from visual change | TRUE |
| Comunidad clean compact landing preserved | TRUE |
| Busco clean compact landing preserved | TRUE |
| Mascotas clean compact landing preserved | TRUE |
| Results pages untouched | TRUE |
| Publish flows untouched | TRUE |
| Other categories untouched | TRUE |
| Ready for manual QA | YES |
