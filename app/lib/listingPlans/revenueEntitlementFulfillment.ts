/**
 * Revenue OS package + placement entitlement activation — server-only.
 * Gate STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01
 *
 * Package C Build 3 (C5/C6), Coach Correction 1 — split into two primitives so package access
 * can never be conflated with payment-derived placement or false Stripe/webhook provenance:
 *   - activatePackageEntitlement(...) writes ONLY listing_package_entitlements. Never touches
 *     placement. metadata.source is a truthful caller-supplied descriptor, never a hardcoded
 *     "stripe_webhook" string.
 *   - activatePlacementForRealPayment(...) is the extracted placement-insert logic, called only
 *     when a real payment occurred. placement_source is an explicit parameter.
 *   - activateEntitlementsForPayment(...) is kept — SAME name, SAME signature — as a thin
 *     backward-compatible wrapper. The webhook route and manualClearedPayments.ts require ZERO
 *     call-site changes.
 * complimentaryGrants.ts (comp/partner) calls activatePackageEntitlement() directly and NEVER
 * calls activateEntitlementsForPayment or activatePlacementForRealPayment — comp/partner grants
 * create zero rows in leonix_placement_entitlements and zero rows in leonix_payment_records.
 */

import "server-only";
import { randomBytes } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  normalizePlacementTier,
  type PlacementTier,
} from "./placementEntitlements";
import { computeEndsAt } from "./subscriptionLifecyclePolicy";
import { writePlacementEntitlement } from "./placementEntitlementWriter";

export { computeEndsAt };

export type PaymentRecordRow = {
  id: string;
  category: string;
  package_key: string | null;
  listing_id: string | null;
  owner_user_id: string | null;
  leonix_ad_id: string | null;
  billing_mode: string | null;
  placement_tier: string | null;
  promo_code_id: string | null;
  promo_redemption_id: string | null;
  package_entitlement_id: string | null;
  placement_entitlement_id: string | null;
  stripe_checkout_session_id: string | null;
  metadata: Record<string, unknown> | null;
};

const CHECKOUT_SAFE_PLACEMENT_TIERS = new Set<PlacementTier>([
  "paid_private",
  "website_business",
  "affiliate",
]);

function generateEntitlementCode(): string {
  return `LX-REV-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export function resolveCheckoutPlacementTier(
  packageDef: RevenuePackageDefinition,
): PlacementTier | null {
  if (!packageDef.placementEligible) return null;

  if (packageDef.placementTierKey) {
    const tier = normalizePlacementTier(packageDef.placementTierKey);
    if (tier === "unknown" || tier === "free") return null;
    if (tier === "partner_premium" || tier.startsWith("print_")) return null;
    if (!CHECKOUT_SAFE_PLACEMENT_TIERS.has(tier)) return null;
    return tier;
  }

  if (packageDef.billingMode === "monthly_subscription") return "website_business";
  if (packageDef.billingMode === "one_time") return "paid_private";
  return null;
}

function resolvePlacementSurfaces(tier: PlacementTier): string[] {
  if (tier === "website_business") {
    return ["home", "clasificados", "negocios", "category_landing", "category_results"];
  }
  return ["clasificados", "category_landing", "category_results"];
}

/** Locked 7-calendar-day failed-payment grace (Package C Build 1). */
const SUBSCRIPTION_ENDS_AT_GRACE_BACKSTOP_DAYS = 7;

export type EntitlementFulfillmentResult = {
  ok: boolean;
  idempotent?: boolean;
  packageEntitlementId?: string | null;
  placementEntitlementId?: string | null;
  packageEntitlementEndsAt?: string | null;
  code?: string;
  message?: string;
};

export type PackageGrantSource =
  | "stripe_webhook"
  | "admin_manual"
  | "print_included"
  | "comp"
  | "partner"
  | "manual_cleared_payment";

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PART A — activatePackageEntitlement: writes ONLY listing_package_entitlements.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type ActivatePackageEntitlementInput = {
  packageDef: RevenuePackageDefinition;
  category: string;
  listingId: string;
  grantSource: PackageGrantSource;
  startsAt: Date;
  endsAt: Date;
  /** Truthful audit label for metadata.source — e.g. "stripe:<eventId>", "manual:<paymentRecordId>",
   * "comp:<adminUserId>:<ts>". Never hardcoded to "stripe_webhook" regardless of caller. */
  sourceDescriptor: string;
  /** True when endsAt was derived from a real Stripe period end (vs the fallback duration). */
  endsAtFromRealPeriod?: boolean;
  /** Linkage — all optional/nullable; a comp/partner grant passes none of these. */
  paymentRecordId?: string | null;
  existingPackageEntitlementId?: string | null;
  promoCodeId?: string | null;
  promoRedemptionId?: string | null;
  subscriptionRecordId?: string | null;
  /** Non-payment provenance (comp/partner/admin_manual/print_included). */
  actorAdminUserId?: string | null;
  reason?: string | null;
  customerName?: string | null;
  businessName?: string | null;
};

export async function activatePackageEntitlement(
  input: ActivatePackageEntitlementInput,
): Promise<EntitlementFulfillmentResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const supabase = getAdminSupabase();
  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return { ok: false, code: "listing_id_missing", message: "listingId is required." };
  }

  // Fast-path idempotency (payment-linked callers only — comp/partner have no payment record and
  // skip straight to the atomic insert; the M4 live-uniqueness index is the real correctness
  // boundary either way, never this pre-check).
  const existingId = input.existingPackageEntitlementId ?? null;
  if (existingId) {
    const { data: existing } = await supabase
      .from("listing_package_entitlements")
      .select("id, status, payment_record_id")
      .eq("id", existingId)
      .maybeSingle();
    if (
      existing?.status === "active" &&
      (!input.paymentRecordId || existing.payment_record_id === input.paymentRecordId)
    ) {
      return { ok: true, idempotent: true, packageEntitlementId: existingId };
    }
  }
  if (input.paymentRecordId) {
    const { data: byPayment } = await supabase
      .from("listing_package_entitlements")
      .select("id, status")
      .eq("payment_record_id", input.paymentRecordId)
      .maybeSingle();
    if (byPayment?.id && byPayment.status === "active") {
      return { ok: true, idempotent: true, packageEntitlementId: byPayment.id as string };
    }
  }

  const { data: pkgInsert, error: pkgError } = await supabase
    .from("listing_package_entitlements")
    .insert({
      category: input.category,
      listing_source: input.category,
      listing_id: listingId,
      package_tier: "digital_only",
      entitlement_code: generateEntitlementCode(),
      starts_at: input.startsAt.toISOString(),
      ends_at: input.endsAt.toISOString(),
      status: "active",
      package_key: input.packageDef.packageKey,
      billing_mode: input.packageDef.billingMode,
      payment_record_id: input.paymentRecordId ?? null,
      promo_code_id: input.promoCodeId ?? null,
      promo_redemption_id: input.promoRedemptionId ?? null,
      grant_source: input.grantSource,
      created_by: input.actorAdminUserId ?? null,
      customer_name: input.customerName ?? null,
      business_name: input.businessName ?? null,
      notes: input.reason ?? null,
      ...(input.subscriptionRecordId ? { subscription_record_id: input.subscriptionRecordId } : {}),
      metadata: {
        source: input.sourceDescriptor,
        gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
        ...(input.endsAtFromRealPeriod
          ? { ends_at_source: "stripe_period_end_plus_grace" }
          : input.packageDef.billingMode === "monthly_subscription"
            ? { ends_at_source: "fallback_30d" }
            : {}),
        ...(input.packageDef.billingMode === "monthly_subscription"
          ? { subscription_active: true }
          : {}),
      },
      benefits: {},
      placement_scope: [],
    })
    .select("id")
    .single();

  if (pkgError || !pkgInsert?.id) {
    // Package C Build 1 — the M4 live-uniqueness index turns a concurrent duplicate insert into
    // 23505. Effectively-once: re-select the live row and return idempotent rather than failing.
    // This is the ACTUAL durable idempotency boundary for every grant source, comp/partner
    // included — never the pre-check SELECTs above, which are fast-path optimizations only.
    if (pkgError?.code === "23505") {
      const { data: liveRow } = await supabase
        .from("listing_package_entitlements")
        .select("id")
        .eq("listing_source", input.category)
        .eq("listing_id", listingId)
        .eq("package_key", input.packageDef.packageKey)
        .in("status", ["active", "scheduled"])
        .maybeSingle();
      if (liveRow?.id) {
        return { ok: true, idempotent: true, packageEntitlementId: liveRow.id as string };
      }
    }
    return {
      ok: false,
      code: "package_entitlement_insert_failed",
      message: pkgError?.message ?? "Failed to create package entitlement.",
    };
  }

  return { ok: true, packageEntitlementId: pkgInsert.id as string };
}

/** Conditional CAS revoke — never deletes. A retry after the first successful revoke affects
 * zero rows and is detected/returned as idempotent, matching the CAS idiom already used
 * throughout Build 1 (subscription-suspension restore, manual-payment state transitions). */
export async function revokePackageEntitlement(input: {
  packageEntitlementId: string;
  revokedBy?: string | null;
  reason?: string | null;
}): Promise<{ ok: boolean; idempotent?: boolean; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const supabase = getAdminSupabase();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("listing_package_entitlements")
    .update({ status: "revoked", revoked_at: now, revoked_by: input.revokedBy ?? null, updated_at: now })
    .eq("id", input.packageEntitlementId)
    .in("status", ["active", "scheduled"])
    .select("id");
  if (error) return { ok: false, code: "revoke_failed", message: error.message };
  if (data?.length) return { ok: true };

  const { data: row } = await supabase
    .from("listing_package_entitlements")
    .select("status")
    .eq("id", input.packageEntitlementId)
    .maybeSingle();
  if (row?.status === "revoked") return { ok: true, idempotent: true };
  return { ok: false, code: "not_active_or_scheduled", message: `Entitlement was not active/scheduled (status=${row?.status ?? "unknown"}).` };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PART B — activatePlacementForRealPayment: extracted placement logic, real payments only.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export type ActivatePlacementForRealPaymentInput = {
  packageDef: RevenuePackageDefinition;
  listingId: string;
  ownerUserId: string | null;
  leonixAdId: string | null;
  promoCodeId?: string | null;
  paymentRecordId: string;
  stripeEventId: string;
  stripeEventType: string;
  stripeCheckoutSessionId: string;
  startsAt: Date;
  endsAt: Date;
  /** leonix_placement_entitlements_source_chk only permits: stripe_paid | included_with_print |
   * promo_code | admin_comp | affiliate | free | manual_contract. "manual_cleared_payment" is
   * NOT a valid value (would violate the CHECK constraint) — the wrapper intentionally always
   * passes "stripe_paid" for both real-payment grant sources; see Part C for why. */
  placementSource: "stripe_paid" | "included_with_print" | "promo_code" | "admin_comp" | "affiliate" | "free" | "manual_contract";
  existingPlacementEntitlementId?: string | null;
};

export async function activatePlacementForRealPayment(
  input: ActivatePlacementForRealPaymentInput,
): Promise<{ ok: boolean; placementEntitlementId?: string | null; code?: string; message?: string }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const listingId = String(input.listingId ?? "").trim();
  const placementTier = resolveCheckoutPlacementTier(input.packageDef);
  if (!placementTier) return { ok: true, placementEntitlementId: input.existingPlacementEntitlementId ?? null };
  if (input.existingPlacementEntitlementId) {
    return { ok: true, placementEntitlementId: input.existingPlacementEntitlementId };
  }

  // Package D Build D2, Gate 9 — routed through the canonical writer (natural-key idempotency on
  // stripe_payment_record_id lives inside the writer now; behavior/shape unchanged from before).
  const written = await writePlacementEntitlement({
    listingId,
    ownerUserId: input.ownerUserId,
    leonixAdId: input.leonixAdId,
    category: input.packageDef.category,
    placementTier,
    placementSource: input.placementSource,
    surfaces: resolvePlacementSurfaces(placementTier),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: "active",
    stripePaymentRecordId: input.paymentRecordId,
    promoCodeId: input.promoCodeId ?? null,
    metadata: {
      source: input.placementSource,
      stripe_event_id: input.stripeEventId,
      stripe_event_type: input.stripeEventType,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      package_key: input.packageDef.packageKey,
    },
  });

  if (!written.ok) {
    return { ok: false, code: written.code, message: written.message };
  }
  return { ok: true, placementEntitlementId: written.placementEntitlementId };
}

// ─────────────────────────────────────────────────────────────────────────────────────────────
// PART C — activateEntitlementsForPayment: backward-compatible wrapper. SAME name, SAME
// signature as before this refactor — the webhook route and manualClearedPayments.ts require
// ZERO call-site changes.
// ─────────────────────────────────────────────────────────────────────────────────────────────

export async function activateEntitlementsForPayment(input: {
  paymentRecord: PaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeEventType: string;
  stripeCheckoutSessionId: string;
  /** Real Stripe subscription period end (post-Basil: from subscription items). */
  realPeriodEnd?: Date | null;
  /** Package C Build 1 — grant provenance (defaults to stripe_webhook). */
  grantSource?: PackageGrantSource;
  /** Link to the canonical subscription record when subscription-mode. */
  subscriptionRecordId?: string | null;
}): Promise<EntitlementFulfillmentResult & { placementEntitlementId?: string | null }> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }
  const listingId = String(input.paymentRecord.listing_id ?? "").trim();
  if (!listingId) {
    return { ok: false, code: "listing_id_missing", message: "Payment record missing listing_id." };
  }

  const grantSource = input.grantSource ?? "stripe_webhook";
  const startsAt = new Date();
  const endsAt = computeEndsAt(startsAt, input.packageDef, input.realPeriodEnd ?? null);

  const entResult = await activatePackageEntitlement({
    packageDef: input.packageDef,
    category: input.packageDef.category,
    listingId,
    grantSource,
    startsAt,
    endsAt,
    endsAtFromRealPeriod: Boolean(input.realPeriodEnd),
    sourceDescriptor:
      grantSource === "manual_cleared_payment"
        ? `manual:${input.paymentRecord.id}`
        : `stripe:${input.stripeEventId}`,
    paymentRecordId: input.paymentRecord.id,
    existingPackageEntitlementId: input.paymentRecord.package_entitlement_id ?? null,
    promoCodeId: input.paymentRecord.promo_code_id,
    promoRedemptionId: input.paymentRecord.promo_redemption_id,
    subscriptionRecordId: input.subscriptionRecordId,
  });

  if (!entResult.ok) return entResult;

  // Placement only for a real payment (Stripe webhook or a real, non-Stripe cleared payment) —
  // comp/partner/print/generic admin_manual never reach this branch via this wrapper (and
  // complimentaryGrants.ts never calls this wrapper at all).
  let placementEntitlementId = input.paymentRecord.placement_entitlement_id ?? null;
  const isRealPayment = grantSource === "stripe_webhook" || grantSource === "manual_cleared_payment";
  if (isRealPayment && entResult.ok) {
    const placementResult = await activatePlacementForRealPayment({
      packageDef: input.packageDef,
      listingId,
      ownerUserId: input.paymentRecord.owner_user_id,
      leonixAdId: input.paymentRecord.leonix_ad_id,
      promoCodeId: input.paymentRecord.promo_code_id,
      paymentRecordId: input.paymentRecord.id,
      stripeEventId: input.stripeEventId,
      stripeEventType: input.stripeEventType,
      stripeCheckoutSessionId: input.stripeCheckoutSessionId,
      startsAt,
      endsAt,
      // NOTE: pre-refactor behavior hardcoded "stripe_paid" for BOTH stripe_webhook and
      // manual_cleared_payment (a real mislabel for the latter — flagged during C5/C6 planning).
      // Preserved as-is here rather than relabeled: leonix_placement_entitlements.placement_source
      // is not confirmed CHECK-constrained at implementation time, and correcting a label on an
      // unrelated (already-shipped, real-payment) code path is out of C5/C6's required scope —
      // see plan Stop Conditions. Revisit in a dedicated follow-up if desired.
      placementSource: "stripe_paid",
      existingPlacementEntitlementId: entResult.idempotent ? placementEntitlementId : null,
    });
    if (!placementResult.ok) {
      return { ok: false, code: placementResult.code, message: placementResult.message, packageEntitlementId: entResult.packageEntitlementId };
    }
    placementEntitlementId = placementResult.placementEntitlementId ?? placementEntitlementId;
  }

  if (!entResult.idempotent) {
    const supabase = getAdminSupabase();
    await supabase
      .from("leonix_payment_records")
      .update({
        package_entitlement_id: entResult.packageEntitlementId,
        placement_entitlement_id: placementEntitlementId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.paymentRecord.id);
  }

  return {
    ok: true,
    idempotent: entResult.idempotent,
    packageEntitlementId: entResult.packageEntitlementId,
    placementEntitlementId,
    packageEntitlementEndsAt: endsAt.toISOString(),
  };
}

/**
 * Package C Build 1 (C3) — invoice.paid extension: advance the SAME entitlement row to the new
 * real period end (+7d grace backstop). Never inserts a duplicate; revives expired rows that
 * lapsed past the backstop during slow recovery; never auto-revives `revoked` (admin-terminal).
 * Renewal history lives on per-invoice payment records — the entitlement carries only a small
 * last_extended pointer so metadata stays bounded.
 */
export async function extendEntitlementForInvoicePaid(input: {
  packageEntitlementId: string | null;
  listingSource?: string | null;
  listingId?: string | null;
  packageKey?: string | null;
  newPeriodEnd: Date;
  stripeInvoiceId: string;
  stripeEventId: string;
}): Promise<{ ok: boolean; entitlementId?: string | null; revived?: boolean; code?: string }> {
  if (!isSupabaseAdminConfigured()) return { ok: false, code: "supabase_not_configured" };
  const supabase = getAdminSupabase();

  const newEndsAt = new Date(input.newPeriodEnd);
  newEndsAt.setUTCDate(newEndsAt.getUTCDate() + SUBSCRIPTION_ENDS_AT_GRACE_BACKSTOP_DAYS);

  let targetId = String(input.packageEntitlementId ?? "").trim() || null;
  if (!targetId && input.listingSource && input.listingId && input.packageKey) {
    // Legacy-pointer fallback via the M4 unique key; the caller heals the pointer afterward.
    const { data } = await supabase
      .from("listing_package_entitlements")
      .select("id")
      .eq("listing_source", input.listingSource)
      .eq("listing_id", input.listingId)
      .eq("package_key", input.packageKey)
      .in("status", ["active", "scheduled", "expired"])
      .order("ends_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    targetId = (data?.id as string | undefined) ?? null;
  }
  if (!targetId) return { ok: false, code: "entitlement_not_found" };

  const { data: current } = await supabase
    .from("listing_package_entitlements")
    .select("id, status, metadata")
    .eq("id", targetId)
    .maybeSingle();
  if (!current) return { ok: false, code: "entitlement_not_found" };
  if (String(current.status) === "revoked") {
    // Admin-terminal — surfaced, never auto-revived.
    return { ok: false, code: "entitlement_revoked_requires_admin" };
  }

  const meta = (current.metadata ?? {}) as Record<string, unknown>;
  const lastExtended = meta.last_extended as { invoice_id?: string } | undefined;
  if (lastExtended?.invoice_id === input.stripeInvoiceId) {
    return { ok: true, entitlementId: targetId }; // replay-idempotent
  }

  const revived = String(current.status) === "expired";
  const { error } = await supabase
    .from("listing_package_entitlements")
    .update({
      status: "active",
      ends_at: newEndsAt.toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...meta,
        ends_at_source: "stripe_period_end_plus_grace",
        last_extended: {
          invoice_id: input.stripeInvoiceId,
          stripe_event_id: input.stripeEventId,
          period_end: input.newPeriodEnd.toISOString(),
          at: new Date().toISOString(),
        },
      },
    })
    .eq("id", targetId);
  if (error) return { ok: false, code: "extension_failed" };
  return { ok: true, entitlementId: targetId, revived };
}
