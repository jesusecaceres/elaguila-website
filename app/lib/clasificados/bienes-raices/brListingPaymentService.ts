/**
 * BR-FINAL-PUBLISH-STRIPE-ROTATION-05 — server-side listing payment activation on `public.listings`.
 */

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { mainListingInventoryPatchAfterInsert } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import { BR_INVENTORY_PACK_MAX_CHILDREN } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";

export type BrListingRowForPayment = {
  id: string;
  owner_id?: string | null;
  category?: string | null;
  seller_type?: string | null;
  status?: string | null;
  is_published?: boolean | null;
  inventory_role?: string | null;
  br_inventory_group_id?: string | null;
  published_at?: string | null;
};

export async function getBrListingById(listingId: string): Promise<BrListingRowForPayment | null> {
  if (!isSupabaseAdminConfigured()) return null;
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("listings")
    .select("id, owner_id, category, seller_type, status, is_published, inventory_role, br_inventory_group_id, published_at")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data) return null;
  return data as BrListingRowForPayment;
}

export async function setBrListingPendingPayment(
  listingId: string,
  stripeCheckoutSessionId: string,
  lane: "negocio" | "privado" = "negocio",
): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const row = await getBrListingById(listingId);
  if (!row) return false;
  void stripeCheckoutSessionId;
  void lane;
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("listings")
    .update({
      status: "pending",
      is_published: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .in("status", ["pending", "active"]);
  return !error;
}

export type TryActivateBrResult = { ok: boolean; transitioned: boolean };

/**
 * Idempotent activation after Stripe paid. Only transitions rows with status=pending and unpublished.
 * When a Bienes inventory listing activates, pending siblings in the same group also activate (bundle checkout).
 */
export async function tryActivateBrListingAfterPayment(
  listingId: string,
  opts?: { stripePaymentIntentId?: string | null; activateInventorySiblings?: boolean },
): Promise<TryActivateBrResult> {
  if (!isSupabaseAdminConfigured()) return { ok: false, transitioned: false };
  const existing = await getBrListingById(listingId);
  if (!existing) return { ok: false, transitioned: false };
  if (existing.status === "active" && existing.is_published === true) {
    return { ok: true, transitioned: false };
  }
  if (existing.status !== "pending" || existing.is_published !== false) {
    return { ok: false, transitioned: false };
  }

  const now = new Date().toISOString();

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("listings")
    .update({
      status: "active",
      is_published: true,
      published_at: existing.published_at ?? now,
      updated_at: now,
    })
    .eq("id", listingId)
    .eq("status", "pending")
    .eq("is_published", false)
    .select("id, inventory_role, br_inventory_group_id")
    .maybeSingle();

  if (error) {
    console.error("tryActivateBrListingAfterPayment", error);
    return { ok: false, transitioned: false };
  }
  if (data) {
    if (existing.category === "bienes-raices" && data.inventory_role === "main") {
      const patch = mainListingInventoryPatchAfterInsert(listingId);
      await supabase.from("listings").update({ ...patch, updated_at: now }).eq("id", listingId);
    }
    const fanOut = opts?.activateInventorySiblings !== false;
    if (fanOut && existing.category === "bienes-raices") {
      const groupId =
        String(data.br_inventory_group_id ?? "").trim() ||
        (data.inventory_role === "main" ? listingId : "");
      if (groupId) {
        const { data: siblings } = await supabase
          .from("listings")
          .select("id, created_at")
          .eq("category", "bienes-raices")
          .eq("br_inventory_group_id", groupId)
          .eq("inventory_role", "inventory_property")
          .eq("status", "pending")
          .eq("is_published", false)
          .neq("id", listingId)
          .order("created_at", { ascending: true })
          .limit(BR_INVENTORY_PACK_MAX_CHILDREN);
        for (const sib of siblings ?? []) {
          const sibId = String((sib as { id?: string }).id ?? "").trim();
          if (!sibId) continue;
          await tryActivateBrListingAfterPayment(sibId, {
            stripePaymentIntentId: opts?.stripePaymentIntentId,
            activateInventorySiblings: false,
          });
        }
      }
    }
    return { ok: true, transitioned: true };
  }
  const again = await getBrListingById(listingId);
  if (again?.status === "active" && again.is_published === true) {
    return { ok: true, transitioned: false };
  }
  return { ok: false, transitioned: false };
}

export async function assertBrListingOwner(
  listingId: string,
  ownerUserId: string,
): Promise<BrListingRowForPayment | null> {
  const row = await getBrListingById(listingId);
  if (!row || String(row.owner_id ?? "") !== ownerUserId) return null;
  return row;
}

export function brListingAwaitingPayment(row: BrListingRowForPayment): boolean {
  if (row.status !== "pending" || row.is_published !== false) return false;
  return true;
}
