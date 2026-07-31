/**
 * Work Package I.9A — one shared Admin capability/action truth resolver. Classifies, per pipeline
 * and action, whether a real implemented handler exists in the current codebase. Every entry
 * below is backed by direct source inspection (route file existence + a real DB write inside
 * it) — not a guess and not a route-name-implies-it-works assumption, per this package's own
 * "an Admin action is working only when its real handler, authorization, target row, and result
 * are proven" requirement.
 *
 * This module makes no claim about the owner-dashboard equivalent (`resolveDashboardActions()`)
 * — that resolver is untouched, this is Admin-only and does not replace it.
 */
import type { CanonicalCategoryKey } from "@/app/lib/listingIdentity/types";

export type AdminActionKey =
  | "viewPublic"
  | "preview"
  | "openOwnerEditContext"
  | "suspend"
  | "unsuspend"
  | "approvePublish"
  | "archive"
  | "restore"
  | "markSoldFilledClosed"
  | "remove"
  | "inspectOwner"
  | "inspectPayment"
  | "inspectEntitlement"
  | "inspectReports"
  | "inspectParentChild";

export type AdminActionStatus =
  | "working"
  | "working_with_adapter"
  | "intentionally_unsupported"
  | "blocked"
  | "stale_or_unsafe"
  | "ui_only_no_handler";

type ActionTruthRow = Partial<Record<AdminActionKey, AdminActionStatus>>;

/**
 * Pipelines with a dedicated `app/api/admin/{category}/listings/[id]/route.ts` PATCH handler,
 * confirmed to call `requireAdminCookie` and perform a real `.update()` against that category's
 * own table: restaurantes, servicios, empleos (+ moderate route), autos (autos_classifieds_listings),
 * viajes (+ staged-listings/moderate route).
 *
 * Pipelines routed through the generic `app/api/admin/clasificados/listings/[id]/route.ts`
 * (shared `listings` table, category-branching PATCH): rentas, en_venta, bienes_raices_negocio,
 * bienes_raices_privado, comunidad, clases, busco, mascotas_y_perdidos, autos_privado.
 *
 * Pipelines confirmed to have a real Admin queue page but NO write route at all (direct
 * inspection: no suspend/archive handler, no fetch to /api/admin, only a GET search form and a
 * queue/live toggle link): comida_local.
 *
 * ofertas_locales is intentionally excluded from this truth table — it is a locked system for
 * this package (Ofertas/Cupones); no Admin write surface for it was inspected or classified here.
 */
const DEDICATED_ROUTE_PIPELINES = new Set<CanonicalCategoryKey>([
  "restaurantes",
  "servicios",
  "empleos",
  "autos_negocios",
  "viajes",
]);

const GENERIC_LISTINGS_ROUTE_PIPELINES = new Set<CanonicalCategoryKey>([
  "rentas_negocio",
  "rentas_privado",
  "en_venta",
  "bienes_raices_negocio",
  "bienes_raices_privado",
  "comunidad",
  "clases",
  "busco",
  "mascotas_y_perdidos",
  "autos_privado",
]);

const NO_WRITE_ROUTE_PIPELINES = new Set<CanonicalCategoryKey>(["comida_local"]);

function baseLifecycleTruth(hasDedicatedRoute: boolean, hasGenericRoute: boolean): ActionTruthRow {
  if (hasDedicatedRoute) {
    return {
      viewPublic: "working",
      inspectOwner: "working",
      inspectReports: "working",
      suspend: "working",
      unsuspend: "working",
      archive: "working",
      restore: "working",
      approvePublish: "working",
      inspectPayment: "working",
      inspectEntitlement: "working",
      // Preview/openOwnerEditContext/markSold/remove/inspectParentChild are per-pipeline —
      // filled in by the caller below, not defaulted here.
    };
  }
  if (hasGenericRoute) {
    return {
      viewPublic: "working",
      inspectOwner: "working",
      inspectReports: "working",
      suspend: "working_with_adapter",
      unsuspend: "working_with_adapter",
      archive: "working_with_adapter",
      restore: "working_with_adapter",
      approvePublish: "working_with_adapter",
      inspectPayment: "working",
      inspectEntitlement: "working",
    };
  }
  return {
    viewPublic: "working",
    inspectOwner: "working",
    inspectReports: "working",
    suspend: "ui_only_no_handler",
    unsuspend: "ui_only_no_handler",
    archive: "ui_only_no_handler",
    restore: "ui_only_no_handler",
    approvePublish: "ui_only_no_handler",
    inspectPayment: "intentionally_unsupported",
    inspectEntitlement: "intentionally_unsupported",
  };
}

/** Per-pipeline overrides for the actions that are never generic (mark sold, remove, preview,
 * owner-edit-context, parent/child inspection). Confirmed by direct inspection; only pipelines
 * with a real, evidence-backed fact are listed — anything else defaults to
 * "intentionally_unsupported" (never guessed as working). */
const PIPELINE_OVERRIDES: Partial<Record<CanonicalCategoryKey, ActionTruthRow>> = {
  restaurantes: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  servicios: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  empleos: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  autos_negocios: {
    markSoldFilledClosed: "intentionally_unsupported",
    remove: "blocked",
    preview: "working",
    openOwnerEditContext: "working",
    // Real gap confirmed by audit: Admin's write routes act directly on whatever UUID is passed,
    // with no parent/child guard analogous to the owner-dashboard's `resolveDashboardActions()`.
    inspectParentChild: "stale_or_unsafe",
  },
  bienes_raices_negocio: {
    markSoldFilledClosed: "intentionally_unsupported",
    remove: "blocked",
    preview: "working",
    openOwnerEditContext: "working",
    inspectParentChild: "stale_or_unsafe",
  },
  bienes_raices_privado: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  rentas_negocio: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  rentas_privado: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  en_venta: { markSoldFilledClosed: "working_with_adapter", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  autos_privado: { markSoldFilledClosed: "working_with_adapter", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  viajes: {
    markSoldFilledClosed: "intentionally_unsupported",
    remove: "blocked",
    // Preview/staff-edit-context for Viajes staged listings is confirmed real (moderation route),
    // but ambiguous which of the two lanes (negocios/privado) an id belongs to without a lookup
    // — same lane-ambiguity finding already established in I.7A for the owner-facing route.
    preview: "working_with_adapter",
    openOwnerEditContext: "working_with_adapter",
    inspectParentChild: "intentionally_unsupported",
  },
  clases: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  comunidad: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  busco: { markSoldFilledClosed: "intentionally_unsupported", remove: "blocked", preview: "working", openOwnerEditContext: "working", inspectParentChild: "intentionally_unsupported" },
  mascotas_y_perdidos: {
    markSoldFilledClosed: "intentionally_unsupported",
    remove: "blocked",
    preview: "working",
    // Confirmed: no safe category-specific editor exists yet (categoryRouteRegistry.ts
    // MASCOTAS_Y_PERDIDOS_ADAPTER.editRoute() still returns null) — same fact already
    // established on the owner-dashboard side (I.6B/I.8B), still true for Admin.
    openOwnerEditContext: "blocked",
    inspectParentChild: "intentionally_unsupported",
  },
  comida_local: { markSoldFilledClosed: "intentionally_unsupported", remove: "intentionally_unsupported", preview: "ui_only_no_handler", openOwnerEditContext: "ui_only_no_handler", inspectParentChild: "intentionally_unsupported" },
};

/** `remove` is deliberately "blocked" everywhere real destructive delete exists at the DB layer
 * only through the generic `deleteListingAction` (listings table only, gated, but hard-deletes
 * Mux assets — a genuinely destructive, low-frequency staff action this package does not
 * reclassify as a routine "working" listing action; it remains its own explicit, separately
 * gated tool, not part of the standard per-row action set this resolver certifies as safe to
 * wire into a generic action bar). */
export function resolveAdminActionTruth(pipeline: CanonicalCategoryKey | null): ActionTruthRow {
  if (!pipeline) {
    return {
      viewPublic: "intentionally_unsupported",
      preview: "intentionally_unsupported",
      openOwnerEditContext: "intentionally_unsupported",
      suspend: "intentionally_unsupported",
      unsuspend: "intentionally_unsupported",
      approvePublish: "intentionally_unsupported",
      archive: "intentionally_unsupported",
      restore: "intentionally_unsupported",
      markSoldFilledClosed: "intentionally_unsupported",
      remove: "intentionally_unsupported",
      inspectOwner: "intentionally_unsupported",
      inspectPayment: "intentionally_unsupported",
      inspectEntitlement: "intentionally_unsupported",
      inspectReports: "intentionally_unsupported",
      inspectParentChild: "intentionally_unsupported",
    };
  }

  const hasDedicated = DEDICATED_ROUTE_PIPELINES.has(pipeline);
  const hasGeneric = GENERIC_LISTINGS_ROUTE_PIPELINES.has(pipeline);
  const base = baseLifecycleTruth(hasDedicated, hasGeneric);
  const overrides = PIPELINE_OVERRIDES[pipeline] ?? {};

  return { ...base, ...overrides };
}

export function isAdminActionSafeToShow(status: AdminActionStatus | undefined): boolean {
  return status === "working" || status === "working_with_adapter";
}

export { DEDICATED_ROUTE_PIPELINES, GENERIC_LISTINGS_ROUTE_PIPELINES, NO_WRITE_ROUTE_PIPELINES };
