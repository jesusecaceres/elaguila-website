/**
 * Viajes discovery ordering — fair, explainable, not pay-to-win.
 *
 * - `newest`: strict recency on `publishedAt` (ISO).
 * - `priceAsc` / `priceDesc`: parse numeric price where present; non-numeric sort to end/start.
 * - `featured`: quality + recency + deterministic rotation (daily seed) + soft diversity by destination slug.
 *   No sponsored override: future paid “refresh visibility” must be modeled as capped score influence + disclosure, not hard reorder.
 *
 * Live inventory should supply the same signals via merged browse rows without changing this API.
 */

import type { ViajesSortKey } from "./viajesBrowseContract";
import type { ViajesResultRow } from "../data/viajesResultsSampleData";

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function daySeed(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
}

function priceNumber(row: ViajesResultRow): number {
  if (row.kind === "editorial") return NaN;
  const raw = row.kind === "affiliate" ? row.priceFrom : row.price;
  const n = parseInt(String(raw).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
}

function destinationKey(row: ViajesResultRow): string {
  const d = row.kind === "editorial" ? row.destinationLabel : row.destination;
  return d.trim().toLowerCase().slice(0, 48);
}

function publishedMs(row: ViajesResultRow): number {
  const iso = row.publishedAt;
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
}

/**
 * Featured: not “paid placement” — uses scaffold scores + recency + rotation + diversity cap.
 */
export function scoreViajesFeatured(row: ViajesResultRow, seed: string): number {
  const base = row.discovery?.featuredBase ?? (row.kind === "affiliate" ? 50 : row.kind === "business" ? 48 : 25);
  const trust = row.discovery?.sourceTrust ?? 1;
  const complete = row.discovery?.completeness ?? 0.7;
  const recencyScore = Math.min(18, publishedMs(row) / (86400000 * 120)); // up to ~18 pts over ~4mo
  const rot = (hashString(`${seed}:${row.id}`) % 1000) / 1000;
  return base * trust * (0.85 + complete * 0.15) + recencyScore + rot * 2;
}

function featuredOrdered(rows: ViajesResultRow[]): ViajesResultRow[] {
  const seed = daySeed();
  const destCounts = new Map<string, number>();
  const scored = rows.map((row) => {
    let s = scoreViajesFeatured(row, seed);
    const dk = destinationKey(row);
    const prev = destCounts.get(dk) ?? 0;
    if (prev > 0) s -= prev * 6;
    destCounts.set(dk, prev + 1);
    return { row, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.map((x) => x.row);
}

export function sortViajesResultRows(rows: ViajesResultRow[], sort: ViajesSortKey): ViajesResultRow[] {
  const out = [...rows];
  if (sort === "newest") {
    out.sort((a, b) => publishedMs(b) - publishedMs(a));
    return out;
  }
  if (sort === "priceAsc") {
    out.sort((a, b) => {
      const pa = priceNumber(a);
      const pb = priceNumber(b);
      const na = Number.isNaN(pa);
      const nb = Number.isNaN(pb);
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      return pa - pb;
    });
    return out;
  }
  if (sort === "priceDesc") {
    out.sort((a, b) => {
      const pa = priceNumber(a);
      const pb = priceNumber(b);
      const na = Number.isNaN(pa);
      const nb = Number.isNaN(pb);
      if (na && nb) return 0;
      if (na) return 1;
      if (nb) return -1;
      return pb - pa;
    });
    return out;
  }
  return featuredOrdered(out);
}
