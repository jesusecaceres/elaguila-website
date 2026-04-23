import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { isServiciosListingPromoted, sortServiciosListingRows } from "./serviciosResultsFilter";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

const MAX_LANDING_DESTACADOS = 3;
const MAX_LANDING_RECIENTES = 3;

/**
 * Pure `published_at` ordering for landing “Recientes”.
 * Results/search may boost verified listings; landing “Recientes” is contractually **newest-first by time**
 * so a just-published row in the current `liveRows` window appears in the strip (Empleos-style finish line).
 */
function sortLandingRowsByPublishedAtDesc(rows: ServiciosPublicListingRow[]): ServiciosPublicListingRow[] {
  return [...rows].sort((a, b) => {
    if (a.published_at < b.published_at) return 1;
    if (a.published_at > b.published_at) return -1;
    return a.slug.localeCompare(b.slug, "en");
  });
}

/**
 * Pick landing “Destacados” from promoted rows (newest first), with **one card per business name**
 * so a single advertiser cannot occupy the whole strip.
 *
 * “Recientes” = newest published listings by `published_at` that are not shown in Destacados (by slug).
 * The **first** Recientes card is always the newest non-destacado row in `liveRows` (then up to two more).
 */
export function selectLandingDestacadosRecientes(
  rows: ServiciosPublicListingRow[],
  lang: ServiciosLang,
): { destacadosRows: ServiciosPublicListingRow[]; recientesRows: ServiciosPublicListingRow[] } {
  const promotedSorted = sortServiciosListingRows(rows.filter(isServiciosListingPromoted), lang, "newest");
  const destacadosRows = takePromotedWithBusinessCap(promotedSorted, MAX_LANDING_DESTACADOS);
  const destacadoSlugs = new Set(destacadosRows.map((r) => r.slug));

  const chrono = sortLandingRowsByPublishedAtDesc(rows);
  const firstNonDestacado = chrono.find((r) => !destacadoSlugs.has(r.slug)) ?? null;
  const tail = chrono.filter((r) => !destacadoSlugs.has(r.slug) && r.slug !== firstNonDestacado?.slug);
  const recientesRows = firstNonDestacado ? [firstNonDestacado, ...tail].slice(0, MAX_LANDING_RECIENTES) : [];

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
