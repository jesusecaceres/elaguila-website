import type { Lang } from "@/app/clasificados/config/clasificadosHub";

import { resolveBuscoBudgetDisplay } from "@/app/publicar/busco/shared/buscoBudgetDisplay";

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

/** Urgency slug from detail_pairs (null if normal/absent). Legacy 3-state values are mapped onto
 *  the current 4-state model (Gate 4, Section G) — see buscoQuickAdViewModel's published reader. */
export function buscoOwnerDashboardUrgency(detailPairs: unknown): string | null {
  const pairs = detailPairsToMap(detailPairs);
  const v = (pairs["Leonix:buscoUrgency"] ?? "").trim();
  if (v === "pronto") return "esta_semana";
  if (v === "urgente") return "urgente_hoy";
  return v || null;
}

/** Resolved budget display from detail_pairs — structured mode/amount (Gate 4) with a fallback to
 *  the legacy free-text field for rows published before Gate 4. */
export function buscoOwnerDashboardBudget(detailPairs: unknown, lang: Lang): string | null {
  const pairs = detailPairsToMap(detailPairs);
  return resolveBuscoBudgetDisplay(
    {
      budgetMode: pairs["Leonix:buscoBudgetMode"] ?? "",
      budgetAmount: pairs["Leonix:buscoBudgetAmount"] ?? "",
      legacyBudgetText: pairs["Leonix:buscoBudget"] ?? "",
    },
    lang,
  );
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
