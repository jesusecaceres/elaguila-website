import { computePublishGallerySequence } from "@/app/clasificados/restaurantes/application/restauranteGalleryMediaSequence";
import { firstRestauranteBucketImageRef } from "@/app/clasificados/restaurantes/application/restauranteMediaDisplay";
import type { RestauranteListingDraft } from "@/app/clasificados/restaurantes/application/restauranteDraftTypes";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import type {
  RestauranteHighlightKey,
  RestauranteServiceMode,
} from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import { isRestauranteOpenNowFromWeeklyHours } from "@/app/clasificados/restaurantes/lib/restauranteOpenNowFromHours";
import type { RestauranteAmenityGroupId } from "@/app/clasificados/restaurantes/lib/restauranteAmenitiesCatalog";
import type { RestaurantesPublicListingDbRow } from "./restaurantesPublicListingsServer";
import { mapRestauranteDraftToShellData } from "@/app/clasificados/restaurantes/application/mapRestauranteDraftToShell";
import { resolveRestauranteCardSummaryFromDraft } from "./restauranteCardSummary";

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
  currentLocationUrl?: string;
  cateringAvailable?: boolean;
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
  const draft = listingJsonToDraft(row.listing_json ?? {});
  const currentLocationUrl = draft.movingVendorStack?.currentLocationUrl?.trim() || undefined;
  return {
    id: row.id,
    slug: (row.slug ?? "").trim(),
    businessName: (row.business_name ?? "").trim(),
    businessTypeKey: (row.business_type ?? "").trim(),
    primaryCuisineKey: primary,
    secondaryCuisineKey: secondary || undefined,
    cityCanonical: (row.city_canonical ?? "").trim(),
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
    currentLocationUrl,
    /** Recency for discovery sort: republish/renew bumps `updated_at` so listings resurface fairly. */
    listedAt: row.updated_at || row.published_at,
  };
}

export function mapDbRowsToPublicResultsRows(rows: RestaurantesPublicListingDbRow[]): RestaurantePublicResultsRow[] {
  return rows.map(dbRowToPublicResultsRow);
}

/** Hero fallback when publish did not set `hero_image_url` (matches blueprint card quality). */
export const RESTAURANTE_PUBLIC_CARD_IMAGE_FALLBACK =
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";

/**
 * Full public discovery row for results/landing: denormalized columns + `listing_json` for
 * hours-based open signal, full `serviceModes`, and additional cuisine keys for search.
 */
export function mapRestaurantesPublicListingDbRowToShellInventoryRow(row: RestaurantesPublicListingDbRow): RestaurantesPublicBlueprintRow {
  const pr = dbRowToPublicResultsRow(row);
  const draft = listingJsonToDraft(row.listing_json ?? {});

  const getAmenityIds = (group: RestauranteAmenityGroupId): string[] | undefined => {
    const ids = draft.restaurantAmenities?.[group];
    if (!Array.isArray(ids) || ids.length === 0) return undefined;
    const out = ids
      .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      .map((x) => x.trim());
    return out.length ? out : undefined;
  };

  const fromDraftModes = Array.isArray(draft.serviceModes)
    ? draft.serviceModes.filter((m): m is RestauranteServiceMode => typeof m === "string")
    : [];
  const fromPr = (pr.serviceModeKeys ?? []).filter((m): m is RestauranteServiceMode => typeof m === "string");
  const serviceModes: RestauranteServiceMode[] = fromDraftModes.length ? fromDraftModes : fromPr.length ? fromPr : ["dine_in"];

  const openNowDemo = isRestauranteOpenNowFromWeeklyHours(draft);
  const familyFriendly = pr.highlightKeys.includes("family_friendly");
  const priceLevel = pr.priceLevel ?? "$$";
  const rating =
    typeof pr.externalRatingValue === "number" && Number.isFinite(pr.externalRatingValue) ? pr.externalRatingValue : 0;
  const summaryLine = resolveRestauranteCardSummaryFromDraft(draft) || pr.businessName;
  const longDescription = (draft.longDescription ?? "").trim() || undefined;
  const addCuisines = Array.isArray(draft.additionalCuisines)
    ? draft.additionalCuisines.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    : undefined;

  const deliveryRadiusMiles =
    typeof draft.deliveryRadiusMiles === "number" && Number.isFinite(draft.deliveryRadiusMiles)
      ? draft.deliveryRadiusMiles
      : undefined;
  const serviceAreaTrim = (draft.serviceAreaText ?? "").trim();
  const spokenLanguageKeys = Array.isArray(draft.languagesSpoken)
    ? draft.languagesSpoken
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .map((x) => x.trim())
    : undefined;

  const hasWebsite = nonEmpty(draft.websiteUrl);
  const hasWhatsApp = nonEmpty(draft.whatsAppNumber);
  const hasMenu = nonEmpty(draft.menuUrl) || nonEmpty(draft.menuFile);
  const hasSocial =
    nonEmpty(draft.instagramUrl) ||
    nonEmpty(draft.facebookUrl) ||
    nonEmpty(draft.tiktokUrl) ||
    nonEmpty(draft.youtubeUrl) ||
    nonEmpty(draft.snapchatUrl) ||
    nonEmpty(draft.xTwitterUrl);

  let shellBase: ReturnType<typeof mapRestauranteDraftToShellData>;
  try {
    shellBase = mapRestauranteDraftToShellData(draft);
  } catch {
    shellBase = mapRestauranteDraftToShellData(mergeRestauranteDraft({}));
  }
  const previewShellData = { ...shellBase, id: pr.id };
  const cardImage =
    previewShellData.heroImageUrl?.trim() ||
    (pr.heroImageUrl && pr.heroImageUrl.trim()) ||
    RESTAURANTE_PUBLIC_CARD_IMAGE_FALLBACK;

  return {
    id: pr.id,
    name: pr.businessName,
    slug: pr.slug,
    leonixAdId: row.leonix_ad_id?.trim() || null,
    primaryCuisineKey: pr.primaryCuisineKey || "other",
    secondaryCuisineKey: pr.secondaryCuisineKey,
    cuisineLine: summaryLine,
    city: pr.cityCanonical,
    state: (draft.state ?? "").trim() || undefined,
    zip: pr.zipCode,
    rating,
    priceLevel,
    imageSrc: cardImage,
    serviceModes,
    additionalCuisineKeys: addCuisines?.length ? addCuisines : undefined,
    familyFriendly,
    promoted: pr.sponsored === true,
    leonixVerified: pr.leonixVerified === true,
    packageTier: row.package_tier ?? null,
    packageEntitlementTier: row.package_entitlement_tier ?? null,
    entitlementStartsAt: row.entitlement_starts_at ?? null,
    entitlementEndsAt: row.entitlement_ends_at ?? null,
    entitlementDigitalPlacementPriority: row.entitlement_digital_placement_priority ?? null,
    entitlementPrintPlacementType: row.entitlement_print_placement_type ?? null,
    republishedAt: row.republished_at ?? null,
    openNowDemo,
    veganOptions: pr.highlightKeys.includes("vegan_options"),
    glutenFreeOptions: pr.highlightKeys.includes("gluten_free"),
    halalCuisine: pr.primaryCuisineKey === "halal",
    listedAt: pr.listedAt,
    businessType: pr.businessTypeKey || undefined,
    movingVendor: pr.movingVendor,
    homeBasedBusiness: pr.homeBasedBusiness,
    foodTruck: pr.foodTruck,
    popUp: pr.popUp,
    neighborhood: pr.neighborhood,
    highlightKeys: pr.highlightKeys,
    externalReviewCount: pr.externalReviewCount,
    reservationsAvailable: draft.reservationsAvailable === true,
    preorderRequired: draft.preorderRequired === true,
    pickupAvailable: draft.pickupAvailable === true,
    serviceAreaText: serviceAreaTrim || undefined,
    deliveryRadiusMiles,
    paymentMethodKeys: getAmenityIds("payments"),
    ambienceKeys: getAmenityIds("atmosphere"),
    amenityKeys: getAmenityIds("amenities"),
    accessibilityKeys: getAmenityIds("accessibility"),
    foodOptionKeys: getAmenityIds("foodOptions"),
    spokenLanguageKeys: spokenLanguageKeys?.length ? spokenLanguageKeys : undefined,
    hasMenu,
    hasSocial,
    hasWebsite,
    hasWhatsApp,
    ownerUserId: row.owner_user_id ?? null,
    description: longDescription,
    previewShellData,
  };
}

export function mapRestaurantesPublicListingDbRowsToShellInventory(rows: RestaurantesPublicListingDbRow[]): RestaurantesPublicBlueprintRow[] {
  return rows.map(mapRestaurantesPublicListingDbRowToShellInventoryRow);
}

/** Resolve hero URL for denormalized card column (matches preview fallback). */
export function resolveRestauranteHeroForPublish(d: RestauranteListingDraft): string | null {
  if (nonEmpty(d.heroImage)) return d.heroImage!.trim();
  const seq = computePublishGallerySequence(d);
  const imgs = d.galleryImages ?? [];
  const firstGalIdx = seq.find((x): x is number => typeof x === "number" && Number.isFinite(x) && x >= 0 && x < imgs.length);
  const firstGal = firstGalIdx != null ? imgs[firstGalIdx] : undefined;
  if (nonEmpty(firstGal)) return firstGal!.trim();
  const bucket = firstRestauranteBucketImageRef(d);
  if (bucket != null && nonEmpty(bucket)) return bucket.trim();
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
