# Restaurantes discovery (internal)

| Concern | Location |
| -------- | -------- |
| URL params + `RestaurantesDiscoveryState` | `lib/restaurantesDiscoveryContract.ts` |
| Blueprint filtering / sorting | `lib/filterRestaurantesBlueprintRows.ts` |
| Destacados / Recientes / promoted band policy | `lib/restaurantesListingExposurePolicy.ts` |
| Demo inventory | `data/restaurantesPublicBlueprintData.ts` |
| Published listing → card row (future API) | `adapters/restauranteApplicationToDiscoveryRow.ts` |
| First-party prefs + saved ids | `lib/restaurantesFirstPartyPreferences.ts` |
| Coarse geolocation (explicit user action) | `lib/restaurantesCoarseGeolocation.ts` |
| Site-wide cookie/consent | `app/components/LeonixCookieConsent.tsx`, `app/lib/leonixPublicConsent.ts` |

**Routes:** `/clasificados/restaurantes`, `/clasificados/restaurantes/resultados`
