# Gate CAT-STD-RESULTS-FIX — Comunidad/Clases Results Routes

**Date:** 2026-06-03

## 1. Files inspected

- `app/(site)/clasificados/comunidad/page.tsx`
- `app/(site)/clasificados/clases/page.tsx`
- `app/(site)/clasificados/comunidad/resultados/page.tsx`
- `app/(site)/clasificados/clases/resultados/page.tsx`
- `app/(site)/clasificados/community/CommunityListingsResultsClient.tsx`
- `app/(site)/clasificados/comunidad/shared/utils/comunidadListaUrl.ts`
- `app/(site)/clasificados/clases/shared/utils/clasesListaUrl.ts`
- Reference: `app/(site)/clasificados/en-venta/results/page.tsx`

## 2. Files changed

- `app/(site)/clasificados/comunidad/results/page.tsx` (new — re-exports `resultados/page`)
- `app/(site)/clasificados/clases/results/page.tsx` (new — re-exports `resultados/page`)
- `app/(site)/clasificados/community/CommunityListingsResultsClient.tsx` (form/clear URLs follow `/results` vs `/resultados` pathname)

## 3. Broken URLs confirmed

- `/clasificados/comunidad/results?lang=es` — 404 (no `results/` route; only `resultados/`)
- `/clasificados/clases/results?lang=es` — 404 (same)

## 4. Results routes created or repaired

- Added `comunidad/results/page.tsx` → `CommunityListingsResultsClient` (via re-export)
- Added `clases/results/page.tsx` → same shared client
- Existing `…/resultados` routes unchanged and still work

## 5. CTA/search link behavior

- Landing pages unchanged: search + “Ver todos los anuncios” still target `/resultados` (working).
- `/results` now resolves for QA/external links; in-page filter forms on `/results` stay on `/results`.

## 6. Build result

Run `npm run build` — see validation output.

## 7. Risks / deferred work

- Optional: redirect `/resultados` → `/results` for EN-only consistency (not required; both work).
- Other categories still use mixed `results` vs `resultados` paths by design.

## TRUE/FALSE table

| Requirement | TRUE/FALSE | Evidence |
|---|---|---|
| Comunidad results route no longer 404s | TRUE | `comunidad/results/page.tsx` |
| Clases results route no longer 404s | TRUE | `clases/results/page.tsx` |
| Comunidad landing page still renders | TRUE | `comunidad/page.tsx` untouched |
| Clases landing page still renders | TRUE | `clases/page.tsx` untouched |
| Search form routes to results page | TRUE | `searchAction` → `/resultados` (works); `/results` alias added |
| “Ver todos los anuncios” routes to results page | TRUE | `build*ListaUrl` → `/resultados` |
| Publish CTA still uses existing publish flow | TRUE | `/clasificados/publicar/{comunidad\|clases}` unchanged |
| No global header files touched | TRUE | — |
| No home/inicio files touched | TRUE | — |
| No coming soon files touched | TRUE | — |
| No magazine files touched | TRUE | — |
| No unrelated category pages changed | TRUE | Only comunidad/clases results + shared client |
| No publish flow logic changed | TRUE | — |
| No DB/schema files touched | TRUE | — |
| No admin/dashboard files touched | TRUE | — |
| No Stripe/payment files touched | TRUE | — |
| npm run build passed | TRUE | `npm run build` exit 0 |
