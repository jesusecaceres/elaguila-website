/**
 * ASSISTED REOPEN (Autos) — stored canonical row -> the SAME draft shapes the owner dashboard edit
 * hydration produces. Pure: no fetch, no storage, no server-only.
 *
 * This is NOT a second mapper. The stored `listing_payload` is what the owner-side
 * `GET /api/clasificados/autos/listings/[id]` returns as `listing`, and the intake's own
 * `hydrateAutosDealerListingForDashboardEdit` / privado dashboard hydration run
 * `normalizeLoadedListing` (+ `autosLane: "privado"` for privado) over exactly that payload. The
 * staff reopen reads the identical payload from `GET /api/admin/sales-preview/bound-row` (the owner
 * bearer is not available to staff) and applies the same normalization, so the form is filled from
 * SERVER truth, never from whatever this browser remembers.
 */
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { normalizeLoadedListing } from "@/app/clasificados/autos/negocios/lib/autoDealerDraftDefaults";
import {
  normalizeAdditionalInventoryVehicles,
  type AutosAdditionalInventoryVehicleDraft,
} from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";

function payloadOf(row: Record<string, unknown> | null | undefined): Partial<AutoDealerListing> | null {
  const p = row?.listing_payload;
  return p && typeof p === "object" && !Array.isArray(p) ? (p as Partial<AutoDealerListing>) : null;
}

function hasVehicleIdentity(l: Partial<AutoDealerListing> | null): boolean {
  if (!l) return false;
  return Boolean(
    String(l.make ?? "").trim() || String(l.model ?? "").trim() || String(l.vin ?? "").trim() || String(l.vehicleTitle ?? "").trim(),
  );
}

export type AssistedDealerDraftFromRow = {
  listing: AutoDealerListing;
  vehicleTitleOverride: boolean;
  additionalInventoryVehicles: AutosAdditionalInventoryVehicleDraft[];
};

/**
 * Dealer parent row (+ the single assisted vehicle child) -> dealer application draft.
 *
 * The assisted save writes the SAME intake listing to the dealer parent AND to its one vehicle
 * child, so the parent payload already carries the vehicle fields and is the base. The child is used
 * only as a fallback for the vehicle identity fields when the parent payload has none (never as an
 * "additional inventory vehicle": that would show the same car twice). Embedded additional vehicles
 * come from the parent's own payload, exactly as the dashboard hydration reads them.
 * Returns null when the row is not a dealer parent (wrong lane, or an inventory child).
 */
export function assistedBoundRowToDealerDraft(
  row: Record<string, unknown> | null | undefined,
  children: ReadonlyArray<Record<string, unknown>> = [],
): AssistedDealerDraftFromRow | null {
  if (!row) return null;
  if (String(row.lane ?? "") !== "negocios") return null;
  if (String(row.inventory_role ?? "") === "inventory_vehicle") return null;
  const parent = payloadOf(row);
  if (!parent) return null;
  let merged: Partial<AutoDealerListing> = parent;
  const child = payloadOf(children[0]);
  if (!hasVehicleIdentity(parent) && hasVehicleIdentity(child)) {
    merged = { ...parent, ...child };
  }
  const listing = normalizeLoadedListing(merged);
  return {
    listing,
    vehicleTitleOverride: Boolean(listing.vehicleTitle?.trim()),
    additionalInventoryVehicles: normalizeAdditionalInventoryVehicles(listing.additionalInventoryVehicles ?? []),
  };
}

/** Privado row -> privado application listing (same shape the privado dashboard edit flushes). */
export function assistedBoundRowToPrivadoListing(
  row: Record<string, unknown> | null | undefined,
): AutoDealerListing | null {
  if (!row) return null;
  if (String(row.lane ?? "") !== "privado") return null;
  const payload = payloadOf(row);
  if (!payload) return null;
  return { ...(payload as AutoDealerListing), autosLane: "privado" };
}
