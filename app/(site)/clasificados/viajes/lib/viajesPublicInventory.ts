/**
 * Public Viajes inventory for `/clasificados/viajes/resultados` — **single adapter** for result rows.
 *
 * **Launch reality (read before changing):**
 * - Live DB/API feed for approved business listings is **not wired** in this repo yet.
 * - Until `fetchApprovedViajesPublicRows()` exists, rows come from curated **sample data** that
 *   mirrors the normalized `ViajesResultRow` shape so filters, sort, and cards behave like production.
 *
 * **Swap procedure (future):**
 * 1. Implement server fetch (e.g. Supabase) returning rows compatible with `ViajesResultRow`.
 * 2. Merge partner/affiliate feeds + editorial index in this module only.
 * 3. Keep `viajesRowMatchesBrowse` + `sortViajesResultRows` unchanged — they operate on `ViajesResultRow[]`.
 *
 * Do not import `VIAJES_RESULTS_SAMPLE` directly in UI shells — use `getViajesPublicResultRows()` always.
 */

import { VIAJES_RESULTS_SAMPLE, type ViajesResultRow } from "../data/viajesResultsSampleData";

/** True while public rows are demo/sample-backed (show honest banner in UI). */
export function isViajesPublicInventoryDemoMode(): boolean {
  return true;
}

/** All rows shown on the public results page (demo or live). */
export function getViajesPublicResultRows(): ViajesResultRow[] {
  return VIAJES_RESULTS_SAMPLE;
}
