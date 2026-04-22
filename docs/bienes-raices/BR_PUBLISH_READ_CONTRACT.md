# BR publish → read contract (rebuild reference)

## Entry points

| Lane | Preview publish button | Handler |
|------|-------------------------|---------|
| Privado | `BienesRaicesPrivadoPreviewClient` | `publishLeonixListingFromBienesRaicesPrivadoDraft` |
| Negocio | `BienesRaicesNegocioPreviewClient` | `publishLeonixListingFromBienesRaicesNegocioDraft` |

Both require **signed-in** Supabase user (`publishLeonixRealEstateListingCore` checks `auth.getUser()`).

## Core insert shape

See `clasificados/lib/leonixPublishRealEstateListingCore.ts`:

- `category`: `bienes-raices`
- `seller_type`: `personal` (Privado) or `business` (Negocio)
- `detail_pairs`: merged human + Leonix contract + machine facet pairs
- `status` / `is_published`: set active on successful insert path (see file for upload-warning behavior)

## Error surfacing

Insert and storage failures return localized strings; RLS (`42501`) and missing-column patterns include explicit hints in Spanish/English.

## Read path

Published rows are read with `fetchBrPublishedListingsForBrowse` and mapped through `mapBrListingRowToNegocioCard` so URL filters operate on the same card shape as demo rows in development.
