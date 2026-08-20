/**
 * Saved Search 06 — shared, neutral support for `certifyBienesRaicesPublicEligibleListing`.
 * Exists only so the BR match orchestrator and the BR delivery resolver can both load a listing
 * and build its parent map without importing each other — importing the orchestrator from the
 * delivery resolver would recreate the orchestrator <-> delivery circular dependency the Saved
 * Search 05 pre-commit hardening gate already fixed once for Autos
 * (`autosSavedSearchEligibilitySupport.ts` is the exact precedent this file mirrors). This file
 * imports neither the orchestrator nor the delivery engine, and must never be made to.
 */
import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { listingsQueryWithSelectShrink } from "@/app/clasificados/lib/listingsSelectShrink";
import type { BrPublicParentCandidate } from "@/app/clasificados/lib/brPublicChildParentVisibility";
import type { BienesRaicesListingDbRow } from "./bienesRaicesPublicEligibleListing";

const BR_LISTING_SELECT =
  "id, category, title, description, city, price, is_free, images, detail_pairs, listing_json, profile_json, contact_json, seller_type, business_name, owner_id, br_inventory_group_id, br_inventory_parent_listing_id, inventory_role, created_at, updated_at, published_at, status, is_published, leonix_ad_id";

/** Server-side (admin client) single-row loader for BR match orchestration/delivery — no existing
 * function selects full display columns by id (the payment-service loader only selects lifecycle
 * columns), so this is a new, narrow, single-purpose read. */
export async function getBienesRaicesListingById(listingId: string): Promise<BienesRaicesListingDbRow | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await listingsQueryWithSelectShrink(BR_LISTING_SELECT, async (cols) => {
    const res = await supabase.from("listings").select(cols).eq("id", listingId).maybeSingle();
    return { data: res.data as BienesRaicesListingDbRow | null, error: res.error ? { message: res.error.message } : null };
  });
  if (error || !data) return null;
  return data;
}

/** Builds the minimal parent map `certifyBienesRaicesPublicEligibleListing` needs — only fetches
 * the ONE specific parent row for a Negocio inventory child. Mirrors Autos's `loadParentsById`. */
export async function loadBienesRaicesParentsById(row: {
  inventory_role?: string | null;
  br_inventory_parent_listing_id?: string | null;
}): Promise<ReadonlyMap<string, BrPublicParentCandidate>> {
  if (row.inventory_role !== "inventory_property") return new Map();
  const parentId = (row.br_inventory_parent_listing_id ?? "").trim();
  if (!parentId) return new Map();
  if (!isSupabaseAdminConfigured()) return new Map();
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("listings")
    .select("id, category, seller_type, inventory_role, owner_id, status, is_published")
    .eq("id", parentId)
    .maybeSingle();
  if (!data) return new Map();
  const parent = data as BrPublicParentCandidate;
  return new Map([[parent.id, parent]]);
}
