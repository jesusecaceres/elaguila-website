import "server-only";

/**
 * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE — category-agnostic custody primitives reused by
 * every category's publish route in assisted mode (Servicios first, Restaurantes next — see Gate
 * 9). Composed entirely from existing canonical truth, never a second listing-truth system:
 *
 *  - CUSTODY / "who does this Leonix-prepared draft belong to": the existing
 *    `business_listing_links` junction (businessId <-> listing_source/listing_id), the same table
 *    `app/admin/_lib/leonixManagedInventory.ts` already reads to compose the "Leonix Managed"
 *    admin inventory. `linked_by` is attribution only ("who linked this record"), never ownership
 *    — it is never read as, or confused with, a listing's customer owner_user_id.
 *  - PAYMENT / "has Leonix been paid for this specific listing": the existing
 *    `leonix_payment_records` ledger (`app/lib/listingPlans/manualClearedPayments.ts`), queried
 *    read-only here. Recording/clearing a manual payment still happens through the EXISTING admin
 *    Payment Tracker (`app/admin/(dashboard)/workspace/payment-tracker/manual-payment/`) — no new
 *    payment UI, no fake Stripe identity.
 *
 * Nothing here mutates a listing row directly, and nothing here ever writes a customer-ownership
 * column. Both functions fail closed (return false / no-op) when Supabase admin is not configured.
 */
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type AssistedListingSource = "servicios_public_listings" | "restaurantes_public_listings";

/**
 * True when `listing_id` is already linked (status='verified') to `businessId` under
 * `listingSource`. Used to authorize an assisted-mode staff actor to reopen/update a
 * previously-saved Leonix-prepared draft, in place of the normal customer owner_user_id check.
 */
export async function isListingLinkedToBusiness(input: {
  businessId: string;
  listingSource: AssistedListingSource;
  listingId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("business_listing_links")
    .select("id")
    .eq("business_id", input.businessId)
    .eq("listing_source", input.listingSource)
    .eq("listing_id", input.listingId)
    .eq("status", "verified")
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

/**
 * Additive, idempotent: creates the verified link the first time a Leonix-prepared draft is
 * saved for a business; a later re-save that finds the link already present is a no-op (never
 * mutates `linked_by`/`linked_at` — "who first prepared this" stays stable, matching
 * business_listing_links' own "never mutates" doctrine).
 */
export async function linkAssistedListingToBusiness(input: {
  businessId: string;
  listingSource: AssistedListingSource;
  listingId: string;
  linkedByAuthUserId: string;
}): Promise<{ ok: boolean }> {
  if (!isSupabaseAdminConfigured()) return { ok: false };
  const supabase = getAdminSupabase();
  const already = await isListingLinkedToBusiness(input);
  if (already) return { ok: true };
  const nowIso = new Date().toISOString();
  const { error } = await supabase.from("business_listing_links").insert({
    business_id: input.businessId,
    listing_source: input.listingSource,
    listing_id: input.listingId,
    relationship_role: "primary",
    linked_by: input.linkedByAuthUserId,
    status: "verified",
    verified_at: nowIso,
  });
  return { ok: !error };
}

/**
 * True when a manual payment for this exact listing has been recorded AND cleared through the
 * existing admin Payment Tracker (`leonix_payment_records.manual_state = 'cleared'`). This is the
 * "Publish for Client" payment gate — a real, staff-verified payment fact, never a fabricated
 * Stripe session.
 */
export async function hasClearedManualPaymentForListing(input: {
  listingSource: AssistedListingSource;
  listingId: string;
}): Promise<boolean> {
  if (!isSupabaseAdminConfigured()) return false;
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("leonix_payment_records")
    .select("id")
    .eq("listing_source", input.listingSource)
    .eq("listing_id", input.listingId)
    .eq("manual_state", "cleared")
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}
