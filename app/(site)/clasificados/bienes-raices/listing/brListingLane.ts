/**
 * Gate I.5.4A — deterministic Bienes Raíces listing lane classification.
 *
 * Uses only canonical, already-persisted evidence already set correctly by both publish
 * builders (confirmed by reading `leonixPublishRealEstateFromDraftState.ts` directly):
 *   - `buildPublishParamsFromBienesRaicesPrivadoDraft` always sets `sellerType: "personal"`.
 *   - `buildPublishParamsFromBienesRaicesNegocioDraft` always sets `sellerType: "business"`
 *     (this is also the live agente-individual/Negocio-parent path's downstream target, and the
 *     inventory-child publish path funnels through it too — so `seller_type` is reliably
 *     "business" for every Negocio-family row, parent or child).
 * Child-vs-parent within Negocio reuses the exact same evidence
 * `BienesRaicesNegocioLiveDetailShell.tsx` already used before this gate
 * (`inventory_role === "inventory_property"` + a non-empty parent id) — not redefined, only
 * extracted into a shared, testable helper.
 *
 * Never classifies by title text, UI labels, or any other fragile signal.
 */

export type BrListingLane = "privado" | "negocio_parent" | "negocio_child";

export type BrLaneEvidence = {
  /** camelCase (client-shaped `Listing`) or snake_case (raw DB row) — both accepted. */
  sellerType?: string | null;
  seller_type?: string | null;
  inventoryRole?: string | null;
  inventory_role?: string | null;
  brInventoryParentListingId?: string | null;
  br_inventory_parent_listing_id?: string | null;
};

export function resolveBrListingLane(listing: BrLaneEvidence): BrListingLane {
  const sellerType = String(listing.sellerType ?? listing.seller_type ?? "").trim().toLowerCase();
  const inventoryRole = String(listing.inventoryRole ?? listing.inventory_role ?? "").trim();
  const parentId = String(listing.brInventoryParentListingId ?? listing.br_inventory_parent_listing_id ?? "").trim();
  const isChild = inventoryRole === "inventory_property" && Boolean(parentId);

  if (sellerType === "business") {
    return isChild ? "negocio_child" : "negocio_parent";
  }
  // Privado never has parent/child inventory (registry: supportsParentChildInventory: false) —
  // any listing that isn't confirmed "business" is treated as Privado, matching the publish
  // contract exactly (Privado is the only other value the publish builders ever set).
  return "privado";
}
