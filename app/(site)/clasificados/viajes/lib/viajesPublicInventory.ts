/**
 * Public Viajes inventory for `/clasificados/viajes/resultados` — merge **approved staged** rows + curated seed.
 *
 * - Approved submissions live in `public.viajes_staged_listings` (see migration).
 * - Curated `VIAJES_RESULTS_SAMPLE` remains as discovery seed / affiliate+editorial examples until fully replaced.
 * - Server entry: `fetchViajesPublicBrowseRowsMerged()` passes merged rows into `ViajesResultsShell`.
 */

import { VIAJES_RESULTS_SAMPLE, type ViajesResultRow } from "../data/viajesResultsSampleData";

/** Merge approved staged cards first, then curated seed (IDs are disjoint). */
export function mergeViajesPublicResultRows(stagedApproved: ViajesResultRow[]): ViajesResultRow[] {
  return [...stagedApproved, ...VIAJES_RESULTS_SAMPLE];
}

/** @deprecated Use server `fetchViajesPublicBrowseRowsMerged()` + props; fallback for non-SSR callers. */
export function getViajesPublicResultRows(): ViajesResultRow[] {
  return VIAJES_RESULTS_SAMPLE;
}

/**
 * When true, UI may emphasize that results still include curated examples (not only user submissions).
 * Set false when you hide the seed column-wide via env (optional).
 */
export function isViajesPublicInventoryDemoMode(): boolean {
  return process.env.NEXT_PUBLIC_VIAJES_HIDE_CURATED_SEED !== "1";
}
