# DETAILS-COMMAS-02 — Numeric Detail Formatting Across Every Pipeline

Gate: **DETAILS-COMMAS-02**  
Scope: Bienes Raíces (Privado + Negocio/Agente) and Rentas (Privado + Negocio) only.

## Shared helpers

| File | Role |
| --- | --- |
| `app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat.ts` | `formatUsdWhole`, `formatIntegerWithCommas`, `formatSqftDisplay`, `formatYearBuiltDisplay`, `formatDetailCountDisplay`, `formatBrSizeFieldDisplay`, `formatBrFacetSqftForCard`, `formatBrOptionalCurrencyDisplay` |
| `app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts` | Rent/deposit USD preview, `formatRentasSqftPreview`, `formatRentasSizeDisplayForPublic` (decimal-safe plain numbers) |

## Files inspected

### BR Privado
- `publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx`
- `publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts`
- `publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState.ts`
- `bienes-raices/preview/privado/BienesRaicesPrivadoPreviewView.tsx`
- `bienes-raices/resultados/lib/mapBrListingRowToCard.ts`
- `bienes-raices/resultados/lib/brFacetFromDetailPairs.ts`

### BR Negocio / Agente
- `publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts`
- `publicar/bienes-raices/negocio/application/sections/shared/DatosPropiedadSection.tsx`
- `publicar/bienes-raices/negocio/application/sections/shared/InformacionPrincipalSection.tsx`
- `publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts`
- `publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx`
- `bienes-raices/preview/BienesRaicesNegocioPreviewView.tsx`

### Rentas Privado
- `publicar/rentas/privado/application/RentasPrivadoForm.tsx`
- `publicar/rentas/privado/application/mapping/mapRentasPrivadoStateToPreviewVm.ts`
- `publicar/rentas/shared/RentasAnuncioFormSection.tsx`
- `publicar/rentas/shared/RentasTipoFlowDetailFields.tsx`
- `rentas/shared/rentasResidencialPreviewRows.ts`
- `rentas/shared/rentasRentalTypeApply.ts`
- `rentas/data/mapListingRowToRentasPublicListing.ts`
- `rentas/listing/mapRentasListingLiveToPreviewVm.ts`
- `rentas/preview/shared/rentasPreviewResultCardListing.ts`

### Rentas Negocio
- `publicar/rentas/negocio/application/RentasNegocioForm.tsx`
- `publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm.ts`

## Files changed

- `app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat.ts`
- `app/(site)/clasificados/bienes-raices/resultados/lib/brFacetFromDetailPairs.ts`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/BienesRaicesPrivadoForm.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/privado/application/mapping/mapBienesRaicesPrivadoStateToPreviewVm.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/application/sections/shared/DatosPropiedadSection.tsx`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/lib/agenteResidencialPreviewFormat.ts`
- `app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/sections/steps04-09.tsx`
- `app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers.ts`
- `app/(site)/clasificados/rentas/shared/rentasResidencialPreviewRows.ts`
- `app/(site)/clasificados/rentas/shared/rentasRentalTypeApply.ts`
- `app/(site)/clasificados/rentas/preview/shared/rentasPreviewResultCardListing.ts`
- `app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx`
- `app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx`
- `scripts/details-commas-02-pipeline-audit.ts`
- `package.json` (audit script entry only)

## Pipeline matrix

| Pipeline | Price/Rent | Deposit | Interior size | Lot size | Commercial/office | Garage/storage | Preview | Public detail | Cards/results |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BR Privado | TRUE | N/A | TRUE | TRUE | TRUE | N/A | TRUE | TRUE | TRUE |
| BR Negocio | TRUE | N/A | TRUE | TRUE | TRUE | N/A | TRUE | TRUE | TRUE |
| Rentas Privado | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |
| Rentas Negocio | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE | TRUE |

## Sub-pipeline matrix

| Sub-pipeline | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio | Notes |
| --- | --- | --- | --- | --- | --- |
| residential / casa / townhouse / condo | TRUE | TRUE | TRUE | TRUE | Residencial fields + preview mappers |
| multifamily / investment | N/A | TRUE | N/A | N/A | BR Negocio `multifamiliar_inversion` publication type only; rent/income currency formatting |
| commercial / office | TRUE | TRUE | TRUE | TRUE | Comercial sqft + tipo-flow commercial size |
| garage / storage | N/A | N/A | TRUE | TRUE | `storage_parking` tipo de renta rows + numeric tamaño aproximado |
| room / shared-space | N/A | N/A | TRUE | TRUE | Room flow omits full sqft rows by design; contract rows formatted |
| land / lote / terreno | TRUE | TRUE | TRUE | TRUE | Terreno lote sqft + land parcel tipo rows |

### N/A explanations

- **BR Privado — deposit:** sale listings; no deposit field in privado pipeline.
- **BR Negocio — deposit:** sale-focused negocio form; no rental deposit field.
- **BR — garage/storage:** no dedicated garage/storage sale sub-pipeline in privado/negocio forms (parking count only).
- **BR Privado — multifamily/investment:** publication type exists only on Negocio hub, not Privado.
- **Rentas — multifamily/investment:** no separate multifamily branch; covered under residencial/comercial/tipo de renta.
- **BR/Rentas room/shared-space interior sqft:** partial row mode hides full interior/lot in form; extension rows still comma-safe when present.

## TRUE/FALSE/N/A detail checks

| Check | BR Privado | BR Negocio | Rentas Privado | Rentas Negocio |
| --- | --- | --- | --- | --- |
| price/rent formatting | TRUE | TRUE | TRUE | TRUE |
| deposit formatting | N/A | N/A | TRUE | TRUE |
| interior size formatting | TRUE | TRUE | TRUE | TRUE |
| lot size formatting | TRUE | TRUE | TRUE | TRUE |
| commercial/office size formatting | TRUE | TRUE | TRUE | TRUE |
| garage/storage size formatting | N/A | N/A | TRUE | TRUE |
| preview output | TRUE | TRUE | TRUE | TRUE |
| public detail output | TRUE | TRUE | TRUE | TRUE |
| listing/card output | TRUE | TRUE | TRUE | TRUE |
| year not comma-formatted | TRUE | TRUE | TRUE | TRUE |
| old draft safety (raw digits in storage) | TRUE | TRUE | TRUE | TRUE |

## Year / decimal rules

- `formatYearBuiltDisplay` — trim only; 2024 never becomes 2,024.
- `formatDetailCountDisplay` — preserves decimals (e.g. 2.5 baths); small whole counts unchanged.
- Form inputs remain raw digits/strings; formatting applied in preview/public mappers and live helper text.

- **land/lote/terreno:** terreno lote sqft fields + `land_parcel` tipo de renta rows use comma formatting.

## land/lote/terreno coverage

All four pipelines format terreno/lote sqft in preview and public output where those sub-branches exist.

## Unrelated categories

Confirmed **no changes** to: Autos, Servicios, Restaurantes, Clases, Comunidad, Viajes, Tienda, global navigation, DB schema, Stripe/payment, or unrelated shared components outside allowed BR/Rentas paths.
