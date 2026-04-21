/**
 * **Publish → discovery adapter (read path).**
 *
 * Maps a future persisted `RestauranteListingApplication` (or API DTO) into the public
 * `RestaurantesPublicBlueprintRow`-compatible shape used by landing/results shells.
 *
 * ## Launch readiness (read this before claiming “live listings”)
 *
 * - **Adapter:** `applicationToRestauranteDiscoveryRow` is complete for mapping app → card row shape
 *   (name, cuisines, city/ZIP, service modes, highlights, promoted signals, `listedAt`, etc.).
 * - **Read path:** production inventory is loaded server-side from `restaurantes_public_listings` and mapped
 *   via `mapRestaurantesPublicListingDbRowToShellInventoryRow` (this adapter remains useful for tests and
 *   future “application → row” previews).
 * - **Exposure:** Landing destacados/recientes and the results promoted band are driven by
 *   `restaurantesListingExposurePolicy` over whatever row array is passed in (today: blueprint only).
 *
 * @see `application/restauranteListingApplicationModel.ts`
 * @see `data/restaurantesPublicBlueprintData.ts`
 */

import type {
  RestauranteHighlightKey,
  RestauranteListingApplication,
  RestauranteServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

/**
 * Normalized row for cards, filters, and sorting.
 * Keep fields aligned with `RestaurantesPublicBlueprintRow` for a drop-in swap.
 */
export type RestauranteDiscoveryRow = RestaurantesPublicBlueprintRow;

/** Placeholder: wire to real media URL resolver + cuisine line formatter. */
export function applicationToRestauranteDiscoveryRow(
  app: RestauranteListingApplication,
  opts: {
    imageSrc: string;
    openNowDemo?: boolean;
  },
): RestauranteDiscoveryRow {
  const primary = app.primaryCuisine;
  const secondary = app.secondaryCuisine;
  const svc = (app.serviceModes ?? []).filter((m): m is RestauranteServiceMode => typeof m === "string" && m.length > 0);
  const serviceModes: RestauranteServiceMode[] = svc.length ? svc : ["dine_in"];

  const highlights = (app.highlights ?? []) as RestauranteHighlightKey[];
  const has = (k: RestauranteHighlightKey) => highlights.includes(k);
  const familyFriendly = has("family_friendly");

  return {
    id: app.listingId,
    name: app.businessName,
    slug: app.slug,
    primaryCuisineKey: primary,
    secondaryCuisineKey: secondary,
    cuisineLine: app.shortSummary,
    city: app.cityCanonical,
    zip: app.zipCode,
    rating: app.externalRatingValue ?? 0,
    priceLevel: app.priceLevel ?? "$$",
    imageSrc: opts.imageSrc,
    serviceModes,
    familyFriendly,
    promoted: Boolean(app.featured || app.boosted || app.planTier === "featured" || app.planTier === "supporter"),
    leonixVerified: false,
    openNowDemo: opts.openNowDemo ?? false,
    veganOptions: has("vegan_options"),
    glutenFreeOptions: has("gluten_free"),
    halalCuisine: primary === "halal",
    listedAt: app.publishedAt ?? app.createdAt,
    businessType: app.businessType,
    movingVendor: Boolean(app.movingVendor),
    homeBasedBusiness: Boolean(app.homeBasedBusiness),
    foodTruck: Boolean(app.foodTruck),
    popUp: Boolean(app.popUp),
    neighborhood: app.neighborhood,
    highlightKeys: highlights,
    externalReviewCount: app.externalReviewCount,
    additionalCuisineKeys: app.additionalCuisines?.length ? [...app.additionalCuisines] : undefined,
  };
}
