/**
 * Work Package I.8A — one shared, additive classification helper for the owner-facing Mis
 * Anuncios dashboard. Given the small set of facts each dashboard row/item already carries
 * (raw category string, seller/business lane, BR/Autos-Negocio branch, inventory role), decides:
 *   - which of the three organizational groups the row belongs in (business / private / child);
 *   - the canonical `CanonicalCategoryKey` pipeline it maps to, when resolvable;
 *   - whether it genuinely qualifies for Business Hub tooling (coupons/offers/inventory).
 *
 * This does NOT replace `resolveDashboardActions()` — that remains the sole source of truth for
 * which actions actually render, including its own entitlement/parent-child gating. This helper
 * only answers the coarser, page-organization question: which section does this row belong in,
 * and could Business Hub tooling ever apply to it at all (pipeline+role truth, not "is an
 * entitlement currently active"). Business Hub eligibility here is deliberately narrower than a
 * category adapter's `supportsBusinessHub` flag where the real `resolveDashboardActions()` never
 * emits any coupons/offers/inventory action for that pipeline today (Rentas Negocio, Viajes
 * business lane, Comida Local) — this helper reports what is actually true, not what a flag
 * aspires to.
 */
import type { CanonicalCategoryKey } from "@/app/lib/listingIdentity/types";

export type OwnerDashboardGroup = "business" | "private" | "inventory_child" | "unsupported";

export type DashboardClassificationInput = {
  /** Raw category string as already resolved by the caller (e.g. "restaurantes", "bienes-raices",
   * "rentas", "autos", "empleos", "viajes", "en-venta", "clases", "comunidad", "busco",
   * "comida-local", "servicios", or any other value found on a live row — including genuinely
   * unmodeled ones, which must classify as "unsupported", never silently default to "private"). */
  category: string;
  /** "business" | "personal" when known (Rentas/BR/Autos seller_type, or equivalent). */
  sellerType?: string | null;
  /** Parsed BR/Rentas branch when the row came from the shared `listings` table
   * (`bienes_raices_negocio` | `bienes_raices_privado` | `rentas_negocio` | `rentas_privado`),
   * mirrors `parseLeonixListingContract(...).branch`. */
  brRentasBranch?: string | null;
  /** Autos classified lane ("negocios" | "privado"), mirrors `DashboardInventoryItem.autosLane`. */
  autosLane?: string | null;
  /** Viajes lane ("business" | "private"), mirrors `DashboardInventoryItem.viajesLane`. */
  viajesLane?: string | null;
  /** Inventory role when known — "inventory_property"/"inventory_vehicle" marks a child row. */
  inventoryRole?: string | null;
};

export type DashboardClassification = {
  group: OwnerDashboardGroup;
  pipeline: CanonicalCategoryKey | null;
  /** True only when a real, live Business Hub action (coupons/offers/inventory) can ever be
   * emitted for this pipeline+role by `resolveDashboardActions()` today. */
  businessHubEligible: boolean;
};

const CHILD_ROLES = new Set(["inventory_property", "inventory_vehicle"]);

/** Pipelines resolveDashboardActions() genuinely wires a coupons/offers/inventory action for,
 * as a main/parent row. Kept in sync with `dashboardActionResolver.ts`'s own branches — do not
 * add an entry here unless a real action exists in that resolver. */
const REAL_BUSINESS_HUB_PIPELINES = new Set<CanonicalCategoryKey>([
  "restaurantes",
  "servicios",
  "bienes_raices_negocio",
  "autos_negocios",
]);

function normalize(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

export function classifyOwnerDashboardRow(input: DashboardClassificationInput): DashboardClassification {
  const category = normalize(input.category);
  const inventoryRole = normalize(input.inventoryRole);
  const isChildRole = CHILD_ROLES.has(inventoryRole);

  let pipeline: CanonicalCategoryKey | null = null;
  let group: OwnerDashboardGroup;

  if (category === "restaurantes") {
    pipeline = "restaurantes";
    group = "business";
  } else if (category === "servicios") {
    pipeline = "servicios";
    group = "business";
  } else if (category === "comida-local" || category === "comida_local") {
    pipeline = "comida_local";
    group = "business";
  } else if (category === "bienes-raices" || category === "bienes_raices") {
    const branch = normalize(input.brRentasBranch);
    if (branch === "bienes_raices_negocio") {
      pipeline = "bienes_raices_negocio";
      group = isChildRole ? "inventory_child" : "business";
    } else if (branch === "bienes_raices_privado") {
      pipeline = "bienes_raices_privado";
      group = "private";
    } else {
      // Genuinely unresolved BR branch — fail closed rather than guess business vs private.
      pipeline = null;
      group = "unsupported";
    }
  } else if (category === "rentas") {
    const branch = normalize(input.brRentasBranch);
    const sellerType = normalize(input.sellerType);
    const isNegocio = branch === "rentas_negocio" || sellerType === "business";
    pipeline = isNegocio ? "rentas_negocio" : "rentas_privado";
    // Rentas Negocio is organizationally a business listing, but no real coupons/offers/
    // inventory action exists for it today (see REAL_BUSINESS_HUB_PIPELINES) — group "business"
    // still applies for organization, hub eligibility is computed below from the real set.
    group = isNegocio ? "business" : "private";
  } else if (category === "autos") {
    const lane = normalize(input.autosLane);
    if (lane === "negocios") {
      pipeline = "autos_negocios";
      group = isChildRole ? "inventory_child" : "business";
    } else {
      pipeline = "autos_privado";
      group = "private";
    }
  } else if (category === "viajes") {
    const lane = normalize(input.viajesLane);
    pipeline = "viajes";
    // Same reasoning as Rentas Negocio above — real business lane, no live hub action.
    group = lane === "business" ? "business" : "private";
  } else if (category === "empleos") {
    pipeline = "empleos";
    group = "private";
  } else if (category === "en-venta" || category === "en_venta") {
    pipeline = "en_venta";
    group = "private";
  } else if (category === "clases") {
    pipeline = "clases";
    group = "private";
  } else if (category === "comunidad") {
    pipeline = "comunidad";
    group = "private";
  } else if (category === "busco") {
    pipeline = "busco";
    group = "private";
  } else if (category === "mascotas-y-perdidos" || category === "mascotas_y_perdidos") {
    // Confirmed by repository evidence: not in MIS_ANUNCIOS_CATEGORY_KEYS, no dashboardRoute,
    // no safe editRoute (categoryRouteRegistry.ts MASCOTAS_Y_PERDIDOS_ADAPTER). A category may be
    // marked unsupported only with repository evidence — this is that evidence.
    pipeline = "mascotas_y_perdidos";
    group = "unsupported";
  } else {
    // Genuinely unmodeled category — fail closed to unsupported/attention, never silently
    // treated as a private listing.
    pipeline = null;
    group = "unsupported";
  }

  if (isChildRole && group !== "inventory_child") {
    // Any row carrying a confirmed child inventory role is a child row regardless of the
    // category branch above (defense in depth — e.g. a future pipeline that reuses these role
    // strings without updating this function explicitly).
    group = "inventory_child";
  }

  const businessHubEligible =
    group !== "unsupported" &&
    !isChildRole &&
    pipeline != null &&
    REAL_BUSINESS_HUB_PIPELINES.has(pipeline);

  return { group, pipeline, businessHubEligible };
}
