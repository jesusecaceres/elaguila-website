/**
 * Public Viajes inventory for `/clasificados/viajes/resultados` and related surfaces.
 *
 * - Approved submissions live in `public.viajes_staged_listings` (see migration).
 * - Curated `VIAJES_RESULTS_SAMPLE` is **opt-in only** (`NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1`)
 *   and never used as Production-facing commercial fallback.
 * - Production and local owner-QA default: real approved staged rows only.
 * - `NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED=1` always hides curated sample rows.
 */

import { VIAJES_RESULTS_SAMPLE, type ViajesBusinessResult, type ViajesResultRow } from "../data/viajesResultsSampleData";
import type { ViajesPartnerSpotlightCard } from "../data/viajesHomeFeedTypes";
import { isViajesInternalQaInventoryIdentity } from "./viajesPublicOfferTitle";

/**
 * When true, curated sample results (`VIAJES_RESULTS_SAMPLE`) may be merged into public browse.
 * Also gates sample-backed destination index entries and similar demo-only catalog slices.
 * Default is off — fixtures stay available for tests; they must not masquerade as customer inventory.
 */
export function viajesAllowCuratedDemoCatalog(): boolean {
  if (process.env.NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED === "1") return false;
  /** Production never merges curated sample rows — even if `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1` is set by mistake. */
  if (process.env.NODE_ENV === "production") return false;
  return process.env.NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED === "1";
}

function rowPublicTitle(row: ViajesResultRow): string {
  if (row.kind === "business") return row.offerTitle;
  return row.title;
}

function rowPublicName(row: ViajesResultRow): string {
  if (row.kind === "business") return row.businessName;
  if (row.kind === "affiliate") return row.title;
  return "";
}

/** True when a browse row is eligible as Production commercial/listing inventory. */
export function isViajesProductionCommercialRow(row: ViajesResultRow): boolean {
  if (row.kind === "editorial") return false;
  if (
    isViajesInternalQaInventoryIdentity(
      row.id,
      row.href,
      rowPublicTitle(row),
      rowPublicName(row),
      row.kind === "business" ? row.slug : undefined
    )
  ) {
    return false;
  }
  return true;
}

export function filterViajesProductionCommercialRows(rows: ViajesResultRow[]): ViajesResultRow[] {
  return rows.filter(isViajesProductionCommercialRow);
}

export function filterViajesProductionFeaturedOffers(rows: ViajesBusinessResult[]): ViajesBusinessResult[] {
  return rows.filter((row) => isViajesProductionCommercialRow(row));
}

/** Real approved business providers from public browse rows. */
export function selectViajesLivePartnerSpotlight(
  rows: ViajesBusinessResult[],
  limit = 3
): ViajesPartnerSpotlightCard[] {
  const seen = new Set<string>();
  const out: ViajesPartnerSpotlightCard[] = [];
  for (const row of rows) {
    if (row.sellerLane === "private") continue;
    if (isViajesInternalQaInventoryIdentity(row.offerTitle, row.businessName, row.slug, row.id)) continue;
    const slug = (row.businessProfileSlug || "").trim();
    const name = row.businessName.trim();
    if (!slug || !name || name === "—") continue;
    const key = slug.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      slug,
      businessName: name,
      tagline: row.includedSummary || row.destination,
      destinationsLine: row.destination,
      profileHref: `/clasificados/viajes/negocio/${encodeURIComponent(slug)}`,
      logoAlt: name,
    });
    if (out.length >= limit) break;
  }
  return out;
}

/** Merge approved staged cards with optional curated seed (never in production unless explicitly opted in). */
export function mergeViajesPublicResultRows(stagedApproved: ViajesResultRow[]): ViajesResultRow[] {
  if (!viajesAllowCuratedDemoCatalog()) return [...stagedApproved];
  return [...stagedApproved, ...VIAJES_RESULTS_SAMPLE];
}

/**
 * Sample-only rows for legacy callers (destination index, docs).
 * Returns [] in production unless `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1`.
 */
export function getViajesPublicResultRows(): ViajesResultRow[] {
  if (!viajesAllowCuratedDemoCatalog()) return [];
  return VIAJES_RESULTS_SAMPLE;
}

/**
 * When true, results UI may show the “mixed / demo inventory” disclosure (sample rows merged).
 */
export function isViajesPublicInventoryDemoMode(): boolean {
  return viajesAllowCuratedDemoCatalog();
}
