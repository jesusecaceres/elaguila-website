/**
 * Autos Dealer listing activation after Revenue OS webhook payment — server-only.
 *
 * Activates `autos_classifieds_listings` negocios rows from pending_payment -> active
 * and grants the paid inventory pack entitlement when it was bundled as a Revenue OS add-on.
 */

import "server-only";
import { randomBytes } from "node:crypto";
import {
  getAutosClassifiedsListingById,
  tryActivateAutosListingAfterPayment,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";
import {
  AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES,
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  AUTOS_DEALER_MONTHLY_PACKAGE_KEY,
} from "./publishCheckoutCheckpoint";
import { getRevenuePackageDefinition } from "./revenuePricingMatrix";
import type { LeonixPaymentRecordRow } from "./revenuePaymentRecords";

export type AutosDealerRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "wrong_lane"
  | "unsafe_status"
  | "inventory_entitlement_failed"
  | "error";

export type AutosDealerRevenueActivationResult = {
  ok: boolean;
  outcome: AutosDealerRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

function hasPaidInventoryPackAddOn(paymentRecord: LeonixPaymentRecordRow): boolean {
  const addOns = paymentRecord.metadata?.add_ons;
  if (!Array.isArray(addOns)) return false;
  return addOns.some(
    (a) =>
      a &&
      typeof a === "object" &&
      String((a as Record<string, unknown>).key ?? "").trim().toLowerCase() ===
        AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  );
}

function generateEntitlementCode(): string {
  return `LX-AUTOS-INV-${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function grantAutosDealerInventoryPackAddOn(input: {
  paymentRecord: LeonixPaymentRecordRow;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; message?: string }> {
  if (!hasPaidInventoryPackAddOn(input.paymentRecord)) return { ok: true };
  if (!isSupabaseAdminConfigured()) return { ok: false, message: "Supabase admin is not configured." };

  const listingId = input.paymentRecord.listing_id?.trim();
  if (!listingId) return { ok: false, message: "listingId is required for dealer inventory entitlement." };

  const packageDef = getRevenuePackageDefinition(AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY);
  if (!packageDef) return { ok: false, message: "Autos dealer inventory package definition is missing." };

  const supabase = getAdminSupabase();
  const { data: existing } = await supabase
    .from("listing_package_entitlements")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("package_key", AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY)
    .eq("payment_record_id", input.paymentRecord.id)
    .maybeSingle();

  if (existing?.id && existing.status === "active") return { ok: true };

  const startsAt = new Date();
  const endsAt = new Date(startsAt);
  endsAt.setUTCDate(endsAt.getUTCDate() + 30);

  const { error } = await supabase.from("listing_package_entitlements").insert({
    category: "autos",
    listing_source: "autos_classifieds_listings",
    listing_id: listingId,
    package_tier: "digital_only",
    entitlement_code: generateEntitlementCode(),
    starts_at: startsAt.toISOString(),
    ends_at: endsAt.toISOString(),
    status: "active",
    package_key: AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
    billing_mode: packageDef.billingMode,
    payment_record_id: input.paymentRecord.id,
    promo_code_id: input.paymentRecord.promo_code_id,
    promo_redemption_id: input.paymentRecord.promo_redemption_id,
    benefits: {
      additional_active_vehicles: AUTOS_DEALER_INVENTORY_PACK_ADDITIONAL_VEHICLES,
    },
    placement_scope: [],
    metadata: {
      source: "stripe_webhook",
      gate: "AUTOS-DEALER-REVENUE-OS-INVENTORY-ENTITLEMENT-PARITY-01",
      stripe_event_id: input.stripeEventId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      package_key: AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
      parent_package_key: AUTOS_DEALER_MONTHLY_PACKAGE_KEY,
      subscription_active: true,
    },
  });

  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function activatePaidAutosDealerListingFromRevenueOs(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageKey: string | null | undefined;
  stripePaymentIntentId?: string | null;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<AutosDealerRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== AUTOS_DEALER_MONTHLY_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.paymentRecord.listing_id ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Autos Dealer activation.",
    };
  }

  const row = await getAutosClassifiedsListingById(listingId);
  if (!row) {
    return { ok: false, outcome: "not_found", message: "Autos dealer listing row not found.", listingId };
  }

  if (row.lane !== "negocios") {
    return {
      ok: true,
      outcome: "wrong_lane",
      message: "Listing is not Autos dealer/negocios.",
      listingId,
    };
  }

  if (row.status !== "pending_payment" && row.status !== "active") {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Autos Dealer listing from status "${row.status}".`,
      listingId,
    };
  }

  const result =
    row.status === "active"
      ? { ok: true, transitioned: false }
      : await tryActivateAutosListingAfterPayment(listingId, {
          stripePaymentIntentId: input.stripePaymentIntentId ?? null,
        });

  if (!result.ok) {
    return {
      ok: false,
      outcome: "error",
      message: "Autos Dealer activation failed after payment.",
      listingId,
    };
  }

  const entitlement = await grantAutosDealerInventoryPackAddOn({
    paymentRecord: input.paymentRecord,
    stripeEventId: input.stripeEventId,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
  });
  if (!entitlement.ok) {
    return {
      ok: false,
      outcome: "inventory_entitlement_failed",
      message: entitlement.message,
      listingId,
    };
  }

  return {
    ok: true,
    outcome: result.transitioned ? "activated" : "already_published",
    listingId,
  };
}
