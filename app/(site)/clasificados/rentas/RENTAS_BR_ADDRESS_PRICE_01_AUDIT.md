# RENTAS — BR-ADDRESS-PRICE-01 audit

Gate: structured address, comma price/size formatting, privacy-safe map CTA (Rentas privado + negocio).

## Files inspected

- `app/(site)/clasificados/publicar/rentas/shared/RentasAnuncioFormSection.tsx`
- `app/(site)/clasificados/publicar/rentas/shared/RentasTipoFlowDetailFields.tsx`
- `app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts`
- `app/(site)/clasificados/rentas/shared/rentasRentalTypeApply.ts`
- `app/(site)/clasificados/rentas/shared/rentasResidencialPreviewRows.ts`
- `app/(site)/clasificados/publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts`
- `app/(site)/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm.ts`
- `app/(site)/clasificados/rentas/lib/rentasMachineDetailPairs.ts`
- `app/(site)/clasificados/rentas/data/mapListingRowToRentasPublicListing.ts`
- `app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts`
- `app/(site)/clasificados/rentas/preview/shared/rentasPreviewResultCardListing.ts`
- `app/(site)/clasificados/rentas/preview/privado/components/RentasPrivadoPreviewClient.tsx`
- `app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx`
- `app/(site)/clasificados/rentas/results/cards/RentasResultCard.tsx`
- `app/(site)/clasificados/rentas/shell/RentasPreviewCard.tsx`

## Helpers / functions checked

| Helper | Role |
|--------|------|
| `formatRentasMensualAnuncioPreview` | Rent comma + `/ mes` (form + preview) |
| `formatRentasDepositUsdPreview` | Deposit comma USD |
| `formatRentasPlainNumberPreview` | Large plain numbers |
| `formatRentasSqftPreview` | Sqft with commas + `ft²` |
| `formatRentasSizeDisplayForPublic` | Public card/detail size normalization |
| `buildRentasStreetLine` | Street + unit (`line1, line2`) |
| `buildRentasAssembledAddressLine` | Street/unit, then city/state/zip |
| `buildRentasCityStateZipLine` | `City, ST ZIP` |
| `buildRentasGoogleMapsSearchQuery` | Exact vs approximate map query + dedupe |
| `rentasGoogleMapsUrlFromQuery` | Maps CTA URL |
| `buildRentasRentaMensualRow` | Preview/publish rent row |
| `buildRentasFlowContractRows` | Deposit row in preview |
| `buildRentasResidencialPropertyRows` | Interior/lot sqft preview rows |
| `extensionRows` / `buildRentasPublishedFlowExtensionRows` | Commercial-space size row |
| `rentDisplayFromPrice` / `depositDisplay` | Live public rent/deposit |
| `mergeRentasPrivadoMachinePairs` / `mergeRentasNegocioMachinePairs` | Persisted map URL |

## TRUE/FALSE — 12 Rentas requirements

| # | Requirement | Result |
|---|-------------|--------|
| 1 | Rentas privado rent/deposit commas in preview/public | **TRUE** — `formatUsdMonthly`, `formatRentasDepositUsdPreview`, `formatRentasMensualAnuncioPreview`, `rentDisplayFromPrice` |
| 2 | Rentas negocio rent/deposit commas in preview/public | **TRUE** — same helpers + `mapRentasNegocioStateToPreviewVm` / `rentDisplayFromPrice` |
| 3 | Privado address: street + unit, then city/state/zip | **TRUE** — `buildRentasAssembledAddressLine`, `mapRentasPrivadoStateToPreviewVm` |
| 4 | Negocio address: street + unit, then city/state/zip | **TRUE** — same helpers, `mapRentasNegocioStateToPreviewVm` |
| 5 | Privado map CTA: full structured address when exact | **TRUE** — `buildRentasGoogleMapsSearchQuery` + `rentasMachineDetailPairs` |
| 6 | Negocio map CTA: full structured address when exact | **TRUE** — same |
| 7 | Privado map CTA hides street/unit when exact off | **TRUE** — query uses cross + city/state/zip only |
| 8 | Negocio map CTA hides street/unit when exact off | **TRUE** — same |
| 9 | No duplicate city/state/zip in map query | **TRUE** — `appendRentasMapSegment` dedupes segments |
| 10 | No street/unit exposure when privacy off | **TRUE** — preview mappers + public `mapListingRowToRentasPublicListing` + `rentasLiveLocationLines` no longer fall back to exact street lines |
| 11 | Commercial/lot/large sizes show commas publicly/preview | **TRUE** — `formatRentasSqftPreview`, `buildRentasResidencialPropertyRows`, `extensionRows`, `formatRentasSizeDisplayForPublic` on browse read |
| 12 | Large numeric inputs show formatted preview/helper | **TRUE** — rent/deposit in `RentasAnuncioFormSection`; commercial ft² in `RentasTipoFlowDetailFields`; residencial/comercial category sqft via preview rows |

## Rentas code changes (this pass)

Small surgical fixes only:

1. **`rentasPublishFormHelpers.ts`** — size format helpers; map-query dedupe via `appendRentasMapSegment`.
2. **`rentasRentalTypeApply.ts`** — commercial-space `Tamaño (ft²)` uses `formatRentasSqftPreview` in preview + published extension rows.
3. **`RentasTipoFlowDetailFields.tsx`** — live formatted preview under commercial size input.
4. **`mapListingRowToRentasPublicListing.ts`** — privacy-safe approximate address; sqft/lot comma formatting on public read.
5. **`mapRentasListingLiveToPreviewVm.ts`** — approximate live detail lines no longer fall back to street-level `addressLine`.

Prior gate work on Bienes Raíces is out of scope for this Rentas audit file.
