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

function computeEndsAt(startsAt: Date, packageDef: RevenuePackageDefinition): Date {
  if (packageDef.billingMode === "monthly_subscription") {
    const end = new Date(startsAt);
    end.setUTCDate(end.getUTCDate() + 30);
    return end;
  }
  const days = packageDef.durationDays ?? 30;
  const end = new Date(startsAt);
  end.setUTCDate(end.getUTCDate() + days);
  return end;
}

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
  const endsAt = computeEndsAt(startsAt, input.packageDef);

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
      metadata: {
        ...webhookMeta,
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
