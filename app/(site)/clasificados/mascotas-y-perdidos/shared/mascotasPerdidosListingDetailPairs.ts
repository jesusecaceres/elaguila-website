import { detailPairsToMap as communityDetailPairsToMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

export type MascotasPerdidosListingPairMap = Record<string, string>;

export function detailPairsToMap(detailPairs: unknown): MascotasPerdidosListingPairMap {
  return communityDetailPairsToMap(detailPairs);
}

export function isMascotasPerdidosSimpleListing(pairs: MascotasPerdidosListingPairMap): boolean {
  const lane = (pairs["Leonix:mascotasLane"] ?? "").trim().toLowerCase();
  return !lane || lane === "simple";
}
