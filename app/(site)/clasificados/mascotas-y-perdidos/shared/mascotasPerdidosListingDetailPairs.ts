import { detailPairsToMap as communityDetailPairsToMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";

export type MascotasPerdidosListingPairMap = Record<string, string>;

export function detailPairsToMap(detailPairs: unknown): MascotasPerdidosListingPairMap {
  return communityDetailPairsToMap(detailPairs);
}

/**
 * True for every Mascotas quick-publish listing this app's own detail component renders — legacy
 * "simple" lane rows (pre-Gate-3, lane empty or "simple") AND Gate 3's richer "rich" lane rows.
 * Function name kept stable (the universal `clasificados/anuncio/[id]/page.tsx` router imports it
 * by this name to decide whether to use `MascotasPerdidosPublishedDetailPage`) — only the lane
 * check itself was widened, so no other file needed to change.
 */
export function isMascotasPerdidosSimpleListing(pairs: MascotasPerdidosListingPairMap): boolean {
  const lane = (pairs["Leonix:mascotasLane"] ?? "").trim().toLowerCase();
  return !lane || lane === "simple" || lane === "rich";
}
