# Stack FINAL-1C — Gold Standard Audit (En Venta / Varios + Servicios)

## En Venta / Varios files inspected

| Area | Key files |
|------|-----------|
| Application | `LeonixEnVentaFreeApplication.tsx`, `enVentaFreeFormState.ts` |
| Draft | `enVentaPreviewDraft.ts`, `enVentaPreviewDraftIdb.ts`, `useEnVentaFormAutosave.ts` |
| Preview | `EnVentaPreviewPage.tsx`, `buildEnVentaPreviewModel.ts` |
| Publish | `enVentaPublishFromDraft.ts`, `enVentaPublishValidation.ts` |
| Public browse | `enVentaListingPublicSelect.ts`, `listingPublicBrowseEligibility.ts` |
| Results card | `EnVentaResultListingCard.tsx`, `buildEnVentaResultsCardModel.ts` |
| Detail | `EnVentaAnuncioLayout.tsx`, `EnVentaBuyerPanel.tsx` |
| Admin | `app/admin/(dashboard)/workspace/clasificados/en-venta/page.tsx` |
| Dashboard | `dashboard/mis-anuncios/page.tsx`, `EnVentaListingManageCard.tsx` |
| Analytics | `enVentaAnalytics.ts`, `enVentaGlobalAnalytics.ts` |

## Servicios files inspected

| Area | Key files |
|------|-----------|
| Application | `ClasificadosServiciosApplication.tsx` |
| Draft | `clasificadosServiciosStorage.ts` (sessionStorage + IDB) |
| Preview handoff | `clasificadosServiciosPreviewHandoff.ts` |
| Publish API | `app/api/clasificados/servicios/publish/route.ts` |
| Public detail | `app/(site)/clasificados/servicios/[slug]/page.tsx` |
| Admin | `app/admin/(dashboard)/workspace/clasificados/servicios/page.tsx` |
| Dashboard | `app/(site)/dashboard/servicios/page.tsx` |
| Analytics | `serviciosAnalytics.ts`, `servicios_analytics_events` |

## Gold-standard patterns

### Application
Multi-step form, auth-gated publish, debounced autosave, explicit preview route.

### Media persistence (En Venta + Servicios)
- **Per-tab sessionStorage** (+ IDB for heavy media in both references)
- Preview round-trip via return key (Servicios) or shared draft store (En Venta)
- **New tab starts clean** via session scope / tab session id
- Upload at publish time to blob/storage; metadata in draft until submit

### Publish (En Venta vs Servicios vs Ofertas)
| | En Venta | Servicios | Ofertas Locales |
|--|----------|-----------|-----------------|
| Auth | Client Supabase | Bearer JWT strict in prod | Bearer JWT API |
| Initial public status | active immediately | published (or pending_review if moderation mode) | **pending_review always** |
| Admin gate | Post-publish ops | Optional moderation mode | **Pre-public approval** |

### Public card/detail
Normalized DTO from DB; contact CTAs real or hidden; no fake counts.

### Admin / dashboard
En Venta: ops queue post-publish. Servicios: full lifecycle admin + owner dashboard. Ofertas: **not built yet**.

### Analytics
Servicios: DB-backed `servicios_analytics_events`. En Venta: global listing analytics. Ofertas: **event names only** (Gate 1).

## Differences Ofertas Locales must close

| Gap | Fix now | Defer |
|-----|---------|-------|
| sessionStorage per-tab draft | ✅ Done (FINAL-1B+) | — |
| googleReview/yelp in publish + public parse | ✅ Gate C | — |
| Production DB tables | — | **BLOCKER — Chuy SQL apply** |
| Admin review queue | — | FINAL-2 |
| Seller dashboard / edit | — | FINAL-3 |
| Public offer social on cards | — | FINAL-4 (promote metadata on approve) |
| Analytics pipeline | — | FINAL-5 |
| AI item admin activation | — | FINAL-6 |
| Email/SMS list share | — | FINAL-7 |
