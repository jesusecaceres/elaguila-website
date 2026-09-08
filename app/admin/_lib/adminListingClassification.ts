/**
 * Work Package I.9A — one shared, additive Admin listing classification helper. Mirrors the
 * owner-dashboard's `classifyOwnerDashboardRow()` (app/(site)/dashboard/lib/
 * dashboardOwnerClassification.ts), but for the staff-facing Admin surface, and reuses the same
 * canonical `CanonicalCategoryKey` pipeline vocabulary from `app/lib/listingIdentity/types.ts`
 * instead of inventing a second identity system — Admin previously had zero usage of that
 * canonical type anywhere (confirmed by audit).
 *
 * This is deliberately narrow: it answers "which organizational group and canonical pipeline
 * does this row belong to," not "which actions are available" (see `adminActionTruth.ts`) or
 * "what should its status say" (see `adminStatusAttention.ts`). Never takes an owner id or any
 * write-capable value — pure classification only.
 */
import type { CanonicalCategoryKey } from "@/app/lib/listingIdentity/types";

export type AdminListingGroup = "business" | "private" | "inventory_child" | "unsupported";

export type AdminClassificationInput = {
  /** Raw category/slug string as already resolved by the caller (e.g. "restaurantes",
   * "bienes-raices", "rentas", "autos", "empleos", "viajes"/"travel", "en-venta", "clases",
   * "comunidad", "busco", "comida-local", "mascotas-y-perdidos", "servicios", or any other value
   * found on a live row — including genuinely unmodeled ones, which must classify as
   * "unsupported", never silently default to "private"). */
  category: string;
  /** "business" | "personal" when known (Rentas/BR/Autos seller_type, or equivalent). */
  sellerType?: string | null;
  /** Parsed BR/Rentas branch when the row came from the shared `listings` table
   * (`bienes_raices_negocio` | `bienes_raices_privado` | `rentas_negocio` | `rentas_privado`). */
  brRentasBranch?: string | null;
  /** Autos classified lane ("negocios" | "privado"). */
  autosLane?: string | null;
  /** Viajes lane ("business" | "private"). */
  viajesLane?: string | null;
  /** Inventory role when known — "inventory_property"/"inventory_vehicle" marks a child row. */
  inventoryRole?: string | null;
};

export type AdminListingClassification = {
  group: AdminListingGroup;
  pipeline: CanonicalCategoryKey | null;
};

const CHILD_ROLES = new Set(["inventory_property", "inventory_vehicle"]);

function normalize(raw: string | null | undefined): string {
  return String(raw ?? "").trim().toLowerCase();
}

export function classifyAdminListingRow(input: AdminClassificationInput): AdminListingClassification {
  const category = normalize(input.category);
  const inventoryRole = normalize(input.inventoryRole);
  const isChildRole = CHILD_ROLES.has(inventoryRole);

  let pipeline: CanonicalCategoryKey | null = null;
  let group: AdminListingGroup;

  if (category === "restaurantes") {
    pipeline = "restaurantes";
    group = "business";
  } else if (category === "servicios") {
    pipeline = "servicios";
    group = "business";
  } else if (category === "comida-local" || category === "comida_local") {
    pipeline = "comida_local";
    group = "business";
  } else if (category === "ofertas-locales" || category === "ofertas_locales") {
    // Ofertas/Cupones is a locked system for this package — classified for organizational
    // completeness only, no Admin surface for it was inspected or touched.
    pipeline = "ofertas_locales";
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
      pipeline = null;
      group = "unsupported";
    }
  } else if (category === "rentas") {
    const branch = normalize(input.brRentasBranch);
    const sellerType = normalize(input.sellerType);
    const isNegocio = branch === "rentas_negocio" || sellerType === "business";
    pipeline = isNegocio ? "rentas_negocio" : "rentas_privado";
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
  } else if (category === "viajes" || category === "travel") {
    const lane = normalize(input.viajesLane);
    pipeline = "viajes";
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
    pipeline = "mascotas_y_perdidos";
    group = "private";
  } else {
    pipeline = null;
    group = "unsupported";
  }

  if (isChildRole && group !== "inventory_child") {
    group = "inventory_child";
  }

  return { group, pipeline };
}
