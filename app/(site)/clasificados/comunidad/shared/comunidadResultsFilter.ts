import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { parseAccessibilityKeysCsv, type CommunityListingPairMap } from "@/app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { resolveComunidadEventTypePublicLabel } from "@/app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";

export type ComunidadResultsFilterParams = {
  eventCost: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
  audienceF: string;
  registrationF: string;
  accessibilityF: string;
};

function textMatch(hay: string, needle: string): boolean {
  if (!needle.trim()) return true;
  return hay.toLowerCase().includes(needle.trim().toLowerCase());
}

/**
 * Comunidad-owned results filter predicate — extracted verbatim from the
 * `category === "comunidad"` branch that used to live inline in
 * CommunityListingsResultsClient.tsx. Only decides comunidad-specific facet
 * matches (eventCost/eventType/date range/accessibility); the shared results
 * client still owns generic filters (text/location) itself.
 */
export function comunidadMatchesResultsFilters(
  pairs: CommunityListingPairMap,
  quick: boolean,
  lang: Lang,
  params: ComunidadResultsFilterParams,
): boolean {
  const { eventCost, eventType, dateFrom, dateTo, audienceF, registrationF, accessibilityF } = params;

  if (eventCost !== "all") {
    const ec = (pairs["Leonix:eventCost"] ?? "").trim().toLowerCase();
    if (ec !== eventCost) return false;
  }
  if (eventType.trim()) {
    const slug = (pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "").trim().toLowerCase();
    const needle = eventType.trim().toLowerCase();
    if (slug && slug === needle) {
      /* exact taxonomy slug match */
    } else {
      const catRaw = slug === "otro" ? pairs["Leonix:eventCategoryCustom"] || slug : slug;
      const eventTypeLine = quick
        ? resolveComunidadEventTypePublicLabel(
            pairs["Leonix:eventCategory"] ?? pairs["Leonix:eventType"] ?? "",
            pairs["Leonix:eventCategoryCustom"] ?? "",
            lang,
          )
        : "";
      const hay = `${String(catRaw ?? "")} ${eventTypeLine}`.toLowerCase();
      if (!textMatch(hay, eventType)) return false;
    }
  }
  const isoLike = /^\d{4}-\d{2}-\d{2}/;
  const start = (pairs["Leonix:eventDate"] ?? "").trim();
  const startKey = isoLike.test(start) ? start.slice(0, 10) : "";
  if (dateFrom.trim() && startKey && startKey < dateFrom.trim()) return false;
  if (dateTo.trim() && startKey && startKey > dateTo.trim()) return false;
  if (audienceF !== "all") {
    const a = (pairs["Leonix:audience"] ?? "").trim().toLowerCase();
    if (a !== audienceF) return false;
  }
  if (registrationF !== "all") {
    const r = (pairs["Leonix:registrationRequired"] ?? "").trim().toLowerCase();
    if (r !== registrationF) return false;
  }
  if (accessibilityF !== "all") {
    const keys = parseAccessibilityKeysCsv(pairs["Leonix:accessibility"]);
    if (!keys.includes(accessibilityF)) return false;
  }
  return true;
}
