# Rentas: publish application → public browse field audit

Single reference for which **Privado** / **Negocio** publish fields feed public UX. Source: `rentasPrivadoFormState.ts`, `rentasNegocioFormState.ts`, `RentasPublicListing`.

| Publish field | Public field / usage | Landing search | Quick chip | Results filter | Card | Detail |
|---------------|----------------------|----------------|------------|----------------|------|--------|
| `titulo` | `title` | via `q` | — | `q` | title | title |
| `categoriaPropiedad` | `categoriaPropiedad` | via `tipo`→category map | `propiedad` | `propiedad` / `tipo` | category | specs |
| `rentaMensual` | `rentDisplay` / `rentMonthly` | `precio` band | — | `precio`, `rent_min`/`rent_max` | price | price |
| `ciudad` | `city` (+ `addressLine`) | optional location → `city`/`zip` | — | `city` | address | location |
| `ubicacionLinea` | `addressLine` | `q` | — | `q` | address | address |
| *(future geocode)* | `postalCode`, `stateRegion` | location → `zip` | — | `zip`, `state` | — | — |
| `amueblado` | `amueblado` | — | chip | `amueblado=1` | — | specs |
| `mascotas` | `mascotasPermitidas` | — | chip | `mascotas=1` | — | specs |
| residencial recs/baths | `beds`, `baths` | `recs`, (results) `baths_min` | rec chip | `recs`, `baths_min` | facts | specs |
| `estadoAnuncio` | browse eligibility | — | — | (adapter filters non-disponible) | — | — |
| `media.photoDataUrls` | `imageUrl` / `galleryUrls` | — | — | — | image | gallery |
| seller block | `branch`, `sellerDisplay` | — | branch chips | `branch` | badge | seller |
| `promoted` / highlights | `promoted`, `badges` | — | — | — | badges | — |
| publish time | `publishedAt`, `recencyRank` | — | — | sort | — | — |

**ZIP / state:** Not required in raw publish JSON today; `RentasPublicListing.postalCode` / `stateRegion` are adapter-filled when geocoding or structured address exists.

**Wired vs missing:** Demo data sets `city` / `postalCode` / `publishedAt` / `browseActive`. Live DB must populate the same public fields.

## 2026-05 — media + convivencia + contact parity

| Publish field | Public / UX |
|---------------|-------------|
| `media.videoUrl` + local video (`videoLocalDataUrl` / `videoLocalDraftId`) | `resolveRentas*DraftMediaToRemoteUrls` uploads to Blob (`draft-media-upload` `slot=video`) → HTTPS `videoUrl` → `Leonix:rent:video_url` → gallery VM + lightbox **Video** tab |
| `rentasPreferenciasEspacioCompartido` | Human pair **Preferencias del espacio compartido** → `RentasPublicListing.sharedSpacePreferences` → live preview contract rows + anuncio rental-facts path (not amenities) |
| Lead CTAs | Shared copy `rentasLeadContactCopy.ts`: SMS + WhatsApp (`wa.me?text=`) + mailto body; live anuncio reads SMS/WhatsApp digits from `detail_pairs` when present |
| `descripcion` | `stripLeonixPublishedDescriptionBody` on public mapper + live listing blurb + `getRentasListingDetailExtra` so gallery appendix never shows as body text |

