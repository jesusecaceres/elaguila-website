import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { detailPairsToMap } from "./buscoListingDetailPairs";
import { resolveBuscoTypePublicLabel } from "./buscoPublicLabel";

/** Owner dashboard location line: city + optional zone from detail_pairs. */
export function buscoOwnerDashboardLocationLine(
  city: string | null | undefined,
  detailPairs: unknown,
): string {
  const pairs = detailPairsToMap(detailPairs);
  const zone = (pairs["Leonix:buscoZone"] ?? "").trim();
  const c = String(city ?? "").trim();
  return [c, zone].filter(Boolean).join(" · ");
}

/** Resolved request type for dashboard (Otro → custom text; hide bare “Otro” without custom). */
export function buscoOwnerDashboardTypeLabel(detailPairs: unknown, lang: Lang): string | null {
  const pairs = detailPairsToMap(detailPairs);
  const slug = (pairs["Leonix:buscoType"] ?? "").trim();
  const custom = (pairs["Leonix:buscoTypeCustom"] ?? "").trim();
  if (slug === "otro" && !custom) return null;
  const label = resolveBuscoTypePublicLabel(slug, custom, lang);
  return label && label !== "—" ? label : null;
}
