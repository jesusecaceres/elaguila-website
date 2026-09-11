import "server-only";

import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  RENTAS_LISTING_LIFECYCLE_CONFIG,
  AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG,
  AUTOS_PRIVADO_LIFECYCLE_PACKAGE_KEY,
  BR_FSBO_LISTING_LIFECYCLE_CONFIG,
  BR_FSBO_LIFECYCLE_PACKAGE_KEY,
} from "./listingLifecycleConfig";
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

/**
 * Webhook-retry idempotency guard shared by every fixed-term category's renewal fulfillment
 * (Rentas keeps its own private copy of this exact check inline; Autos Privado and Bienes Raíces
 * FSBO — Gate 20 — use this shared version instead of duplicating it a third time). A specific
 * payment record can only ever apply its own renewal once, even if the webhook that reports it
 * successful is redelivered (Stripe retry, or the webhook ledger's crash self-heal re-claim).
 */
export function isRenewalAlreadyApplied(metadata: Record<string, unknown> | null | undefined): boolean {
  return Boolean(metadata?.renewal_applied_at);
}

export async function markRenewalPaymentApplied(input: {
  paymentRecordId: string;
  renewedAt: string;
  newExpiresAt: string;
}): Promise<void> {
  const { data } = await getAdminSupabase()
    .from("leonix_payment_records")
    .select("metadata")
    .eq("id", input.paymentRecordId)
    .maybeSingle();
  const metadata = (data?.metadata && typeof data.metadata === "object" ? data.metadata : {}) as Record<string, unknown>;
  await getAdminSupabase()
    .from("leonix_payment_records")
    .update({
      metadata: {
        ...metadata,
        renewal_applied_at: input.renewedAt,
        renewal_new_expires_at: input.newExpiresAt,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentRecordId);
}

export type AutosPrivadoRenewalOwnerValidationResult =
  | { ok: true; ownerUserId: string | null; currentExpiresAt: string | null; leonixAdId: string | null }
  | { ok: false; status: number; code: string; message: string };

export async function validateAutosPrivadoRenewalCheckoutOwnership(input: {
  listingId: string;
  bearerUserId: string | null;
}): Promise<AutosPrivadoRenewalOwnerValidationResult> {
  if (!input.bearerUserId?.trim()) {
    return { ok: false, status: 401, code: "auth_required", message: "Authentication required for Autos Privado renewal." };
  }
  const listingId = input.listingId.trim();
  if (!listingId) {
    return { ok: false, status: 400, code: "listing_id_required", message: "listingId is required for renewal." };
  }
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, status: 503, code: "supabase_not_configured", message: "Supabase admin is not configured." };
  }

  const { data, error } = await getAdminSupabase()
    .from("autos_classifieds_listings")
    .select("id, owner_user_id, lane, status, published_at, expires_at, leonix_ad_id")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data?.id) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Autos Privado listing not found." };
  }
  if (String(data.owner_user_id ?? "").trim() !== input.bearerUserId.trim()) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to the authenticated user." };
  }
  if (String(data.lane ?? "").trim().toLowerCase() !== "privado") {
    return { ok: false, status: 422, code: "wrong_lane", message: "Renewal applies only to Autos Privado listings." };
  }

  const lifecycle = resolveListingLifecycle(
    {
      category: "autos",
      packageKey: AUTOS_PRIVADO_LIFECYCLE_PACKAGE_KEY,
      status: String(data.status ?? ""),
      isPublished: true,
      publishedAt: data.published_at ?? null,
      expiresAt: data.expires_at ?? null,
    },
    AUTOS_PRIVADO_LISTING_LIFECYCLE_CONFIG,
  );
  if (!lifecycle.isRenewalEligible) {
    return {
      ok: false,
      status: 422,
      code: lifecycle.lifecycleState === "suspended" ? "renewal_suspended" : "renewal_not_eligible",
      message: "This Autos Privado listing is not eligible for renewal yet.",
    };
  }

  return {
    ok: true,
    ownerUserId: String(data.owner_user_id ?? "").trim() || null,
    currentExpiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
    leonixAdId: typeof data.leonix_ad_id === "string" ? data.leonix_ad_id : null,
  };
}

export type BienesFsboRenewalOwnerValidationResult =
  | { ok: true; ownerUserId: string | null; currentExpiresAt: string | null; leonixAdId: string | null }
  | { ok: false; status: number; code: string; message: string };

export async function validateBienesFsboRenewalCheckoutOwnership(input: {
  listingId: string;
  bearerUserId: string | null;
}): Promise<BienesFsboRenewalOwnerValidationResult> {
  if (!input.bearerUserId?.trim()) {
    return { ok: false, status: 401, code: "auth_required", message: "Authentication required for Bienes Raíces FSBO renewal." };
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
    .select("id, owner_id, category, seller_type, status, is_published, published_at, expires_at, leonix_ad_id, listing_json")
    .eq("id", listingId)
    .maybeSingle();
  if (error || !data?.id) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Bienes Raíces FSBO listing not found." };
  }
  if (String(data.owner_id ?? "").trim() !== input.bearerUserId.trim()) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to the authenticated user." };
  }
  const category = String(data.category ?? "").trim().toLowerCase();
  const sellerType = String(data.seller_type ?? "").trim().toLowerCase();
  const brPublish =
    data.listing_json && typeof data.listing_json === "object"
      ? (data.listing_json as { br_publish?: { lane?: string } }).br_publish
      : null;
  if (category !== "bienes-raices" || sellerType !== "personal" || brPublish?.lane !== "privado") {
    return { ok: false, status: 422, code: "wrong_lane", message: "Renewal applies only to Bienes Raíces FSBO listings." };
  }

  const lifecycle = resolveListingLifecycle(
    {
      category: "bienes-raices",
      packageKey: BR_FSBO_LIFECYCLE_PACKAGE_KEY,
      status: String(data.status ?? ""),
      isPublished: data.is_published ?? null,
      publishedAt: data.published_at ?? null,
      expiresAt: data.expires_at ?? null,
    },
    BR_FSBO_LISTING_LIFECYCLE_CONFIG,
  );
  if (!lifecycle.isRenewalEligible) {
    return {
      ok: false,
      status: 422,
      code: lifecycle.lifecycleState === "suspended" ? "renewal_suspended" : "renewal_not_eligible",
      message: "This Bienes Raíces FSBO listing is not eligible for renewal yet.",
    };
  }

  return {
    ok: true,
    ownerUserId: String(data.owner_id ?? "").trim() || null,
    currentExpiresAt: typeof data.expires_at === "string" ? data.expires_at : null,
    leonixAdId: typeof data.leonix_ad_id === "string" ? data.leonix_ad_id : null,
  };
}
