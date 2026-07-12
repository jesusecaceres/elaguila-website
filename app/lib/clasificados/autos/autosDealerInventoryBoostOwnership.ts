import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export type AutosDealerInventoryBoostOwnerValidationResult =
  | { ok: true }
  | { ok: false; status: number; code: string; message: string };

/** Draft/pending_payment/active negocios listings owned by bearer — pre-publish Inventory Boost. */
const APPLICATION_BOOST_ELIGIBLE_STATUSES = new Set([
  "draft",
  "pending_payment",
  "payment_failed",
  "active",
]);

export async function validateAutosDealerInventoryAddonOwnershipForApplication(input: {
  listingId: string;
  bearerUserId: string | null;
}): Promise<AutosDealerInventoryBoostOwnerValidationResult> {
  if (!input.bearerUserId?.trim()) {
    return {
      ok: false,
      status: 401,
      code: "auth_required",
      message: "Authentication required for Autos dealer inventory add-on checkout.",
    };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      status: 400,
      code: "listing_id_required",
      message: "listingId is required for Autos dealer inventory add-on checkout.",
    };
  }

  if (!isSupabaseAdminConfigured()) {
    return {
      ok: false,
      status: 503,
      code: "supabase_not_configured",
      message: "Supabase admin is not configured.",
    };
  }

  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("autos_classifieds_listings")
    .select("id, status, lane, owner_user_id")
    .eq("id", listingId)
    .maybeSingle();

  if (error || !data?.id) {
    return {
      ok: false,
      status: 404,
      code: "listing_not_found",
      message: "Autos dealer listing not found.",
    };
  }

  if (String(data.owner_user_id ?? "").trim() !== input.bearerUserId.trim()) {
    return {
      ok: false,
      status: 403,
      code: "listing_owner_mismatch",
      message: "Listing does not belong to the authenticated user.",
    };
  }

  const lane = String(data.lane ?? "").trim().toLowerCase();
  if (lane !== "negocios") {
    return {
      ok: false,
      status: 422,
      code: "listing_not_dealer",
      message: "Vehicle inventory add-on applies only to dealer/negocio Autos listings.",
    };
  }

  const status = String(data.status ?? "").trim().toLowerCase();
  if (!APPLICATION_BOOST_ELIGIBLE_STATUSES.has(status)) {
    return {
      ok: false,
      status: 422,
      code: "listing_not_eligible",
      message: "Inventory add-on can only be purchased for a draft or active dealer listing.",
    };
  }

  return { ok: true };
}
