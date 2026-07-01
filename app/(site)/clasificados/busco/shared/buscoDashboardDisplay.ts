import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { detailPairsToMap } from "./buscoListingDetailPairs";
import { resolveBuscoTypePublicLabel } from "./buscoPublicLabel";

/** Owner dashboard location line: city, state, country + optional zone from detail_pairs. */
export function buscoOwnerDashboardLocationLine(
  city: string | null | undefined,
  detailPairs: unknown,
): string {
  const pairs = detailPairsToMap(detailPairs);
  const c = String(city ?? "").trim();
  const st = (pairs["Leonix:state"] ?? "").trim();
  const country = (pairs["Leonix:buscoCountry"] ?? "").trim();
  const zone = (pairs["Leonix:buscoZone"] ?? "").trim();
  const line = [c, st, country].filter(Boolean).join(", ");
  return [line, zone].filter(Boolean).join(" · ");
}

/** Urgency slug from detail_pairs (null if normal/absent). */
export function buscoOwnerDashboardUrgency(detailPairs: unknown): string | null {
  const pairs = detailPairsToMap(detailPairs);
  const v = (pairs["Leonix:buscoUrgency"] ?? "").trim();
  return v || null;
}

/** Raw budget string from detail_pairs. */
export function buscoOwnerDashboardBudget(detailPairs: unknown): string | null {
  const pairs = detailPairsToMap(detailPairs);
  return (pairs["Leonix:buscoBudget"] ?? "").trim() || null;
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
