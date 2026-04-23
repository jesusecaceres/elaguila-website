# Restaurantes discovery (internal)

| Concern | Location |
| -------- | -------- |
| URL params + `RestaurantesDiscoveryState` (single source of truth) | `lib/restaurantesDiscoveryContract.ts` |
| Filtering / sorting (`q`, city/ZIP/`nbh`, cuisine, `svc`, reservations/preorder/pickup, `feat`/`lxv`/`drm`, highlights, flags, open-now) | `lib/filterRestaurantesBlueprintRows.ts` |
| Destacados / Recientes / promoted band policy + caps | `lib/restaurantesListingExposurePolicy.ts` |
| **Published** inventory load (results + landing) | `lib/restaurantesResultsInventoryServer.ts`, `lib/restaurantesLandingInventoryServer.ts` |
| DB row + `listing_json` → shell row (`openNow`, full `serviceModes`, extra cuisines) | `lib/restaurantesPublicListingMapper.ts` (`mapRestaurantesPublicListingDbRowToShellInventoryRow`) |
| Weekly hours → “open now” (America/Los_Angeles) | `lib/restauranteOpenNowFromHours.ts` |
| Blueprint pool (Storybook / unit tests only — **not** used on landing/results routes) | `data/restaurantesPublicBlueprintData.ts` |
| Application → discovery row (tests / previews) | `adapters/restauranteApplicationToDiscoveryRow.ts` |
| First-party prefs + saved ids (consent-gated) | `lib/restaurantesFirstPartyPreferences.ts` |
| Coarse geolocation (explicit user action only) | `lib/restaurantesCoarseGeolocation.ts` |
| Landing-only chips / tiles | `landing/restaurantesBlueprintSampleData.ts` |
| Landing UI shell | `landing/RestaurantesLandingPage.tsx`, `landing/RestaurantesLandingShell.tsx` |
| Results UI shell | `resultados/RestaurantesResultsShell.tsx` |
| Site-wide cookie/consent | `app/components/LeonixCookieConsent.tsx`, `app/lib/leonixPublicConsent.ts` |

**Routes:** `/clasificados/restaurantes` (fast search + chips), `/clasificados/restaurantes/resultados` (full filters + grid).

**`svc=` URL values:** whitelisted in `filterRestaurantesBlueprintRows.ts` (`dine_in`, `takeout`, `delivery`, `catering`, `events`, `meal_prep`, `personal_chef`, `pop_up`, `food_truck`, `other`); UI select exposes the first four plus catering/events/meal_prep/personal_chef.

## Launch readiness (code)

| Question | Answer |
| -------- | ------ |
| Is the discovery **URL contract** ready? | Yes — `restaurantesDiscoveryContract.ts`. |
| Is **search/filter mapping** ready for real data? | Yes — filters run on whatever row pool the server passes (published DB rows mapped to shell shape). |
| Are **published listings** shown in `/resultados`? | **Yes** when `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set: server reads `restaurantes_public_listings` (`status=published`) and maps each row through `mapRestaurantesPublicListingDbRowToShellInventoryRow`. |
| Blueprint / sample on public routes? | **No.** Results + landing use only published DB rows or empty + banner. |
| Are **destacados / recientes / promoted** fair? | Yes — `restaurantesListingExposurePolicy.ts` caps promoted slots, sorts recientes by `listedAt` (DB `updated_at` for republish), and nudges free / home-based rows in organic destacados scoring. |
| **Republish vs paid promo** | Recency uses `updated_at` → `listedAt`. `promoted` is admin/paid only; publish POST cannot set it. |
