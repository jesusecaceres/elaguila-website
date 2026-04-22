# Bienes Raíces — field coverage matrix (Leonix)

Single source of truth for **where BR application data lands** and how it surfaces.  
**Persisted** = written on publish to Supabase `listings` (row + `detail_pairs` + optional `business_meta` + description image marker).  
**Machine keys** = `Leonix:*` labels inside `detail_pairs` (see `leonixRealEstateListingContract.ts`, built in `leonixBrMachineFacetPairsFromFormState.ts`, merged in `leonixRealEstatePersistContract.ts`).

Legend: **Y** = yes / supported, **N** = not stored as structured filter facet, **partial** = text/description only or UI-only.

## Privado (`BienesRaicesPrivadoFormState`)

| Group / field | Persisted | Detail (`EnVentaAnuncioLayout` + `BrLiveFactsStrip`) | Filterable (resultados) | Admin table “Leonix” col | Dashboard `mis-anuncios` | Notes |
|---------------|-----------|--------------------------------------------------------|-------------------------|----------------------------|----------------------------|-------|
| `titulo` | Y (`title`) | Y | Y (`q` text) | Y | Y | |
| `precio` | Y (`price`) | Y | Y (`priceMin`/`priceMax`) | Y | Y | |
| `ciudad`, `ubicacionLinea` | Y (`city`; line in description context) | Y (city) | Y (`city`) | Y | Y | ZIP filter only when `Leonix:postal_code` present (Negocio CP path). |
| `enlaceMapa` | partial (human `detail_pairs` if mapped in preview VM) | if in pairs | N | partial | partial | |
| `descripcion` | Y (`description`) | Y | Y (`q` matches title/address line today) | — | — | |
| `estadoAnuncio` | N (not in core insert payload) | N | N | N | N | Listing row `status` forced `active` on publish. |
| `petsAllowed` | Y (`Leonix:pets_allowed`) | Y (`BrLiveFactsStrip`) | Y (`pets`, chip `mascotas`) | Y (facet line) | partial | Required before preview/publish. |
| `categoriaPropiedad` | Y (`Leonix:categoria_propiedad` + branch) | Y | Y (`propiedad` URL + primary chips) | Y | partial | |
| `media.*` | Y (`images` + `[LEONIX_IMAGES]` block) | Y | N | — | Y | Storage bucket `listing-images`. |
| `seller.*` | Y (`contact_phone`, `contact_email`; identity in `detail_pairs` human) | Y (resolved contact) | N | — | partial | `resolveLeonixLiveListingContact`. |
| **Residencial** specs (`recamaras`, `banos`, `mediosBanos`, `interiorSqft`, `loteSqft`, `estacionamiento`, `ano`, `condicion`, `highlightKeys`) | Y machine: beds, baths, parking, pool (piscina highlight), subtype | Y (pairs + facts strip) | Y beds/baths/pool; subtype drives `Leonix:results_property_kind` | Y (counts/kind) | partial | Pool filter requires structured `Leonix:pool` true. |
| **Comercial** block | Y subtype, baths, parking, machine pool if destacados | Y | same as residencial for shared facets | Y | partial | |
| **Terreno** block | Y subtype + machine | Y | `propertyType` terreno | Y | partial | |
| `confirm*` flags | N | N | N | N | N | Client-only legal acknowledgements. |

## Negocio (`BienesRaicesNegocioFormState`)

| Group | Persisted | Detail | Filterable | Admin | Dashboard | Notes |
|-------|-----------|--------|------------|-------|-----------|-------|
| Core (`titulo`, `precio`, `ciudad`, `direccion`, `codigoPostal`, `tipoPropiedad`, `publicationType`, …) | Y row + human + machine pairs | Y | Y (`operationType`, `propertyType`, `city`, `zip` when CP present, `sellerType`) | Y | partial | `inferCategoriaPropiedadFromBienesNegocioState` feeds branch. |
| `petsAllowed` | Y `Leonix:pets_allowed` | Y | Y | Y | partial | Required gate + UI in `DatosPropiedadSection`. |
| Specs (`recamaras`, `banosCompletos`, `mediosBanos`, `piesCuadrados`, `estacionamientos`, …) | Y machine facets | Y | beds/baths + pool/furnished when set | Y | partial | |
| `highlightPresets` / deep details | partial → machine where mapped (e.g. pool) | partial in description | pool when `Leonix:pool` | partial | partial | |
| Identity / CTA / trust / `business_meta` | Y `business_meta` JSON for business lane | Y | `sellerType` | partial | partial | |
| Mux video slots | partial URLs in state; not full Mux pipeline in core insert | preview | N | N | N | |

## Runtime / infra (launch checklist)

| Requirement | Detected when |
|-------------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `createSupabaseBrowserClient()` throws before publish. |
| Signed-in user | `publishLeonixRealEstateListingCore` returns localized error. |
| `listings` insert RLS / missing column | Error string now appends **RLS** or **missing column** hint (`leonixPublishRealEstateListingCore.ts`). |
| Storage `listing-images` | Publish returns **warnings** if all uploads fail (row still inserted). |

## Automated proof (no DB)

```bash
npm run verify:br
```

Covers: URL parse/merge round-trip, demo filter semantics for `pool` / `pets` / `furnished`, and Privado machine pair labels for pets + pool.
