import "server-only";

/**
 * Gate SERVICIOS-2 — Related Listings for the Servicios public vitrina.
 *
 * Derived entirely from REAL published listing data and REAL Servicios relationships. There is no
 * ranking engine here and no recommendation model: candidates come from the same canonical public
 * reader the results page uses (`listServiciosPublicListingsRaw`, already published-only and
 * already ordered newest-first by `compareServiciosPublicDiscoveryNewestFirst`), and are scored by
 * two relationships this category actually has:
 *
 *   1. TRADE FAMILY — `internal_group`, the same facet the results `group=` filter matches on and
 *      the same value the landing's "Explora por giro" cards link into.
 *   2. LOCATION — city, then state/region, normalized with the exact same helpers the results
 *      location filter uses (`normalizeServiciosSearchText` for city, `normalizeLeonixLbStateCode`
 *      for state), so "San José" and "san jose" relate here exactly as they already match in search.
 *
 * Nothing is fabricated: a listing with no shared trade family and no shared location is simply
 * not related, and the caller renders the "browse all services" fallback instead of an empty
 * section (the same never-a-broken-promise shape `EnVentaRelatedRail` established).
 *
 * Ordering within a score tier is the reader's own discovery order — this module never invents a
 * secondary ranking signal, and deliberately does not consult paid placement/entitlement weight:
 * relatedness is an editorial relationship, not an ad slot.
 */
import {
  listServiciosPublicListingsRaw,
  type ServiciosPublicListingRow,
} from "./serviciosPublicListingsServer";
import { normalizeServiciosSearchText } from "./serviciosSearchSynonyms";
import { normalizeLeonixLbStateCode } from "@/app/(site)/clasificados/shared/constants/leonixLocalBusinessLocationContract";

/** Bounded candidate pool — same order of magnitude as the En Venta related rail's own 30-row
 * pool, sized up modestly because Servicios relatedness is facet-based rather than price-based. */
const CANDIDATE_POOL = 120;

/** Never more than one short rail's worth. */
export const SERVICIOS_RELATED_MAX = 3;

/** Same city normalization the results location filter uses (`normalizeServiciosSearchText`), so
 * "San José" and "san jose" relate exactly as they already match in search. */
function token(raw: string | null | undefined): string {
  return normalizeServiciosSearchText(raw ?? "");
}

/** Same state normalization the results state filter uses. */
function regionToken(raw: string | null | undefined): string {
  return normalizeLeonixLbStateCode(raw ?? "").toLowerCase();
}

function groupToken(raw: string | null | undefined): string {
  return (raw ?? "").trim().toLowerCase();
}

/**
 * Score is a small, explicit tier — not a tuned weight:
 *   4 = same trade family AND same city    (strongest real relationship)
 *   3 = same trade family AND same state   (same service, reachable)
 *   2 = same trade family, anywhere        (same service)
 *   1 = same city, different trade family  (local alternative)
 *   0 = no real relationship -> excluded entirely
 *
 * A shared state alone is deliberately NOT a relationship: "another Servicios listing somewhere in
 * California" is not something a reader would recognize as related.
 */
function relatednessScore(
  candidate: ServiciosPublicListingRow,
  currentGroup: string,
  currentCity: string,
  currentRegion: string,
): number {
  const sameGroup = Boolean(currentGroup) && groupToken(candidate.internal_group) === currentGroup;
  const candidateCity = token(candidate.city || candidate.profile_json?.contact?.physicalCity);
  const candidateRegion = regionToken(candidate.profile_json?.contact?.physicalRegion);
  const sameCity = Boolean(currentCity) && candidateCity === currentCity;
  const sameRegion = Boolean(currentRegion) && candidateRegion === currentRegion;

  if (sameGroup && sameCity) return 4;
  if (sameGroup && sameRegion) return 3;
  if (sameGroup) return 2;
  if (sameCity) return 1;
  return 0;
}

/** Score at or above which the match was driven by a real shared trade family. */
const TRADE_MATCH_MIN_SCORE = 2;

export type ServiciosRelatedListingsResult = {
  rows: ServiciosPublicListingRow[];
  /** True when a real trade family drove the matching — lets the caller title the rail honestly. */
  matchedByTrade: boolean;
};

/**
 * Related published Servicios listings for one listing, excluding itself.
 * Returns an empty array (never a fabricated filler row) when nothing genuinely relates.
 */
export async function listRelatedServiciosListings(
  current: ServiciosPublicListingRow,
  limit: number = SERVICIOS_RELATED_MAX,
): Promise<ServiciosRelatedListingsResult> {
  const currentGroup = groupToken(current.internal_group);
  const currentCity = token(current.city || current.profile_json?.contact?.physicalCity);
  const currentRegion = regionToken(current.profile_json?.contact?.physicalRegion);

  // No facet at all to relate on — honest empty rather than "newest listings" dressed up as related.
  if (!currentGroup && !currentCity) return { rows: [], matchedByTrade: false };

  let pool: ServiciosPublicListingRow[];
  try {
    pool = await listServiciosPublicListingsRaw(CANDIDATE_POOL);
  } catch {
    return { rows: [], matchedByTrade: false };
  }

  const scored: { row: ServiciosPublicListingRow; score: number }[] = [];
  for (const candidate of pool) {
    if (candidate.slug === current.slug) continue;
    if (current.id && candidate.id && candidate.id === current.id) continue;
    const score = relatednessScore(candidate, currentGroup, currentCity, currentRegion);
    if (score > 0) scored.push({ row: candidate, score });
  }

  // Stable: higher tier first, original discovery order preserved inside each tier.
  scored.sort((a, b) => b.score - a.score);

  const rows = scored.slice(0, Math.max(0, limit)).map((s) => s.row);
  const matchedByTrade = scored.slice(0, rows.length).some((s) => s.score >= TRADE_MATCH_MIN_SCORE);
  return { rows, matchedByTrade };
}
