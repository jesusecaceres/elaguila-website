import type { ServiciosLang } from "@/app/servicios/types/serviciosBusinessProfile";
import { compareServiciosPublicDiscoveryNewestFirst } from "./serviciosPublicListingSort";
import { getServiciosDestacadosRows } from "./serviciosDestacados";
import type { ServiciosPublicListingRow } from "./serviciosPublicListingsServer";

const MAX_LANDING_DESTACADOS = 3;
const MAX_LANDING_RECIENTES = 3;

/**
 * Newest-first by discovery timestamp (`coalesce(republished_at, published_at, updated_at)` when fields exist).
 */
function sortLandingRowsByPublishedAtDesc(rows: ServiciosPublicListingRow[]): ServiciosPublicListingRow[] {
  return [...rows].sort(compareServiciosPublicDiscoveryNewestFirst);
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
  const destacadosSorted = getServiciosDestacadosRows(rows);
  const destacadosRows = takePromotedWithBusinessCap(destacadosSorted, MAX_LANDING_DESTACADOS);
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
