import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { isServiciosListingPromoted, sortServiciosListingRows } from "./serviciosResultsFilter";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

const MAX_LANDING_DESTACADOS = 3;
const MAX_LANDING_RECIENTES = 3;

/**
 * Pick landing “Destacados” from promoted rows (newest first), with **one card per business name**
 * so a single advertiser cannot occupy the whole strip.
 * “Recientes” = newest published listings that are not shown in Destacados (by slug).
 */
export function selectLandingDestacadosRecientes(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
): { destacadosRows: ServiciosPublicListingRow[]; recientesRows: ServiciosPublicListingRow[] } {
  const sortedNewest = sortServiciosListingRows(rows, lang, "newest");
  const promoted = sortedNewest.filter(isServiciosListingPromoted);

  const destacadosRows = takePromotedWithBusinessCap(promoted, MAX_LANDING_DESTACADOS);
  const destacadoSlugs = new Set(destacadosRows.map((r) => r.slug));

  const recientesRows = sortedNewest.filter((r) => !destacadoSlugs.has(r.slug)).slice(0, MAX_LANDING_RECIENTES);

  return { destacadosRows, recientesRows };
}

function takePromotedWithBusinessCap(
  promotedNewestFirst: ServiciosPublicListingRow[],
  limit: number,
): ServiciosPublicListingRow[] {
  const out: ServiciosPublicListingRow[] = [];
  const seenBusiness = new Set<string>();

  for (const r of promotedNewestFirst) {
    const key = r.business_name.trim().toLowerCase() || r.slug;
    if (seenBusiness.has(key)) continue;
    seenBusiness.add(key);
    out.push(r);
    if (out.length >= limit) break;
  }

  if (out.length < limit) {
    for (const r of promotedNewestFirst) {
      if (out.some((x) => x.slug === r.slug)) continue;
      out.push(r);
      if (out.length >= limit) break;
    }
  }

  return out.slice(0, limit);
}
