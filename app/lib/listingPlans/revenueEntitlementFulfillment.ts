/**
 * Revenue OS package + placement entitlement activation — server-only.
 * Gate STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01
 */

import "server-only";
import { randomBytes } from "node:crypto";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import type { RevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  normalizePlacementTier,
  type PlacementTier,
} from "./placementEntitlements";

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
export { computeEndsAt } from "./subscriptionLifecyclePolicy";
import { computeEndsAt } from "./subscriptionLifecyclePolicy";

export type EntitlementFulfillmentResult = {
  ok: boolean;
  idempotent?: boolean;
  packageEntitlementId?: string | null;
  placementEntitlementId?: string | null;
  code?: string;
  message?: string;
};

export async function activateEntitlementsForPayment(input: {
  paymentRecord: PaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeEventType: string;
  stripeCheckoutSessionId: string;
  /** Real Stripe subscription period end (post-Basil: from subscription items). */
  realPeriodEnd?: Date | null;
  /** Package C Build 1 — grant provenance (defaults to stripe_webhook). */
  grantSource?: "stripe_webhook" | "admin_manual" | "print_included" | "comp" | "partner" | "manual_cleared_payment";
  /** Link to the canonical subscription record when subscription-mode. */
  subscriptionRecordId?: string | null;
}): Promise<EntitlementFulfillmentResult> {
  if (!isSupabaseAdminConfigured()) {
    return { ok: false, code: "supabase_not_configured", message: "Supabase admin not configured." };
  }

  const supabase = getAdminSupabase();
  const listingId = String(input.paymentRecord.listing_id ?? "").trim();
  if (!listingId) {
    return { ok: false, code: "listing_id_missing", message: "Payment record missing listing_id." };
  }

  const startsAt = new Date();
  const endsAt = computeEndsAt(startsAt, input.packageDef, input.realPeriodEnd ?? null);

  let packageEntitlementId = input.paymentRecord.package_entitlement_id ?? null;

  if (packageEntitlementId) {
    const { data: existing } = await supabase
      .from("listing_package_entitlements")
      .select("id, status, payment_record_id")
      .eq("id", packageEntitlementId)
      .maybeSingle();

    if (existing?.payment_record_id === input.paymentRecord.id && existing.status === "active") {
      return {
        ok: true,
        idempotent: true,
        packageEntitlementId,
        placementEntitlementId: input.paymentRecord.placement_entitlement_id ?? null,
      };
    }
  }

  const { data: byPayment } = await supabase
    .from("listing_package_entitlements")
    .select("id, status")
    .eq("payment_record_id", input.paymentRecord.id)
    .maybeSingle();

  if (byPayment?.id && byPayment.status === "active") {
    packageEntitlementId = byPayment.id as string;
    return {
      ok: true,
      idempotent: true,
      packageEntitlementId,
      placementEntitlementId: input.paymentRecord.placement_entitlement_id ?? null,
    };
  }

  let placementEntitlementId = input.paymentRecord.placement_entitlement_id ?? null;
  const placementTier = resolveCheckoutPlacementTier(input.packageDef);

  if (placementTier && !placementEntitlementId) {
    const { data: existingPlacement } = await supabase
      .from("leonix_placement_entitlements")
      .select("id, status")
      .eq("stripe_payment_record_id", input.paymentRecord.id)
      .maybeSingle();

    if (existingPlacement?.id && existingPlacement.status === "active") {
      placementEntitlementId = existingPlacement.id as string;
    } else if (!existingPlacement?.id) {
      const { data: placementInsert, error: placementError } = await supabase
        .from("leonix_placement_entitlements")
        .insert({
          owner_user_id: input.paymentRecord.owner_user_id,
          listing_id: listingId,
          leonix_ad_id: input.paymentRecord.leonix_ad_id,
          category: input.packageDef.category,
          placement_tier: placementTier,
          placement_source: "stripe_paid",
          surfaces: resolvePlacementSurfaces(placementTier),
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          status: "active",
          stripe_payment_record_id: input.paymentRecord.id,
          promo_code_id: input.paymentRecord.promo_code_id,
          metadata: {
            source: "stripe_webhook",
            stripe_event_id: input.stripeEventId,
            stripe_event_type: input.stripeEventType,
            stripe_checkout_session_id: input.stripeCheckoutSessionId,
            package_key: input.packageDef.packageKey,
          },
        })
        .select("id")
        .single();

      if (placementError || !placementInsert?.id) {
        return {
          ok: false,
          code: "placement_entitlement_insert_failed",
          message: placementError?.message ?? "Failed to create placement entitlement.",
        };
      }
      placementEntitlementId = placementInsert.id as string;
    }
  }

  const webhookMeta = {
    source: "stripe_webhook",
    stripe_event_id: input.stripeEventId,
    stripe_event_type: input.stripeEventType,
    stripe_checkout_session_id: input.stripeCheckoutSessionId,
    gate: "STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01",
  };

  const { data: pkgInsert, error: pkgError } = await supabase
    .from("listing_package_entitlements")
    .insert({
      category: input.packageDef.category,
      listing_source: input.packageDef.category,
      listing_id: listingId,
      package_tier: "digital_only",
      entitlement_code: generateEntitlementCode(),
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      status: "active",
      package_key: input.packageDef.packageKey,
      billing_mode: input.packageDef.billingMode,
      payment_record_id: input.paymentRecord.id,
      promo_code_id: input.paymentRecord.promo_code_id,
      promo_redemption_id: input.paymentRecord.promo_redemption_id,
      placement_entitlement_id: placementEntitlementId,
      grant_source: input.grantSource ?? "stripe_webhook",
      ...(input.subscriptionRecordId ? { subscription_record_id: input.subscriptionRecordId } : {}),
      metadata: {
        ...webhookMeta,
        ...(input.realPeriodEnd
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
    // Package C Build 1 — the M4 live-uniqueness index turns a concurrent duplicate insert
    // into 23505. Effectively-once: re-select the live row and return idempotent rather than
    // failing (closes the concurrent-webhook race the payment-record-only dedupe left open).
    if (pkgError?.code === "23505") {
      const { data: liveRow } = await supabase
        .from("listing_package_entitlements")
        .select("id, placement_entitlement_id")
        .eq("listing_source", input.packageDef.category)
        .eq("listing_id", listingId)
        .eq("package_key", input.packageDef.packageKey)
        .in("status", ["active", "scheduled"])
        .maybeSingle();
      if (liveRow?.id) {
        return {
          ok: true,
          idempotent: true,
          packageEntitlementId: liveRow.id as string,
          placementEntitlementId:
            (liveRow.placement_entitlement_id as string | null) ?? placementEntitlementId,
        };
      }
    }
    return {
      ok: false,
      code: "package_entitlement_insert_failed",
      message: pkgError?.message ?? "Failed to create package entitlement.",
    };
  }

  packageEntitlementId = pkgInsert.id as string;

  await supabase
    .from("leonix_payment_records")
    .update({
      package_entitlement_id: packageEntitlementId,
      placement_entitlement_id: placementEntitlementId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.paymentRecord.id);

  return {
    ok: true,
    packageEntitlementId,
    placementEntitlementId,
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
