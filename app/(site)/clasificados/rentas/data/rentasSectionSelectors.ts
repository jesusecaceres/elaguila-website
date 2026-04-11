/**
 * Central selectors for landing sections — used by `rentasLandingSampleData` and any future live-backed pool.
 */

import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import {
  DESTACADA_SECTION_LIMIT,
  NEGOCIOS_SECTION_LIMIT,
  PRIVADO_SECTION_LIMIT,
  RECIENTES_SECTION_LIMIT,
} from "@/app/clasificados/rentas/data/rentasSectionPolicy";

function cityKey(l: RentasPublicListing): string {
  return (l.city ?? l.addressLine).split(",")[0]?.trim() ?? l.id;
}

/**
 * Destacadas: scored fairness + city diversity — see `rentasSectionPolicy.ts`.
 */
export function selectRentasLandingDestacadas(pool: RentasPublicListing[]): RentasPublicListing[] {
  const active = pool.filter((l) => l.browseActive !== false);
  const candidates = active.filter(
    (l) => l.promoted || l.badges.includes("destacada") || (l.recencyRank ?? 0) >= 85
  );
  const base = candidates.length ? candidates : active;

  const scored = base.map((l) => {
    const rec = l.recencyRank ?? 0;
    const mediaBonus = (l.galleryUrls?.length ?? 0) > 1 ? 6 : 0;
    const privadoLift = l.branch === "privado" ? 8 : 0;
    const promo = l.promoted ? 14 : 0;
    const badge = l.badges.includes("destacada") ? 10 : 0;
    const score = rec * 0.4 + promo + badge + mediaBonus + privadoLift;
    return { l, score };
  });
  scored.sort((a, b) => b.score - a.score);

  const out: RentasPublicListing[] = [];
  const seenIds = new Set<string>();
  const seenCities = new Set<string>();
  for (const { l } of scored) {
    if (out.length >= DESTACADA_SECTION_LIMIT) break;
    const ck = cityKey(l);
    if (seenIds.has(l.id)) continue;
    if (!seenCities.has(ck) || out.length < 3) {
      out.push(l);
      seenIds.add(l.id);
      seenCities.add(ck);
    }
  }
  for (const { l } of scored) {
    if (out.length >= DESTACADA_SECTION_LIMIT) break;
    if (!seenIds.has(l.id)) {
      out.push(l);
      seenIds.add(l.id);
    }
  }
  return out.slice(0, DESTACADA_SECTION_LIMIT);
}

export function selectRentasLandingRecientes(pool: RentasPublicListing[]): RentasPublicListing[] {
  const active = pool.filter((l) => l.browseActive !== false);
  return [...active]
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : (a.recencyRank ?? 0) * 1e12;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : (b.recencyRank ?? 0) * 1e12;
      return tb - ta;
    })
    .slice(0, RECIENTES_SECTION_LIMIT);
}

export function selectRentasLandingNegocios(pool: RentasPublicListing[]): RentasPublicListing[] {
  return pool
    .filter((l) => l.browseActive !== false && l.branch === "negocio")
    .slice(0, NEGOCIOS_SECTION_LIMIT);
}

export function selectRentasLandingPrivado(pool: RentasPublicListing[]): RentasPublicListing[] {
  return pool
    .filter((l) => l.browseActive !== false && l.branch === "privado")
    .slice(0, PRIVADO_SECTION_LIMIT);
}
