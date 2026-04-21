import type { RestauranteServiceMode } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";
import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

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
import {
  normalizeDiscoveryLocationText,
  type RestaurantesDiscoveryState,
} from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";

/**
 * Free-text `q` matches (case-insensitive substring) against the same fields we intend to index for publish:
 * business name, cuisine copy line, primary/secondary cuisine keys (taxonomy), city display string, ZIP.
 * Includes `additionalCuisineKeys` from published `listing_json` when present on the row.
 */
function rowMatchesQuery(q: string, row: RestaurantesPublicBlueprintRow): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const blob = [
    row.name,
    row.cuisineLine,
    row.primaryCuisineKey,
    row.secondaryCuisineKey ?? "",
    ...(row.additionalCuisineKeys ?? []),
    row.city,
    row.zip ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(needle);
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
      const needle = normalizeDiscoveryLocationText(s.city).toLowerCase();
      if (needle && !row.city.toLowerCase().includes(needle)) return false;
    }
    if (s.zip && (row.zip ?? "").trim() !== s.zip.trim()) return false;
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
    if (s.diet === "vegan" && !row.veganOptions) return false;
    if (s.diet === "glutenfree" && !row.glutenFreeOptions) return false;
    if (s.diet === "halal" && !row.halalCuisine && row.primaryCuisineKey !== "halal") return false;
    if (s.top && row.rating < 4.5) return false;

    if (s.movingVendor && !row.movingVendor) return false;
    if (s.homeBasedBusiness && !row.homeBasedBusiness) return false;
    if (s.foodTruck && !row.foodTruck) return false;
    if (s.popUp && !row.popUp) return false;

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
    list.sort((a, b) => b.rating - a.rating || b.listedAt.localeCompare(a.listedAt));
    return list;
  }
  list.sort((a, b) => b.listedAt.localeCompare(a.listedAt));
  return list;
}
