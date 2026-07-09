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
| HEAD | `9827b35b commit and push` |
| Dirty at audit start | clean |
| Prior audit docs | YES — CAT_STD + CLASIFICADOS shell docs exist |

---

## Gate 1 — Route inventory

| Surface | Category/Lane | Landing route | Results route | Alias route | Publish/Advertise route | Source file | Client/server | Notes |
|---------|---------------|---------------|---------------|-------------|-------------------------|-------------|---------------|-------|
| Clasificados hub | all | `/clasificados` | per category | — | per category | `clasificados/page.tsx` | client + Suspense | **Fixed:** Suspense + Link on post CTA |
| En Venta / Varios | en-venta | `/clasificados/en-venta` | `/clasificados/en-venta/results` | — | `/clasificados/publicar/en-venta` | `en-venta/page.tsx`, `en-venta/results/page.tsx` | landing SSR shell streams preview; results client | Preview cap 24; **Fixed:** Suspense defers listing fetch |
| Rentas | rentas | `/clasificados/rentas` | `/clasificados/rentas/results` | — | `/clasificados/publicar/rentas` | `rentas/page.tsx`, `rentas/results/page.tsx` | landing client shell; results SSR 5000 cap | Landing has no SSR listing fetch; **Fixed:** Suspense on results SSR |
| Empleos | empleos | `/clasificados/empleos` | `/clasificados/empleos/results` | `/clasificados/empleos/resultados` | `/clasificados/publicar/empleos` | `empleos/page.tsx`, `empleos/resultados/page.tsx` | landing server; results dynamic SSR | `results` re-exports `resultados`; **Fixed:** fetch inside Suspense |
| Autos | autos | `/clasificados/autos` | `/clasificados/autos/results` | `/clasificados/autos/resultados` | `/clasificados/publicar/autos` | `autos/page.tsx`, `autos/resultados/page.tsx` | client landing + Suspense | Dealer lane: `results?seller=dealer` |
| Bienes Raíces | bienes-raices | `/clasificados/bienes-raices` | `/clasificados/bienes-raices/results` | `/clasificados/bienes-raices/resultados` | `/clasificados/publicar/bienes-raices` | `bienes-raices/page.tsx` | client landing hub | Negocios Locales overlap |
| Servicios | servicios | `/clasificados/servicios` | `/clasificados/servicios/results` | `/clasificados/servicios/resultados` | `/clasificados/publicar/servicios/checkpoint` | `servicios/page.tsx`, `servicios/resultados/page.tsx` | landing SSR 200; results SSR 500 | **Deferred:** heavy SSR on results |
| Restaurantes | restaurantes | `/clasificados/restaurantes` | `/clasificados/restaurantes/results` | `/clasificados/restaurantes/resultados` | `/clasificados/restaurantes/publicar` | `restaurantes/page.tsx` | landing SSR inventory | Negocios Locales overlap |
| Viajes | viajes | `/clasificados/viajes` | `/clasificados/viajes/results` | `/clasificados/viajes/resultados` | `/clasificados/publicar/viajes` | `viajes/page.tsx` | SSR browse merge + client | Legacy `/clasificados/travel` → redirect |
| Clases | clases | `/clasificados/clases` | `/clasificados/clases/results` | `/clasificados/clases/resultados` | `/clasificados/publicar/clases` | `clases/page.tsx` | client landing; client results | **Fixed:** Suspense for useSearchParams |
| Comunidad | comunidad | `/clasificados/comunidad` | `/clasificados/comunidad/results` | `/clasificados/comunidad/resultados` | `/clasificados/publicar/comunidad` | `comunidad/page.tsx` | client landing | **Fixed:** Suspense |
| Busco | busco | `/clasificados/busco` | `/clasificados/busco/results` | `/clasificados/busco/resultados` | `/publicar/busco/quick` | `busco/page.tsx` | client landing | **Fixed:** Suspense |
| Mascotas y Perdidos | mascotas-y-perdidos | `/clasificados/mascotas-y-perdidos` | `/clasificados/mascotas-y-perdidos/results` | `/clasificados/mascotas-y-perdidos/resultados` | `/clasificados/publicar/mascotas-y-perdidos` | `mascotas-y-perdidos/page.tsx` | client landing | **Fixed:** Suspense |
| Ofertas Locales | ofertas-locales | `/clasificados/ofertas-locales` | `/clasificados/ofertas-locales/results` | — | `/publicar/ofertas-locales` | `ofertas-locales/page.tsx` | client search shell | Negocios Locales overlap |
| Comida Local | comida-local | `/clasificados/comida-local` | inline on landing | — | `/publicar/comida-local` | `comida-local/page.tsx` | SSR listing query | Negocios Locales overlap |
| Negocios Locales | all lanes | `/negocios-locales` | per lane → Clasificados | — | per lane | `negocios-locales/page.tsx` | client hub + Suspense | **Fixed:** autos-dealer → `/autos/results` |

---

## Gate 2 — Navigation / double-click hunt

| Finding | Status |
|---------|--------|
| Clasificados hub `useSearchParams` without Suspense | **Fixed** — Suspense wrapper |
| Clasificados hub post CTA used `<a>` for `/login` | **Fixed** — Next `Link` |
| Category landings (clases/comunidad/busco/mascotas) missing Suspense | **Fixed** |
| Negocios Locales lane cards | OK — `Link` with stable hrefs |
| Nested anchors / blocking overlays on primary cards | None found |
| Perceived double-click on slow categories | Aligns with SSR/data latency, not click handlers |

---

## Gate 3–5 — Performance findings

| Route | Risk | Cause | Fix |
|-------|------|-------|-----|
| `/clasificados/rentas/results` | HIGH | SSR `fetchRentasPublicListingsForBrowse` cap 5000 + entitlement overlay blocks TTFB | **Fixed:** Suspense streams shell first |
| `/clasificados/en-venta` | MEDIUM | Parallel SSR hub + preview fetch blocked shell | **Fixed:** Suspense defers preview fetch; shell renders with empty preview |
| `/clasificados/en-venta/results` | HIGH | Client `queryEnVentaBrowseListings` cap 800 | **Deferred** — results page intentionally heavy |
| `/clasificados/empleos` | MEDIUM | Server job fetch before Suspense boundary | **Fixed:** fetch moved inside Suspense child |
| `/clasificados/servicios/resultados` | HIGH | SSR 500 rows + overlay | **Deferred** — needs separate streaming task |
| `/clasificados/rentas` landing | LOW | Client-only hub, no listing SSR | OK |
| Fast reference (clases/comunidad) | LOW | Client landing + client-side recent fetch | OK |

---

## Gate 6 — Negocios Locales cross-reference

| Lane | Explore route | Advertise route | Clasificados overlap | Verified | Future separation risk |
|------|---------------|-----------------|----------------------|----------|------------------------|
| Ofertas Locales | `/clasificados/ofertas-locales` | `/publicar/ofertas-locales` | YES — same category | YES | Low — dedicated publish path exists |
| Servicios | `/clasificados/servicios` | `/clasificados/publicar/servicios` | YES | YES | Medium — shared results SSR |
| Restaurantes | `/clasificados/restaurantes` | `/clasificados/restaurantes/publicar` | YES | YES | Medium — shared landing inventory |
| Comida Local | `/clasificados/comida-local` | `/publicar/comida-local` | YES | YES | Low — separate publish path |
| Autos Dealer | `/clasificados/autos/results?seller=dealer` | `/publicar/autos/negocios` | YES — autos results filter | YES — **Fixed** canonical `/results` | Medium — dealer param contract |
| Bienes Raíces | `/clasificados/bienes-raices` | `/clasificados/publicar/bienes-raices` | YES | YES | Medium — shared hub + publish |

**Preservation for later separation:** Keep lane explore/advertise href helpers in `negocios-locales/page.tsx`; preserve `seller=dealer` on autos; do not break `/results` ↔ `/resultados` re-exports.

---

## Gate 7 — Smoke matrix

| Category | Landing | Results | Alias | Publish | Lang | First-click | Slow-load | Status |
|----------|---------|---------|-------|---------|------|-------------|-----------|--------|
| hub | YES | — | — | per cat | YES | low | low | Fixed Suspense |
| en-venta | YES | YES | — | YES | YES | low | medium→low shell | Fixed Suspense |
| rentas | YES | YES | — | YES | YES | low | high results | Fixed Suspense shell |
| empleos | YES | YES | YES | YES | YES | low | medium | Fixed Suspense |
| autos | YES | YES | YES | YES | YES | low | medium | OK |
| bienes-raices | YES | YES | YES | YES | YES | low | medium | OK |
| servicios | YES | YES | YES | YES | YES | low | high results | Deferred |
| restaurantes | YES | YES | YES | YES | YES | low | medium | OK |
| viajes | YES | YES | YES | YES | YES | low | medium | OK |
| clases | YES | YES | YES | YES | YES | low | low | Fixed Suspense |
| comunidad | YES | YES | YES | YES | YES | low | low | Fixed Suspense |
| busco | YES | YES | YES | YES | YES | low | low | Fixed Suspense |
| mascotas-y-perdidos | YES | YES | YES | YES | YES | low | low | Fixed Suspense |
| ofertas-locales | YES | YES | — | YES | YES | low | medium | OK |
| comida-local | YES | inline | — | YES | YES | low | medium | OK |
| negocios-locales | YES | per lane | — | per lane | YES | low | low | Fixed autos path |

---

## Gate 9 — Timing guide

Run: `npx tsx scripts/clasificados-route-smoke-audit.ts`

Optional: `BASE_URL=http://localhost:3000 npx tsx scripts/clasificados-route-smoke-audit.ts`

**Manual checks:**
1. Single click from hub or Negocios Locales → page opens (no second click).
2. Network tab: landing TTFB should show shell before heavy JSON/HTML.
3. Compare fast (clases/comunidad) vs slow suspects (rentas/results, servicios/resultados).
4. Rentas results: loading shell visible before grid populates.
5. En Venta landing: hero/CTAs visible before recent listings stream in.

---

## Gate 10 — Build validation

Run `npm run build` after fixes. See final report for result.
