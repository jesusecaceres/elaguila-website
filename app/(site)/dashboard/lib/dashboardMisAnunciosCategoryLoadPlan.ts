/**
 * Gate I.4.2 — selected-category load plan for `/dashboard/mis-anuncios`.
 *
 * Before this gate, the page unconditionally fetched full listing content for every dedicated
 * category (Restaurantes, Servicios, Empleos, Autos, Viajes, Comida Local) plus the shared
 * `listings` table on every load, regardless of which category tab was selected (Gate I.4A
 * audit). This file is the single source of truth for which sources a given selected category
 * actually needs, so the page can defer everything else.
 *
 * Pure, zero-I/O plan resolution lives here (`resolveMisAnunciosLoadPlan`,
 * `DEFERRED_DEDICATED_CATEGORIES`) alongside the one real I/O helper this gate adds
 * (`fetchDedicatedCategoryCounts`) — kept in the same file since both exist for the same reason
 * and the count helper is trivial, not worth a second file.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { MisAnunciosCategoryKey } from "./dashboardMisAnunciosCategories";

/** Categories resolved from the shared `listings` table (already fetched as one query — BR vs.
 * Rentas resolution requires `detail_pairs`, so this family is never split further in this
 * gate; see the Gate I.4.2 report §5). */
const SHARED_LISTINGS_CATEGORIES = new Set<MisAnunciosCategoryKey>([
  "en-venta",
  "autos",
  "bienes-raices",
  "rentas",
  "clases",
  "comunidad",
  "busco",
]);

/**
 * Dedicated-source categories whose full row content is deferred until actually selected.
 * Servicios is deliberately excluded: its owner-scoped rows are only reachable through the
 * admin-backed `/api/clasificados/servicios/my-listings` route (no owner-read RLS policy exists
 * on `servicios_public_listings` for a direct browser count query — confirmed in the Gate I.4.2
 * report), so no lightweight count-only path exists for it without touching that locked API
 * route. Its full set is still fetched eagerly, same as before this gate.
 */
export const DEFERRED_DEDICATED_CATEGORIES = new Set<MisAnunciosCategoryKey>([
  "restaurantes",
  "empleos",
  "viajes",
  "autos",
  "comida-local",
]);

/** Categories with a real entitlement/paid-module lookup. Clases/Comunidad/Busco/Comida Local
 * have never had one — this must never invent one for them. */
const ENTITLEMENT_ELIGIBLE_CATEGORIES = new Set<MisAnunciosCategoryKey>([
  "restaurantes",
  "servicios",
  "autos",
  "bienes-raices",
  "rentas",
  "en-venta",
]);

export type MisAnunciosLoadPlan = {
  category: MisAnunciosCategoryKey;
  /** Whether this category's full row content is loaded from the shared `listings` fetch
   * (already-loaded, filtered client-side — never a second network fetch). */
  requiresSharedListings: boolean;
  /** Whether this category's full row content must be fetched from its own dedicated source
   * once selected (false for Servicios — see `DEFERRED_DEDICATED_CATEGORIES`'s own note). */
  requiresDedicatedFetch: boolean;
  /** Whether an entitlement/paid-module lookup should ever be sent for this category. */
  requiresEntitlementLookup: boolean;
};

export function resolveMisAnunciosLoadPlan(category: MisAnunciosCategoryKey): MisAnunciosLoadPlan {
  return {
    category,
    requiresSharedListings: SHARED_LISTINGS_CATEGORIES.has(category),
    requiresDedicatedFetch: DEFERRED_DEDICATED_CATEGORIES.has(category),
    requiresEntitlementLookup: ENTITLEMENT_ELIGIBLE_CATEGORIES.has(category),
  };
}

export type DedicatedCategoryCounts = {
  restaurantes: number;
  empleos: number;
  viajes: number;
  autosPaid: number;
  comidaLocal: number;
};

export const EMPTY_DEDICATED_CATEGORY_COUNTS: DedicatedCategoryCounts = {
  restaurantes: 0,
  empleos: 0,
  viajes: 0,
  autosPaid: 0,
  comidaLocal: 0,
};

/**
 * Lightweight, count-only, owner-scoped query per dedicated table — same tables and owner column
 * (`owner_user_id`) already used by `dashboardInventory.ts`'s full-row fetchers, just `head: true`
 * instead of full columns. Parallelized; never blocks on any single table.
 */
export async function fetchDedicatedCategoryCounts(
  sb: SupabaseClient,
  ownerId: string,
): Promise<DedicatedCategoryCounts> {
  const [rest, emp, via, autos, comida] = await Promise.all([
    sb.from("restaurantes_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("empleos_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("viajes_staged_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("autos_classifieds_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
    sb.from("comida_local_public_listings").select("id", { count: "exact", head: true }).eq("owner_user_id", ownerId),
  ]);
  return {
    restaurantes: rest.count ?? 0,
    empleos: emp.count ?? 0,
    viajes: via.count ?? 0,
    autosPaid: autos.count ?? 0,
    comidaLocal: comida.count ?? 0,
  };
}
