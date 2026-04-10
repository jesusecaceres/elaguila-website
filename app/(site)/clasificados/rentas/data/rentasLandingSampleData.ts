import type { RentasResultsDemoListing } from "@/app/clasificados/rentas/results/rentasResultsDemoData";
import {
  rentasResultsFeatured,
  rentasResultsGridDemo,
} from "@/app/clasificados/rentas/results/rentasResultsDemoData";

function allDemoUnique(): RentasResultsDemoListing[] {
  const map = new Map<string, RentasResultsDemoListing>();
  for (const l of [rentasResultsFeatured, ...rentasResultsGridDemo]) {
    map.set(l.id, l);
  }
  return [...map.values()];
}

function cityKey(l: RentasResultsDemoListing): string {
  return (l.city ?? l.addressLine).split(",")[0]?.trim() ?? l.id;
}

/**
 * **Destacadas (fair demo, not pay-only):**
 * - Pool: active browse listings (`browseActive !== false`) with destacada badge OR promoted OR high recency.
 * - Score blends recency, visibility flags, media richness, and a **small lift for `privado`** so business promos do not bury private ads.
 * - **City diversity:** greedy pick preferring unseen cities before repeating (demo substitute for “not all hero slots from one metro”).
 * - Future: swap weights when billing/featured product exists; keep diversity + privado floor in policy.
 */
export function getRentasLandingDestacadas(): RentasResultsDemoListing[] {
  const pool = allDemoUnique().filter((l) => l.browseActive !== false);
  const candidates = pool.filter(
    (l) => l.promoted || l.badges.includes("destacada") || (l.recencyRank ?? 0) >= 85
  );
  const base = candidates.length ? candidates : pool;

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

  const out: RentasResultsDemoListing[] = [];
  const seenIds = new Set<string>();
  const seenCities = new Set<string>();
  for (const { l } of scored) {
    if (out.length >= 6) break;
    const ck = cityKey(l);
    if (seenIds.has(l.id)) continue;
    if (!seenCities.has(ck) || out.length < 3) {
      out.push(l);
      seenIds.add(l.id);
      seenCities.add(ck);
    }
  }
  for (const { l } of scored) {
    if (out.length >= 6) break;
    if (!seenIds.has(l.id)) {
      out.push(l);
      seenIds.add(l.id);
    }
  }
  return out.slice(0, 6);
}

/**
 * **Recientes:** newest published first (`publishedAt` desc, fallback `recencyRank`).
 */
export function getRentasLandingRecientes(): RentasResultsDemoListing[] {
  const pool = allDemoUnique().filter((l) => l.browseActive !== false);
  return [...pool]
    .sort((a, b) => {
      const ta = a.publishedAt ? Date.parse(a.publishedAt) : (a.recencyRank ?? 0) * 1e12;
      const tb = b.publishedAt ? Date.parse(b.publishedAt) : (b.recencyRank ?? 0) * 1e12;
      return tb - ta;
    })
    .slice(0, 6);
}

/**
 * **Negocios:** business lane only (`branch === "negocio"`), capped slice — visibility without dominating the whole page.
 */
export function getRentasLandingNegocios(): RentasResultsDemoListing[] {
  return allDemoUnique()
    .filter((l) => l.browseActive !== false && l.branch === "negocio")
    .slice(0, 4);
}

/**
 * **Desde particulares:** private lane only (`branch === "privado"`).
 */
export function getRentasLandingPrivado(): RentasResultsDemoListing[] {
  return allDemoUnique()
    .filter((l) => l.browseActive !== false && l.branch === "privado")
    .slice(0, 4);
}

export { rentasResultsFeatured as rentasLandingFeaturedListing };
