import { detailPairsToMap as communityDetailPairsToMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

export type BuscoListingPairMap = Record<string, string>;

export function detailPairsToMap(detailPairs: unknown): BuscoListingPairMap {
  return communityDetailPairsToMap(detailPairs);
}

export function isBuscoQuickListing(pairs: BuscoListingPairMap): boolean {
  return pairs["Leonix:buscoLane"] === "quick";
}
