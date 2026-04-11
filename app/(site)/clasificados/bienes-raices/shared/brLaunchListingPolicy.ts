/**
 * Leonix BR — launch listing placement policy (demo + contract for live).
 *
 * Destacadas: NOT pay-to-win — editorial / quality / freshness / trust signals.
 * Negocios: stronger merchandising in spotlight lane only; capped count.
 * Privado: visible alongside negocio; freshness-first default.
 * Recientes: newest approved active (demo: `demoPublishedAtMs` or synthetic order).
 */

import type { BrNegocioListing } from "../resultados/cards/listingTypes";

const SPOTLIGHT_MAX = 6;

function hasBadge(listing: BrNegocioListing, b: string) {
  return (listing.badges ?? []).includes(b as never);
}

/** Mirrors `getSellerKind` in `brResultsFilters` (kept local to avoid import cycles). */
function getSellerKind(listing: BrNegocioListing): "privado" | "negocio" {
  if (listing.sellerKind) return listing.sellerKind;
  return listing.badges.includes("negocio") ? "negocio" : "privado";
}

function isNegocioChannel(listing: BrNegocioListing) {
  return getSellerKind(listing) === "negocio" || hasBadge(listing, "negocio");
}

function isDestacada(listing: BrNegocioListing) {
  return hasBadge(listing, "destacada");
}

/** Synthetic “approval time” for demo rows missing `demoPublishedAtMs`. */
function effectivePublishedMs(l: BrNegocioListing, fallbackIndex: number): number {
  if (typeof l.demoPublishedAtMs === "number") return l.demoPublishedAtMs;
  return Date.now() - fallbackIndex * 86_400_000;
}

/** Editorial score: destacada + trust + freshness — not payment rank. */
function destacadaScore(l: BrNegocioListing, idx: number): number {
  let s = 0;
  if (isDestacada(l)) s += 100;
  if (l.trustChip) s += 20;
  if ((l.metaLines?.length ?? 0) > 0) s += 5;
  s += Math.min(30, effectivePublishedMs(l, idx) / 1e12);
  return s;
}

export function selectLandingDestacadas(pool: BrNegocioListing[], max = 4): BrNegocioListing[] {
  const withIdx = pool.map((l, i) => ({ l, i }));
  return [...withIdx]
    .filter(
      ({ l }) =>
        isDestacada(l) ||
        (isNegocioChannel(l) && (l.badges ?? []).includes("promocionada" as never))
    )
    .sort((a, b) => destacadaScore(b.l, b.i) - destacadaScore(a.l, a.i))
    .slice(0, max)
    .map(({ l }) => l);
}

export function selectLandingRecientes(pool: BrNegocioListing[], max = 6): BrNegocioListing[] {
  return [...pool]
    .map((l, i) => ({ l, i }))
    .sort((a, b) => effectivePublishedMs(b.l, b.i) - effectivePublishedMs(a.l, a.i))
    .slice(0, max)
    .map(({ l }) => l);
}

export function selectLandingPrivado(pool: BrNegocioListing[], max = 6): BrNegocioListing[] {
  return pool
    .filter((l) => getSellerKind(l) === "privado")
    .map((l, i) => ({ l, i }))
    .sort((a, b) => effectivePublishedMs(b.l, b.i) - effectivePublishedMs(a.l, a.i))
    .slice(0, max)
    .map(({ l }) => l);
}

/** Landing “Negocios” band — negocio channel, freshness-first within the lane. */
export function selectLandingNegocios(pool: BrNegocioListing[], max = 6): BrNegocioListing[] {
  return pool
    .filter(isNegocioChannel)
    .map((l, i) => ({ l, i }))
    .sort((a, b) => effectivePublishedMs(b.l, b.i) - effectivePublishedMs(a.l, a.i))
    .slice(0, max)
    .map(({ l }) => l);
}

export function selectSpotlightNegocios(pool: BrNegocioListing[], max = SPOTLIGHT_MAX): BrNegocioListing[] {
  const neg = pool.filter(isNegocioChannel);
  return [...neg]
    .map((l, i) => ({ l, i }))
    .sort((a, b) => destacadaScore(b.l, b.i) - destacadaScore(a.l, a.i))
    .slice(0, max)
    .map(({ l }) => l);
}

/** IDs shown in spotlight should be excluded from main grid duplicate rows (demo). */
export function spotlightIds(spotlight: BrNegocioListing[]): Set<string> {
  return new Set(spotlight.map((l) => l.id));
}
