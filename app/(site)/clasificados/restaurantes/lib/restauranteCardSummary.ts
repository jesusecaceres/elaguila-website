import type { RestauranteListingDraft } from "../application/restauranteDraftTypes";

function nonEmpty(s: string | undefined | null): boolean {
  return typeof s === "string" && s.trim().length > 0;
}

/** Discovery/card line when `shortSummary` is omitted (Gate R-C2). */
export function resolveRestauranteCardSummaryLine(d: {
  businessName?: string;
  primaryCuisine?: string;
  primaryCuisineCustom?: string;
  secondaryCuisine?: string;
  secondaryCuisineCustom?: string;
  longDescription?: string;
  shortSummary?: string;
}): string {
  if (nonEmpty(d.shortSummary)) return d.shortSummary!.trim();
  const cuisines: string[] = [];
  if (nonEmpty(d.primaryCuisine)) cuisines.push(d.primaryCuisine!.trim());
  if (nonEmpty(d.secondaryCuisine)) cuisines.push(d.secondaryCuisine!.trim());
  if (cuisines.length) return cuisines.join(" · ");
  const about = d.longDescription?.trim();
  if (about) return about.length > 140 ? `${about.slice(0, 137)}…` : about;
  return d.businessName?.trim() || "";
}

export function resolveRestauranteCardSummaryFromDraft(d: RestauranteListingDraft): string {
  return resolveRestauranteCardSummaryLine(d);
}
