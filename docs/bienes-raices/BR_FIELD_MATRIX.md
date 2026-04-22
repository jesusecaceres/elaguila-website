# Bienes Raíces — field coverage matrix (major families)

**Authority:** TypeScript schemas — `publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState.ts`, `publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts` (+ nested identity objects).

Legend: **Y** = wired in publish/read path today, **P** = partial (subset in `detail_pairs` / facets / card), **N** = not intended for this surface, **—** = depends on form branch.

| Field family | Persisted (`listings` / `detail_pairs` / images) | Machine-readable (facets / contract) | Detail (`/clasificados/anuncio`) | Resultados filters | Admin (`detail_pairs` filters) | Dashboard manage |
|--------------|--------------------------------------------------|----------------------------------------|-----------------------------------|--------------------|--------------------------------|--------------------|
| Title, description, city, price | Y | Y (price numeric column) | Y | Y (`q`, city, price range) | Y | Y |
| Operation (venta/renta) | Y (contract + human pairs) | Y | Y | Y (`operationType`) | Y (`leonix_operation`) | Y (chip) |
| `categoriaPropiedad` (residencial / comercial / terreno) | Y | Y | P | Y (`propertyType` / negocio prop param) | Y (`leonix_propiedad`) | Y |
| Beds / baths / sqft / year (as collected) | P in pairs / VM | P (`brFacetFromDetailPairs`) | P | P (`beds`, etc. when present on card) | P | P |
| Pets / pool / furnished | Y (machine facet labels) | Y | P | Y (`pets`, `pool`, `furnished` URL flags) | Y (parsed machine read line) | — |
| Seller contact (phone/email) | Y (`contact_phone`, `contact_email`) | — | Via contact resolver | N | N | — |
| Media gallery | Y (`images` JSON + description marker strip) | — | Y | N | N | thumbnail from `images` |
| Negocio business identity | Y (`business_name`, `business_meta` JSON when present) | P | P | N | P | P |
| Pets required for publish | Gate in `leonixPublishRealEstateFromDraftState` | Y | — | — | — | — |

**Dropped / lost:** Any field not mapped in `leonixRealEstateDetailPairsFromPreviewVm` / `leonixBrMachineFacetPairsFromFormState` / `leonixNegocioBusinessMetaFromFormState` will not round-trip to filters — treat as **implementation gap** if product requires it.
