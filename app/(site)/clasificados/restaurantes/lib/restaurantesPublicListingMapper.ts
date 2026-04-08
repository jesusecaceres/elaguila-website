import { computePublishGallerySequence } from "@/app/clasificados/restaurantes/application/restauranteGalleryMediaSequence";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import type {
  RestauranteHighlightKey,
  RestauranteServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestaurantesPublicListingDbRow } from "./restaurantesPublicListingsServer";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/** Results / cards: public discovery row from DB; `sponsored` maps from `promoted`. */
export type RestaurantePublicResultsRow = {
  id: string;
  slug: string;
  businessName: string;
  businessTypeKey: string;
  primaryCuisineKey: string;
  secondaryCuisineKey?: string;
  cityCanonical: string;
  zipCode?: string;
  neighborhood?: string;
  priceLevel?: "$" | "$$" | "$$$" | "$$$$";
  serviceModeKeys: RestauranteServiceMode[];
  highlightKeys: RestauranteHighlightKey[];
  movingVendor: boolean;
  homeBasedBusiness: boolean;
  foodTruck: boolean;
  popUp: boolean;
  summaryShort: string;
  heroImageUrl?: string;
  sponsored?: boolean;
  leonixVerified?: boolean;
  externalRatingValue?: number;
  externalReviewCount?: number;
  listedAt: string;
};

function parseServiceModes(raw: unknown): RestauranteServiceMode[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is RestauranteServiceMode => typeof x === "string");
}

function parseHighlights(raw: unknown): RestauranteHighlightKey[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is RestauranteHighlightKey => typeof x === "string");
}

function parsePriceLevel(raw: string | null | undefined): "$" | "$$" | "$$$" | "$$$$" | undefined {
  if (raw === "$" || raw === "$$" || raw === "$$$" || raw === "$$$$") return raw;
  return undefined;
}

export function dbRowToPublicResultsRow(row: RestaurantesPublicListingDbRow): RestaurantePublicResultsRow {
  const primary = (row.primary_cuisine ?? "").trim();
  const secondary = (row.secondary_cuisine ?? "").trim();
  return {
    id: row.id,
    slug: row.slug,
    businessName: row.business_name.trim(),
    businessTypeKey: (row.business_type ?? "").trim(),
    primaryCuisineKey: primary,
    secondaryCuisineKey: secondary || undefined,
    cityCanonical: row.city_canonical.trim(),
    zipCode: row.zip_code?.trim() || undefined,
    neighborhood: row.neighborhood?.trim() || undefined,
    priceLevel: parsePriceLevel(row.price_level),
    serviceModeKeys: parseServiceModes(row.service_modes),
    highlightKeys: parseHighlights(row.highlights),
    movingVendor: row.moving_vendor === true,
    homeBasedBusiness: row.home_based_business === true,
    foodTruck: row.food_truck === true,
    popUp: row.pop_up === true,
    summaryShort: (row.summary_short ?? "").trim(),
    heroImageUrl: row.hero_image_url?.trim() || undefined,
    sponsored: row.promoted === true,
    leonixVerified: row.leonix_verified === true,
    externalRatingValue: row.external_rating_value ?? undefined,
    externalReviewCount: row.external_review_count ?? undefined,
    listedAt: row.published_at,
  };
}

export function mapDbRowsToPublicResultsRows(rows: RestaurantesPublicListingDbRow[]): RestaurantePublicResultsRow[] {
  return rows.map(dbRowToPublicResultsRow);
}

/** Resolve hero URL for denormalized card column (matches preview fallback). */
export function resolveRestauranteHeroForPublish(d: RestauranteListingDraft): string | null {
  if (nonEmpty(d.heroImage)) return d.heroImage!.trim();
  const seq = computePublishGallerySequence(d);
  const imgs = d.galleryImages ?? [];
  const firstGalIdx = seq.find((x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length);
  const firstGal = firstGalIdx != null ? imgs[firstGalIdx] : undefined;
  if (nonEmpty(firstGal)) return firstGal!.trim();
  return null;
}

export function draftToRestaurantePublicListingInsert(
  d: RestauranteListingDraft,
  slug: string,
  opts?: { ownerUserId?: string | null; promoted?: boolean; packageTier?: string | null }
): Record<string, unknown> {
  const hero = resolveRestauranteHeroForPublish(d);
  return {
    slug,
    owner_user_id: opts?.ownerUserId ?? null,
    draft_listing_id: d.draftListingId,
    status: "published",
    package_tier: opts?.packageTier ?? null,
    leonix_verified: false,
    promoted: opts?.promoted === true,
    business_name: d.businessName.trim(),
    city_canonical: d.cityCanonical.trim(),
    zip_code: d.zipCode?.trim() || null,
    neighborhood: d.neighborhood?.trim() || null,
    primary_cuisine: d.primaryCuisine?.trim() || null,
    secondary_cuisine: d.secondaryCuisine?.trim() || null,
    business_type: d.businessType?.trim() || null,
    price_level: d.priceLevel ?? null,
    service_modes: d.serviceModes ?? [],
    moving_vendor: d.movingVendor === true,
    home_based_business: d.homeBasedBusiness === true,
    food_truck: d.foodTruck === true,
    pop_up: d.popUp === true,
    highlights: d.highlights ?? [],
    summary_short: d.shortSummary?.trim() || null,
    hero_image_url: hero,
    external_rating_value: d.externalRatingValue ?? null,
    external_review_count: d.externalReviewCount ?? null,
    listing_json: d,
  };
}

export function listingJsonToDraft(listingJson: unknown): RestauranteListingDraft {
  return mergeRestauranteDraft(listingJson);
}
