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
  isAutosListingPayableStatus,
  tryActivateAutosListingAfterPayment,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import {
  publishableChildren,
  publishNegociosBundleAdditionalVehicles,
} from "@/app/lib/clasificados/autos/autosNegociosBundlePublish";
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
  | "child_publish_failed"
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

/**
 * Live-data idempotency: how many child vehicles has this parent already had published?
 * publishNegociosBundleAdditionalVehicles always processes its filtered/ordered vehicle list
 * strictly in order and stops at the first failure (Gate 10/11, 2026-09-18) — so N existing child
 * rows means the first N vehicles in that same filtered order already succeeded, and a retry only
 * needs to resume from index N, never re-attempt (and duplicate) them.
 */
async function countAutosDealerListingChildRows(parentListingId: string): Promise<number> {
  if (!isSupabaseAdminConfigured()) return 0;
  const supabase = getAdminSupabase();
  const { count } = await supabase
    .from("autos_classifieds_listings")
    .select("id", { count: "exact", head: true })
    .eq("dealer_inventory_parent_listing_id", parentListingId)
    .eq("inventory_role", "inventory_vehicle");
  return count ?? 0;
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

  if (!isAutosListingPayableStatus(row.status) && row.status !== "active") {
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

  // Gate 6/7/8/9 — publish the dealer's saved additional-inventory (child) vehicles as their own
  // canonical listing rows. Children were staged durably server-side on `row.listing_payload
  // .additionalInventoryVehicles` before Checkout opened (see AutosNegociosPreviewClient's
  // ensurePendingDealerListing) — the webhook never depends on browser state.
  //
  // Gate 10/11 (2026-09-18): idempotency is resolved by live data — how many child rows already
  // exist for this parent — not a whole-bundle boolean. publishNegociosBundleAdditionalVehicles
  // processes its filtered/ordered vehicle list strictly in order and stops at the first failure,
  // so N existing child rows means the first N vehicles (in that same filtered order) already
  // succeeded; a Stripe retry or an owner-triggered event resend after a partial failure resumes
  // from exactly index N instead of either re-attempting (duplicating) or skipping (losing) the
  // remaining children.
  const pendingChildren = row.listing_payload.additionalInventoryVehicles ?? [];
  if (pendingChildren.length > 0) {
    const alreadyPublishedCount = await countAutosDealerListingChildRows(listingId);
    const remainingChildren = publishableChildren(pendingChildren).slice(alreadyPublishedCount);
    if (remainingChildren.length > 0) {
      const bundle = await publishNegociosBundleAdditionalVehicles({
        ownerUserId: row.owner_user_id,
        mainListingId: listingId,
        additionalVehicles: remainingChildren,
        lang: row.lang,
      });
      if (!bundle.ok) {
        return {
          ok: false,
          outcome: "child_publish_failed",
          message: `Autos Dealer child vehicle publish failed (error=${bundle.error ?? "unknown"}, published=${bundle.published.length}).`,
          listingId,
        };
      }
    }
  }

  return {
    ok: true,
    outcome: result.transitioned ? "activated" : "already_published",
    listingId,
  };
}
