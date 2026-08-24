import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import { buildListingIdentity, resolveDashboardActions, type DashboardAction } from "@/app/lib/listingIdentity";
import type { DashboardInventoryItem } from "./dashboardInventory";
import {
  type MisAnunciosCategoryDef,
  type MisAnunciosCategoryKey,
  provenInventoryAnalyticsHref,
} from "./dashboardMisAnunciosCategories";

/** Quick-tool keys for Mis anuncios category + listing workspaces. */
export type CategoryToolKey =
  | "openPanel"
  | "publish"
  | "publicResults"
  | "publicView"
  | "preview"
  | "edit"
  | "analytics"
  | "refresh"
  | "pause"
  | "archive"
  | "markSold"
  | "reactivate"
  | "couponUpgrade"
  | "couponEdit";

export type CategoryToolStatus = "ready" | "hidden" | "future" | "unproven";

export type CategoryPanelAction = {
  key: "openPanel" | "publish" | "publicResults";
  label: string;
  href: string;
  tone: "primary" | "secondary" | "manage";
};

/**
 * Gate 2C — extended to match `ActionItem`'s semantic tones (`DashboardListingActionBar.tsx`):
 * "positive"/"warning"/"danger" for lifecycle actions, "premium" for specialized/add-on
 * tools. Kept as a separate type (not a re-export) since this file predates that component
 * and other callers may still only supply the original three — but the value sets are
 * identical, so anything built here renders correctly through the shared action bar.
 */
export type ListingPanelAction = {
  href?: string;
  label: string;
  tone?: "primary" | "secondary" | "subtle" | "positive" | "warning" | "danger" | "premium";
  onClick?: () => void;
  disabled?: boolean;
};

/** Category-level tools in the selected category workspace panel. */
export const CATEGORY_PANEL_TOOL_TRUTH: Record<
  MisAnunciosCategoryKey,
  Partial<Record<"openPanel" | "publish" | "publicResults", CategoryToolStatus>>
> = {
  "en-venta": { openPanel: "hidden", publish: "ready", publicResults: "ready" },
  restaurantes: { openPanel: "ready", publish: "ready", publicResults: "ready" },
  servicios: { openPanel: "ready", publish: "ready", publicResults: "ready" },
  "comida-local": { openPanel: "hidden", publish: "ready" },
  autos: { openPanel: "hidden", publish: "ready", publicResults: "ready" },
  empleos: { openPanel: "ready", publish: "ready", publicResults: "ready" },
  rentas: { openPanel: "hidden", publish: "ready", publicResults: "ready" },
  "bienes-raices": { openPanel: "hidden", publish: "ready", publicResults: "ready" },
  viajes: { openPanel: "ready", publish: "ready", publicResults: "ready" },
  clases: { publish: "future" },
  comunidad: { publish: "future" },
  busco: { openPanel: "hidden", publish: "ready" },
  // Work Package I.8B — Mascotas now discoverable in Mis Anuncios (real rows, canonical UUID,
  // safe public route). No dedicated category panel, same as Busco.
  mascotas: { openPanel: "hidden", publish: "ready", publicResults: "ready" },
};

/** Listing-level tools on Mis anuncios cards. */
export const CATEGORY_LISTING_TOOL_TRUTH: Record<
  MisAnunciosCategoryKey,
  Partial<Record<CategoryToolKey, CategoryToolStatus>>
> = {
  "en-venta": {
    publicView: "ready",
    analytics: "ready",
    refresh: "ready",
    pause: "ready",
    archive: "ready",
    markSold: "ready",
    reactivate: "ready",
    edit: "ready",
  },
  restaurantes: {
    publicView: "ready",
    openPanel: "ready",
    preview: "ready",
    publicResults: "ready",
    analytics: "unproven",
    couponUpgrade: "ready",
    couponEdit: "ready",
  },
  servicios: {
    publicView: "ready",
    openPanel: "ready",
    preview: "ready",
    publicResults: "ready",
    analytics: "ready",
    // Package E Build E2, Gate 4 — real backend already exists
    // (/api/clasificados/servicios/manage, owner-verified, slug-keyed, published <->
    // paused_unpublished state machine), previously only wired on the separate
    // /dashboard/servicios page. Now also available on the unified My Listings card.
    pause: "ready",
    reactivate: "ready",
  },
  "comida-local": { publicView: "ready", analytics: "unproven" },
  autos: { publicView: "ready", archive: "ready", analytics: "ready" },
  empleos: {
    publicView: "ready",
    edit: "ready",
    preview: "ready",
    publicResults: "ready",
    analytics: "ready",
    // Package E Build E2, Gate 4 — real backend already exists
    // (PATCH /api/clasificados/empleos/listings/{id}, owner-verified, accepts
    // published|paused|archived|draft with no per-transition gating), previously only wired on
    // the /dashboard/empleos/[listingId] detail page. Now also available on the unified card.
    pause: "ready",
    archive: "ready",
    reactivate: "ready",
  },
  rentas: {
    publicView: "ready",
    analytics: "ready",
    pause: "ready",
    archive: "ready",
    reactivate: "ready",
  },
  "bienes-raices": {
    publicView: "ready",
    analytics: "ready",
    pause: "ready",
    archive: "ready",
    markSold: "ready",
    reactivate: "ready",
    edit: "ready",
  },
  viajes: {
    publicView: "ready",
    edit: "ready",
    preview: "ready",
    publicResults: "ready",
    analytics: "ready",
  },
  clases: { publicView: "ready", publicResults: "ready", analytics: "unproven", archive: "ready" },
  comunidad: { publicView: "ready", publicResults: "ready", analytics: "unproven", archive: "ready" },
  busco: { publicView: "ready", publicResults: "ready", analytics: "unproven", archive: "ready" },
  // Work Package I.8B — View public and Archive use the same generic, already-safe mechanisms as
  // Busco/Clases/Comunidad. Edit carries no key here for the same reason as Busco/Clases/
  // Comunidad: the Edit action for the generic listings family is delivered by
  // resolveDashboardActions from the registry editRoute — which Globalization Package A Gate 5
  // wired to the generic owner-verified editor for Mascotas (safety-proven; see the registry's
  // adapter comment). Analytics stays "unproven" — no per-listing analytics route confirmed.
  mascotas: { publicView: "ready", publicResults: "ready", analytics: "unproven", archive: "ready" },
};

export function categoryPanelToolStatus(
  category: MisAnunciosCategoryKey | string,
  tool: "openPanel" | "publish" | "publicResults",
): CategoryToolStatus {
  const key = category as MisAnunciosCategoryKey;
  return CATEGORY_PANEL_TOOL_TRUTH[key]?.[tool] ?? "hidden";
}

export function listingToolStatus(
  category: MisAnunciosCategoryKey | string,
  tool: CategoryToolKey,
): CategoryToolStatus {
  const key = category as MisAnunciosCategoryKey;
  return CATEGORY_LISTING_TOOL_TRUTH[key]?.[tool] ?? "hidden";
}

export function categoryPanelToolIsReady(
  category: MisAnunciosCategoryKey | string,
  tool: "openPanel" | "publish" | "publicResults",
): boolean {
  return categoryPanelToolStatus(category, tool) === "ready";
}

export function listingToolIsReady(category: MisAnunciosCategoryKey | string, tool: CategoryToolKey): boolean {
  return listingToolStatus(category, tool) === "ready";
}

export function categoryToolsTrustCopy(lang: Lang): string {
  return lang === "es"
    ? "Solo mostramos herramientas disponibles para esta categoría."
    : "We only show tools available for this category.";
}

/**
 * Gate 2C — canonical primary owner doorway label, locked across every category that
 * has a truthful manage/edit/workspace destination. Do not use "Gestionar"/"Gestionar
 * vacante"/"Gestionar envío"/"Editar anuncio"/"Ver detalles" as a primary card doorway —
 * those may still exist as secondary/specialized concepts inside the destination the
 * owner lands on, just not as the card's own primary label.
 */
export function openPanelLabel(lang: Lang): string {
  return lang === "es" ? "Administrar anuncio" : "Manage listing";
}

export function editListingLabel(lang: Lang): string {
  return lang === "es" ? "Editar anuncio" : "Edit listing";
}

export function publishLabel(lang: Lang): string {
  return lang === "es" ? "Publicar" : "Publish";
}

export function publicResultsLabel(lang: Lang): string {
  return lang === "es" ? "Ver resultados" : "View results";
}

export function publicViewLabel(lang: Lang): string {
  return lang === "es" ? "Ver público" : "View public";
}

export function previewLabel(lang: Lang): string {
  return lang === "es" ? "Vista previa" : "Preview";
}

export function analyticsLabel(lang: Lang): string {
  return lang === "es" ? "Analíticas" : "Analytics";
}

export function publicResultsListingLabel(lang: Lang): string {
  return lang === "es" ? "Ver en resultados públicos" : "View in public results";
}

export function archiveListingLabel(lang: Lang): string {
  return lang === "es" ? "Archivar anuncio" : "Archive listing";
}

export function pauseListingLabel(lang: Lang): string {
  return lang === "es" ? "Pausar anuncio" : "Pause listing";
}

export function resumeListingLabel(lang: Lang): string {
  return lang === "es" ? "Reactivar anuncio" : "Reactivate listing";
}

export function markSoldListingLabel(lang: Lang): string {
  return lang === "es" ? "Marcar vendido" : "Mark sold";
}

export function republishListingLabel(lang: Lang): string {
  return lang === "es" ? "Republicar anuncio" : "Republish listing";
}

export function manageInventoryLabel(lang: Lang): string {
  return lang === "es" ? "Gestionar inventario" : "Manage inventory";
}

export function offersAndCouponsLabel(lang: Lang): string {
  return lang === "es" ? "Ofertas y cupones" : "Offers & coupons";
}

export function applicationsLabel(lang: Lang): string {
  return lang === "es" ? "Solicitudes" : "Applications";
}

/** Dedicated dashboard hub — not the Mis anuncios self-ref workspace. */
export function isDedicatedCategoryPanelHref(href: string | null | undefined): boolean {
  if (!href) return false;
  return href.startsWith("/dashboard/") && !href.startsWith("/dashboard/mis-anuncios");
}

/** Category-level CTAs for the selected category workspace panel. */
export function buildCategoryPanelActions(
  def: MisAnunciosCategoryDef,
  lang: Lang,
  q: string,
): CategoryPanelAction[] {
  const actions: CategoryPanelAction[] = [];
  const key = def.key;

  const manageHref = def.manageHref(q);
  if (
    def.ready &&
    manageHref &&
    isDedicatedCategoryPanelHref(manageHref) &&
    categoryPanelToolIsReady(key, "openPanel")
  ) {
    actions.push({
      key: "openPanel",
      label: openPanelLabel(lang),
      href: manageHref,
      tone: "manage",
    });
  }

  const publishHref = def.publishHref(q);
  if (def.ready && publishHref && categoryPanelToolIsReady(key, "publish")) {
    actions.push({
      key: "publish",
      label: publishLabel(lang),
      href: publishHref,
      tone: "primary",
    });
  }

  const resultsHref = def.resultsHref?.(q) ?? null;
  if (resultsHref && categoryPanelToolIsReady(key, "publicResults")) {
    actions.push({
      key: "publicResults",
      label: key === "servicios" ? publicResultsListingLabel(lang) : publicResultsLabel(lang),
      href: resultsHref,
      tone: "secondary",
    });
  }

  return actions;
}

type InventoryCategory = "restaurantes" | "servicios" | "empleos" | "viajes";

type CanonicalInventoryCategory = "restaurantes" | "servicios";

const CANONICAL_SOURCE_TABLE: Record<
  CanonicalInventoryCategory,
  "restaurantes_public_listings" | "servicios_public_listings"
> = {
  restaurantes: "restaurantes_public_listings",
  servicios: "servicios_public_listings",
};

/**
 * Gate D.1 — resolves the truthful, canonical-identity href actions for one inventory item
 * (Restaurantes/Servicios only). Returns an empty map (never a guessed/fallback href) when
 * ownership isn't available or the item's id doesn't validate as the real DB uuid — callers
 * must keep their existing legacy href as the fallback in that case, never render nothing.
 */
function canonicalInventoryHrefActions(
  category: CanonicalInventoryCategory,
  item: DashboardInventoryItem,
  ownerUserId: string | null | undefined,
  lang: Lang,
): Map<string, DashboardAction> {
  const owner = ownerUserId?.trim();
  if (!owner) return new Map();

  const identityResult = buildListingIdentity({
    sourceTable: CANONICAL_SOURCE_TABLE[category],
    sourceId: item.id,
    category,
    pipeline: category,
    leonixAdId: item.leonixAdId ?? "",
    ownerUserId: owner,
    publicUrl: item.publicHref,
  });
  if (!identityResult.ok) return new Map();

  const actions = resolveDashboardActions({
    identity: identityResult.identity,
    lifecycle: { status: item.status },
    entitlement: {
      couponsActive: item.restaurantCouponEditEligible,
      offersActive: item.serviciosOffersAddonActive,
    },
    role: null,
    ownerVerified: true,
    lang: lang === "en" ? "en" : "es",
  });

  return new Map(actions.map((action) => [action.key, action]));
}

/** Listing-level CTAs for inventory cards (restaurant, service, jobs, travel). */
export function buildInventoryListingActions(
  category: InventoryCategory,
  item: DashboardInventoryItem,
  lang: Lang,
  q: string,
  opts?: {
    onCouponUpgrade?: () => void;
    couponUpgradeBusy?: boolean;
    onCouponEdit?: () => void;
    couponEditBusy?: boolean;
    /** Servicios P0C listing-edit route (mode=listing-edit, returnPanel=servicios, identity). */
    serviciosEditHref?: string;
    /** Servicios P0C offers-edit route (mode=offers-edit&focus=coupon-upgrade). */
    serviciosOffersEditHref?: string;
    /** True when the Servicios listing already shows offers/coupons content. */
    serviciosOffersActive?: boolean;
    /** Category-specific edit label override (e.g. "Editar servicio"). */
    editLabelOverride?: string;
    /** Servicios offers-edit CTA label override (e.g. "Editar ofertas"). */
    offersEditLabelOverride?: string;
    /** Gate D.1 — page-level authenticated owner id; required to source resolver hrefs. */
    ownerUserId?: string | null;
    /** Package E Build E2, Gate 4 — real pause/resume via /api/clasificados/servicios/manage. */
    onServiciosManage?: (action: "pause" | "resume") => void;
    serviciosManageBusy?: boolean;
    /** Package E Build E2, Gate 4 — real pause/archive/resume via PATCH
     * /api/clasificados/empleos/listings/{id}. */
    onEmpleosLifecycle?: (next: "published" | "paused" | "archived") => void;
    empleosLifecycleBusy?: boolean;
  },
): ListingPanelAction[] {
  const actions: ListingPanelAction[] = [];

  const canonical: Map<string, DashboardAction> =
    category === "restaurantes" || category === "servicios"
      ? canonicalInventoryHrefActions(category, item, opts?.ownerUserId, lang)
      : new Map();

  if (category === "servicios" && listingToolIsReady(category, "openPanel")) {
    // Servicios existing-listing edit must carry P0C identity (mode=listing-edit, returnPanel=servicios).
    // Gate D.4 — canonical resolver output preferred (verified parity in Gate D.4's read-only
    // pass: `listingSlug` is a hydration fallback only, never required when a real listingId is
    // present), falling back to the existing opts/href chain when identity isn't available.
    // Gate 2C — this IS Servicios' single canonical primary doorway (the destination the
    // legacy `actionContract.manageUrl` branch used to duplicate with a second, conflicting
    // "Administrar anuncio" button — that branch is retired below). Labeled as the canonical
    // primary doorway, not "Editar anuncio", since it's now the one place "manage this
    // listing" means for Servicios.
    actions.push({
      href: canonical.get("edit")?.href ?? opts?.serviciosEditHref ?? item.editHref,
      label: opts?.editLabelOverride ?? openPanelLabel(lang),
      tone: "primary",
    });
  }

  if (
    category === "servicios" &&
    opts?.serviciosOffersActive &&
    opts?.serviciosOffersEditHref
  ) {
    // Gate 2C — specialized/add-on action, gold "premium" role; not a second primary.
    actions.push({
      href: opts.serviciosOffersEditHref,
      label: opts.offersEditLabelOverride ?? offersAndCouponsLabel(lang),
      tone: "premium",
    });
  }

  if (listingToolIsReady(category, "publicView")) {
    // Gate 2C — view-tier action for every category (previously "primary" for
    // non-Servicios categories, which competed visually with the real manage doorway).
    actions.push({
      href: canonical.get("viewPublic")?.href ?? item.publicHref,
      label: publicViewLabel(lang),
      tone: "secondary",
    });
  }

  if (category === "restaurantes" && listingToolIsReady(category, "openPanel")) {
    // Gate 2C — canonical primary doorway; this dedicated page is Restaurantes' real
    // manage surface (form-hydration edit model, no listing-scoped sub-route exists).
    actions.push({
      href: `/dashboard/restaurantes?${q}`,
      label: openPanelLabel(lang),
      tone: "primary",
    });
  }

  if (
    category === "restaurantes" &&
    item.restaurantCouponUpgradeEligible &&
    listingToolIsReady(category, "couponUpgrade") &&
    opts?.onCouponUpgrade
  ) {
    // Gate 2C — specialized/add-on action, gold "premium" role; not a second primary.
    actions.push({
      label: opts.couponUpgradeBusy
        ? lang === "es"
          ? "Iniciando pago…"
          : "Starting checkout…"
        : lang === "es"
          ? "Agregar cupones +$99/mes"
          : "Add coupons +$99/mo",
      onClick: opts.onCouponUpgrade,
      disabled: opts.couponUpgradeBusy,
      tone: "premium",
    });
  }

  if (
    category === "restaurantes" &&
    item.restaurantCouponEditEligible &&
    listingToolIsReady(category, "couponEdit") &&
    opts?.onCouponEdit
  ) {
    // Gate 2C — specialized/add-on action, gold "premium" role; not a second primary.
    // Kept as the specific "edit existing coupons" label (distinct from the generic
    // "Ofertas y cupones" concept used where no more precise action exists) so the
    // distinction between adding vs. editing coupons isn't lost.
    actions.push({
      label: opts.couponEditBusy
        ? lang === "es"
          ? "Cargando…"
          : "Loading…"
        : lang === "es"
          ? "Editar cupones"
          : "Edit coupons",
      onClick: opts.onCouponEdit,
      disabled: opts.couponEditBusy,
      tone: "premium",
    });
  }

  if (
    category === "servicios" &&
    item.status === "published" &&
    listingToolIsReady(category, "pause") &&
    opts?.onServiciosManage
  ) {
    // Gate 2C — lifecycle action, amber "warning" role (pause/caution).
    actions.push({
      label: opts.serviciosManageBusy
        ? lang === "es"
          ? "Pausando…"
          : "Pausing…"
        : pauseListingLabel(lang),
      onClick: () => opts.onServiciosManage!("pause"),
      disabled: opts.serviciosManageBusy,
      tone: "warning",
    });
  }

  if (
    category === "servicios" &&
    item.status === "paused_unpublished" &&
    listingToolIsReady(category, "reactivate") &&
    opts?.onServiciosManage
  ) {
    // Gate 2C — lifecycle action, green "positive" role (resume/reactivate).
    actions.push({
      label: opts.serviciosManageBusy
        ? lang === "es"
          ? "Restaurando…"
          : "Restoring…"
        : resumeListingLabel(lang),
      onClick: () => opts.onServiciosManage!("resume"),
      disabled: opts.serviciosManageBusy,
      tone: "positive",
    });
  }

  // Gate 2C, Task 2C-4 — the legacy `actionContract.manageUrl` branch that used to push a
  // SECOND, conflicting "Administrar anuncio" button here (pointing at
  // `/dashboard/servicios?listingSlug=...`, a different destination than the canonical
  // edit/manage href above) is retired. `buildServiciosDashboardActionContract` and
  // `item.actionContract` themselves are untouched — their other fields (publicUrl,
  // editUrl, resultsUrl, listingId fallbacks) are still real and still used elsewhere
  // (dashboardInventory.ts, mis-anuncios/page.tsx) — only this one duplicate CTA push is
  // removed, so one Servicios listing now has exactly one primary doorway.

  if (category === "empleos" && listingToolIsReady(category, "edit")) {
    // Gate 2C — canonical primary doorway (was "Gestionar vacante"/"Manage listing" with
    // no tone, i.e. visually secondary). Destination unchanged: /dashboard/empleos/{id}.
    actions.push({
      href: item.editHref,
      label: openPanelLabel(lang),
      tone: "primary",
    });
  }

  if (category === "empleos" && opts?.onEmpleosLifecycle) {
    const busyLabel = lang === "es" ? "Actualizando…" : "Updating…";
    if (item.status === "published" && listingToolIsReady(category, "pause")) {
      actions.push({
        label: opts.empleosLifecycleBusy ? busyLabel : pauseListingLabel(lang),
        onClick: () => opts.onEmpleosLifecycle!("paused"),
        disabled: opts.empleosLifecycleBusy,
        tone: "warning",
      });
    }
    if (item.status === "paused" && listingToolIsReady(category, "reactivate")) {
      actions.push({
        label: opts.empleosLifecycleBusy ? busyLabel : resumeListingLabel(lang),
        onClick: () => opts.onEmpleosLifecycle!("published"),
        disabled: opts.empleosLifecycleBusy,
        tone: "positive",
      });
    }
    if ((item.status === "published" || item.status === "paused") && listingToolIsReady(category, "archive")) {
      actions.push({
        label: opts.empleosLifecycleBusy ? busyLabel : archiveListingLabel(lang),
        onClick: () => opts.onEmpleosLifecycle!("archived"),
        disabled: opts.empleosLifecycleBusy,
        tone: "danger",
      });
    }
  }

  if (category === "viajes" && listingToolIsReady(category, "edit")) {
    // Gate 2C — canonical primary doorway (was "Gestionar envío"/"Manage submission" with
    // no tone). Destination unchanged (item.editHref) — Viajes' own routing was left as-is
    // per this gate's explicit "do not redesign Viajes" instruction; only the label/tone
    // that the owner sees on the Mis Anuncios card changed.
    actions.push({
      href: item.editHref,
      label: openPanelLabel(lang),
      tone: "primary",
    });
  }

  if (item.previewHref && listingToolIsReady(category, "preview")) {
    // Gate D.4 — canonical resolver output preferred for Servicios only (verified safe; `mode`
    // forced to "listing-edit" is inert since the Preview client defaults to the same value when
    // absent). Restaurantes/Empleos/Viajes keep their existing item.previewHref untouched.
    actions.push({
      href: (category === "servicios" ? canonical.get("preview")?.href : undefined) ?? item.previewHref,
      label: previewLabel(lang),
      tone: "subtle",
    });
  }

  if (item.resultsHref && listingToolIsReady(category, "publicResults")) {
    actions.push({
      href: item.resultsHref,
      label: publicResultsListingLabel(lang),
      tone: "subtle",
    });
  }

  const analyticsHref =
    (category === "servicios" ? canonical.get("analytics")?.href : undefined) ??
    provenInventoryAnalyticsHref(item);
  if (analyticsHref && listingToolIsReady(category, "analytics")) {
    actions.push({
      href: analyticsHref,
      label: analyticsLabel(lang),
      tone: "subtle",
    });
  }

  return actions.filter((action) => Boolean(action.href) || Boolean(action.onClick));
}

export function listingAnalyticsIsProven(category: string): boolean {
  return listingToolIsReady(category, "analytics");
}
