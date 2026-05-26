/**
 * Gate C6 — Entitlement Activation Contract.
 * Single source of truth for whether an entitlement row activates benefits.
 * Used by public placement, dashboard, admin, and inventory add-on surfaces.
 *
 * An entitlement activates benefits ONLY when ALL of these are true:
 * 1. status is NOT "revoked"
 * 2. revoked_at is NULL
 * 3. starts_at ≤ now ≤ ends_at (date window active)
 * 4. payment_status (in metadata) is NULL (admin grant, pre-Stripe) OR "paid"/"succeeded"
 *
 * Pending/failed/canceled/refunded payment_status blocks activation even if dates are valid.
 */

import { isPackageEntitlementActive, type PackageEntitlementTier } from "./packageEntitlements";
import { normalizePaymentStatus, isPaymentCleared, type PaymentStatus } from "./paymentTracking";
import {
  BR_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY,
  AUTOS_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY,
  entitlementMetadataHasInventoryAddon,
} from "./listingPackageEntitlementPlacement";

export type EntitlementActivationInput = {
  status?: string | null;
  revoked_at?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  metadata?: Record<string, unknown> | null;
  now?: Date | string | number | null;
};

export type EntitlementActivationResult = {
  activatesPlacement: boolean;
  activatesInventoryAddon: boolean;
  inventoryAddonKey: string | null;
  effectiveStatus: EntitlementEffectiveStatus;
  paymentStatus: PaymentStatus;
  paymentBlocks: boolean;
  reason: string;
};

export type EntitlementEffectiveStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "revoked"
  | "pending_payment"
  | "failed_payment"
  | "canceled"
  | "refunded";

export function resolveEntitlementActivation(input: EntitlementActivationInput): EntitlementActivationResult {
  const status = String(input.status ?? "").trim().toLowerCase();
  const metadata = input.metadata && typeof input.metadata === "object" ? input.metadata : null;

  if (status === "revoked" || input.revoked_at) {
    return buildResult("revoked", "unknown", false, false, null, "Entitlement revoked");
  }

  const startsAt = input.starts_at ?? null;
  const endsAt = input.ends_at ?? null;
  const dateActive = isPackageEntitlementActive({ startsAt, endsAt, now: input.now ?? null });

  if (dateActive === false) {
    const start = startsAt ? new Date(startsAt) : null;
    const now = input.now ? new Date(input.now as string | number) : new Date();
    if (start && now.getTime() < start.getTime()) {
      return buildResult("scheduled", "unknown", false, false, null, "Start date in future");
    }
    return buildResult("expired", "unknown", false, false, null, "End date in past");
  }

  const rawPaymentStatus = metadata?.payment_status != null ? String(metadata.payment_status) : null;
  const paymentStatus = rawPaymentStatus ? normalizePaymentStatus(rawPaymentStatus) : "unknown";

  if (rawPaymentStatus === null) {
    const addonKey = resolveInventoryAddonKey(metadata);
    return buildResult("active", "unknown", true, addonKey !== null, addonKey, "Admin grant (no payment_status)");
  }

  if (isPaymentCleared(rawPaymentStatus)) {
    const addonKey = resolveInventoryAddonKey(metadata);
    return buildResult("active", paymentStatus, true, addonKey !== null, addonKey, "Payment cleared");
  }

  if (paymentStatus === "pending" || paymentStatus === "unpaid" || paymentStatus === "requires_action") {
    return buildResult("pending_payment", paymentStatus, false, false, null, "Payment pending");
  }

  if (paymentStatus === "failed") {
    return buildResult("failed_payment", paymentStatus, false, false, null, "Payment failed");
  }

  if (paymentStatus === "canceled") {
    return buildResult("canceled", paymentStatus, false, false, null, "Payment canceled");
  }

  if (paymentStatus === "refunded") {
    return buildResult("refunded", paymentStatus, false, false, null, "Payment refunded");
  }

  if (paymentStatus === "disputed") {
    return buildResult("pending_payment", paymentStatus, false, false, null, "Payment disputed — benefits suspended");
  }

  const addonKey = resolveInventoryAddonKey(metadata);
  return buildResult("active", paymentStatus, true, addonKey !== null, addonKey, "Unknown payment status — active by default");
}

export function entitlementActivatesPlacement(input: EntitlementActivationInput): boolean {
  return resolveEntitlementActivation(input).activatesPlacement;
}

export function entitlementActivatesInventoryAddon(
  input: EntitlementActivationInput,
  addonKey: string,
): boolean {
  const result = resolveEntitlementActivation(input);
  if (!result.activatesPlacement) return false;
  const metadata = input.metadata && typeof input.metadata === "object" ? input.metadata : null;
  return entitlementMetadataHasInventoryAddon(metadata, addonKey);
}

export function entitlementActivatesBrPropertyAddon(input: EntitlementActivationInput): boolean {
  return entitlementActivatesInventoryAddon(input, BR_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY);
}

export function entitlementActivatesAutosVehicleAddon(input: EntitlementActivationInput): boolean {
  return entitlementActivatesInventoryAddon(input, AUTOS_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY);
}

export function entitlementEffectiveStatusLabel(
  status: EntitlementEffectiveStatus,
  lang: "en" | "es",
): string {
  const labels: Record<EntitlementEffectiveStatus, { en: string; es: string }> = {
    active: { en: "Active", es: "Activo" },
    scheduled: { en: "Scheduled", es: "Programado" },
    expired: { en: "Expired — renewal needed", es: "Expirado — renovar" },
    revoked: { en: "Revoked", es: "Revocado" },
    pending_payment: { en: "Pending payment", es: "Pago pendiente" },
    failed_payment: { en: "Payment failed", es: "Pago fallido" },
    canceled: { en: "Canceled", es: "Cancelado" },
    refunded: { en: "Refunded", es: "Reembolsado" },
  };
  return labels[status]?.[lang] ?? status;
}

function resolveInventoryAddonKey(metadata: Record<string, unknown> | null): string | null {
  if (!metadata) return null;
  if (entitlementMetadataHasInventoryAddon(metadata, BR_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY)) {
    return BR_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY;
  }
  if (entitlementMetadataHasInventoryAddon(metadata, AUTOS_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY)) {
    return AUTOS_INVENTORY_ADDON_ENTITLEMENT_METADATA_KEY;
  }
  return null;
}

function buildResult(
  effectiveStatus: EntitlementEffectiveStatus,
  paymentStatus: PaymentStatus,
  activatesPlacement: boolean,
  activatesInventoryAddon: boolean,
  inventoryAddonKey: string | null,
  reason: string,
): EntitlementActivationResult {
  const paymentBlocks = !activatesPlacement && (
    effectiveStatus === "pending_payment" ||
    effectiveStatus === "failed_payment" ||
    effectiveStatus === "canceled" ||
    effectiveStatus === "refunded"
  );
  return {
    activatesPlacement,
    activatesInventoryAddon,
    inventoryAddonKey,
    effectiveStatus,
    paymentStatus,
    paymentBlocks,
    reason,
  };
}
