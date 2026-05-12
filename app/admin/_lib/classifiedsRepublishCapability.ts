import { listingPlanFromDetailPairs } from "@/app/(site)/dashboard/lib/dashboardListingMeta";

export type RepublishActionLabelResult = {
  label: string;
  disabled: boolean;
  /** When disabled, short staff-facing explanation. */
  reason?: string;
};

function lc(s: unknown): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

function republishOverride(row: Record<string, unknown>): boolean | null {
  const v = row.republish_override;
  if (v === true) return true;
  if (v === false) return false;
  return null;
}

/** Generic `listings` row + category slug (from row or queue filter). */
export function republishCapabilityReasonListings(row: Record<string, unknown>, categoryRaw: string): string | null {
  const o = republishOverride(row);
  if (o === false) return "Staff disabled republish for this row";
  if (o === true) return null;

  const cat = lc(categoryRaw || row.category);
  if (cat === "comunidad") return "Community listings cannot be republished";
  if (cat === "clases") return "Classes listings cannot be republished";

  if (cat === "en-venta") {
    const plan = listingPlanFromDetailPairs(row.detail_pairs);
    if (plan !== "pro") return "Free listing";
    return null;
  }

  if (cat === "rentas") return null;

  if (cat === "bienes-raices") {
    return null;
  }

  if (cat === "travel" || cat === "viajes") {
    return "Use Viajes admin queue for republish";
  }

  if (cat === "autos") {
    return "Use Autos admin queue for republish";
  }

  if (cat === "empleos") {
    return "Use Empleos admin queue for republish";
  }

  return "Category not enabled for republish on generic listings";
}

export function canRepublishListingsRow(row: Record<string, unknown>, categoryRaw: string): boolean {
  return republishCapabilityReasonListings(row, categoryRaw) === null;
}

export function listingsRowIsPublicLive(row: Record<string, unknown>): boolean {
  const st = lc(row.status);
  if (st === "removed") return false;
  return row.is_published === true && st === "active";
}

export function republishCapabilityReasonRestaurantes(_row: Record<string, unknown>): string | null {
  const o = republishOverride(_row);
  if (o === false) return "Staff disabled republish for this row";
  if (o === true) return null;
  return null;
}

export function restauranteRowIsPublicLive(row: Record<string, unknown>): boolean {
  return lc(row.status) === "published";
}

export function republishCapabilityReasonServicios(_row: Record<string, unknown>): string | null {
  const o = republishOverride(_row);
  if (o === false) return "Staff disabled republish for this row";
  if (o === true) return null;
  return null;
}

export function serviciosRowIsPublicLive(row: Record<string, unknown>): boolean {
  return lc(row.listing_status) === "published";
}

export function republishCapabilityReasonEmpleos(_row: Record<string, unknown>): string | null {
  const o = republishOverride(_row);
  if (o === false) return "Staff disabled republish for this row";
  if (o === true) return null;
  return null;
}

export function empleosRowIsPublicLive(row: Record<string, unknown>): boolean {
  return lc(row.lifecycle_status) === "published";
}

export function republishCapabilityReasonAutos(row: Record<string, unknown>): string | null {
  const o = republishOverride(row);
  if (o === false) return "Staff disabled republish for this row";
  if (o === true) return null;

  const lane = lc(row.lane);
  const st = lc(row.status);
  // Paid lanes only; draft / checkout rows are not catalog-republish targets.
  if (lane !== "negocios" && lane !== "privado") return "Unknown Autos lane";
  if (st === "draft" || st === "pending_payment" || st === "payment_failed") return "Listing not yet live on Autos";
  return null;
}

export function autosRowIsPublicLive(row: Record<string, unknown>): boolean {
  return lc(row.status) === "active";
}

export function republishCapabilityReasonViajes(row: Record<string, unknown>): string | null {
  const o = republishOverride(row);
  if (o === false) return "Staff disabled republish for this row";
  if (o === true) return null;
  const st = lc(row.lifecycle_status);
  if (st === "draft" || st === "submitted" || st === "in_review" || st === "rejected" || st === "changes_requested" || st === "expired") {
    return "Offer not in a republishable state";
  }
  return null;
}

export function viajesRowIsPublicLive(row: Record<string, unknown>): boolean {
  return lc(row.lifecycle_status) === "approved" && row.is_public === true;
}

/**
 * @param category — `listings.category`, or vertical slug: `restaurantes`, `servicios`, `empleos`, `autos`, `viajes`.
 */
export function republishCapabilityReason(row: Record<string, unknown>, category: string): string | null {
  const c = lc(category);
  if (c === "restaurantes") return republishCapabilityReasonRestaurantes(row);
  if (c === "servicios") return republishCapabilityReasonServicios(row);
  if (c === "empleos") return republishCapabilityReasonEmpleos(row);
  if (c === "autos") return republishCapabilityReasonAutos(row);
  if (c === "viajes" || c === "travel") return republishCapabilityReasonViajes(row);
  return republishCapabilityReasonListings(row, category);
}

export function canRepublishListing(row: Record<string, unknown>, category: string): boolean {
  return republishCapabilityReason(row, category) === null;
}

export function republishActionLabel(row: Record<string, unknown>, category: string): RepublishActionLabelResult {
  const reason = republishCapabilityReason(row, category);
  if (reason) {
    return { label: "No republish", disabled: true, reason };
  }
  const c = lc(category);
  let live = false;
  if (c === "restaurantes") live = restauranteRowIsPublicLive(row);
  else if (c === "servicios") live = serviciosRowIsPublicLive(row);
  else if (c === "empleos") live = empleosRowIsPublicLive(row);
  else if (c === "autos") live = autosRowIsPublicLive(row);
  else if (c === "viajes" || c === "travel") live = viajesRowIsPublicLive(row);
  else live = listingsRowIsPublicLive(row);

  if (live) return { label: "Move to top", disabled: false };
  return { label: "Republish", disabled: false };
}
