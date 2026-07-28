/**
 * Gate D — canonical dashboard action resolver.
 *
 * Pure function: no React, no browser globals, no Supabase calls, no localStorage, no
 * mutation. Consumes the Gate B category route registry so every route is resolved through
 * the same canonical adapters already used to build/verify identity — never guessed here.
 *
 * SCOPE BOUNDARY (deliberate, not an oversight): this gate's resolver only emits
 * `actionKind: "navigate"` actions with a real, static href. Coupon/offers/inventory-pack
 * *activation* (starting a Revenue OS checkout) and lifecycle mutations (pause/resume/archive/
 * mark-sold) are live client-side async handlers in the current codebase, not navigable URLs —
 * representing them here would require either widening `DashboardAction` to carry a
 * handler/action-id (a real contract change) or reaching into checkout/lifecycle architecture,
 * both explicitly locked for this gate ("Do not change coupon architecture in this gate",
 * "Do not create new pause/archive/reactivate APIs in this gate"). Only the "manage" (edit
 * already-active content) half of coupons/offers/inventory is represented — never "activate".
 */

import { getCategoryRouteAdapter, type CategoryRouteRegistry } from "./categoryRouteRegistry";
import type { DashboardAction, DashboardActionContext } from "./dashboardActionTypes";
import { isCanonicalUuid } from "./identityBuilders";
import type { InventoryRole } from "./types";

function isParentRole(role: InventoryRole | null): boolean {
  return role == null || role === "main";
}

function isChildRole(role: InventoryRole | null): boolean {
  return role === "inventory_property" || role === "inventory_vehicle";
}

/** `/dashboard/mis-anuncios/{id}` workspace Analytics tab — the confirmed generic pattern for
 * `listings`-table rows (en-venta, bienes-raices, rentas, etc.), not category-specific. */
function genericWorkspaceAnalyticsHref(sourceId: string, lang: "es" | "en"): string {
  return `/dashboard/mis-anuncios/${encodeURIComponent(sourceId)}?lang=${lang}`;
}

/** Mirrors autosPaidListingAnalyticsHref (app/lib/clasificados/autos/autosPaidListingAnalyticsHref.ts:6-21)
 * — same query-param shape, not imported for the same dependency-direction reason documented
 * in categoryRouteRegistry.ts's file header. */
function autosListingAnalyticsHref(sourceId: string, leonixAdId: string, lang: "es" | "en"): string {
  const q = new URLSearchParams({
    source_table: "autos_classifieds_listings",
    source_id: sourceId,
    category: "autos",
    lang,
  });
  if (leonixAdId) q.set("canonical_ad_id", leonixAdId);
  return `/dashboard/analytics/listing?${q.toString()}`;
}

/**
 * Resolve the truthful, supported dashboard actions for one canonical listing identity.
 * Returns an empty array (never a partial/fake action) when ownership isn't verified or the
 * source UUID doesn't validate — this is the resolver's only hard rejection; every other
 * omission is per-action (a specific action is simply never pushed when unsupported).
 */
export function resolveDashboardActions(context: DashboardActionContext): DashboardAction[] {
  const { identity } = context;

  if (!context.ownerVerified) return [];
  if (!isCanonicalUuid(identity.sourceId)) return [];

  const adapter = getCategoryRouteAdapter(identity.pipeline as keyof CategoryRouteRegistry);
  if (!adapter) return [];

  const opts = { lang: context.lang };
  const parent = isParentRole(context.role);
  const child = isChildRole(context.role);

  const actions: DashboardAction[] = [];
  const push = (
    key: DashboardAction["key"],
    labelEs: string,
    labelEn: string,
    href: string | null | undefined,
    requiresEntitlement = false,
  ): void => {
    const trimmed = href?.trim();
    if (!trimmed) return;
    actions.push({
      key,
      labelEs,
      labelEn,
      href: trimmed,
      actionKind: "navigate",
      category: identity.category,
      pipeline: identity.pipeline,
      sourceId: identity.sourceId,
      leonixAdId: identity.leonixAdId,
      requiresEntitlement,
      destructive: false,
    });
  };

  // --- View public: every pipeline, every role — always the identity's own public route. ---
  push("viewPublic", "Ver público", "View public", adapter.publicRoute(identity, opts));

  // --- Preview ---
  // Bienes children: no genuine per-child preview confirmed — omitted entirely (see the
  // BIENES_RAICES_NEGOCIO_ADAPTER.knownLimitations entry citing BrNegocioListingInventoryActions.tsx).
  const previewSupported = !(identity.pipeline === "bienes_raices_negocio" && child);
  if (previewSupported) {
    push("preview", "Vista previa", "Preview", adapter.previewRoute(identity, opts));
  }

  // --- Edit ---
  // Bienes and Autos children: no per-child edit UI exists today — locked product rule for
  // this gate ("Do not expose Edit until the real per-child dashboard entry point exists").
  const editSupported = !(
    (identity.pipeline === "bienes_raices_negocio" || identity.pipeline === "autos_negocios") &&
    child
  );
  if (editSupported) {
    push("edit", "Editar anuncio", "Edit listing", adapter.editRoute(identity, opts));
  }

  // --- Analytics --- (per confirmed live truth per pipeline; never a guessed/fallback identity)
  if (identity.pipeline === "servicios") {
    // CATEGORY_LISTING_TOOL_TRUTH.servicios.analytics === "ready"
    // (dashboardMisAnunciosCategoryTools.ts:86-92); confirmed href in buildServiciosInventoryItems
    // (dashboardInventory.ts:320): `/dashboard/analytics?lang=...`.
    push("analytics", "Analíticas", "Analytics", `/dashboard/analytics?lang=${context.lang}`);
  } else if (identity.pipeline === "restaurantes") {
    // CATEGORY_LISTING_TOOL_TRUTH.restaurantes.analytics === "unproven" — omitted, not guessed.
  } else if (identity.pipeline === "autos_negocios") {
    // Confirmed live: analytics link only shown when status === "active"
    // (AutosDealerInventoryDashboardSection.tsx:277-291, :358-369).
    if (context.lifecycle.status === "active") {
      push(
        "analytics",
        "Ver analíticas",
        "View analytics",
        autosListingAnalyticsHref(identity.sourceId, identity.leonixAdId, context.lang),
      );
    }
  } else if (identity.pipeline === "bienes_raices_negocio") {
    // No dedicated per-listing analytics link found in LeonixRealEstateListingManageCard.tsx —
    // uses the generic /dashboard/mis-anuncios/{id} workspace Analytics tab pattern confirmed
    // for `listings`-table categories elsewhere; applied to both parent and child rows.
    push("analytics", "Analíticas", "Analytics", genericWorkspaceAnalyticsHref(identity.sourceId, context.lang));
  }
  // autos_privado: no confirmed per-listing analytics route — omitted, not guessed.

  // --- Manage coupons / offers / inventory --- (parent-only; entitlement-gated per confirmed
  // live behavior; never an "activate" action — see file header scope boundary.)
  if (identity.pipeline === "restaurantes" && parent && context.entitlement.couponsActive) {
    push(
      "manageCoupons",
      "Editar cupones",
      "Edit coupons",
      adapter.secondaryManageRoute?.(identity, opts),
      true,
    );
  }
  if (identity.pipeline === "servicios" && parent && context.entitlement.offersActive) {
    push(
      "manageOffers",
      "Editar ofertas",
      "Edit offers",
      adapter.secondaryManageRoute?.(identity, opts),
      true,
    );
  }
  if (identity.pipeline === "bienes_raices_negocio" && parent && context.entitlement.inventoryPackActive) {
    // Confirmed live: BrNegocioListingInventoryActions.tsx:163-169 only renders the inventory
    // edit Link when `upgradeActive` — otherwise it renders an activation button instead
    // (out of this gate's scope per the file header).
    push(
      "manageInventory",
      "Administrar inventario",
      "Manage inventory",
      adapter.secondaryManageRoute?.(identity, opts),
      true,
    );
  }
  if (identity.pipeline === "autos_negocios" && parent) {
    // Confirmed live: AutosDealerInventoryDashboardSection.tsx:370-377 renders this link
    // unconditionally for any parent with an id — NOT entitlement-gated in the current UI,
    // unlike Bienes above. This is an existing asymmetry between the two pipelines' live
    // dashboards, not something introduced by this resolver.
    push(
      "manageInventory",
      "Administrar inventario",
      "Manage inventory",
      adapter.secondaryManageRoute?.(identity, opts),
      false,
    );
  }

  return actions;
}
