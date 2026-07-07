/**
 * Dashboard Servicios offers/coupons add-on checkout — add-on-only ($99/mo), no base plan.
 * Gate SERVICIOS-P0C-DASHBOARD-ADDON-ONLY-STRIPE-AND-EDIT-ROUTE-PARITY
 *
 * Mirrors the proven Restaurante dashboard add-on pattern, Servicios-specific:
 * - Always uses category `servicios` + the offers add-on package key.
 * - Never includes the base monthly package (no $399 base charge from dashboard edit).
 * - Existing-listing edit hrefs route to `/publicar/servicios` (direct app — Restaurante parity).
 * - `/clasificados/publicar/servicios` redirects to checkpoint and must not be used for dashboard edit.
 */

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { SERVICIOS_OFFERS_ADDON_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";

export { SERVICIOS_OFFERS_ADDON_PACKAGE_KEY };

type Lang = "es" | "en";

export type ServiciosDashboardOffersAddonCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; userMessage: string };

export function serviciosOffersInactiveDashboardHint(lang: Lang): string {
  return lang === "es"
    ? "Para agregar ofertas destacadas, entra a Editar servicio y abre la sección Cupones y ofertas."
    : "To add featured offers, open Edit service and go to Featured coupons and offers.";
}

export function serviciosOffersEditSuccessLabel(lang: Lang): string {
  return lang === "es" ? "Editar ofertas ahora" : "Edit offers now";
}

export function serviciosOffersAddonUpgradeLabel(lang: Lang): string {
  return lang === "es" ? "Destacar ofertas +$99/mes" : "Feature offers +$99/mo";
}

export function serviciosOffersAddonUpgradeBusyLabel(lang: Lang): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export function serviciosOffersEditLabel(lang: Lang): string {
  return lang === "es" ? "Editar ofertas" : "Edit offers";
}

export function serviciosOffersEditFooterHint(lang: Lang): string {
  return lang === "es"
    ? "Administra hasta 4 ofertas destacadas de este anuncio."
    : "Manage up to 4 featured offers for this listing.";
}

export function serviciosOffersModuleHeading(lang: Lang): string {
  return lang === "es" ? "Cupones y ofertas destacadas" : "Featured coupons and offers";
}

type ServiciosEditHrefInput = {
  lang: Lang;
  listingId?: string | null;
  listingSlug?: string | null;
  leonixAdId?: string | null;
};

/** Legacy clasificados publish entry (new listings) — server redirects to checkpoint; never dashboard edit. */
export const SERVICIOS_LEGACY_CLASIFICADOS_PUBLISH_ENTRY = "/clasificados/publicar/servicios";

/** Direct Servicios application mount (same component as checkpoint product flow, no checkpoint hop). */
export const SERVICIOS_DASHBOARD_APPLICATION_BASE = "/publicar/servicios";

/** Listing-bound seller preview (separate route; does not redirect to checkpoint). */
export const SERVICIOS_DASHBOARD_PREVIEW_BASE = "/clasificados/publicar/servicios/preview";

function baseServiciosEditParams(input: ServiciosEditHrefInput): URLSearchParams {
  const params = new URLSearchParams({ edit: "1", source: "dashboard" });
  const listingId = input.listingId?.trim();
  const listingSlug = input.listingSlug?.trim();
  const leonixAdId = input.leonixAdId?.trim();
  if (listingId) params.set("listingId", listingId);
  if (listingSlug) params.set("listingSlug", listingSlug);
  if (leonixAdId) params.set("leonixAdId", leonixAdId);
  params.set("returnPanel", "servicios");
  return params;
}

/** Full listing edit — opens the saved listing normally. */
export function serviciosListingEditHref(input: ServiciosEditHrefInput): string {
  const params = baseServiciosEditParams(input);
  params.set("mode", "listing-edit");
  return appendLangToPath(`${SERVICIOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

/** Dashboard listing-bound preview — hydrates from owner DB listing, not empty local draft. */
export function serviciosListingPreviewHref(input: ServiciosEditHrefInput): string {
  const params = baseServiciosEditParams(input);
  params.set("preview", "listing");
  return appendLangToPath(`${SERVICIOS_DASHBOARD_PREVIEW_BASE}?${params.toString()}`, input.lang);
}

/** Offers edit shortcut — opens the saved listing and jumps to the coupon section. */
export function serviciosOffersEditHref(input: ServiciosEditHrefInput): string {
  const params = baseServiciosEditParams(input);
  params.set("mode", "offers-edit");
  params.set("focus", "coupon-upgrade");
  return appendLangToPath(`${SERVICIOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

/** Offers add-on activation — opens the saved listing at the coupon section with the inactive add-on CTA. */
export function serviciosOffersAddonHref(input: ServiciosEditHrefInput): string {
  const params = baseServiciosEditParams(input);
  params.set("mode", "offers-addon");
  params.set("focus", "coupon-upgrade");
  return appendLangToPath(`${SERVICIOS_DASHBOARD_APPLICATION_BASE}?${params.toString()}`, input.lang);
}

export async function startServiciosDashboardOffersAddonCheckout(input: {
  listingId: string;
  leonixAdId?: string | null;
  lang: Lang;
  customerEmail?: string | null;
  returnPath?: string | null;
}): Promise<ServiciosDashboardOffersAddonCheckoutResult> {
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Se requiere un anuncio publicado para activar el módulo de ofertas."
          : "A published listing is required to enable the offers module.",
    };
  }

  const returnPath =
    input.returnPath?.trim() || buildDashboardMisAnunciosReturnPath(input.lang, "servicios");
  const checkout = await startRevenueCategoryCheckout({
    category: SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT.category,
    packageKey: SERVICIOS_OFFERS_ADDON_DASHBOARD_CHECKOUT.packageKey,
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

export async function redirectServiciosDashboardOffersAddonCheckout(
  input: Parameters<typeof startServiciosDashboardOffersAddonCheckout>[0],
): Promise<ServiciosDashboardOffersAddonCheckoutResult> {
  const result = await startServiciosDashboardOffersAddonCheckout(input);
  if (result.ok) {
    redirectToRevenueCategoryCheckout(result.checkoutUrl);
  }
  return result;
}

/**
 * Honest display state (P0C): whether the published listing already shows paid offers content.
 *
 * NOTE: There is no verified Servicios paid-entitlement flag in `profile_json` yet, so this reflects
 * published coupon/flyer/more-offers CONTENT only (set after a save), not Stripe payment state.
 * Paid activation itself always goes through the real add-on-only checkout. Webhook entitlement
 * wiring is documented as the next step.
 */
export function serviciosListingJsonOffersEnabled(profileJson: unknown): boolean {
  if (!profileJson || typeof profileJson !== "object") return false;
  const p = profileJson as Record<string, unknown>;
  const coupons = Array.isArray(p.coupons) ? p.coupons : [];
  const hasCoupon = coupons.some((c) => {
    if (!c || typeof c !== "object") return false;
    const row = c as Record<string, unknown>;
    return Boolean(
      (typeof row.title === "string" && row.title.trim()) ||
        (typeof row.description === "string" && row.description.trim()) ||
        (typeof row.imageUrl === "string" && row.imageUrl.trim()) ||
        (typeof row.couponCode === "string" && row.couponCode.trim()) ||
        (typeof row.expirationDate === "string" && row.expirationDate.trim()),
    );
  });
  const flyer = p.couponFlyer as { imageUrl?: unknown } | undefined;
  const hasFlyer = Boolean(flyer && typeof flyer.imageUrl === "string" && flyer.imageUrl.trim());
  const more = p.couponMoreOffers as { url?: unknown } | undefined;
  const hasMore = Boolean(more && typeof more.url === "string" && more.url.trim());
  return hasCoupon || hasFlyer || hasMore;
}

export function serviciosOffersAddonUpgradeEligible(input: {
  status: string;
  profileJson?: unknown;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "published") return false;
  return !serviciosListingJsonOffersEnabled(input.profileJson);
}

export function serviciosOffersEditEligible(input: {
  status: string;
  profileJson?: unknown;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "published") return false;
  return serviciosListingJsonOffersEnabled(input.profileJson);
}

export function resolveServiciosOffersAddonSuccessPrimaryCta(input: {
  packageKey: string | null;
  listingId: string | null;
  listingSlug?: string | null;
  leonixAdId: string | null;
  lang: Lang;
}): { href: string; label: string } | null {
  if (input.packageKey !== SERVICIOS_OFFERS_ADDON_PACKAGE_KEY) return null;
  const listingId = input.listingId?.trim();
  if (!listingId) return null;
  return {
    href: serviciosOffersEditHref({
      lang: input.lang,
      listingId,
      listingSlug: input.listingSlug,
      leonixAdId: input.leonixAdId,
    }),
    label: serviciosOffersEditSuccessLabel(input.lang),
  };
}
