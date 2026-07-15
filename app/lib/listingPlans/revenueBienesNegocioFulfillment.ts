/**
 * Bienes Raices negocio / agent activation after Revenue OS webhook payment.
 * Publishes the exact pending parent row and up to four pending inventory children after paid truth.
 */

import "server-only";
import {
  getBrListingById,
  tryActivateBrListingAfterPayment,
} from "@/app/lib/clasificados/bienes-raices/brListingPaymentService";

export const BIENES_NEGOCIO_BASE_PACKAGE_KEY = "br_agent_monthly" as const;
export const BIENES_INVENTORY_PACK_PACKAGE_KEY = "br_inventory_pack_monthly" as const;

export type BienesNegocioRevenueActivationOutcome =
  | "activated"
  | "already_published"
  | "skipped_wrong_package"
  | "missing_listing_id"
  | "not_found"
  | "wrong_category"
  | "wrong_lane"
  | "unsafe_status"
  | "error";

export type BienesNegocioRevenueActivationResult = {
  ok: boolean;
  outcome: BienesNegocioRevenueActivationOutcome;
  message?: string;
  listingId?: string | null;
};

export async function activatePaidBienesNegocioListingFromRevenueOs(input: {
  listingId: string | null | undefined;
  packageKey: string | null | undefined;
  stripePaymentIntentId?: string | null;
  activateInventoryChildren?: boolean;
}): Promise<BienesNegocioRevenueActivationResult> {
  const packageKey = String(input.packageKey ?? "").trim().toLowerCase();
  if (packageKey === BIENES_INVENTORY_PACK_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }
  if (packageKey !== BIENES_NEGOCIO_BASE_PACKAGE_KEY) {
    return { ok: true, outcome: "skipped_wrong_package" };
  }

  const listingId = String(input.listingId ?? "").trim();
  if (!listingId) {
    return {
      ok: false,
      outcome: "missing_listing_id",
      message: "listingId is required for Bienes negocio activation.",
    };
  }

  const row = await getBrListingById(listingId);
  if (!row?.id) {
    return { ok: false, outcome: "not_found", message: "Bienes negocio listing row not found.", listingId };
  }

  if (String(row.category ?? "").trim().toLowerCase() !== "bienes-raices") {
    return { ok: true, outcome: "wrong_category", message: "Listing is not a Bienes row.", listingId };
  }

  if (String(row.seller_type ?? "").trim().toLowerCase() !== "business") {
    return { ok: true, outcome: "wrong_lane", message: "Listing is not a Bienes negocio row.", listingId };
  }

  if (row.status === "active" && row.is_published === true) {
    return { ok: true, outcome: "already_published", listingId };
  }

  if (row.status === "removed" || row.status === "flagged") {
    return {
      ok: true,
      outcome: "unsafe_status",
      message: "Removed/flagged Bienes negocio listings are not auto-activated by webhook.",
      listingId,
    };
  }

  if (row.status !== "pending" || row.is_published !== false) {
    return {
      ok: false,
      outcome: "unsafe_status",
      message: `Cannot activate Bienes negocio listing from status "${String(row.status ?? "")}" (published=${String(row.is_published)}).`,
      listingId,
    };
  }

  const activation = await tryActivateBrListingAfterPayment(listingId, {
    stripePaymentIntentId: input.stripePaymentIntentId ?? null,
    activateInventorySiblings: input.activateInventoryChildren === true,
  });

  if (!activation.ok) {
    return {
      ok: false,
      outcome: "error",
      message: "Bienes negocio listing activation update did not apply.",
      listingId,
    };
  }

  return { ok: true, outcome: activation.transitioned ? "activated" : "already_published", listingId };
}
