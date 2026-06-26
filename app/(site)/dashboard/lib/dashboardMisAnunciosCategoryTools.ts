import type { Lang } from "@/app/clasificados/config/clasificadosHub";
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
  | "reactivate";

export type CategoryToolStatus = "ready" | "hidden" | "future" | "unproven";

export type CategoryPanelAction = {
  key: "openPanel" | "publish" | "publicResults";
  label: string;
  href: string;
  tone: "primary" | "secondary" | "manage";
};

export type ListingPanelAction = {
  href?: string;
  label: string;
  tone?: "primary" | "secondary" | "subtle";
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
  },
  servicios: {
    publicView: "ready",
    openPanel: "ready",
    preview: "ready",
    publicResults: "ready",
    analytics: "unproven",
  },
  "comida-local": { publicView: "ready", analytics: "unproven" },
  autos: { publicView: "ready", archive: "ready", analytics: "unproven" },
  empleos: {
    publicView: "ready",
    edit: "ready",
    preview: "ready",
    publicResults: "ready",
    analytics: "ready",
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
    reactivate: "ready",
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

export function openPanelLabel(lang: Lang): string {
  return lang === "es" ? "Abrir panel" : "Open panel";
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
      label: publicResultsLabel(lang),
      href: resultsHref,
      tone: "secondary",
    });
  }

  return actions;
}

type InventoryCategory = "restaurantes" | "servicios" | "empleos" | "viajes";

/** Listing-level CTAs for inventory cards (restaurant, service, jobs, travel). */
export function buildInventoryListingActions(
  category: InventoryCategory,
  item: DashboardInventoryItem,
  lang: Lang,
  q: string,
): ListingPanelAction[] {
  const actions: ListingPanelAction[] = [];

  if (listingToolIsReady(category, "publicView")) {
    actions.push({
      href: item.publicHref,
      label: publicViewLabel(lang),
      tone: "primary",
    });
  }

  if (category === "restaurantes" && listingToolIsReady(category, "openPanel")) {
    actions.push({
      href: `/dashboard/restaurantes?${q}`,
      label: openPanelLabel(lang),
    });
  }

  if (category === "servicios" && listingToolIsReady(category, "openPanel")) {
    actions.push({
      href: item.editHref,
      label: openPanelLabel(lang),
    });
  }

  if (category === "empleos" && listingToolIsReady(category, "edit")) {
    actions.push({
      href: item.editHref,
      label: lang === "es" ? "Gestionar vacante" : "Manage listing",
    });
  }

  if (category === "viajes" && listingToolIsReady(category, "edit")) {
    actions.push({
      href: item.editHref,
      label: lang === "es" ? "Gestionar envío" : "Manage submission",
    });
  }

  if (item.previewHref && listingToolIsReady(category, "preview")) {
    actions.push({
      href: item.previewHref,
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

  const analyticsHref = provenInventoryAnalyticsHref(item);
  if (analyticsHref && listingToolIsReady(category, "analytics")) {
    actions.push({
      href: analyticsHref,
      label: analyticsLabel(lang),
      tone: "subtle",
    });
  }

  return actions.filter((action) => Boolean(action.href));
}

export function listingAnalyticsIsProven(category: string): boolean {
  return listingToolIsReady(category, "analytics");
}
