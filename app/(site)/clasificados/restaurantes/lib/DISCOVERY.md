# Restaurantes discovery (internal)

| Concern | Location |
| -------- | -------- |
| URL params + `RestaurantesDiscoveryState` (single source of truth) | `lib/restaurantesDiscoveryContract.ts` |
| Blueprint filtering / sorting (`q`, city/ZIP, taxonomy filters) | `lib/filterRestaurantesBlueprintRows.ts` |
| Destacados / Recientes / promoted band policy + caps | `lib/restaurantesListingExposurePolicy.ts` |
| Demo inventory | `data/restaurantesPublicBlueprintData.ts` |
| Published listing → card row (future API) | `adapters/restauranteApplicationToDiscoveryRow.ts` |
| First-party prefs + saved ids (consent-gated) | `lib/restaurantesFirstPartyPreferences.ts` |
| Coarse geolocation (explicit user action only) | `lib/restaurantesCoarseGeolocation.ts` |
| Landing-only chips / tiles | `landing/restaurantesBlueprintSampleData.ts` |
| Landing UI shell | `landing/RestaurantesLandingPage.tsx`, `landing/RestaurantesLandingShell.tsx` |
| Results UI shell | `resultados/RestaurantesResultsShell.tsx` |
| Site-wide cookie/consent | `app/components/LeonixCookieConsent.tsx`, `app/lib/leonixPublicConsent.ts` |

**Routes:** `/clasificados/restaurantes` (fast search + chips), `/clasificados/restaurantes/resultados` (full filters + grid).

**Handoff:** Replace blueprint rows with API-backed rows; keep `RestaurantesDiscoveryState` and filter field names aligned with `RestauranteListingApplication`.
