# Rentas data layer (sample → live)

## Current state

- Public UI reads listings through **`data/rentasPublicData.ts`** helpers backed by **`results/rentasResultsDemoData.ts`** (typed as **`model/rentasPublicListing.ts`**).
- Detail copy and galleries for select demo rows live on the same `RentasPublicListing` objects (`description`, `sellerDisplay`, `galleryUrls`).

## Swap-in points (future live published records)

| Surface | Helper | Replace with |
|--------|--------|----------------|
| Landing bands | `getRentasLandingDestacadas`, `getRentasLandingRecientes`, `getRentasLandingNegocios`, `getRentasLandingPrivado`, `rentasLandingFeaturedListing` | Server loader / API returning `RentasPublicListing[]` |
| Results grid | `getRentasResultsGridListings`, `getRentasResultsFeaturedListing`, `getRentasResultsDemoTotal` | Paginated search API; total count from server |
| Detail | `getRentasListingById` | `getRentasListingById` → fetch by `id` or `slug`, map row → `RentasPublicListing` |

## Not in this stack

- Live DB queries, auth, payments, moderation workflows, maps, favorites, analytics pipelines.
