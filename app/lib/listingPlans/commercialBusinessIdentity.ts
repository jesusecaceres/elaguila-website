/**
 * Package C Build 2 (C4) — category-aware commercial business identity resolver.
 *
 * The verified-intro-15% discount's anti-repeat rule requires "one redemption per business
 * where applicable" as an ADDITIONAL boundary layered on top of (never a substitute for) the
 * global owner_user_id boundary (see verifiedIntroDiscountPolicy.ts / decision 5 in the plan).
 *
 * This resolver reuses the exact commercial-parent-listing identity that
 * commercialWriteGuard.ts already establishes for Autos Dealer / Bienes Negocio capacity
 * enforcement (Package C Build 1) — it does not invent a new business-identity system. For
 * lanes with no parent/child or dealer-group structure (confirmed: Autos Privado, BR Privado,
 * Restaurantes, Servicios — a single listing IS the business in these lanes), the resolver
 * falls back to owner_user_id, explicitly stamped and auditable, never silent.
 *
 * The identity is namespaced by `identityType` — the uniqueness boundary on the redemption
 * table is composite `(business_identity_type, business_identity_key)`, so a key collision
 * across two different namespaces (e.g. an Autos dealer-group id vs a Bienes commercial-parent
 * id) can never matter, even in the astronomically unlikely event the raw key strings collide.
 */

import "server-only";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type CommercialBusinessIdentityType =
  | "dealer_inventory_group"
  | "commercial_parent_listing"
  | "owner_user_id_fallback";

export type CommercialBusinessIdentity = {
  identityType: CommercialBusinessIdentityType;
  identityKey: string;
  fallbackReason: string | null;
};

export type ResolveCommercialBusinessIdentityInput = {
  category: string;
  listingSource: string | null | undefined;
  listingId: string | null | undefined;
  ownerUserId: string;
};

function fallbackToOwner(reason: string, ownerUserId: string): CommercialBusinessIdentity {
  return { identityType: "owner_user_id_fallback", identityKey: ownerUserId, fallbackReason: reason };
}

async function resolveAutosBusinessIdentity(
  listingId: string,
  ownerUserId: string,
): Promise<CommercialBusinessIdentity> {
  if (!isSupabaseAdminConfigured()) {
    return fallbackToOwner("autos: commercial verification unavailable (Supabase admin not configured)", ownerUserId);
  }
  const supabase = getAdminSupabase();
  const { data: row } = await supabase
    .from("autos_classifieds_listings")
    .select("id, owner_user_id, lane, inventory_role, dealer_inventory_parent_listing_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!row || String(row.lane ?? "") !== "negocios") {
    // Autos Privado, or an unresolved listing — no dealer/parent structure exists in this lane.
    return fallbackToOwner(
      "autos privado: single listing is the business; no parent/dealer entity exists for this lane",
      ownerUserId,
    );
  }

  const role = String(row.inventory_role ?? "").trim().toLowerCase();
  if (role === "inventory_vehicle" && row.dealer_inventory_parent_listing_id) {
    // Child vehicle — resolve UP to the dealer's parent listing, never the child itself.
    return {
      identityType: "dealer_inventory_group",
      identityKey: String(row.dealer_inventory_parent_listing_id),
      fallbackReason: null,
    };
  }
  // The listing IS the dealer parent (role 'main' or unset legacy row).
  return { identityType: "dealer_inventory_group", identityKey: String(row.id), fallbackReason: null };
}

async function resolveBienesBusinessIdentity(
  listingId: string,
  ownerUserId: string,
): Promise<CommercialBusinessIdentity> {
  if (!isSupabaseAdminConfigured()) {
    return fallbackToOwner("bienes-raices: commercial verification unavailable (Supabase admin not configured)", ownerUserId);
  }
  const supabase = getAdminSupabase();
  const { data: row } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, inventory_role, br_inventory_parent_listing_id")
    .eq("id", listingId)
    .maybeSingle();

  if (!row || String(row.category ?? "") !== "bienes-raices" || String(row.seller_type ?? "") !== "business") {
    // BR Privado (private seller), or an unresolved listing — no parent/child structure.
    return fallbackToOwner(
      "bienes-raices privado: single listing is the business; no parent entity exists for this lane",
      ownerUserId,
    );
  }

  const role = String(row.inventory_role ?? "").trim().toLowerCase();
  if (role === "inventory_property" && row.br_inventory_parent_listing_id) {
    return {
      identityType: "commercial_parent_listing",
      identityKey: String(row.br_inventory_parent_listing_id),
      fallbackReason: null,
    };
  }
  return { identityType: "commercial_parent_listing", identityKey: String(row.id), fallbackReason: null };
}

/**
 * Resolves the durable business identity for anti-repeat purposes. Priority: (1) an existing
 * durable dealer/commercial-parent identity established by Build 1's capacity system, (2) the
 * authenticated owner_user_id fallback, explicitly stamped with why no safer identity exists.
 * Never uses mutable business name/email/phone/slug/display title as the identity.
 */
export async function resolveCommercialBusinessIdentity(
  input: ResolveCommercialBusinessIdentityInput,
): Promise<CommercialBusinessIdentity> {
  const category = String(input.category ?? "").trim().toLowerCase();
  const listingId = String(input.listingId ?? "").trim();
  const ownerUserId = String(input.ownerUserId ?? "").trim();

  if (!listingId) {
    return fallbackToOwner(`${category || "unknown"}: no listingId supplied for business-identity resolution`, ownerUserId);
  }

  if (category === "autos") {
    return resolveAutosBusinessIdentity(listingId, ownerUserId);
  }
  if (category === "bienes-raices") {
    return resolveBienesBusinessIdentity(listingId, ownerUserId);
  }

  // Restaurantes, Servicios, Rentas, Empleos, Clases, Ofertas/Cupones, and any other category:
  // no durable parent/business entity is established anywhere in this repo for these lanes today
  // (confirmed for Restaurantes/Servicios; other categories default here too until a targeted
  // schema read at implementation time proves otherwise for a specific lane — see plan decision 6).
  return fallbackToOwner(
    `${category || "unknown"}: single listing is the business; no parent/business entity exists in this repo for this lane`,
    ownerUserId,
  );
}
