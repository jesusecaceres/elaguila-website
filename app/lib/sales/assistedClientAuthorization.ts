import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

/**
 * REQUIRED REPAIR 5 — the customer/business association the server proves for itself.
 *
 * Autos and Bienes both write `clientUserId` from the request body into the listing's OWNER
 * column, and both used to say so in a comment: "trusted only because the staff actor has already
 * authenticated". That reasoning has a hole in it. Authenticating the STAFF actor proves who is
 * asking; it proves nothing at all about whether the user id in the body belongs to the business
 * the assisted context names. A typo, a stale dropdown, or a copied request body silently writes
 * one customer's ad into another customer's account — and ownership is the column every later
 * authorization check reads.
 *
 * This is the check that closes it: the selected client must hold an ACTIVE membership in the
 * business the server-issued context is bound to. `business_memberships` is the canonical
 * association table the rest of the codebase already authorizes against
 * (`findActiveMembershipForBusinessAndUser`, `resolveActiveBusinessIdForUser`); this reads the
 * same relationship from the staff side, where there is no customer session to scope by RLS.
 *
 * FAIL CLOSED. An unconfigured database, a query error, and a missing row are all "no". There is
 * deliberately no branch in which an unverifiable association is treated as a verified one.
 */
export async function isClientAuthorizedForBusiness(input: {
  businessId: string;
  clientUserId: string;
}): Promise<boolean> {
  const businessId = input.businessId?.trim();
  const clientUserId = input.clientUserId?.trim();
  if (!businessId || !clientUserId) return false;
  if (!isSupabaseAdminConfigured()) return false;

  try {
    const db = getAdminSupabase();
    const { data, error } = await db
      .from("business_memberships")
      .select("id")
      .eq("business_id", businessId)
      .eq("user_id", clientUserId)
      .eq("membership_status", "active")
      .limit(1)
      .maybeSingle();
    if (error) return false;
    return !!(data as { id?: string } | null)?.id;
  } catch {
    return false;
  }
}
