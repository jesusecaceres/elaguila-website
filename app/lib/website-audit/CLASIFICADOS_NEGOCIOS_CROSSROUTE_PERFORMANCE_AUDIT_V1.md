# CLASIFICADOS + NEGOCIOS LOCALES — Cross-Route Performance Audit V1

**Task:** `CLASIFICADOS-NEGOCIOS-CROSSROUTE-SLOW-DOUBLECLICK-AUDIT-V1`  
**Date:** 2026-07-06  
**Scope:** Route/navigation/performance only — no chip/design polish, no schema/monetization changes.

Related docs: `CAT_STD_ALL_LANDING_RESULTS_AUDIT.md`, `CLASIFICADOS_ALL_SHELL_STANDARD_V1.md`, `categoryStandardRoutes.ts`.

---

## Gate 0 — Preflight

| Item | Value |
|------|-------|
| Branch | `main` |
| HEAD | `c3678192 commit and push` |
| Dirty at audit start | clean |
| Prior audit docs | YES — CAT_STD + CLASIFICADOS shell docs exist |

---

## Gate 1 — Route inventory

| Surface | Category/Lane | Landing route | Results route | Alias route | Publish/Advertise route | Source file | Client/server | Notes |
|---------|---------------|---------------|---------------|-------------|-------------------------|-------------|---------------|-------|
| Clasificados hub | all | `/clasificados` | per category | — | per category | `app/(site)/clasificados/page.tsx` | client | Link cards; priority en-venta/rentas/empleos |
| En Venta / Varios | en-venta | `/clasificados/en-venta` | `/clasificados/en-venta/results` | — | `/clasificados/publicar/en-venta` | `en-venta/page.tsx`, `en-venta/results/page.tsx` | landing SSR + client hub; results client | **Fixed:** landing preview cap 24 (was 800 SSR) |
| Rentas | rentas | `/clasificados/rentas` | `/clasificados/rentas/results` | — | `/clasificados/publicar/rentas` | `rentas/page.tsx`, `rentas/results/page.tsx` | landing client shell; results SSR 5000 cap | **Fixed:** removed dead landing SSR fetch |
| Empleos | empleos | `/clasificados/empleos` | `/clasificados/empleos/results` | `/clasificados/empleos/resultados` | `/clasificados/publicar/empleos` | `empleos/page.tsx`, `empleos/resultados/page.tsx` | landing server; results dynamic SSR | `results` re-exports `resultados` |
| Autos | autos | `/clasificados/autos` | `/clasificados/autos/results` | `/clasificados/autos/resultados` | `/clasificados/publicar/autos` | `autos/page.tsx`, `autos/resultados/page.tsx` | client landing + Suspense | Dealer lane uses `resultados?seller=dealer` |
| Bienes Raíces | bienes-raices | `/clasificados/bienes-raices` | `/clasificados/bienes-raices/results` | `/clasificados/bienes-raices/resultados` | `/clasificados/publicar/bienes-raices` | `bienes-raices/page.tsx` | client landing hub | Negocios Locales overlap |
| Servicios | servicios | `/clasificados/servicios` | `/clasificados/servicios/results` | `/clasificados/servicios/resultados` | `/clasificados/publicar/servicios/checkpoint` | `servicios/page.tsx`, `servicios/resultados/page.tsx` | landing SSR 200; results SSR 500 | `results` re-exports `resultados` |
| Restaurantes | restaurantes | `/clasificados/restaurantes` | `/clasificados/restaurantes/results` | `/clasificados/restaurantes/resultados` | `/clasificados/restaurantes/publicar` | `restaurantes/page.tsx` | landing SSR inventory | Negocios Locales overlap |
| Viajes | viajes | `/clasificados/viajes` | `/clasificados/viajes/results` | `/clasificados/viajes/resultados` | `/clasificados/publicar/viajes` | `viajes/page.tsx` | SSR browse merge + client | Legacy `/clasificados/travel` → redirect |
| Clases | clases | `/clasificados/clases` | `/clasificados/clases/results` | `/clasificados/clases/resultados` | `/clasificados/publicar/clases` | `clases/page.tsx` | client landing; client results | CAT-STD shell |
| Comunidad | comunidad | `/clasificados/comunidad` | `/clasificados/comunidad/results` | `/clasificados/comunidad/resultados` | `/clasificados/publicar/comunidad` | `comunidad/page.tsx` | client landing | Fast reference category |
| Busco | busco | `/clasificados/busco` | `/clasificados/busco/results` | `/clasificados/busco/resultados` | `/publicar/busco/quick` | `busco/page.tsx` | client landing | CAT-STD shell |
| Mascotas y Perdidos | mascotas-y-perdidos | `/clasificados/mascotas-y-perdidos` | `/clasificados/mascotas-y-perdidos/results` | `/clasificados/mascotas-y-perdidos/resultados` | `/clasificados/publicar/mascotas-y-perdidos` | `mascotas-y-perdidos/page.tsx` | client landing | CAT-STD shell |
| Ofertas Locales | ofertas-locales | `/clasificados/ofertas-locales` | `/clasificados/ofertas-locales/results` | — | `/publicar/ofertas-locales` | `ofertas-locales/page.tsx` | client search shell | Negocios Locales overlap |
| Comida Local | comida-local | `/clasificados/comida-local` | inline on landing | — | `/publicar/comida-local` | `comida-local/page.tsx` | SSR listing query | Negocios Locales overlap |
| Negocios Locales | all lanes | see Gate 6 | — | — | see Gate 6 | `negocios-locales/page.tsx` | client hub | Maps into Clasificados |

---

## Gate 2 — Navigation / double-click hunt

No nested anchors, blocking overlays, or missing Link on primary internal routes found beyond Negocios Locales login CTAs (fixed). Perceived double-click on slow categories aligns with SSR/data latency, not click handlers.

---

## Gate 3–5 — Performance findings

See final report tables. Key fixes: Rentas dead fetch removed; En Venta landing cap 24.

---

## Gate 9 — Timing guide

`npx tsx scripts/clasificados-route-smoke-audit.ts`
