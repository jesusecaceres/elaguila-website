import type { RestaurantesPublicBlueprintRow } from "@/app/clasificados/restaurantes/data/restaurantesPublicBlueprintData";

import type { RestaurantesPublicListingDbRow } from "./restaurantesPublicListingsServer";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Canonical form for matching `listing_analytics.listing_id` to listing rows (case drift, UUID casing). */
export function normalizeRestaurantesListingAnalyticsKey(raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (UUID_RE.test(s)) return s.toLowerCase();
  if (/^REST-/i.test(s)) return s.toUpperCase();
  return s;
}

/** Values to include in PostgREST `.in("listing_id", …)` so we still find rows if analytics stored a different case. */
export function restaurantListingIdVariantsForAnalyticsQuery(raw: string): string[] {
  const t = raw.trim();
  if (!t) return [];
  if (UUID_RE.test(t)) {
    const low = t.toLowerCase();
    return low === t ? [t] : [t, low];
  }
  if (/^REST-/i.test(t)) {
    const up = t.toUpperCase();
    return up === t ? [t] : [t, up];
  }
  return [t];
}

export function collectRestauranteListingAnalyticsQueryIds(
  rows: Pick<RestaurantesPublicListingDbRow, "id" | "leonix_ad_id">[],
): string[] {
  const out = new Set<string>();
  for (const r of rows) {
    for (const v of restaurantListingIdVariantsForAnalyticsQuery(r.id)) out.add(v);
    const ad = (r.leonix_ad_id ?? "").trim();
    if (ad) for (const v of restaurantListingIdVariantsForAnalyticsQuery(ad)) out.add(v);
  }
  return [...out];
}

/** Build set of normalized ids we attribute to these listings (for filtering analytics rows). */
export function normalizedRestauranteListingAnalyticsTargets(
  rows: Pick<RestaurantesPublicListingDbRow, "id" | "leonix_ad_id">[],
): Set<string> {
  const s = new Set<string>();
  for (const r of rows) {
    s.add(normalizeRestaurantesListingAnalyticsKey(r.id));
    const ad = (r.leonix_ad_id ?? "").trim();
    if (ad) s.add(normalizeRestaurantesListingAnalyticsKey(ad));
  }
  return s;
}

type LikeEventRow = { listing_id: string | null | undefined; event_type: string | null | undefined };

/**
 * Net likes per **normalized** `listing_id` (only keys in `targets`), from real `listing_analytics` rows.
 */
export function aggregateRestauranteLikeAnalyticsEvents(events: LikeEventRow[], targets: Set<string>): Map<string, number> {
  const net = new Map<string, number>();
  for (const k of targets) {
    if (k) net.set(k, 0);
  }
  for (const raw of events) {
    const lidN = normalizeRestaurantesListingAnalyticsKey(String(raw.listing_id ?? ""));
    if (!lidN || !net.has(lidN)) continue;
    const t = raw.event_type;
    if (t === "listing_like") net.set(lidN, (net.get(lidN) ?? 0) + 1);
    else if (t === "listing_unlike") net.set(lidN, Math.max(0, (net.get(lidN) ?? 0) - 1));
  }
  return net;
}

/** Same stable key as public detail `LeonixLikeButton` (`leonix_ad_id` else row UUID). */
export function restaurantesEngagementListingKey(row: Pick<RestaurantesPublicListingDbRow, "id" | "leonix_ad_id">): string {
  const ad = (row.leonix_ad_id ?? "").trim();
  if (ad) return ad;
  return (row.id ?? "").trim();
}

export function applyRestauranteLikeCountsToBlueprintRows(
  rows: RestaurantesPublicBlueprintRow[],
  /** Normalized `listing_id` → net like count (may include separate buckets for UUID vs Leonix id). */
  countsByNormalizedId: Map<string, number>,
): RestaurantesPublicBlueprintRow[] {
  return rows.map((r) => {
    const idN = normalizeRestaurantesListingAnalyticsKey(r.id);
    const adRaw = (r.leonixAdId ?? "").trim();
    const adN = adRaw ? normalizeRestaurantesListingAnalyticsKey(adRaw) : null;
    let n = countsByNormalizedId.get(idN) ?? 0;
    if (adN && adN !== idN) n += countsByNormalizedId.get(adN) ?? 0;
    return n > 0 ? { ...r, likesCount: n } : { ...r, likesCount: undefined };
  });
}
