import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isPaymentCleared } from "@/app/lib/listingPlans/paymentTracking";
import type { LeonixPaymentRecordRow } from "@/app/lib/listingPlans/revenuePaymentRecords";

import {
  getOfertaLocalCommercialProductByPackageKey,
  getOfertaLocalCommercialProductForOfferType,
  ofertaLocalCommercialProductMatchesOfferType,
  type OfertaLocalCommercialProduct,
} from "./ofertasLocalesCommercial";
import { ensureOfertaLocalLeonixAdId } from "./ofertasLocalesLeonixAdId";
import { validateOfertaLocalPartnerCourtesyEligibility } from "./ofertasLocalesPartnerOperations";
import {
  markOfertaLocalRenewalPaymentAuthorized,
  paymentRecordIsOfertaLocalRenewal,
  resolveOfertaLocalRenewalEligibility,
} from "./ofertasLocalesRenewals";

type SupabaseLike = { from: (table: string) => any };

const CHECKOUT_ELIGIBLE_STATUSES = new Set(["draft", "submitted", "pending_review", "rejected"]);

export type OfertaLocalCommercialParentRow = {
  id: string;
  owner_id: string;
  status: string;
  offer_type: string;
  leonix_ad_id: string | null;
  commercial_product_key: string | null;
  commercial_amount_cents: number | null;
  commercial_currency: string | null;
  commercial_duration_days: number | null;
  commercial_ai_included: boolean | null;
  payment_status: string | null;
  paid_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  payment_record_id: string | null;
  package_entitlement_id: string | null;
  entitlement_status: string | null;
  entitlement_granted_at: string | null;
  entitlement_ends_at: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  commercial_eligibility_source?: string | null;
  partner_assignment_id?: string | null;
};

export const OFERTAS_LOCALES_COMMERCIAL_PARENT_SELECT = [
  "id",
  "owner_id",
  "status",
  "offer_type",
  "leonix_ad_id",
  "commercial_product_key",
  "commercial_amount_cents",
  "commercial_currency",
  "commercial_duration_days",
  "commercial_ai_included",
  "payment_status",
  "paid_at",
  "stripe_checkout_session_id",
  "stripe_payment_intent_id",
  "payment_record_id",
  "package_entitlement_id",
  "entitlement_status",
  "entitlement_granted_at",
  "entitlement_ends_at",
  "published_at",
  "expires_at",
  "commercial_eligibility_source",
  "partner_assignment_id",
].join(", ");

export type OfertasCheckoutEligibilityResult =
  | {
      ok: true;
      parent: OfertaLocalCommercialParentRow;
      product: OfertaLocalCommercialProduct;
      leonixAdId: string;
      ownerUserId: string;
      currentExpiresAt: string | null;
    }
  | { ok: false; status: number; code: string; message: string };

async function hasActiveEquivalentEntitlement(input: {
  supabase: SupabaseLike;
  listingId: string;
  packageKey: string;
}): Promise<boolean> {
  const { data } = await input.supabase
    .from("listing_package_entitlements")
    .select("id, status, revoked_at, starts_at, ends_at, package_key")
    .eq("category", "ofertas-locales")
    .eq("listing_source", "ofertas-locales")
    .eq("listing_id", input.listingId)
    .eq("package_key", input.packageKey)
    .neq("status", "revoked")
    .is("revoked_at", null)
    .order("ends_at", { ascending: false })
    .limit(5);

  return Array.isArray(data) && data.some((row) => String(row.status ?? "").toLowerCase() === "active");
}

export async function validateOfertasLocalesCheckoutOwnership(input: {
  supabase: SupabaseLike;
  listingId: string;
  bearerUserId: string | null;
  packageKey: string;
  operation?: "renew_listing" | null;
}): Promise<OfertasCheckoutEligibilityResult> {
  const ownerId = input.bearerUserId?.trim();
  if (!ownerId) {
    return { ok: false, status: 401, code: "auth_required", message: "Authentication required." };
  }

  const listingId = input.listingId.trim();
  if (!listingId) {
    return { ok: false, status: 400, code: "listing_id_required", message: "Listing ID is required." };
  }

  const product = getOfertaLocalCommercialProductByPackageKey(input.packageKey);
  const isRenewal = input.operation === "renew_listing";
  if (!product) {
    return { ok: false, status: 400, code: "package_not_supported", message: "Unsupported Ofertas package." };
  }

  const { data, error } = await input.supabase
    .from("ofertas_locales")
    .select(OFERTAS_LOCALES_COMMERCIAL_PARENT_SELECT)
    .eq("id", listingId)
    .maybeSingle();

  if (error) {
    return { ok: false, status: 500, code: "listing_lookup_failed", message: error.message ?? "Listing lookup failed." };
  }
  if (!data?.id) {
    return { ok: false, status: 404, code: "listing_not_found", message: "Ofertas listing not found." };
  }

  const parent = data as OfertaLocalCommercialParentRow;
  if (parent.owner_id !== ownerId) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to this user." };
  }

  if (!isRenewal && !CHECKOUT_ELIGIBLE_STATUSES.has(String(parent.status ?? "").toLowerCase())) {
    return { ok: false, status: 409, code: "listing_not_checkout_eligible", message: "Listing is not eligible for checkout." };
  }

  if (!ofertaLocalCommercialProductMatchesOfferType({ packageKey: product.packageKey, offerType: parent.offer_type })) {
    return { ok: false, status: 422, code: "package_listing_mismatch", message: "Package does not match listing lane." };
  }

  const activeEquivalent = await hasActiveEquivalentEntitlement({
    supabase: input.supabase,
    listingId,
    packageKey: product.packageKey,
  });
  if (!isRenewal && (
    activeEquivalent ||
    (isPaymentCleared(parent.payment_status) && parent.entitlement_status === "active" && parent.package_entitlement_id)
  )) {
    return {
      ok: false,
      status: 409,
      code: "entitlement_already_active",
      message: "This listing already has an active paid entitlement.",
    };
  }

  const leonix = await ensureOfertaLocalLeonixAdId({ supabase: input.supabase, ofertaLocalId: listingId, ownerId });
  if (!leonix.ok) {
    return { ok: false, status: 500, code: leonix.code, message: leonix.message };
  }

  if (isRenewal) {
    const renewal = await resolveOfertaLocalRenewalEligibility({
      supabase: input.supabase as SupabaseClient,
      parent: { ...parent, leonix_ad_id: leonix.leonixAdId },
      ownerId,
    });
    if (!["eligible_paid", "eligible_partner_courtesy", "renewal_in_progress", "already_authorized"].includes(renewal.code)) {
      return {
        ok: false,
        status: renewal.code === "not_yet_eligible" ? 422 : 409,
        code: renewal.code,
        message: renewal.message,
      };
    }
  }

  return {
    ok: true,
    parent: { ...parent, leonix_ad_id: leonix.leonixAdId },
    product,
    leonixAdId: leonix.leonixAdId,
    ownerUserId: ownerId,
    currentExpiresAt: typeof parent["expires_at"] === "string" ? parent["expires_at"] : null,
  };
}

export async function markOfertaLocalCheckoutStarted(input: {
  supabase: SupabaseLike;
  listingId: string;
  ownerId: string;
  product: OfertaLocalCommercialProduct;
  leonixAdId: string;
  paymentRecordId: string;
  stripeCheckoutSessionId: string;
}): Promise<boolean> {
  const { error } = await input.supabase
    .from("ofertas_locales")
    .update({
      leonix_ad_id: input.leonixAdId,
      commercial_product_key: input.product.packageKey,
      commercial_amount_cents: input.product.amountCents,
      commercial_currency: input.product.currency,
      commercial_duration_days: input.product.durationDays,
      commercial_ai_included: input.product.aiIncluded,
      payment_status: "pending",
      payment_record_id: input.paymentRecordId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      entitlement_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.listingId)
    .eq("owner_id", input.ownerId);
  return !error;
}

export async function markOfertaLocalEntitlementFulfilled(input: {
  supabase: SupabaseLike;
  paymentRecord: LeonixPaymentRecordRow;
  product: OfertaLocalCommercialProduct;
  packageEntitlementId: string | null | undefined;
  entitlementEndsAt?: string | null;
}): Promise<{ ok: true; listingId: string } | { ok: false; code: string; message: string; listingId?: string | null }> {
  const listingId = String(input.paymentRecord.listing_id ?? "").trim();
  const ownerId = String(input.paymentRecord.owner_user_id ?? "").trim();
  if (!listingId || !ownerId) {
    return { ok: false, code: "listing_or_owner_missing", message: "Payment record missing listing or owner.", listingId };
  }

  const { data: row, error: lookupError } = await input.supabase
    .from("ofertas_locales")
    .select("id, owner_id, offer_type, status, published_at, expires_at")
    .eq("id", listingId)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, code: "listing_lookup_failed", message: lookupError.message ?? "Listing lookup failed.", listingId };
  }
  if (!row?.id) {
    return { ok: false, code: "listing_not_found", message: "Ofertas listing not found.", listingId };
  }
  if (String(row.owner_id ?? "") !== ownerId) {
    return { ok: false, code: "listing_owner_mismatch", message: "Payment owner does not own listing.", listingId };
  }
  if (!ofertaLocalCommercialProductMatchesOfferType({ packageKey: input.product.packageKey, offerType: row.offer_type })) {
    return { ok: false, code: "package_listing_mismatch", message: "Payment product does not match listing lane.", listingId };
  }

  if (paymentRecordIsOfertaLocalRenewal(input.paymentRecord.metadata)) {
    const renewal = await markOfertaLocalRenewalPaymentAuthorized({
      supabase: input.supabase as SupabaseClient,
      paymentRecord: input.paymentRecord,
      packageEntitlementId: input.packageEntitlementId,
    });
    if (!renewal.ok) {
      return { ok: false, code: renewal.code, message: renewal.message, listingId };
    }
    return { ok: true, listingId };
  }

  const { error } = await input.supabase
    .from("ofertas_locales")
    .update({
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      commercial_product_key: input.product.packageKey,
      commercial_amount_cents: input.paymentRecord.amount_total_cents ?? input.paymentRecord.amount_cents ?? input.product.amountCents,
      commercial_currency: input.paymentRecord.currency ?? input.product.currency,
      commercial_duration_days: input.product.durationDays,
      commercial_ai_included: input.product.aiIncluded,
      payment_status: "paid",
      paid_at: input.paymentRecord.paid_at ?? new Date().toISOString(),
      stripe_checkout_session_id: input.paymentRecord.stripe_checkout_session_id,
      stripe_payment_intent_id: input.paymentRecord.stripe_payment_intent_id,
      payment_record_id: input.paymentRecord.id,
      package_entitlement_id: input.packageEntitlementId ?? input.paymentRecord.package_entitlement_id,
      entitlement_status: "active",
      entitlement_granted_at: new Date().toISOString(),
      entitlement_ends_at: input.entitlementEndsAt ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", listingId)
    .eq("owner_id", ownerId);

  if (error) {
    return { ok: false, code: "ofertas_parent_update_failed", message: error.message ?? "Parent update failed.", listingId };
  }

  return { ok: true, listingId };
}

export type OfertaLocalSubmissionEntitlementResult =
  | {
      ok: true;
      source: "paid";
      product: OfertaLocalCommercialProduct;
      leonixAdId: string;
      paymentRecordId: string;
      packageEntitlementId: string;
    }
  | {
      ok: true;
      source: "partner_courtesy";
      product: OfertaLocalCommercialProduct;
      leonixAdId: string;
      partnerAssignmentId: string;
    }
  | {
      ok: true;
      source: "free";
      product: OfertaLocalCommercialProduct;
      leonixAdId: string;
    }
  | { ok: false; status: number; code: string; message: string };

export async function validateOfertaLocalSubmissionEntitlement(input: {
  supabase: SupabaseLike;
  parent: { id: string; owner_id: string; offer_type: string; leonix_ad_id?: string | null };
  ownerId: string;
}): Promise<OfertaLocalSubmissionEntitlementResult> {
  if (input.parent.owner_id !== input.ownerId) {
    return { ok: false, status: 403, code: "listing_owner_mismatch", message: "Listing does not belong to this user." };
  }

  // Re-derived from the persisted parent row's own offer_type — never a
  // client-supplied flag. weekly_flyer always resolves to the $399 flyer
  // product; only coupon/promotion offer_types can ever resolve to the free
  // coupon product, so the free path below is structurally unreachable for
  // the flyer lane regardless of any request body content.
  const product = getOfertaLocalCommercialProductForOfferType(input.parent.offer_type);
  if (!product) {
    return { ok: false, status: 422, code: "commercial_product_missing", message: "Listing has no valid commercial product." };
  }

  const leonixAdId = String(input.parent.leonix_ad_id ?? "").trim();
  if (!/^LNX-[A-Z0-9]{8}$/.test(leonixAdId)) {
    return { ok: false, status: 422, code: "leonix_ad_id_missing", message: "Listing must have a stable Leonix Ad ID before submission." };
  }

  // Cupones y Promociones is a free, manual-entry product by commercial
  // definition (amountCents === 0 on its catalog entry) — no Stripe, no
  // payment record, and no partner-courtesy assignment are required or
  // consulted for it. This can never apply to a paid product (flyer is
  // always $399 per its own catalog entry, checked above via `product`).
  if (product.amountCents === 0) {
    return { ok: true, source: "free", product, leonixAdId };
  }

  const { data: entitlements } = await input.supabase
    .from("listing_package_entitlements")
    .select("id, status, revoked_at, starts_at, ends_at, package_key, payment_record_id")
    .eq("category", "ofertas-locales")
    .eq("listing_source", "ofertas-locales")
    .eq("listing_id", input.parent.id)
    .eq("package_key", product.packageKey)
    .neq("status", "revoked")
    .is("revoked_at", null)
    .order("ends_at", { ascending: false })
    .limit(10);

  const activeEntitlement = Array.isArray(entitlements)
    ? entitlements.find((row) => String(row.status ?? "").toLowerCase() === "active" && !row.revoked_at)
    : null;
  if (!activeEntitlement?.id || !activeEntitlement.payment_record_id) {
    const courtesy = await validateOfertaLocalPartnerCourtesyEligibility({
      supabase: input.supabase,
      parent: input.parent,
      ownerId: input.ownerId,
    });
    if (courtesy.ok && courtesy.source === "partner_courtesy") {
      return {
        ok: true,
        source: "partner_courtesy",
        product: courtesy.product,
        leonixAdId,
        partnerAssignmentId: courtesy.assignment.id,
      };
    }
    return {
      ok: false,
      status: 402,
      code: "commercial_entitlement_required",
      message: "Paid entitlement or active verified partner courtesy is required before review submission.",
    };
  }

  const { data: payment } = await input.supabase
    .from("leonix_payment_records")
    .select("id, category, package_key, listing_id, owner_user_id, payment_status, amount_total_cents, currency")
    .eq("id", activeEntitlement.payment_record_id)
    .maybeSingle();

  if (
    !payment?.id ||
    payment.category !== "ofertas-locales" ||
    payment.package_key !== product.packageKey ||
    payment.listing_id !== input.parent.id ||
    payment.owner_user_id !== input.ownerId ||
    !isPaymentCleared(payment.payment_status) ||
    Number(payment.amount_total_cents ?? 0) !== product.amountCents ||
    String(payment.currency ?? "").toLowerCase() !== product.currency
  ) {
    return { ok: false, status: 402, code: "paid_entitlement_invalid", message: "Paid entitlement does not match this listing." };
  }

  return {
    ok: true,
    source: "paid",
    product,
    leonixAdId,
    paymentRecordId: String(payment.id),
    packageEntitlementId: String(activeEntitlement.id),
  };
}
