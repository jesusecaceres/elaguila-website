import type { RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import {
  normalizeDiscoveryLocationText,
  type RestaurantesDiscoveryState,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";
import {
  isLeonixLbUsCountry,
  leonixLbStateMatchesFilter,
} from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";

/** Fold case, strip combining marks (accents), and drop apostrophe-like chars so `San Jose` matches `San José` and `Chuys` matches `Chuy's`. */
export function foldRestaurantesDiscoverySearchText(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/[''`´]/g, "")
    .replace(/\s+/g, " ");
}

/** Service modes allowed as `svc=` URL filter values (matches publish taxonomy). */
const DISCOVERY_SVC_PARAM_WHITELIST = new Set<string>([
  "dine_in",
  "takeout",
  "delivery",
  "catering",
  "events",
  "pop_up",
  "food_truck",
  "personal_chef",
  "meal_prep",
  "other",
]);

function intersectsAny(a: string[] | undefined, b: string[]): boolean {
  if (!a?.length || b.length === 0) return false;
  const set = new Set(a);
  return b.some((x) => set.has(x));
}

/**
 * Free-text `q` matches (case-insensitive substring) against the same fields we intend to index for publish:
 * business name, cuisine copy line, primary/secondary cuisine keys (taxonomy), city, ZIP, neighborhood,
 * `serviceAreaText`, and `additionalCuisineKeys` from published `listing_json` when present on the row.
 */
function rowMatchesQuery(q: string, row: RestaurantesPublicBlueprintRow): boolean {
  const needleRaw = q.trim();
  if (!needleRaw) return true;
  const needleFold = foldRestaurantesDiscoverySearchText(needleRaw);
  const needleLower = needleRaw.toLowerCase();
  const blob = [
    row.name,
    row.slug,
    row.leonixAdId ?? "",
    row.cuisineLine,
    row.primaryCuisineKey,
    row.secondaryCuisineKey ?? "",
    ...(row.additionalCuisineKeys ?? []),
    row.city,
    row.zip ?? "",
    row.neighborhood ?? "",
    row.serviceAreaText ?? "",
    row.description ?? "",
  ]
    .join(" ")
    .toLowerCase();
  const blobFold = foldRestaurantesDiscoverySearchText(blob);
  if (blob.includes(needleLower)) return true;
  if (needleFold.length > 0 && blobFold.includes(needleFold)) return true;
  return false;
}

/** Matches `cuisine=` to primary/secondary/additional keys on the row. */
function rowMatchesCuisineFilter(param: string, row: RestaurantesPublicBlueprintRow): boolean {
  const raw = param.trim();
  if (!raw) return true;
  if (raw === row.primaryCuisineKey || raw === row.secondaryCuisineKey) return true;
  return (row.additionalCuisineKeys ?? []).some((k) => k === raw);
}

export type FilterRestaurantesBlueprintOptions = {
  /** When `saved` is true in state, keep only these listing ids (from first-party storage). */
  savedIds?: Set<string>;
};

/**
 * Single implementation for URL `RestaurantesDiscoveryState` → blueprint rows.
 * **Future:** swap `RestaurantesPublicBlueprintRow[]` for API rows; keep state shape.
 */
export function filterRestaurantesBlueprintRows(
  rows: RestaurantesPublicBlueprintRow[],
  s: RestaurantesDiscoveryState,
  opts?: FilterRestaurantesBlueprintOptions,
): RestaurantesPublicBlueprintRow[] {
  return rows.filter((row) => {
    if (s.q.trim() && !rowMatchesQuery(s.q, row)) return false;
    if (s.city) {
      const needle = foldRestaurantesDiscoverySearchText(normalizeDiscoveryLocationText(s.city));
      const hay = foldRestaurantesDiscoverySearchText(
        [row.city, row.state ?? "", row.zip ?? "", row.neighborhood ?? "", row.serviceAreaText ?? ""].join(" "),
      );
      if (needle && !hay.includes(needle)) return false;
    }
    if (s.zip && (row.zip ?? "").trim() !== s.zip.trim()) return false;
    if (s.state?.trim() && !leonixLbStateMatchesFilter(row.state, s.state)) return false;
    if (s.country?.trim() && !isLeonixLbUsCountry(s.country)) {
      /* Country not stored on listings yet — non-US filter yields no matches until publish field ships. */
      return false;
    }
    if (s.neighborhoodQuery.trim()) {
      const nb = s.neighborhoodQuery.trim().toLowerCase();
      if (!(row.neighborhood ?? "").toLowerCase().includes(nb)) return false;
    }
    if (s.cuisine && !rowMatchesCuisineFilter(s.cuisine, row)) return false;
    if (s.biz && (row.businessType ?? "") !== s.biz) return false;
    if (s.svc) {
      const raw = s.svc.trim();
      if (DISCOVERY_SVC_PARAM_WHITELIST.has(raw)) {
        const want = raw as RestauranteServiceMode;
        if (!row.serviceModes.includes(want)) return false;
      }
    }
    if (s.family && !row.familyFriendly) return false;
    if (s.price && row.priceLevel !== s.price) return false;
    if (s.open && !row.openNowDemo) return false;
    if (s.diet === "vegan" && !(row.veganOptions || (row.foodOptionKeys ?? []).includes("vegan_options"))) return false;
    if (s.diet === "glutenfree" && !(row.glutenFreeOptions || (row.foodOptionKeys ?? []).includes("gluten_free_options")))
      return false;
    if (
      s.diet === "halal" &&
      !(row.halalCuisine || row.primaryCuisineKey === "halal" || row.secondaryCuisineKey === "halal" || (row.foodOptionKeys ?? []).includes("halal"))
    )
      return false;
    if (s.top && row.rating < 4.5) return false;

    if (s.reservationsOnly && row.reservationsAvailable !== true) return false;
    if (s.preorderOnly && row.preorderRequired !== true) return false;
    if (s.pickupOnly && row.pickupAvailable !== true) return false;
    if (s.promotedOnly && !row.promoted) return false;
    if (s.verifiedOnly && row.leonixVerified !== true) return false;
    if (s.deliveryRadiusMin != null && s.deliveryRadiusMin > 0) {
      const r = row.deliveryRadiusMiles;
      if (typeof r !== "number" || !Number.isFinite(r) || r < s.deliveryRadiusMin) return false;
    }

    if (s.movingVendor && !row.movingVendor) return false;
    if (s.homeBasedBusiness && !row.homeBasedBusiness) return false;
    if (s.foodTruck && !row.foodTruck) return false;
    if (s.popUp && !row.popUp) return false;

    if (s.menuOnly && row.hasMenu !== true) return false;
    if (s.socialOnly && row.hasSocial !== true) return false;
    if (s.websiteOnly && row.hasWebsite !== true) return false;
    if (s.whatsappOnly && row.hasWhatsApp !== true) return false;

    if (s.spoken.length > 0 && !intersectsAny(row.spokenLanguageKeys, s.spoken)) return false;
    if (s.pay.length > 0 && !intersectsAny(row.paymentMethodKeys, s.pay)) return false;
    if (s.amb.length > 0 && !intersectsAny(row.ambienceKeys, s.amb)) return false;
    if (s.amen.length > 0 && !intersectsAny(row.amenityKeys, s.amen)) return false;
    if (s.acc.length > 0 && !intersectsAny(row.accessibilityKeys, s.acc)) return false;
    if (s.food.length > 0 && !intersectsAny(row.foodOptionKeys, s.food)) return false;

    if (s.hl) {
      const keys = row.highlightKeys ?? [];
      if (!keys.includes(s.hl)) return false;
    }

    /**
     * `near` without city/zip: intent-only — do not exclude rows until geo radius exists.
     * With city/zip, normal location filters above already apply.
     */
    if (s.near && !s.city.trim() && !s.zip.trim()) {
      // pass
    }

    if (s.saved) {
      const ids = opts?.savedIds;
      if (!ids || ids.size === 0) return false;
      if (!ids.has(row.id)) return false;
    }

    return true;
  });
}

function discoverySortTieBreak(a: RestaurantesPublicBlueprintRow, b: RestaurantesPublicBlueprintRow): number {
  if (a.promoted !== b.promoted) return a.promoted ? -1 : 1;
  if ((a.leonixVerified === true) !== (b.leonixVerified === true)) return a.leonixVerified ? -1 : 1;
  return 0;
}

export function sortRestaurantesBlueprintRows(
  rows: RestaurantesPublicBlueprintRow[],
  sort: RestaurantesDiscoveryState["sort"],
): RestaurantesPublicBlueprintRow[] {
  const list = [...rows];
  if (sort === "name-asc") {
    list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    return list;
  }
  if (sort === "rating-desc") {
    list.sort((a, b) => {
      const dr = b.rating - a.rating;
      if (dr !== 0) return dr;
      const t = b.listedAt.localeCompare(a.listedAt);
      if (t !== 0) return t;
      return discoverySortTieBreak(a, b);
    });
    return list;
  }
  list.sort((a, b) => {
    const t = b.listedAt.localeCompare(a.listedAt);
    if (t !== 0) return t;
    return discoverySortTieBreak(a, b);
  });
  return list;
}
