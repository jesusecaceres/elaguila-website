import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { allocateLeonixAdIdViaRpc } from "@/app/lib/supabase/leonixAdIdsServer";

/** Namespace + prefix passed to Postgres `leonix_allocate_formatted` (must match trigger counter keys). */
export type LeonixAdAllocationKey = {
  namespace: string;
  prefix: string;
};

/** Canonical prefix map for dedicated tables (see `supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql`). */
export const LEONIX_ALLOCATION: Record<
  "restaurantes" | "servicios" | "empleos" | "autos" | "viajes",
  LeonixAdAllocationKey
> = {
  restaurantes: { namespace: "restaurantes", prefix: "REST" },
  servicios: { namespace: "servicios", prefix: "SERV" },
  empleos: { namespace: "empleos", prefix: "JOB" },
  autos: { namespace: "autos", prefix: "AUTO" },
  viajes: { namespace: "viajes", prefix: "TRAV" },
};

export async function allocateLeonixAdIdForTable(
  supabase: SupabaseClient,
  key: keyof typeof LEONIX_ALLOCATION,
  opts?: { maxAttempts?: number; year?: number },
): Promise<string> {
  const { namespace, prefix } = LEONIX_ALLOCATION[key];
  return allocateLeonixAdIdViaRpc(supabase, { namespace, prefix, year: opts?.year }, { maxAttempts: opts?.maxAttempts });
}

/**
 * `listings` trigger uses counter keys `listings:<PREFIX>:<year>` where PREFIX comes from `leonix_listings_prefix(category)`.
 * RPC allocation must use the same namespace `listings` and that prefix.
 */
export async function allocateLeonixAdIdForListingsCategory(
  supabase: SupabaseClient,
  categorySlug: string,
  opts?: { maxAttempts?: number; year?: number },
): Promise<string> {
  const prefix = listingsLeonixPrefixForCategory(categorySlug);
  return allocateLeonixAdIdViaRpc(supabase, { namespace: "listings", prefix, year: opts?.year }, { maxAttempts: opts?.maxAttempts });
}

/**
 * Mirrors SQL `public.leonix_listings_prefix` (keep in sync with migrations).
 * @see supabase/migrations/20260506150000_leonix_ad_id_all_classifieds.sql
 * @see supabase/migrations/20260507140000_viajes_staged_leonix_ad_id_and_listings_prefix_trav.sql
 */
export function listingsLeonixPrefixForCategory(categorySlug: string): string {
  const s = (categorySlug ?? "").trim().toLowerCase();
  switch (s) {
    case "en-venta":
      return "SALE";
    case "rentas":
      return "RENT";
    case "bienes-raices":
      return "BR";
    case "clases":
      return "CLASS";
    case "comunidad":
      return "COM";
    case "travel":
    case "viajes":
      return "TRAV";
    case "autos":
      return "AUTO";
    case "empleos":
      return "JOB";
    default:
      return "LIST";
  }
}

const FORMATTED_RE = /^[A-Z]{2,5}-\d{4}-\d{6}$/;

export function isWellFormedLeonixAdId(value: string | null | undefined): boolean {
  const v = (value ?? "").trim();
  return FORMATTED_RE.test(v);
}
