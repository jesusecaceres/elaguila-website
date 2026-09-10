import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import { RENTAS_LISTING_LIFECYCLE_CONFIG } from "./listingLifecycleConfig";
import {
  BIENES_FSBO_LIFECYCLE_CATEGORY,
  BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
  BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
  isBrFsboRow,
} from "./bienesFsboLifecycle";
import { resolveListingLifecycle } from "./resolveListingLifecycle";

export type RentasRenewalOwnerValidationResult =
  | { ok: true; ownerUserId: string | null; currentExpiresAt: string | null; leonixAdId: string | null }
  | { ok: false; status: number; code: string; message: string };

export async function validateRentasRenewalCheckoutOwnership(input: {
  listingId: string;
  bearerUserId: string | null;
}): Promise<RentasRenewalOwnerValidationResult> {
  if (!input.bearerUserId?.trim()) {
    return { ok: false, status: 401, code: "auth_required", message: "Authentication required for Rentas renewal." };
  }
  const listingId = input.listingId.trim();
  if (!listingId) {
    return { ok: false, status: 400, code: "listing_id_required", message: "listingId is required for renewal." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, status: 503, code: "supabase_not_configured", message: "Supabase admin is not configured." };
  }

  const { data, error } = await getAdminSupabase()
    .from("listings")
    .select("id, owner_id, category, status, is_published, published_at, expires_at, leonix_ad_id")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data?.id) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Rentas listing not found." };
  }
  if (String(data.owner_id ?? "").trim() !== input.bearerUserId.trim()) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to the authenticated user." };
  }
  if (String(data.category ?? "").trim().toLowerCase() !== "rentas") {
    return { ok: false, status: 422, code: "wrong_category", message: "Renewal applies only to Rentas listings." };
  }

  const lifecycle = resolveListingLifecycle(
    {
      category: "rentas",
      packageKey: "rentas_30d",
      status: String(data.status ?? ""),
      isPublished: data.is_published ?? null,
      publishedAt: data.published_at ?? null,
      expiresAt: data.expires_at ?? null,
    },
    RENTAS_LISTING_LIFECYCLE_CONFIG,
  );
  if (!lifecycle.isRenewalEligible) {
    return {
      ok: false,
      status: 422,
      code: lifecycle.lifecycleState === "suspended" ? "renewal_suspended" : "renewal_not_eligible",
      message: "This Rentas listing is not eligible for renewal yet.",
    };
  }

  return {
    ok: true,
    ownerUserId: String(data.owner_id ?? "").trim() || null,
    currentExpiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
    leonixAdId: typeof data.leonix_ad_id === "string" ? data.leonix_ad_id : null,
  };
}

export function paymentRecordIsRenewal(metadata: Record<string, unknown> | null | undefined): boolean {
  return String(metadata?.operation ?? "").trim() === "renew_listing";
}

export type BienesFsboRenewalOwnerValidationResult =
  | { ok: true; ownerUserId: string | null; currentExpiresAt: string | null; leonixAdId: string | null }
  | { ok: false; status: number; code: string; message: string };

/**
 * Gate BIENES-PRIVADO-1 — the server-side gate for a Bienes Raíces FSBO renewal checkout.
 *
 * Deliberately the same shape as `validateRentasRenewalCheckoutOwnership` above (one renewal
 * pattern for the whole platform, per Master §8), with two lane-specific additions this table
 * requires because `listings` holds both BR lanes:
 *
 *   - the row must pass `isBrFsboRow` — a Negocio subscription row is rejected with `wrong_lane`
 *     and can never buy a 45-day fixed term;
 *   - eligibility is resolved against `BIENES_FSBO_LISTING_LIFECYCLE_CONFIG` passed EXPLICITLY,
 *     never through the category-only registry lookup.
 *
 * Nothing here trusts the client: the caller supplies only a listingId and a bearer token, and the
 * expiry the checkout session is priced and stamped against is the one read from the row here.
 */
export async function validateBienesFsboRenewalCheckoutOwnership(input: {
  listingId: string;
  bearerUserId: string | null;
}): Promise<BienesFsboRenewalOwnerValidationResult> {
  if (!input.bearerUserId?.trim()) {
    return { ok: false, status: 401, code: "auth_required", message: "Authentication required for renewal." };
  }
  const listingId = input.listingId.trim();
  if (!listingId) {
    return { ok: false, status: 400, code: "listing_id_required", message: "listingId is required for renewal." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, status: 503, code: "supabase_not_configured", message: "Supabase admin is not configured." };
  }

  const { data, error } = await getAdminSupabase()
    .from("listings")
    .select("id, owner_id, category, seller_type, listing_json, status, is_published, published_at, expires_at, leonix_ad_id")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data?.id) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Listing not found." };
  }
  if (String(data.owner_id ?? "").trim() !== input.bearerUserId.trim()) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to the authenticated user." };
  }
  if (!isBrFsboRow(data)) {
    return {
      ok: false,
      status: 422,
      code: "wrong_lane",
      message: "Fixed-term renewal applies only to private-seller Bienes Raíces listings.",
    };
  }

  const lifecycle = resolveListingLifecycle(
    {
      category: BIENES_FSBO_LIFECYCLE_CATEGORY,
      packageKey: BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
      status: String(data.status ?? ""),
      isPublished: data.is_published ?? null,
      publishedAt: data.published_at ?? null,
      expiresAt: data.expires_at ?? null,
    },
    BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
  );
  if (!lifecycle.isRenewalEligible) {
    return {
      ok: false,
      status: 422,
      code: lifecycle.lifecycleState === "suspended" ? "renewal_suspended" : "renewal_not_eligible",
      message: "This listing is not eligible for renewal yet.",
    };
  }

  return {
    ok: true,
    ownerUserId: String(data.owner_id ?? "").trim() || null,
    currentExpiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
    leonixAdId: typeof data.leonix_ad_id === "string" ? data.leonix_ad_id : null,
  };
}
