import "server-only";

import { isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/**
 * When true, public Empleos surfaces must not use `EMPLEOS_JOB_CATALOG` marketing samples:
 * - results merge (`mergeEmpleosSeedWithLiveJobs`)
 * - landing featured/recent strips
 * - job detail slug fallback (seed catalog must not masquerade as live)
 *
 * Policy:
 * - `EMPLEOS_PUBLIC_LIVE_ONLY=1` → always omit seed (explicit ops override).
 * - `NODE_ENV=production` **and** Supabase admin is configured → omit seed (go-live default).
 * - Otherwise keep seed for local/demo UX.
 */
export function empleosOmitMarketingSeedCatalog(): boolean {
  if (process.env.EMPLEOS_PUBLIC_LIVE_ONLY === "1") return true;
  if (process.env.NODE_ENV === "production" && isSupabaseAdminConfigured()) return true;
  return false;
}
