/**
 * Autos Privado listing activation after Revenue OS webhook payment — server-only.
 * Gate AUTOS-PRIVADO-REVENUE-OS-PREVIEW-CHECKOUT-01
 *
 * Activates `autos_classifieds_listings` privado rows from pending_payment → active
 * via the existing idempotent autos activation helper. Never touches dealer inventory.
 */

import "server-only";
import {
  getAutosClassifiedsListingById,
  tryActivateAutosListingAfterPayment,
  tryRenewAutosPrivadoListingAfterPayment,
} from "@/app/lib/clasificados/autos/autosClassifiedsListingService";
import { AUTOS_PRIVADO_30D_PACKAGE_KEY } from "./publishCheckoutCheckpoint";
import {
  paymentRecordIsRenewal,
  isRenewalAlreadyApplied,
  markRenewalPaymentApplied,
} from "@/app/lib/listingLifecycle/listingRenewalFulfillment";

export type AutosPrivadoRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "renewed"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "wrong_lane"
  | "unsafe_status"
  | "error";

export type AutosPrivadoRevenueActivationResult = {
  ok: boolean;
  outcome: AutosPrivadoRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidAutosPrivadoListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  stripePaymentIntentId?: string | null;
  paymentMetadata?: Record<string, unknown> | null;
  paymentRecordId?: string | null;
}): Promise<AutosPrivadoRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey !== AUTOS_PRIVADO_30D_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Autos Privado activation.",
    };
  }

  const row = await getAutosClassifiedsListingById(listingId);
  if (!row) {
    return { ok: false, outcome: "not_found", message: "Autos listing row not found.", listingId };
  }

  if (row.lane !== "privado") {
    return {
      ok: true,
      outcome: "wrong_lane",
      message: "Listing is not Autos Privado — dealer activation uses a separate path.",
      listingId,
    };
  }

  const renewal = paymentRecordIsRenewal(input.paymentMetadata);

  if (renewal) {
    // Webhook-retry idempotency — see isRenewalAlreadyApplied doc. Must be checked before any
    // write: a redelivered "renewal succeeded" event must never extend the term a second time.
    if (isRenewalAlreadyApplied(input.paymentMetadata)) {
      return { ok: true, outcome: "already_published", listingId };
    }
    // Gate 20 — a renewal never touches status (Autos Privado never leaves "active" on expiry,
    // exactly like Rentas); it only extends expires_at, same row, same ID, same media/analytics.
    if (row.status !== "active") {
      return {
        ok: false,
        outcome: "unsafe_status",
        message: `Cannot renew Autos Privado listing from status "${row.status}".`,
        listingId,
      };
    }
    const renewResult = await tryRenewAutosPrivadoListingAfterPayment(listingId, {
      stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    });
    if (!renewResult.ok) {
      return { ok: false, outcome: "error", message: "Autos Privado renewal failed after payment.", listingId };
    }
    if (renewResult.renewed && input.paymentRecordId) {
      await markRenewalPaymentApplied({
        paymentRecordId: input.paymentRecordId,
        renewedAt: new Date().toISOString(),
        newExpiresAt: renewResult.newExpiresAt,
      });
    }
    return { ok: true, outcome: renewResult.renewed ? "renewed" : "already_published", listingId };
  }

  if (row.status === "active") {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (row.status !== "pending_payment") {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Autos Privado listing from status "${row.status}".`,
      listingId,
    };
  }

  const result = await tryActivateAutosListingAfterPayment(listingId, {
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
  });

  if (!result.ok) {
    return {
      ok: false,
      outcome: "error",
      message: "Autos Privado activation failed after payment.",
      listingId,
    };
  }

  return {
    ok: true,
    outcome: result.transitioned ? "activated" : "already_published",
    listingId,
  };
}
