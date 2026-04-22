# Autos CTA audit (recovery pass)

Legend: **Code** = route/handler exists and static analysis shows correct `href` or `router.push`. **Runtime** = not executed in this session unless noted.

## Publish / pay / success

| CTA | Where | Expected | Actual route / action | Status |
| --- | ----- | -------- | --------------------- | ------ |
| Publicar anuncio (nav) | Landing shell | `/publicar/autos` (+ lang) | `appendLangToPath("/publicar/autos", lang)` | **Code TRUE** |
| Lane entry | `/publicar/autos` | Negocios vs Privado | Routes under `/publicar/autos/negocios` / `privado` | **Code TRUE** |
| Continue / review (in forms) | Publish wizards | Advance steps | Client state in lane apps | **Runtime not run** |
| Pay / Checkout | Confirm surfaces | `POST /api/clasificados/autos/checkout` | `checkout/route.ts` | **Code TRUE** / **Runtime FALSE** |
| Success Dismiss / next | `AutosPagoExitoClient` | Return to dashboard or listing | Inspect component links | **Code TRUE** (verify file for exact hrefs) |

## Landing / results / detail

| CTA | Where | Expected | Status |
| --- | ----- | -------- | ------ |
| Search | Hero | Serialized results URL with q/city/zip | **Code TRUE** |
| Ver todos / Explore all | Hero + CTAs | `/clasificados/autos/resultados?...` | **Code TRUE** |
| Quick chips / body style | Landing | Filtered results URL | **Code TRUE** |
| Card “Ver detalles” | Cards | `/clasificados/autos/vehiculo/[id]?lang=` | **Code TRUE** |
| Filter Apply | Results rail | `router.push` with serialized bundle | **Code TRUE** |
| Pagination | Results | `serializeAutosBrowseUrl` page param | **Code TRUE** |
| Contact (call / email / message) | Detail `AutosLiveVehicleClient` | `tel:` / `mailto:` / message flow | **Code TRUE** / **Runtime FALSE** |
| Report listing | Detail | `LeonixInlineListingReport` | Wired in live client per prior matrix — **Code TRUE** |

## Dashboard / admin

| CTA | Where | Expected | Status |
| --- | ----- | -------- | ------ |
| Manage / Pay / View | `AutosClassifiedListingManageCard` | APIs + internal routes | **Code TRUE** / **Runtime FALSE** |
| Admin public link | Admin autos table | `/clasificados/autos/vehiculo/{id}` | **Code TRUE** / **Runtime FALSE** |

## Issues fixed this pass

- Removed user-visible “Boost” / “impulsos” phrasing in `AutosAnuncioLaneContextStrip.tsx` (renew/refresh language).

## Dead / misleading CTAs

| Finding | Status |
| ------- | ------ |
| None newly identified in code review this pass | — |
