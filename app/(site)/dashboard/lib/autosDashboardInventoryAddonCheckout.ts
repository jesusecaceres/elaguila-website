/**
 * Dashboard Autos Negocio dealer inventory pack checkout — add-on-only ($129/mo), no base dealer plan.
 * Gate AUTOS-DEALER-INVENTORY-ADDON-PARITY-01
 *
 * Mirrors Bienes/Restaurante/Servicios dashboard add-on pattern:
 * - Direct negocio application routes for existing parent listings.
 * - Inventory pack checkout is add-on-only when REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED is true.
 * - Active inventory unlock reads listing_package_entitlements (package_key autos_dealer_inventory_pack_monthly).
 */

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  AUTOS_DEALER_INVENTORY_PACK_PRICE_CENTS,
  REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";
import {
  dashboardEntitlementBadgeForKey,
  fetchDashboardListingPackageEntitlementBadges,
} from "@/app/(site)/dashboard/lib/dashboardPackageEntitlementBadges";
import {
  hydrateAutosDealerListingForDashboardEdit,
  type AutosDashboardHydrationResult,
} from "@/app/(site)/publicar/autos/negocios/lib/autosPublishedToDealerApplicationDraft";
import { INVENTORY_BOOST_MONTHLY_USD } from "@/app/lib/clasificados/autos/autosDealerInventoryCopy";

export { hydrateAutosDealerListingForDashboardEdit };

export {
  AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY,
  REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED,
};

export type { AutosDashboardHydrationResult };

type Lang = "es" | "en";

export type AutosDashboardInventoryAddonCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; userMessage: string };

export type AutosDashboardEditMode = "listing-edit" | "inventory-edit" | "inventory-addon";

type AutosEditHrefInput = {
  lang: Lang;
  listingId?: string | null;
  listingSlug?: string | null;
  leonixAdId?: string | null;
};

/** Direct Autos Negocio application mount — never the publish hub for dashboard edit. */
export const AUTOS_DASHBOARD_APPLICATION_BASE = "/publicar/autos/negocios";

/** Listing-bound seller preview (pre-live / draft). */
export const AUTOS_DASHBOARD_PREVIEW_BASE = "/clasificados/autos/negocios/preview";

function baseAutosEditParams(
  input: AutosEditHrefInput & { mode?: AutosDashboardEditMode; focus?: "inventory-pack" | null },
): URLSearchParams {
  const params = new URLSearchParams({ edit: "1", source: "dashboard" });
  params.set("mode", input.mode ?? "listing-edit");
  params.set("returnPanel", "autos");
  const listingId = input.listingId?.trim();
  const listingSlug = input.listingSlug?.trim();
  const leonixAdId = input.leonixAdId?.trim();
  if (listingId) params.set("listingId", listingId);
  if (listingSlug) params.set("listingSlug", listingSlug);
  if (leonixAdId) params.set("leonixAdId", leonixAdId);
  if (input.focus) params.set("focus", input.focus);
  else if (input.mode === "inventory-edit" || input.mode === "inventory-addon") {
    params.set("focus", "inventory-pack");
  }
  return params;
}

export function buildAutosDashboardListingContextParams(
  input: AutosEditHrefInput & { mode?: AutosDashboardEditMode; focus?: "inventory-pack" | null },
): URLSearchParams {
  return baseAutosEditParams(input);
}

export function autosDealerListingEditHref(input: AutosEditHrefInput): string {
  const params = baseAutosEditParams({ ...input, mode: "listing-edit" });
  return appendLangToPath(`${AUTOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function autosDealerInventoryEditHref(input: AutosEditHrefInput): string {
  const params = baseAutosEditParams({ ...input, mode: "inventory-edit", focus: "inventory-pack" });
  return appendLangToPath(`${AUTOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function autosDealerInventoryAddonHref(input: AutosEditHrefInput): string {
  const params = baseAutosEditParams({ ...input, mode: "inventory-addon", focus: "inventory-pack" });
  return appendLangToPath(`${AUTOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function autosDealerListingPreviewHref(
  input: AutosEditHrefInput & { mode?: AutosDashboardEditMode; focus?: "inventory-pack" | null },
): string {
  const params = baseAutosEditParams(input);
  params.set("preview", "listing");
  return appendLangToPath(`${AUTOS_DASHBOARD_PREVIEW_BASE}?${params.toString()}`, input.lang);
}

export function autosDealerBackToEditHrefFromPreview(
  input: AutosEditHrefInput & { mode?: AutosDashboardEditMode; focus?: "inventory-pack" | null },
): string {
  const params = baseAutosEditParams(input);
  return appendLangToPath(`${AUTOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function autosDealerInventoryPackInactiveDashboardHint(lang: Lang): string {
  return lang === "es"
    ? "Para agregar vehículos al inventario del dealer, activa el paquete de inventario o abre Editar inventario."
    : "To add vehicles to your dealer inventory, activate the inventory pack or open Edit inventory.";
}

export function autosDealerInventoryPackAddonUpgradeLabel(lang: Lang): string {
  return lang === "es"
    ? `Activar inventario +$${INVENTORY_BOOST_MONTHLY_USD}/mes`
    : `Activate inventory +$${INVENTORY_BOOST_MONTHLY_USD}/mo`;
}

export function autosDealerInventoryPackAddonUpgradeBusyLabel(lang: Lang): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export function autosDealerInventoryPackEditLabel(lang: Lang): string {
  return lang === "es" ? "Editar inventario" : "Edit inventory";
}

export function autosDealerInventoryPackEditSuccessLabel(lang: Lang): string {
  return lang === "es" ? "Agregar vehículos ahora" : "Add vehicles now";
}

export function resolveAutosDealerInventoryPackSuccessPrimaryCta(input: {
  packageKey: string | null;
  listingId: string | null;
  leonixAdId?: string | null;
  lang: Lang;
}): { href: string; label: string } | null {
  if (input.packageKey !== AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY) return null;
  const listingId = input.listingId?.trim();
  if (!listingId) return null;
  return {
    href: autosDealerInventoryEditHref({
      lang: input.lang,
      listingId,
      leonixAdId: input.leonixAdId,
    }),
    label: autosDealerInventoryPackEditSuccessLabel(input.lang),
  };
}

export function isAutosDealerInventoryPackEntitlementActiveFromProof(
  proof: { revenuePackageKey?: string | null } | null | undefined,
): boolean {
  return proof?.revenuePackageKey?.trim() === AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY;
}

export async function fetchAutosDealerInventoryPackEntitlementActive(input: {
  listingId: string;
  leonixAdId?: string | null;
  slug?: string | null;
}): Promise<{ active: boolean; pending: boolean }> {
  const listingId = input.listingId.trim();
  if (!listingId) return { active: false, pending: false };

  try {
    const sb = createSupabaseBrowserClient();
    const { data: auth } = await sb.auth.getSession();
    const token = auth.session?.access_token;
    if (!token?.trim()) return { active: false, pending: false };

    const badges = await fetchDashboardListingPackageEntitlementBadges(
      [
        {
          key: listingId,
          category: "autos",
          listingSource: "autos_classifieds_listings",
          listingId,
          slug: input.slug ?? null,
          leonixAdId: input.leonixAdId ?? null,
        },
      ],
      token,
    );
    const badge = dashboardEntitlementBadgeForKey(badges, [
      listingId,
      input.leonixAdId?.trim() ?? "",
      input.slug?.trim() ?? "",
    ]);
    return { active: isAutosDealerInventoryPackEntitlementActiveFromProof(badge), pending: false };
  } catch {
    return { active: false, pending: false };
  }
}

export function autosDealerInventoryPackActive(input: { entitlementActive?: boolean }): boolean {
  return input.entitlementActive === true;
}

export function autosDealerInventoryPackUpgradeEligible(input: {
  status: string;
  lane?: string | null;
  entitlementActive?: boolean;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "active") return false;
  if (input.lane?.trim() === "privado") return false;
  if (autosDealerInventoryPackActive({ entitlementActive: input.entitlementActive })) return false;
  return true;
}

export function autosDealerInventoryPackEditEligible(input: {
  status: string;
  lane?: string | null;
  entitlementActive?: boolean;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "active") return false;
  if (input.lane?.trim() === "privado") return false;
  return autosDealerInventoryPackActive({ entitlementActive: input.entitlementActive });
}

export function autosDealerInventoryAddonBlockedMessage(lang: Lang): string {
  return lang === "es"
    ? "El pago del inventario de vehículos aún no está disponible. Entra a Editar anuncio para preparar tus vehículos."
    : "Dealer vehicle inventory checkout is not fully available yet. Open Edit listing to prepare your vehicles.";
}

export async function startAutosDealerInventoryPackCheckout(input: {
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
  customerEmail?: string | null;
  returnPath?: string | null;
}): Promise<AutosDashboardInventoryAddonCheckoutResult> {
  if (!REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED) {
    return { ok: false, userMessage: autosDealerInventoryAddonBlockedMessage(input.lang) };
  }

  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Se requiere un anuncio dealer publicado para activar el inventario."
          : "A published dealer listing is required to enable vehicle inventory.",
    };
  }

  const returnPath =
    input.returnPath?.trim() ||
    autosDealerInventoryEditHref({
      lang: input.lang,
      listingId,
      leonixAdId: input.leonixAdId,
    });

  const checkout = await startRevenueCategoryCheckout({
    category: AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT.category,
    packageKey: AUTOS_DEALER_INVENTORY_PACK_DASHBOARD_CHECKOUT.packageKey,
    listingId,
    leonixAdId: input.leonixAdId?.trim() || null,
    returnPath,
    locale: input.lang,
    customerEmail: input.customerEmail,
  });

  if (!checkout.ok || !checkout.checkoutUrl?.trim()) {
    return {
      ok: false,
      userMessage: checkout.ok ? revenueCategoryCheckoutErrorMessage(input.lang) : checkout.userMessage,
    };
  }

  return { ok: true, checkoutUrl: checkout.checkoutUrl.trim() };
}

export async function redirectAutosDealerInventoryPackCheckout(
  input: Parameters<typeof startAutosDealerInventoryPackCheckout>[0],
): Promise<AutosDashboardInventoryAddonCheckoutResult> {
  const result = await startAutosDealerInventoryPackCheckout(input);
  if (result.ok) {
    redirectToRevenueCategoryCheckout(result.checkoutUrl);
  }
  return result;
}

/** Documented price for verifiers — sourced from autosDealerInventoryCopy / A5.QA-03. */
export const AUTOS_DEALER_INVENTORY_PACK_MONTHLY_USD = Math.round(AUTOS_DEALER_INVENTORY_PACK_PRICE_CENTS / 100);
