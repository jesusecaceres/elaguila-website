import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { isPaymentCleared } from "@/app/lib/listingPlans/paymentTracking";
import type { LeonixPaymentRecordRow } from "@/app/lib/listingPlans/revenuePaymentRecords";

import {
  getOfertaLocalCommercialProductForOfferType,
  ofertaLocalCommercialProductMatchesOfferType,
  type OfertaLocalCommercialProduct,
} from "./ofertasLocalesCommercial";
import { OFERTAS_LOCALES_PUBLIC_TERM_DAYS } from "./ofertasLocalesConstants";
import {
  getOfertaLocalPublicTermDaysRemaining,
  isOfertaLocalPublicTermActive,
  isOfertaLocalPublicTermExpired,
} from "./ofertasLocalesFormatting";
import { validateOfertaLocalPartnerCourtesyEligibility } from "./ofertasLocalesPartnerOperations";

export const OFERTAS_RENEWAL_ELIGIBLE_DAYS_REMAINING = 14;
export const OFERTAS_RENEWAL_ABANDONED_AFTER_DAYS = 7;

export type OfertaLocalRenewalState =
  | "draft"
  | "awaiting_payment"
  | "payment_pending"
  | "authorized"
  | "preparing_content"
  | "scan_pending"
  | "review_required"
  | "ready_to_submit"
  | "pending_review"
  | "correction_required"
  | "approved_scheduled"
  | "active"
  | "expired"
  | "cancelled"
  | "failed";

export type OfertaLocalRenewalEligibilityCode =
  | "eligible_paid"
  | "eligible_partner_courtesy"
  | "already_authorized"
  | "renewal_in_progress"
  | "not_yet_eligible"
  | "blocked_missing_identity"
  | "blocked_ownership"
  | "blocked_status"
  | "blocked_product"
  | "blocked_source"
  | "blocked_admin_action";

export type OfertaLocalRenewalParentRow = {
  id: string;
  owner_id: string;
  status: string;
  offer_type: string;
  leonix_ad_id: string | null;
  published_at?: string | null;
  expires_at?: string | null;
  commercial_product_key: string | null;
  active_source_asset_id?: string | null;
  public_source_asset_id?: string | null;
  asset_lifecycle_status?: string | null;
  asset_replacement_required_review?: boolean | null;
};

export type OfertaLocalRenewalAttemptRow = {
  id: string;
  oferta_local_id: string;
  owner_id: string;
  leonix_ad_id: string;
  product_key: string;
  state: OfertaLocalRenewalState;
  commercial_path: "paid" | "partner_courtesy";
  payment_record_id: string | null;
  package_entitlement_id: string | null;
  partner_assignment_id: string | null;
  source_asset_version_id: string | null;
  scheduled_activation_at: string | null;
  activated_at: string | null;
  expires_at: string | null;
  failure_reason: string | null;
  retry_count: number;
  updated_at: string;
};

const OPEN_RENEWAL_STATES: readonly OfertaLocalRenewalState[] = [
  "draft",
  "awaiting_payment",
  "payment_pending",
  "authorized",
  "preparing_content",
  "scan_pending",
  "review_required",
  "ready_to_submit",
  "pending_review",
  "correction_required",
  "approved_scheduled",
];

const AUTHORIZED_RENEWAL_STATES: readonly OfertaLocalRenewalState[] = [
  "authorized",
  "preparing_content",
  "scan_pending",
  "review_required",
  "ready_to_submit",
  "pending_review",
  "correction_required",
  "approved_scheduled",
];

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
export function calculateOfertaLocalRenewalActivationWindow(input: {
  approvalTime: Date;
  currentExpiresAt?: string | null;
}): { startsAt: string; expiresAt: string } {
  const currentExpires = input.currentExpiresAt ? new Date(input.currentExpiresAt) : null;
  const currentMs = currentExpires && Number.isFinite(currentExpires.getTime()) ? currentExpires.getTime() : 0;
  const startMs = Math.max(input.approvalTime.getTime(), currentMs);
  const starts = new Date(startMs);
  return {
    startsAt: starts.toISOString(),
    expiresAt: addDays(starts, OFERTAS_LOCALES_PUBLIC_TERM_DAYS).toISOString(),
  };
}
export function paymentRecordIsOfertaLocalRenewal(metadata: Record<string, unknown> | null | undefined): boolean {
  return String(metadata?.operation ?? "").trim() === "renew_listing" &&
    String(metadata?.renewal_attempt_id ?? "").trim().length > 0;
}

export function buildOfertaLocalRenewalCheckoutMetadata(input: {
  renewalAttemptId: string;
  currentExpiresAt?: string | null;
}): Record<string, string> {
  return {
    operation: "renew_listing",
    renewal_attempt_id: input.renewalAttemptId,
    ...(input.currentExpiresAt ? { current_expires_at: input.currentExpiresAt } : {}),
    public_term_starts_on: "admin_renewal_approval",
  };
}

export async function loadOpenOfertaLocalRenewalAttempt(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  productKey: string;
}): Promise<OfertaLocalRenewalAttemptRow | null> {
  const { data } = await input.supabase
    .from("ofertas_local_renewal_attempts")
    .select(
      "id, oferta_local_id, owner_id, leonix_ad_id, product_key, state, commercial_path, payment_record_id, package_entitlement_id, partner_assignment_id, source_asset_version_id, scheduled_activation_at, activated_at, expires_at, failure_reason, retry_count, updated_at"
    )
    .eq("oferta_local_id", input.ofertaLocalId)
    .eq("product_key", input.productKey)
    .in("state", OPEN_RENEWAL_STATES as string[])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as OfertaLocalRenewalAttemptRow | null) ?? null;
}

export async function resolveOfertaLocalRenewalEligibility(input: {
  supabase: SupabaseClient;
  parent: OfertaLocalRenewalParentRow;
  ownerId: string;
  now?: Date;
}): Promise<{
  code: OfertaLocalRenewalEligibilityCode;
  product: OfertaLocalCommercialProduct | null;
  daysRemaining: number | null;
  openAttempt: OfertaLocalRenewalAttemptRow | null;
  message: string;
}> {
  const now = input.now ?? new Date();
  if (input.parent.owner_id !== input.ownerId) {
    return { code: "blocked_ownership", product: null, daysRemaining: null, openAttempt: null, message: "Owner mismatch." };
  }
  if (!/^LNX-[A-Z0-9]{8}$/.test(String(input.parent.leonix_ad_id ?? ""))) {
    return { code: "blocked_missing_identity", product: null, daysRemaining: null, openAttempt: null, message: "Leonix ID is required." };
  }

  const product = getOfertaLocalCommercialProductForOfferType(input.parent.offer_type);
  if (!product || !ofertaLocalCommercialProductMatchesOfferType({ packageKey: product.packageKey, offerType: input.parent.offer_type })) {
    return { code: "blocked_product", product: null, daysRemaining: null, openAttempt: null, message: "Unsupported renewal product." };
  }

  if (input.parent.asset_replacement_required_review || input.parent.asset_lifecycle_status === "replacement_pending") {
    return { code: "blocked_source", product, daysRemaining: null, openAttempt: null, message: "Finish source replacement review first." };
  }

  const openAttempt = await loadOpenOfertaLocalRenewalAttempt({
    supabase: input.supabase,
    ofertaLocalId: input.parent.id,
    productKey: product.packageKey,
  });
  if (openAttempt && AUTHORIZED_RENEWAL_STATES.includes(openAttempt.state)) {
    return { code: "already_authorized", product, daysRemaining: null, openAttempt, message: "Renewal is already authorized." };
  }
  if (openAttempt) {
    return { code: "renewal_in_progress", product, daysRemaining: null, openAttempt, message: "Renewal is already in progress." };
  }

  const status = String(input.parent.status ?? "").toLowerCase();
  if (!["approved", "rejected", "archived", "pending_review", "submitted"].includes(status)) {
    return { code: "blocked_status", product, daysRemaining: null, openAttempt: null, message: "Listing state is not renewal eligible." };
  }

  // A listing that has never completed a first publication has nothing to renew —
  // without this guard, a pending_review/submitted listing with no published_at
  // falls through the active/expired checks below (both false) straight to
  // eligible_paid, showing renewal controls before the first publication exists.
  if (!input.parent.published_at) {
    return { code: "blocked_status", product, daysRemaining: null, openAttempt: null, message: "This listing has not completed its first publication yet." };
  }

  const active = isOfertaLocalPublicTermActive(input.parent.published_at, input.parent.expires_at, now);
  const expired = isOfertaLocalPublicTermExpired(input.parent.expires_at, now);
  const daysRemaining = getOfertaLocalPublicTermDaysRemaining(input.parent.expires_at, now);
  if (active && (daysRemaining == null || daysRemaining > OFERTAS_RENEWAL_ELIGIBLE_DAYS_REMAINING)) {
    return { code: "not_yet_eligible", product, daysRemaining, openAttempt: null, message: "Renewal opens 14 days before expiration." };
  }

  const courtesy = await validateOfertaLocalPartnerCourtesyEligibility({
    supabase: input.supabase,
    parent: {
      id: input.parent.id,
      owner_id: input.parent.owner_id,
      offer_type: input.parent.offer_type,
      leonix_ad_id: input.parent.leonix_ad_id,
    },
    ownerId: input.ownerId,
    now,
  });

  return {
    code: courtesy.ok ? "eligible_partner_courtesy" : "eligible_paid",
    product,
    daysRemaining: active ? daysRemaining : expired ? 0 : null,
    openAttempt: null,
    message: courtesy.ok ? "Partner courtesy can authorize renewal." : "Paid renewal is available.",
  };
}

export async function createOfertaLocalRenewalAttempt(input: {
  supabase: SupabaseClient;
  parent: OfertaLocalRenewalParentRow;
  ownerId: string;
  sourceAssetVersionId?: string | null;
  commercialPath?: "paid" | "partner_courtesy";
  partnerAssignmentId?: string | null;
}): Promise<{ ok: true; attempt: OfertaLocalRenewalAttemptRow } | { ok: false; error: string; status: number }> {
  const eligibility = await resolveOfertaLocalRenewalEligibility({
    supabase: input.supabase,
    parent: input.parent,
    ownerId: input.ownerId,
  });
  if (!eligibility.product) return { ok: false, error: eligibility.code, status: 422 };
  if (!["eligible_paid", "eligible_partner_courtesy", "renewal_in_progress"].includes(eligibility.code)) {
    return { ok: false, error: eligibility.code, status: 409 };
  }
  if (eligibility.openAttempt) return { ok: true, attempt: eligibility.openAttempt };

  const now = new Date().toISOString();
  const { data, error } = await input.supabase
    .from("ofertas_local_renewal_attempts")
    .insert({
      oferta_local_id: input.parent.id,
      owner_id: input.ownerId,
      leonix_ad_id: input.parent.leonix_ad_id,
      product_key: eligibility.product.packageKey,
      source_asset_version_id:
        input.sourceAssetVersionId || input.parent.public_source_asset_id || input.parent.active_source_asset_id || null,
      state: input.commercialPath === "partner_courtesy" ? "authorized" : "awaiting_payment",
      commercial_path: input.commercialPath ?? (eligibility.code === "eligible_partner_courtesy" ? "partner_courtesy" : "paid"),
      partner_assignment_id: input.partnerAssignmentId ?? null,
      requested_at: now,
      paid_or_authorized_at: input.commercialPath === "partner_courtesy" ? now : null,
      updated_at: now,
    })
    .select(
      "id, oferta_local_id, owner_id, leonix_ad_id, product_key, state, commercial_path, payment_record_id, package_entitlement_id, partner_assignment_id, source_asset_version_id, scheduled_activation_at, activated_at, expires_at, failure_reason, retry_count, updated_at"
    )
    .single();

  if (error || !data) return { ok: false, error: "renewal_attempt_insert_failed", status: 500 };
  return { ok: true, attempt: data as OfertaLocalRenewalAttemptRow };
}

export async function markOfertaLocalRenewalPaymentAuthorized(input: {
  supabase: SupabaseClient;
  paymentRecord: LeonixPaymentRecordRow;
  packageEntitlementId?: string | null;
}): Promise<{ ok: true; renewalAttemptId: string } | { ok: false; code: string; message: string }> {
  const renewalAttemptId = String(input.paymentRecord.metadata?.renewal_attempt_id ?? "").trim();
  if (!renewalAttemptId) return { ok: false, code: "renewal_attempt_missing", message: "Payment record is missing renewal attempt." };
  if (!isPaymentCleared(input.paymentRecord.payment_status)) {
    return { ok: false, code: "payment_not_cleared", message: "Renewal payment is not cleared." };
  }
  const now = new Date().toISOString();
  const { data, error } = await input.supabase
    .from("ofertas_local_renewal_attempts")
    .update({
      state: "authorized",
      payment_record_id: input.paymentRecord.id,
      package_entitlement_id: input.packageEntitlementId ?? input.paymentRecord.package_entitlement_id ?? null,
      paid_or_authorized_at: now,
      updated_at: now,
    })
    .eq("id", renewalAttemptId)
    .eq("oferta_local_id", input.paymentRecord.listing_id)
    .in("state", ["awaiting_payment", "payment_pending", "authorized"])
    .select("id")
    .maybeSingle();
  if (error || !data?.id) return { ok: false, code: "renewal_authorization_failed", message: "Renewal attempt could not be authorized." };
  return { ok: true, renewalAttemptId };
}
