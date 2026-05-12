import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

import type { RestaurantesPublicListingDbRow } from "./restaurantesPublicListingsServer";

/** Same stable key as public detail `LeonixLikeButton` (`leonix_ad_id` else row UUID). */
export function restaurantesEngagementListingKey(row: Pick<RestaurantesPublicListingDbRow, "id" | "leonix_ad_id">): string {
  const ad = (row.leonix_ad_id ?? "").trim();
  if (ad) return ad;
  return (row.id ?? "").trim();
}

export function applyRestauranteLikeCountsToBlueprintRows(
  rows: RestaurantesPublicBlueprintRow[],
  counts: Map<string, number>,
): RestaurantesPublicBlueprintRow[] {
  return rows.map((r) => {
    const key = (r.leonixAdId ?? "").trim() || r.id;
    const n = counts.get(key) ?? 0;
    return n > 0 ? { ...r, likesCount: n } : { ...r, likesCount: undefined };
  });
}
