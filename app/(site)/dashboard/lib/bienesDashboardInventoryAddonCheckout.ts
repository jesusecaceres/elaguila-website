/**
 * Dashboard Bienes Raíces inventory pack checkout — add-on-only ($99/mo), no base plan.
 * Gate GLOBAL-MONETIZED-CATEGORY-STACK-01-BIENES-PROOF
 *
 * Mirrors Restaurante/Servicios dashboard add-on pattern:
 * - Direct application routes for existing parent listings (no hub/checkpoint hop).
 * - Inventory pack checkout is add-on-only when REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED is true.
 * - Until fulfillment is wired, checkout CTA stays honestly blocked.
 */

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { BR_NEGOCIO_Q_PROPIEDAD } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import { BR_PREVIEW_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import {
  BR_INVENTORY_PACK_PACKAGE_KEY,
  REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED,
} from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";
import { isBrInventoryUpgradeActive } from "@/app/clasificados/lib/leonixBrPropertyInventoryPolicy";
import {
  hydrateBienesAgenteListingForDashboardEdit,
  type BienesDashboardHydrationResult,
} from "@/app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/bienesPublishedToAgenteApplicationDraft";

export { BR_INVENTORY_PACK_PACKAGE_KEY, REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED };

export type { BienesDashboardHydrationResult };

type Lang = "es" | "en";

export type BienesDashboardInventoryAddonCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; userMessage: string };

export type BienesDashboardEditMode = "listing-edit" | "inventory-edit" | "inventory-addon";

type BienesEditHrefInput = {
  lang: Lang;
  listingId?: string | null;
  listingSlug?: string | null;
  leonixAdId?: string | null;
  categoriaPropiedad?: "residencial" | "comercial" | "terreno_lote" | null;
};

/** Direct Bienes negocio agente application mount — never the publish hub/selector for dashboard edit. */
export const BIENES_DASHBOARD_APPLICATION_BASE = "/clasificados/publicar/bienes-raices/negocio";

/** Listing-bound seller preview (pre-live). */
export const BIENES_DASHBOARD_PREVIEW_BASE = BR_PREVIEW_NEGOCIO;

function baseBienesEditParams(
  input: BienesEditHrefInput & { mode?: BienesDashboardEditMode; focus?: "inventory-pack" | null },
): URLSearchParams {
  const params = new URLSearchParams({ edit: "1", source: "dashboard" });
  params.set("mode", input.mode ?? "listing-edit");
  params.set("returnPanel", "bienes-raices");
  const listingId = input.listingId?.trim();
  const listingSlug = input.listingSlug?.trim();
  const leonixAdId = input.leonixAdId?.trim();
  if (listingId) params.set("listingId", listingId);
  if (listingSlug) params.set("listingSlug", listingSlug);
  if (leonixAdId) params.set("leonixAdId", leonixAdId);
  if (input.categoriaPropiedad) params.set(BR_NEGOCIO_Q_PROPIEDAD, input.categoriaPropiedad);
  if (input.focus) params.set("focus", input.focus);
  else if (input.mode === "inventory-edit" || input.mode === "inventory-addon") {
    params.set("focus", "inventory-pack");
  }
  return params;
}

/** Golden-loop context params for Bienes parent agent application. */
export function buildBienesDashboardListingContextParams(
  input: BienesEditHrefInput & { mode?: BienesDashboardEditMode; focus?: "inventory-pack" | null },
): URLSearchParams {
  return baseBienesEditParams(input);
}

export function bienesListingEditHref(input: BienesEditHrefInput): string {
  const params = baseBienesEditParams({ ...input, mode: "listing-edit" });
  return appendLangToPath(`${BIENES_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function bienesInventoryEditHref(input: BienesEditHrefInput): string {
  const params = baseBienesEditParams({ ...input, mode: "inventory-edit", focus: "inventory-pack" });
  return appendLangToPath(`${BIENES_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function bienesInventoryAddonHref(input: BienesEditHrefInput): string {
  const params = baseBienesEditParams({ ...input, mode: "inventory-addon", focus: "inventory-pack" });
  return appendLangToPath(`${BIENES_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function bienesListingPreviewHref(
  input: BienesEditHrefInput & { mode?: BienesDashboardEditMode; focus?: "inventory-pack" | null },
): string {
  const params = baseBienesEditParams(input);
  params.set("preview", "listing");
  return appendLangToPath(`${BIENES_DASHBOARD_PREVIEW_BASE}?${params.toString()}`, input.lang);
}

/** Preview "Volver a editar" — preserves dashboard context; never hub/checkpoint/product route. */
export function bienesBackToEditHrefFromPreview(
  input: BienesEditHrefInput & { mode?: BienesDashboardEditMode; focus?: "inventory-pack" | null },
): string {
  const params = baseBienesEditParams(input);
  return appendLangToPath(`${BIENES_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export function bienesInventoryInactiveDashboardHint(lang: Lang): string {
  return lang === "es"
    ? "Para agregar propiedades al inventario, entra a Editar anuncio y abre la sección Inventario de propiedades."
    : "To add properties to your inventory, open Edit listing and go to the Property inventory section.";
}

export function bienesInventoryAddonUpgradeLabel(lang: Lang): string {
  return lang === "es" ? "Activar inventario +$99/mes" : "Activate inventory +$99/mo";
}

export function bienesInventoryAddonUpgradeBusyLabel(lang: Lang): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export function bienesInventoryAddonBlockedMessage(lang: Lang): string {
  return lang === "es"
    ? "El pago del inventario de propiedades aún no está disponible. Entra a Editar anuncio para preparar tus propiedades."
    : "Property inventory checkout is not fully available yet. Open Edit listing to prepare your properties.";
}

export function bienesInventoryEditSuccessLabel(lang: Lang): string {
  return lang === "es" ? "Agregar propiedades ahora" : "Add properties now";
}

export function resolveBienesInventoryAddonSuccessPrimaryCta(input: {
  packageKey: string | null;
  listingId: string | null;
  leonixAdId?: string | null;
  lang: Lang;
  categoriaPropiedad?: BienesEditHrefInput["categoriaPropiedad"];
}): { href: string; label: string } | null {
  if (input.packageKey !== BR_INVENTORY_PACK_PACKAGE_KEY) return null;
  const listingId = input.listingId?.trim();
  if (!listingId) return null;
  return {
    href: bienesInventoryEditHref({
      lang: input.lang,
      listingId,
      leonixAdId: input.leonixAdId,
      categoriaPropiedad: input.categoriaPropiedad,
    }),
    label: bienesInventoryEditSuccessLabel(input.lang),
  };
}

export function listingJsonBrInventoryPackEnabled(listingJson: unknown): boolean {
  if (!listingJson || typeof listingJson !== "object") return false;
  const o = listingJson as Record<string, unknown>;
  return o.inventoryPackEnabled === true || o.inventoryUpgradeEnabled === true;
}

export function bienesInventoryAddonUpgradeEligible(input: {
  status: string;
  listingJson?: unknown;
  isPublished?: boolean | null;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "active" && status !== "published") return false;
  if (input.isPublished === false) return false;
  if (isBrInventoryUpgradeActive()) return false;
  return !listingJsonBrInventoryPackEnabled(input.listingJson);
}

export function bienesInventoryEditEligible(input: {
  status: string;
  listingJson?: unknown;
  isPublished?: boolean | null;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "active" && status !== "published") return false;
  if (input.isPublished === false) return false;
  return listingJsonBrInventoryPackEnabled(input.listingJson) || isBrInventoryUpgradeActive();
}

export async function hydrateBienesListingForDashboardEdit(input: {
  listingId: string;
  lang: Lang;
}): Promise<BienesDashboardHydrationResult> {
  return hydrateBienesAgenteListingForDashboardEdit(input);
}

export async function startBienesDashboardInventoryAddonCheckout(input: {
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
  customerEmail?: string | null;
  returnPath?: string | null;
}): Promise<BienesDashboardInventoryAddonCheckoutResult> {
  if (!REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED) {
    return { ok: false, userMessage: bienesInventoryAddonBlockedMessage(input.lang) };
  }

  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Se requiere un anuncio publicado para activar el inventario."
          : "A published listing is required to enable property inventory.",
    };
  }

  const returnPath =
    input.returnPath?.trim() || buildDashboardMisAnunciosReturnPath(input.lang, "bienes-raices");
  const checkout = await startRevenueCategoryCheckout({
    category: BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT.category,
    packageKey: BIENES_INVENTORY_PACK_DASHBOARD_CHECKOUT.packageKey,
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

export async function redirectBienesDashboardInventoryAddonCheckout(
  input: Parameters<typeof startBienesDashboardInventoryAddonCheckout>[0],
): Promise<BienesDashboardInventoryAddonCheckoutResult> {
  const result = await startBienesDashboardInventoryAddonCheckout(input);
  if (result.ok) {
    redirectToRevenueCategoryCheckout(result.checkoutUrl);
  }
  return result;
}

export function resolveBienesCategoriaFromDetailPairs(detailPairs: unknown): BienesEditHrefInput["categoriaPropiedad"] {
  const contract = parseLeonixListingContract(detailPairs);
  const cat = contract.categoriaPropiedad;
  if (cat === "residencial" || cat === "comercial" || cat === "terreno_lote") return cat;
  return "residencial";
}

export async function fetchBienesListingMetaForDashboard(input: {
  listingId: string;
}): Promise<{
  listingId: string;
  leonixAdId: string | null;
  categoriaPropiedad: BienesEditHrefInput["categoriaPropiedad"];
  detailPairs: unknown;
  listingJson: unknown;
  status: string;
  isPublished: boolean | null;
} | null> {
  const listingId = input.listingId.trim();
  if (!listingId) return null;
  try {
    const sb = createSupabaseBrowserClient();
    const { data: auth } = await sb.auth.getUser();
    const userId = auth.user?.id?.trim();
    if (!userId) return null;
    const { data, error } = await sb
      .from("listings")
      .select("id, leonix_ad_id, detail_pairs, listing_json, status, is_published, owner_id, category, seller_type")
      .eq("id", listingId)
      .eq("owner_id", userId)
      .maybeSingle();
    if (error || !data) return null;
    const row = data as {
      id: string;
      leonix_ad_id?: string | null;
      detail_pairs?: unknown;
      listing_json?: unknown;
      status?: string | null;
      is_published?: boolean | null;
      category?: string | null;
      seller_type?: string | null;
    };
    if (String(row.category ?? "").toLowerCase() !== "bienes-raices") return null;
    return {
      listingId: row.id,
      leonixAdId: row.leonix_ad_id?.trim() || null,
      categoriaPropiedad: resolveBienesCategoriaFromDetailPairs(row.detail_pairs),
      detailPairs: row.detail_pairs,
      listingJson: row.listing_json,
      status: String(row.status ?? ""),
      isPublished: row.is_published ?? null,
    };
  } catch {
    return null;
  }
}
