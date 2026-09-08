import type { CommunityListingPairMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

/** Comunidad-owned field-key readers for the event-category detail pairs (`Leonix:eventCategory` / legacy `Leonix:eventType`). */
export function comunidadEventCategorySlug(pairs: CommunityListingPairMap): string {
  return (pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "").trim();
}

export function comunidadEventCategoryCustom(pairs: CommunityListingPairMap): string {
  return (pairs["Leonix:eventCategoryCustom"] ?? "").trim();
}
