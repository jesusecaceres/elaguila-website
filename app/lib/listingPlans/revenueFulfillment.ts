/**
 * Revenue OS Stripe webhook fulfillment orchestration — server-only.
 * Gate STRIPE-REVENUE-OS-WEBHOOK-FULFILLMENT-01
 */

import "server-only";
import type Stripe from "stripe";
import { isPaymentCleared } from "./paymentTracking";
import { activateEntitlementsForPayment } from "./revenueEntitlementFulfillment";
import { writeRevenueAuditLog } from "./revenueAuditLog";
import {
  activatePaidRestauranteListingFromRevenueOs,
  activateRestauranteCouponAddonFromRevenueOs,
  RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY,
  RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY,
} from "./revenueRestaurantFulfillment";
import {
  activatePaidServiciosListingFromRevenueOs,
  grantServiciosOffersAddonEntitlementFromBasePayment,
  normalizeServiciosOffersAddonEntitlementSource,
  SERVICIOS_BASE_MONTHLY_PACKAGE_KEY,
  SERVICIOS_OFFERS_ADDON_PACKAGE_KEY,
} from "./revenueServiciosFulfillment";
import {
  activatePaidComidaLocalListingFromRevenueOs,
  COMIDA_LOCAL_BASE_MONTHLY_PACKAGE_KEY,
} from "./revenueComidaLocalFulfillment";
import {
  activatePaidRentasListingFromRevenueOs,
  RENTAS_30D_PACKAGE_KEY,
} from "./revenueRentasFulfillment";
import {
  activatePaidClasesListingFromRevenueOs,
  CLASES_PAID_30D_PACKAGE_KEY,
} from "./revenueClasesFulfillment";
import {
  activatePaidEmpleosListingFromRevenueOs,
} from "./revenueEmpleosFulfillment";
import {
  activatePaidAutosPrivadoListingFromRevenueOs,
} from "./revenueAutosPrivadoFulfillment";
import {
  activatePaidAutosDealerListingFromRevenueOs,
} from "./revenueAutosDealerFulfillment";
import {
  activatePaidBienesFsboListingFromRevenueOs,
} from "./revenueBienesFsboFulfillment";
import {
  activatePaidBienesNegocioListingFromRevenueOs,
  BIENES_NEGOCIO_BASE_PACKAGE_KEY,
} from "./revenueBienesNegocioFulfillment";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { getOfertaLocalCommercialProductByPackageKey } from "@/app/lib/ofertas-locales/ofertasLocalesCommercial";
import { markOfertaLocalEntitlementFulfilled } from "@/app/lib/ofertas-locales/ofertasLocalesCommercialServer";
import { tryAutoActivateOfertaLocalAfterPayment } from "@/app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations";
import { OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY } from "./publishCheckoutCheckpoint";
import { EMPLEOS_JOB_POST_PAID_PACKAGE_KEY, AUTOS_PRIVADO_30D_PACKAGE_KEY } from "./publishCheckoutCheckpoint";
import {
  loadPaymentRecordById,
  loadPaymentRecordByStripeSessionId,
  markPaymentRecordExpiredOrCanceled,
  markPaymentRecordPaid,
  type LeonixPaymentRecordRow,
} from "./revenuePaymentRecords";
import { getRevenuePackageDefinition, type RevenuePackageDefinition } from "./revenuePricingMatrix";
import {
  markPromoRedemptionExpiredOrCancelled,
  markPromoRedemptionRedeemedWithBusinessAttribution,
} from "./revenuePromoRedemptions";
import {
  markVerifiedIntroDiscountRedemptionRedeemed,
  markVerifiedIntroDiscountRedemptionExpiredOrCancelled,
} from "./verifiedIntroDiscountRedemptions";
import {
  isRevenueOsCheckoutSession,
  parseCheckoutSessionMetadata,
} from "./revenueWebhook";

export type RevenueFulfillmentResult = {
  ok: boolean;
  idempotent?: boolean;
  code?: string;
  message?: string;
  paymentRecordId?: string | null;
  packageEntitlementId?: string | null;
  placementEntitlementId?: string | null;
  promoRedemptionId?: string | null;
};

function resolveStripePaymentIntentId(session: Stripe.Checkout.Session): string | null {
  const pi = session.payment_intent;
  if (typeof pi === "string") return pi;
  return pi?.id ?? null;
}

function resolveStripeCustomerId(session: Stripe.Checkout.Session): string | null {
  const customer = session.customer;
  if (typeof customer === "string") return customer;
  return customer?.id ?? null;
}

function resolveStripeSubscriptionId(session: Stripe.Checkout.Session): string | null {
  const sub = session.subscription;
  if (typeof sub === "string") return sub;
  return sub?.id ?? null;
}

function isStripeSessionPaid(session: Stripe.Checkout.Session): boolean {
  if (session.payment_status === "paid") return true;
  if (session.mode === "subscription" && session.status === "complete") {
    return Boolean(resolveStripeSubscriptionId(session));
  }
  return false;
}

async function resolvePaymentRecord(input: {
  paymentRecordId: string | null;
  stripeCheckoutSessionId: string;
}): Promise<LeonixPaymentRecordRow | null> {
  if (input.paymentRecordId) {
    const byId = await loadPaymentRecordById(input.paymentRecordId);
    if (byId) return byId;
  }
  return loadPaymentRecordByStripeSessionId(input.stripeCheckoutSessionId);
}

function paymentRecordMatchesMetadata(
  row: LeonixPaymentRecordRow,
  metadata: { category: string; packageKey: string },
): boolean {
  const rowCategory = String(row.category ?? "").trim().toLowerCase();
  const rowPackage = String(row.package_key ?? "").trim().toLowerCase();
  return rowCategory === metadata.category && rowPackage === metadata.packageKey;
}

function readRestaurantCouponAddonPaidFromPaymentRecord(row: LeonixPaymentRecordRow): boolean | undefined {
  if (String(row.category ?? "").trim().toLowerCase() !== "restaurantes") return undefined;
  const meta = row.metadata;
  if (!meta || typeof meta !== "object") return undefined;
  const m = meta as Record<string, unknown>;
  if (m.restaurant_coupon_addon_selected === true) return true;
  if (m.restaurant_coupon_addon_selected === false) return false;
  const addOns = m.add_ons;
  if (Array.isArray(addOns)) {
    return addOns.some(
      (a) =>
        a &&
        typeof a === "object" &&
        String((a as Record<string, unknown>).key ?? "").trim() === "restaurantes_offers_addon",
    );
  }
  return undefined;
}

function readBienesInventoryPackPaidFromPaymentRecord(row: LeonixPaymentRecordRow): boolean {
  if (String(row.category ?? "").trim().toLowerCase() !== "bienes-raices") return false;
  const meta = row.metadata;
  if (!meta || typeof meta !== "object") return false;
  const m = meta as Record<string, unknown>;
  if (m.bienes_inventory_pack_selected === true) return true;
  if (m.bienes_inventory_pack_package_key === "br_inventory_pack_monthly") return true;
  const addOns = m.add_ons;
  if (!Array.isArray(addOns)) return false;
  return addOns.some(
    (a) =>
      a &&
      typeof a === "object" &&
      String((a as Record<string, unknown>).key ?? "").trim() === "br_inventory_pack_monthly",
  );
}

async function tryFulfillOfertasLocalesParentAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  packageEntitlementId: string | null | undefined;
  packageEntitlementEndsAt: string | null | undefined;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.category !== "ofertas-locales") {
    return { ok: true };
  }

  const product = getOfertaLocalCommercialProductByPackageKey(input.packageDef.packageKey);
  if (!product) {
    return { ok: false, code: "ofertas_product_unknown", message: "Unknown Ofertas commercial product." };
  }

  const result = await markOfertaLocalEntitlementFulfilled({
    supabase: getAdminSupabase(),
    paymentRecord: input.paymentRecord,
    product,
    packageEntitlementId: input.packageEntitlementId,
    entitlementEndsAt: input.packageEntitlementEndsAt,
  });

  if (!result.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "ofertas_locales",
      targetId: result.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: result.code,
        message: result.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
      },
    });
    return { ok: false, code: result.code, message: result.message };
  }

  await writeRevenueAuditLog({
    action: "ofertas_locales_entitlement_fulfilled_after_payment",
    targetType: "ofertas_locales",
    targetId: result.listingId,
    meta: {
      payment_record_id: input.paymentRecord.id,
      package_key: input.packageDef.packageKey,
      package_entitlement_id: input.packageEntitlementId,
      public_activation: false,
      starts_public_term: false,
    },
  });

  // Commercial doctrine: the $399 flyer auto-publishes on successful payment —
  // no routine Leonix staff approval step. Only the paid flyer package
  // auto-activates here; the free coupon lane never reaches Stripe at all
  // (see the "free" entitlement source) and renewals are handled by their
  // own admin-review call path, not this first-payment fulfillment.
  if (input.packageDef.packageKey === OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY && result.listingId) {
    const activation = await tryAutoActivateOfertaLocalAfterPayment(getAdminSupabase(), result.listingId);

    if (activation.outcome === "already_published" || activation.outcome === "unsafe_status") {
      await writeRevenueAuditLog({
        action: "revenue_webhook_ignored",
        targetType: "ofertas_locales",
        targetId: result.listingId,
        meta: {
          reason: "ofertas_locales_auto_activation_skipped",
          outcome: activation.outcome,
          message: activation.message,
          payment_record_id: input.paymentRecord.id,
        },
      });
    } else if (!activation.ok) {
      // Payment + entitlement are already recorded correctly at this point —
      // an activation precondition failing here (e.g. the owner has not
      // actually finished the item review yet) is an exceptional case for a
      // human to resolve, not a payment failure. Do not fail the webhook.
      await writeRevenueAuditLog({
        action: "revenue_webhook_validation_failed",
        targetType: "ofertas_locales",
        targetId: result.listingId,
        meta: {
          code: `ofertas_locales_auto_activation_${activation.outcome}`,
          message: activation.message,
          payment_record_id: input.paymentRecord.id,
          package_key: input.packageDef.packageKey,
        },
      });
    } else {
      await writeRevenueAuditLog({
        action: "ofertas_locales_listing_activated_after_payment",
        targetType: "ofertas_locales",
        targetId: result.listingId,
        meta: {
          payment_record_id: input.paymentRecord.id,
          package_key: input.packageDef.packageKey,
        },
      });
    }
  }

  return { ok: true };
}

async function tryActivateRestauranteListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== RESTAURANTES_BASE_MONTHLY_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidRestauranteListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    leonixAdId: input.paymentRecord.leonix_ad_id,
    couponAddonPaid: readRestaurantCouponAddonPaidFromPaymentRecord(input.paymentRecord),
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "restaurantes_public_listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "restaurante_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "restaurantes_public_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `restaurante_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Restaurante listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "restaurante_listing_activated_after_payment",
    targetType: "restaurantes_public_listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

/** Gate D19 — mirrors tryActivateRestauranteListingAfterEntitlement; no coupon add-on branch
 * (Comida Local has no coupon feature, Gate D14). */
async function tryActivateComidaLocalListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== COMIDA_LOCAL_BASE_MONTHLY_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidComidaLocalListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    leonixAdId: input.paymentRecord.leonix_ad_id,
  });

  if (activation.outcome === "skipped_wrong_package" || activation.outcome === "already_published") {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "comida_local_public_listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "comida_local_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "comida_local_public_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `comida_local_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Comida Local listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "comida_local_listing_activated_after_payment",
    targetType: "comida_local_public_listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateRestauranteCouponAddonAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== RESTAURANTES_OFFERS_ADDON_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activateRestauranteCouponAddonFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    ownerUserId: input.paymentRecord.owner_user_id,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    leonixAdId: input.paymentRecord.leonix_ad_id,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published"
  ) {
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "restaurantes_public_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `restaurante_coupon_addon_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Restaurante coupon add-on activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "restaurante_listing_activated_after_payment",
    targetType: "restaurantes_public_listings",
    targetId: activation.listingId ?? null,
    meta: {
      activation_kind: "coupon_addon_only",
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateServiciosListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== SERVICIOS_BASE_MONTHLY_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidServiciosListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    leonixAdId: input.paymentRecord.leonix_ad_id,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "servicios_public_listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "servicios_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "servicios_public_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `servicios_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Servicios listing activation failed.",
    };
  }

  const offersEntitlement = await grantServiciosOffersAddonEntitlementFromBasePayment({
    paymentRecord: input.paymentRecord,
    stripeEventId: input.stripeEventId,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
  });
  if (!offersEntitlement.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "servicios_public_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: "servicios_offers_addon_entitlement_failed",
        message: offersEntitlement.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: "servicios_offers_addon_entitlement_failed",
      message: offersEntitlement.message ?? "Servicios offers add-on entitlement failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "servicios_listing_activated_after_payment",
    targetType: "servicios_public_listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

/**
 * Gate E.1 — fires only for the standalone (dashboard-direct) Servicios offers add-on purchase
 * (packageKey === SERVICIOS_OFFERS_ADDON_PACKAGE_KEY), never for the bundled base+addOn purchase
 * (that path already writes the correct listing_source via
 * grantServiciosOffersAddonEntitlementFromBasePayment above). See
 * normalizeServiciosOffersAddonEntitlementSource for the underlying defect and fix.
 */
async function tryNormalizeServiciosOffersAddonEntitlementSource(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  packageEntitlementId: string | null | undefined;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== SERVICIOS_OFFERS_ADDON_PACKAGE_KEY) {
    return { ok: true };
  }

  const result = await normalizeServiciosOffersAddonEntitlementSource({
    packageEntitlementId: input.packageEntitlementId,
  });

  if (!result.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "listing_package_entitlements",
      targetId: input.packageEntitlementId ?? null,
      meta: {
        code: "servicios_offers_addon_listing_source_normalize_failed",
        message: result.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: "servicios_offers_addon_listing_source_normalize_failed",
      message: result.message ?? "Servicios offers add-on entitlement source normalization failed.",
    };
  }

  return { ok: true };
}

async function tryActivateRentasListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== RENTAS_30D_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidRentasListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    leonixAdId: input.paymentRecord.leonix_ad_id,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published" ||
    activation.outcome === "wrong_category"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "rentas_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `rentas_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Rentas listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "rentas_listing_activated_after_payment",
    targetType: "listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateClasesListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== CLASES_PAID_30D_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidClasesListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    leonixAdId: input.paymentRecord.leonix_ad_id,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published" ||
    activation.outcome === "wrong_category"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "clases_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `clases_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Clases listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "clases_listing_activated_after_payment",
    targetType: "listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateEmpleosListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== EMPLEOS_JOB_POST_PAID_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidEmpleosListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    paymentRecordId: input.paymentRecord.id,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
    stripeEventId: input.stripeEventId,
    leonixAdId: input.paymentRecord.leonix_ad_id,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "empleos_public_listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "empleos_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "empleos_public_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `empleos_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Empleos listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "empleos_listing_activated_after_payment",
    targetType: "empleos_public_listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateAutosPrivadoListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== AUTOS_PRIVADO_30D_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidAutosPrivadoListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published" ||
    activation.outcome === "wrong_lane"
  ) {
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "autos_classifieds_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `autos_privado_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Autos Privado listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "autos_privado_listing_activated_after_payment",
    targetType: "autos_classifieds_listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateAutosDealerListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  const activation = await activatePaidAutosDealerListingFromRevenueOs({
    paymentRecord: input.paymentRecord,
    packageKey: input.packageDef.packageKey,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    stripeEventId: input.stripeEventId,
    stripeCheckoutSessionId: input.stripeCheckoutSessionId,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published" ||
    activation.outcome === "wrong_lane"
  ) {
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "autos_classifieds_listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `autos_dealer_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Autos Dealer listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "autos_dealer_listing_activated_after_payment",
    targetType: "autos_classifieds_listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateBienesFsboListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  const activation = await activatePaidBienesFsboListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published" ||
    activation.outcome === "wrong_category" ||
    activation.outcome === "wrong_lane"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "bienes_fsbo_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `bienes_fsbo_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Bienes Raices FSBO listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "bienes_fsbo_listing_activated_after_payment",
    targetType: "listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

async function tryActivateBienesNegocioListingAfterEntitlement(input: {
  paymentRecord: LeonixPaymentRecordRow;
  packageDef: RevenuePackageDefinition;
  stripeEventId: string;
  stripePaymentIntentId?: string | null;
}): Promise<{ ok: boolean; code?: string; message?: string }> {
  if (input.packageDef.packageKey !== BIENES_NEGOCIO_BASE_PACKAGE_KEY) {
    return { ok: true };
  }

  const activation = await activatePaidBienesNegocioListingFromRevenueOs({
    listingId: input.paymentRecord.listing_id,
    packageKey: input.packageDef.packageKey,
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    activateInventoryChildren: readBienesInventoryPackPaidFromPaymentRecord(input.paymentRecord),
  });

  if (
    activation.outcome === "skipped_wrong_package" ||
    activation.outcome === "already_published" ||
    activation.outcome === "wrong_category" ||
    activation.outcome === "wrong_lane"
  ) {
    return { ok: true };
  }

  if (activation.outcome === "unsafe_status" && activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "listings",
      targetId: activation.listingId ?? null,
      meta: {
        reason: "bienes_negocio_activation_unsafe_status",
        outcome: activation.outcome,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        stripe_event_id: input.stripeEventId,
      },
    });
    return { ok: true };
  }

  if (!activation.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "listings",
      targetId: activation.listingId ?? input.paymentRecord.listing_id,
      meta: {
        code: `bienes_negocio_activation_${activation.outcome}`,
        message: activation.message,
        payment_record_id: input.paymentRecord.id,
        package_key: input.packageDef.packageKey,
        stripe_event_id: input.stripeEventId,
      },
    });
    return {
      ok: false,
      code: activation.outcome,
      message: activation.message ?? "Bienes negocio listing activation failed.",
    };
  }

  await writeRevenueAuditLog({
    action: "bienes_negocio_listing_activated_after_payment",
    targetType: "listings",
    targetId: activation.listingId ?? null,
    meta: {
      listing_id: activation.listingId,
      package_key: input.packageDef.packageKey,
      payment_record_id: input.paymentRecord.id,
      leonix_ad_id: input.paymentRecord.leonix_ad_id,
      stripe_event_id: input.stripeEventId,
      outcome: activation.outcome,
    },
  });

  return { ok: true };
}

export async function fulfillCheckoutSessionCompleted(input: {
  session: Stripe.Checkout.Session;
  eventId: string;
  eventType: string;
}): Promise<RevenueFulfillmentResult> {
  const { session, eventId, eventType } = input;

  if (!isRevenueOsCheckoutSession(session)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { reason: "not_revenue_os_session", stripe_event_id: eventId, stripe_event_type: eventType },
    });
    return { ok: true, code: "ignored_non_revenue_os", message: "Not a Revenue OS checkout session." };
  }

  const parsed = parseCheckoutSessionMetadata(session);
  if (!parsed.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: {
        code: parsed.code,
        stripe_event_id: eventId,
        stripe_event_type: eventType,
      },
    });
    return { ok: false, code: parsed.code, message: parsed.message };
  }

  const { metadata } = parsed;
  const packageDef = getRevenuePackageDefinition(metadata.packageKey);
  if (!packageDef) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { code: "package_unknown", stripe_event_id: eventId },
    });
    return { ok: false, code: "package_unknown", message: "Unknown package key." };
  }

  if (!isStripeSessionPaid(session)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: {
        code: "payment_not_paid",
        payment_status: session.payment_status,
        stripe_event_id: eventId,
      },
    });
    return { ok: false, code: "payment_not_paid", message: "Stripe session is not paid." };
  }

  const paymentRecord = await resolvePaymentRecord({
    paymentRecordId: metadata.paymentRecordId,
    stripeCheckoutSessionId: session.id,
  });

  if (!paymentRecord) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { code: "payment_record_not_found", stripe_event_id: eventId },
    });
    return { ok: false, code: "payment_record_not_found", message: "Matching payment record not found." };
  }

  if (!paymentRecordMatchesMetadata(paymentRecord, metadata)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: { code: "payment_record_metadata_mismatch", stripe_event_id: eventId },
    });
    return {
      ok: false,
      code: "payment_record_metadata_mismatch",
      message: "Payment record does not match checkout metadata.",
    };
  }

  const expectedAmount = paymentRecord.amount_total_cents ?? paymentRecord.amount_cents ?? packageDef.priceCents;
  if (session.amount_total != null && expectedAmount > 0 && session.amount_total !== expectedAmount) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: {
        code: "amount_mismatch",
        expected_amount_cents: expectedAmount,
        stripe_amount_total: session.amount_total,
        stripe_event_id: eventId,
      },
    });
    return { ok: false, code: "amount_mismatch", message: "Stripe amount does not match payment record." };
  }

  const paymentCurrency = String(paymentRecord.currency ?? "").trim().toLowerCase();
  if (session.currency && paymentCurrency && session.currency.toLowerCase() !== paymentCurrency) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: {
        code: "currency_mismatch",
        expected_currency: paymentCurrency,
        stripe_currency: session.currency,
        stripe_event_id: eventId,
      },
    });
    return { ok: false, code: "currency_mismatch", message: "Stripe currency does not match payment record." };
  }

  if (packageDef.category === "ofertas-locales") {
    if (
      metadata.schema !== "revenue_os_checkout_v2" ||
      metadata.amountCents !== packageDef.priceCents ||
      metadata.currency !== "usd" ||
      metadata.durationDays !== 30 ||
      metadata.aiIncluded !== true
    ) {
      await writeRevenueAuditLog({
        action: "revenue_webhook_validation_failed",
        targetType: "leonix_payment_records",
        targetId: paymentRecord.id,
        meta: {
          code: "ofertas_metadata_contract_mismatch",
          metadata_schema: metadata.schema,
          metadata_amount_cents: metadata.amountCents,
          metadata_currency: metadata.currency,
          metadata_duration_days: metadata.durationDays,
          metadata_ai_included: metadata.aiIncluded,
          stripe_event_id: eventId,
        },
      });
      return {
        ok: false,
        code: "ofertas_metadata_contract_mismatch",
        message: "Ofertas checkout metadata does not match the commercial contract.",
      };
    }
  }

  const webhookMeta = {
    stripe_event_id: eventId,
    stripe_event_type: eventType,
    stripe_checkout_session_id: session.id,
    stripe_payment_status: session.payment_status,
  };

  if (isPaymentCleared(paymentRecord.payment_status)) {
    const entitlementResult = await activateEntitlementsForPayment({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeEventType: eventType,
      stripeCheckoutSessionId: session.id,
    });

    if (!entitlementResult.ok) {
      return {
        ok: false,
        code: entitlementResult.code,
        message: entitlementResult.message,
        paymentRecordId: paymentRecord.id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const restaurantActivation = await tryActivateRestauranteListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
    });
    if (!restaurantActivation.ok) {
      return {
        ok: false,
        code: restaurantActivation.code,
        message: restaurantActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const comidaLocalActivation = await tryActivateComidaLocalListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
    });
    if (!comidaLocalActivation.ok) {
      return {
        ok: false,
        code: comidaLocalActivation.code,
        message: comidaLocalActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const couponAddonActivation = await tryActivateRestauranteCouponAddonAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
    });
    if (!couponAddonActivation.ok) {
      return {
        ok: false,
        code: couponAddonActivation.code,
        message: couponAddonActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const serviciosActivation = await tryActivateServiciosListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
    });
    if (!serviciosActivation.ok) {
      return {
        ok: false,
        code: serviciosActivation.code,
        message: serviciosActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const serviciosOffersAddonSourceFix = await tryNormalizeServiciosOffersAddonEntitlementSource({
      paymentRecord,
      packageDef,
      packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
    });
    if (!serviciosOffersAddonSourceFix.ok) {
      return {
        ok: false,
        code: serviciosOffersAddonSourceFix.code,
        message: serviciosOffersAddonSourceFix.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const rentasActivation = await tryActivateRentasListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
    });
    if (!rentasActivation.ok) {
      return {
        ok: false,
        code: rentasActivation.code,
        message: rentasActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const clasesActivation = await tryActivateClasesListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
    });
    if (!clasesActivation.ok) {
      return {
        ok: false,
        code: clasesActivation.code,
        message: clasesActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const empleosActivation = await tryActivateEmpleosListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
    });
    if (!empleosActivation.ok) {
      return {
        ok: false,
        code: empleosActivation.code,
        message: empleosActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const autosPrivadoActivation = await tryActivateAutosPrivadoListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
    });
    if (!autosPrivadoActivation.ok) {
      return {
        ok: false,
        code: autosPrivadoActivation.code,
        message: autosPrivadoActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const autosDealerActivation = await tryActivateAutosDealerListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
    });
    if (!autosDealerActivation.ok) {
      return {
        ok: false,
        code: autosDealerActivation.code,
        message: autosDealerActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const bienesNegocioActivation = await tryActivateBienesNegocioListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
    });
    if (!bienesNegocioActivation.ok) {
      return {
        ok: false,
        code: bienesNegocioActivation.code,
        message: bienesNegocioActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const bienesFsboActivation = await tryActivateBienesFsboListingAfterEntitlement({
      paymentRecord,
      packageDef,
      stripeEventId: eventId,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
    });
    if (!bienesFsboActivation.ok) {
      return {
        ok: false,
        code: bienesFsboActivation.code,
        message: bienesFsboActivation.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    const ofertasFulfillment = await tryFulfillOfertasLocalesParentAfterEntitlement({
      paymentRecord,
      packageDef,
      packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
      packageEntitlementEndsAt: entitlementResult.packageEntitlementEndsAt,
    });
    if (!ofertasFulfillment.ok) {
      return {
        ok: false,
        code: ofertasFulfillment.code,
        message: ofertasFulfillment.message,
        paymentRecordId: paymentRecord.id,
        packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
        placementEntitlementId:
          entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
        promoRedemptionId: paymentRecord.promo_redemption_id,
      };
    }

    return {
      ok: true,
      idempotent: true,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId ?? paymentRecord.package_entitlement_id,
      placementEntitlementId:
        entitlementResult.placementEntitlementId ?? paymentRecord.placement_entitlement_id,
      promoRedemptionId: paymentRecord.promo_redemption_id,
    };
  }

  const paidResult = await markPaymentRecordPaid({
    paymentRecordId: paymentRecord.id,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
    stripeCustomerId: resolveStripeCustomerId(session),
    stripeSubscriptionId: resolveStripeSubscriptionId(session),
    amountPaidCents: session.amount_total ?? expectedAmount,
    webhookMeta,
    existingMetadata: paymentRecord.metadata,
  });

  if (!paidResult.ok) {
    return {
      ok: false,
      code: paidResult.code,
      message: paidResult.message,
      paymentRecordId: paymentRecord.id,
    };
  }

  await writeRevenueAuditLog({
    action: "revenue_payment_completed",
    targetType: "leonix_payment_records",
    targetId: paymentRecord.id,
    meta: {
      stripe_checkout_session_id: session.id,
      package_key: metadata.packageKey,
      category: metadata.category,
      idempotent: paidResult.idempotent === true,
      stripe_event_id: eventId,
    },
  });

  const promoRedemptionId = paymentRecord.promo_redemption_id ?? metadata.promoRedemptionId;
  if (promoRedemptionId) {
    const promoResult = await markPromoRedemptionRedeemedWithBusinessAttribution({
      redemptionId: promoRedemptionId,
      stripeCheckoutSessionId: session.id,
      paymentRecordId: paymentRecord.id,
      stripePaymentIntentId: resolveStripePaymentIntentId(session),
      webhookMeta,
    });

    if (promoResult.ok) {
      await writeRevenueAuditLog({
        action: "revenue_promo_redeemed",
        targetType: "leonix_promo_code_redemptions",
        targetId: promoRedemptionId,
        meta: {
          payment_record_id: paymentRecord.id,
          idempotent: promoResult.idempotent === true,
          stripe_event_id: eventId,
        },
      });
    }
  }

  // Package C Build 2 (C4) — parallel to the promo-redemption block above. Conditional,
  // replay-safe 'reserved' -> 'redeemed' UPDATE; without this the reservation never leaves
  // 'reserved' after a real successful payment.
  const verifiedIntroDiscountRedemptionId = paymentRecord.verified_intro_discount_redemption_id;
  if (verifiedIntroDiscountRedemptionId) {
    const verifiedIntroResult = await markVerifiedIntroDiscountRedemptionRedeemed(verifiedIntroDiscountRedemptionId);
    if (verifiedIntroResult.ok) {
      await writeRevenueAuditLog({
        action: "revenue_verified_intro_discount_redeemed",
        targetType: "leonix_verified_intro_discount_redemptions",
        targetId: verifiedIntroDiscountRedemptionId,
        meta: {
          payment_record_id: paymentRecord.id,
          idempotent: verifiedIntroResult.idempotent === true,
          stripe_event_id: eventId,
        },
      });
    }
  }

  const refreshed = (await loadPaymentRecordById(paymentRecord.id)) ?? paymentRecord;
  const entitlementResult = await activateEntitlementsForPayment({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeEventType: eventType,
    stripeCheckoutSessionId: session.id,
  });

  if (!entitlementResult.ok) {
    return {
      ok: false,
      code: entitlementResult.code,
      message: entitlementResult.message,
      paymentRecordId: paymentRecord.id,
      promoRedemptionId,
    };
  }

  await writeRevenueAuditLog({
    action: "revenue_entitlement_activated",
    targetType: "listing_package_entitlements",
    targetId: entitlementResult.packageEntitlementId ?? null,
    meta: {
      payment_record_id: paymentRecord.id,
      placement_entitlement_id: entitlementResult.placementEntitlementId ?? null,
      package_key: metadata.packageKey,
      category: metadata.category,
      idempotent: entitlementResult.idempotent === true,
      stripe_event_id: eventId,
    },
  });

  const ofertasFulfillment = await tryFulfillOfertasLocalesParentAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    packageEntitlementId: entitlementResult.packageEntitlementId,
    packageEntitlementEndsAt: entitlementResult.packageEntitlementEndsAt,
  });
  if (!ofertasFulfillment.ok) {
    return {
      ok: false,
      code: ofertasFulfillment.code,
      message: ofertasFulfillment.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const restaurantActivation = await tryActivateRestauranteListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
  });
  if (!restaurantActivation.ok) {
    return {
      ok: false,
      code: restaurantActivation.code,
      message: restaurantActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const comidaLocalActivation = await tryActivateComidaLocalListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
  });
  if (!comidaLocalActivation.ok) {
    return {
      ok: false,
      code: comidaLocalActivation.code,
      message: comidaLocalActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const couponAddonActivation = await tryActivateRestauranteCouponAddonAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
  });
  if (!couponAddonActivation.ok) {
    return {
      ok: false,
      code: couponAddonActivation.code,
      message: couponAddonActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const serviciosActivation = await tryActivateServiciosListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
  });
  if (!serviciosActivation.ok) {
    return {
      ok: false,
      code: serviciosActivation.code,
      message: serviciosActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const serviciosOffersAddonSourceFix = await tryNormalizeServiciosOffersAddonEntitlementSource({
    paymentRecord: refreshed,
    packageDef,
    packageEntitlementId: entitlementResult.packageEntitlementId,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
  });
  if (!serviciosOffersAddonSourceFix.ok) {
    return {
      ok: false,
      code: serviciosOffersAddonSourceFix.code,
      message: serviciosOffersAddonSourceFix.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const rentasActivation = await tryActivateRentasListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
  });
  if (!rentasActivation.ok) {
    return {
      ok: false,
      code: rentasActivation.code,
      message: rentasActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const clasesActivation = await tryActivateClasesListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
  });
  if (!clasesActivation.ok) {
    return {
      ok: false,
      code: clasesActivation.code,
      message: clasesActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const empleosActivation = await tryActivateEmpleosListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
  });
  if (!empleosActivation.ok) {
    return {
      ok: false,
      code: empleosActivation.code,
      message: empleosActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const autosPrivadoActivation = await tryActivateAutosPrivadoListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
  });
  if (!autosPrivadoActivation.ok) {
    return {
      ok: false,
      code: autosPrivadoActivation.code,
      message: autosPrivadoActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const autosDealerActivation = await tryActivateAutosDealerListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
  });
  if (!autosDealerActivation.ok) {
    return {
      ok: false,
      code: autosDealerActivation.code,
      message: autosDealerActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const bienesNegocioActivation = await tryActivateBienesNegocioListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
  });
  if (!bienesNegocioActivation.ok) {
    return {
      ok: false,
      code: bienesNegocioActivation.code,
      message: bienesNegocioActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  const bienesFsboActivation = await tryActivateBienesFsboListingAfterEntitlement({
    paymentRecord: refreshed,
    packageDef,
    stripeEventId: eventId,
    stripePaymentIntentId: resolveStripePaymentIntentId(session),
  });
  if (!bienesFsboActivation.ok) {
    return {
      ok: false,
      code: bienesFsboActivation.code,
      message: bienesFsboActivation.message,
      paymentRecordId: paymentRecord.id,
      packageEntitlementId: entitlementResult.packageEntitlementId,
      placementEntitlementId: entitlementResult.placementEntitlementId,
      promoRedemptionId,
    };
  }

  return {
    ok: true,
    idempotent: paidResult.idempotent === true && entitlementResult.idempotent === true,
    paymentRecordId: paymentRecord.id,
    packageEntitlementId: entitlementResult.packageEntitlementId,
    placementEntitlementId: entitlementResult.placementEntitlementId,
    promoRedemptionId,
  };
}

export async function markCheckoutSessionExpired(input: {
  session: Stripe.Checkout.Session;
  eventId: string;
  eventType: string;
}): Promise<RevenueFulfillmentResult> {
  const { session, eventId, eventType } = input;

  if (!isRevenueOsCheckoutSession(session)) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_ignored",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { reason: "not_revenue_os_session", stripe_event_id: eventId },
    });
    return { ok: true, code: "ignored_non_revenue_os", message: "Not a Revenue OS checkout session." };
  }

  const parsed = parseCheckoutSessionMetadata(session);
  if (!parsed.ok) {
    await writeRevenueAuditLog({
      action: "revenue_webhook_validation_failed",
      targetType: "stripe_checkout_session",
      targetId: session.id,
      meta: { code: parsed.code, stripe_event_id: eventId },
    });
    return { ok: false, code: parsed.code, message: parsed.message };
  }

  const { metadata } = parsed;
  const paymentRecord = await resolvePaymentRecord({
    paymentRecordId: metadata.paymentRecordId,
    stripeCheckoutSessionId: session.id,
  });

  if (!paymentRecord) {
    return { ok: true, code: "payment_record_not_found", message: "No payment record to expire." };
  }

  const webhookMeta = {
    stripe_event_id: eventId,
    stripe_event_type: eventType,
    stripe_checkout_session_id: session.id,
    reason: "checkout_session_expired",
  };

  const expireResult = await markPaymentRecordExpiredOrCanceled({
    paymentRecordId: paymentRecord.id,
    webhookMeta,
    existingMetadata: paymentRecord.metadata,
  });

  if (!expireResult.ok && expireResult.code !== "payment_already_paid") {
    return {
      ok: false,
      code: expireResult.code,
      message: expireResult.message,
      paymentRecordId: paymentRecord.id,
    };
  }

  if (expireResult.ok) {
    await writeRevenueAuditLog({
      action: "revenue_payment_expired",
      targetType: "leonix_payment_records",
      targetId: paymentRecord.id,
      meta: {
        stripe_checkout_session_id: session.id,
        idempotent: expireResult.idempotent === true,
        stripe_event_id: eventId,
      },
    });
  }

  const promoRedemptionId = paymentRecord.promo_redemption_id ?? metadata.promoRedemptionId;
  if (promoRedemptionId) {
    await markPromoRedemptionExpiredOrCancelled({
      redemptionId: promoRedemptionId,
      stripeCheckoutSessionId: session.id,
      webhookMeta,
    });
  }

  // Package C Build 2 (C4) — mirrors the promo-redemption expiry branch above.
  const verifiedIntroDiscountRedemptionId = paymentRecord.verified_intro_discount_redemption_id;
  if (verifiedIntroDiscountRedemptionId) {
    await markVerifiedIntroDiscountRedemptionExpiredOrCancelled(verifiedIntroDiscountRedemptionId);
  }

  return {
    ok: true,
    idempotent: expireResult.idempotent === true,
    paymentRecordId: paymentRecord.id,
    promoRedemptionId,
  };
}
