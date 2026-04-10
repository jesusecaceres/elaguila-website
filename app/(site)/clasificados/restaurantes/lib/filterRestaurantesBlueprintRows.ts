import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";
import type { RestaurantesDiscoveryState } from "@/app/clasificados/restaurantes/lib/restaurantesDiscoveryContract";

/** Matches landing + results `cuisine=` keys to stored primary/secondary cuisine keys. */
function rowMatchesCuisineFilter(param: string, row: RestaurantesPublicBlueprintRow): boolean {
  const raw = param.trim();
  if (!raw) return true;
  if (raw === row.primaryCuisineKey || raw === row.secondaryCuisineKey) return true;
  return false;
}

export function filterRestaurantesBlueprintRows(
  rows: RestaurantesPublicBlueprintRow[],
  s: RestaurantesDiscoveryState,
): RestaurantesPublicBlueprintRow[] {
  return rows.filter((row) => {
    const q = s.q.trim().toLowerCase();
    if (q) {
      const blob = `${row.name} ${row.cuisineLine} ${row.city} ${row.zip ?? ""}`.toLowerCase();
      if (!blob.includes(q)) return false;
    }
    if (s.city && !row.city.toLowerCase().includes(s.city.toLowerCase())) return false;
    if (s.zip && (row.zip ?? "").trim() !== s.zip.trim()) return false;
    if (s.cuisine && !rowMatchesCuisineFilter(s.cuisine, row)) return false;
    if (s.svc && !row.serviceModes.includes(s.svc as "dine_in" | "takeout" | "delivery")) return false;
    if (s.family && !row.familyFriendly) return false;
    if (s.price && row.priceLevel !== s.price) return false;
    if (s.open && !row.openNowDemo) return false;
    if (s.diet === "vegan" && !row.veganOptions) return false;
    if (s.diet === "glutenfree" && !row.glutenFreeOptions) return false;
    if (s.diet === "halal" && !row.halalCuisine && row.primaryCuisineKey !== "halal") return false;
    if (s.top && row.rating < 4.5) return false;
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
