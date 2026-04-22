/**
 * Public Viajes inventory for `/clasificados/viajes/resultados` and related surfaces.
 *
 * - Approved submissions live in `public.viajes_staged_listings` (see migration).
 * - Curated `VIAJES_RESULTS_SAMPLE` and other demo catalogs are **opt-in in production**:
 *   set `NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED=1` to restore sample rows for staging/demo.
 * - In production without that flag, **only** approved staged rows are merged (no sample results).
 * - In all environments, `NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED=1` hides curated sample rows.
 */

import { VIAJES_RESULTS_SAMPLE, type ViajesResultRow } from "../data/viajesResultsSampleData";

/**
 * When true, curated sample results (`VIAJES_RESULTS_SAMPLE`) may be merged into public browse.
 * Also gates sample-backed destination index entries and similar demo-only catalog slices.
 */
export function viajesAllowCuratedDemoCatalog(): boolean {
  if (process.env.NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED === "1") return false;
  if (process.env.NODE_ENV === "production") {
    return process.env.NEXT_PUBLIC_VIAJES_SHOW_CURATED_SEED === "1";
  }
  return true;
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
