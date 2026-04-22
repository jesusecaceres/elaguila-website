# Autos contact & trust report (enforcement)

**Scope:** Paid Autos **live** detail uses the same preview components as draft: `AutoDealerPreviewPage` / `AutoPrivadoPreviewPage` via `AutosLiveVehicleClient.tsx`.

## CTAs verified in source (not browser-driven)

| CTA | Location | Target / behavior | Dead-link guards |
|-----|----------|-------------------|------------------|
| Llamar / `tel:` | `DealerBusinessStack.tsx`, `PrivadoContactStrip.tsx` | `href={`tel:${phoneForTel}`}` | **Digit threshold** documented in components — short fragments do not render as `tel:` |
| WhatsApp / `wa.me` | `DealerBusinessStack.tsx` | Normalized `wa.me` link when number present | Only shown when field non-empty after normalize |
| Email | `PrivadoContactStrip.tsx` (private lane) | `mailto:` when `dealerEmail` set | Hidden when empty |
| Message / site inquiry | `PrivadoContactStrip.tsx` | Controlled by `privadoSiteMessageEnabled` | Can hide CTA when false |
| Report listing | `AutosLiveVehicleClient.tsx` footer | `LeonixInlineListingReport` → `submitListingReportAction` → `listing_reports` | Requires reason text; shows confirmation copy |
| Back to results | `AutosLiveVehicleClient.tsx` | `serializeAutosBrowseUrl` → `/clasificados/autos/resultados?...` | Always valid internal route |

## Trust fields

| Field | Public card | Detail | Notes |
|-------|---------------|--------|-------|
| VIN | Hidden | Shown in specs when present | Do not put in card for abuse scraping |
| Dealer / private display name | Via `dealerName` / `privateSellerLabel` in mapper | Preview header | Lane-derived `sellerType` gates dealer-only chrome |
| Business description (dealer) | — | Rendered when `branch` negocio | Plain text |

## What was **not** executed here

- No manual click test in a browser on staging/production.  
- No automated Playwright/Cypress run in CI for this pass.

**Verdict for “no dead CTA”:** **proven at source level only**; full UX proof remains **FALSE** until a human or E2E run clicks each CTA on a device (see strict audit in parent enforcement response).
