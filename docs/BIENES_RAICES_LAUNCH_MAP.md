# Bienes Raíces — launch map (internal)

## Canonical routes

| Surface | Path | Constants |
|--------|------|-----------|
| Publish hub | `/clasificados/publicar/bienes-raices` | `BR_PUBLICAR_HUB` in `app/(site)/clasificados/bienes-raices/shared/constants/brPublishRoutes.ts` |
| Privado form | `/clasificados/publicar/bienes-raices/privado` | `BR_PUBLICAR_PRIVADO` |
| Negocio form | `/clasificados/publicar/bienes-raices/negocio` | `BR_PUBLICAR_NEGOCIO` |
| Preview hub | `/clasificados/bienes-raices/preview` | `BR_PREVIEW_HUB` |
| Preview privado/negocio | `/clasificados/bienes-raices/preview/privado` · `/preview/negocio` | `BR_PREVIEW_PRIVADO` / `BR_PREVIEW_NEGOCIO` |
| Live listing | `/clasificados/anuncio/:id` | `leonixLiveAnuncioPath(id)` in `leonixRealEstateListingContract.ts` |
| Category home | `/clasificados/bienes-raices` | `BR_CATEGORY_HOME` |
| Resultados | `/clasificados/bienes-raices/resultados` | `BR_RESULTS` |

## Publish → `listings`

- **Client:** `publishLeonixRealEstateListingCore` (`leonixPublishRealEstateListingCore.ts`) — insert row, upload to bucket `listing-images`, append `[LEONIX_IMAGES]` block to description when uploads succeed.
- **Draft → payload:** `publishLeonixListingFromBienesRaicesPrivadoDraft` / `…NegocioDraft` (`leonixPublishRealEstateFromDraftState.ts`).
- **Human `detail_pairs`:** `buildDetailPairsFromBienesRaices*PreviewVm` (`leonixRealEstateDetailPairsFromPreviewVm.ts`).
- **Machine `detail_pairs`:** `buildLeonixMachineFacetPairsFromBienesRaices*State` (`leonixBrMachineFacetPairsFromFormState.ts`) merged via `mergeLeonixListingContractDetailPairs` (`leonixRealEstatePersistContract.ts`).
- **Structural keys:** `Leonix:branch`, `Leonix:operation`, `Leonix:categoria_propiedad`, `Leonix:listing_lifecycle` — see `leonixRealEstateListingContract.ts`.

## Read contract (resultados + cards)

1. `parseLeonixListingContract` + `parseLeonixMachineFacetRead` on `detail_pairs`.
2. `extractBrFacetsFromDetailPairs` (`brFacetFromDetailPairs.ts`) — prefers machine beds/baths; enriches meta hints.
3. `mapBrListingRowToNegocioCard` (`mapBrListingRowToCard.ts`) — `BrNegocioListing` + `zipCode`, `resultsPropertyKind`, `facetPool` / `facetPets` / `facetFurnished`.
4. `filterBrListings` (`brResultsFilters.ts`) — `effectiveBrResultsPropertyKind` for `propertyType` / primary chips; amenity toggles use facets first, then text heuristics for legacy/demo rows.

## URL / filters source of truth

- `app/(site)/clasificados/bienes-raices/shared/brFilterContract.ts` — canonical keys, landing chip contract, readiness notes.
- `brResultsUrlState.ts` + `constants/brResultsRoutes.ts` — parse/build.

## Runtime dependencies

| Requirement | Notes |
|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` + anon key | Browser client (`createSupabaseBrowserClient`) |
| Auth session | Publish requires signed-in user |
| Table `listings` | Insert + select for dashboard/resultados |
| RLS | Must allow owner read/update patterns used by app |
| Storage `listing-images` | Public URL for gallery |
| Optional `detail_pairs` column | Admin filters + machine facets; migrations referenced in admin workspace warnings |

## Dashboard / drafts

- BR preview drafts: primarily **session/local** until publish creates a `listings` row — copy on `dashboard/drafts/page.tsx`.
- Published BR: `dashboard/page.tsx` BR surfaces; `mis-anuncios` uses same `listings` category `bienes-raices`.

## Listing detail (BR)

- `anuncio/[id]/page.tsx` routes `category === "bienes-raices"` through `EnVentaAnuncioLayout` with `surface="bienes-raices"`, resultados browse CTA, and `showListingReport`.
- `BrLiveFactsStrip` shows machine + branch summary above description.
