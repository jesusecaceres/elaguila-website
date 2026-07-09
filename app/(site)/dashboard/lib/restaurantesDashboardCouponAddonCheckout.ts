/**
 * Dashboard Restaurante coupon add-on checkout — add-on-only ($99/mo), no base plan.
 * Gate REVENUE-OS-GLOBAL-RETURN-SAFETY-PLUS-RESTAURANTES-ADDON-ONLY-01
 * P0B: coupon image persistence + dashboard edit hydrate — RESTAURANTES-P0B
 */

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import { saveRestauranteDraftToStorageResolved } from "@/app/clasificados/restaurantes/application/restauranteDraftStorage";
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import {
  redirectToRevenueCategoryCheckout,
  revenueCategoryCheckoutErrorMessage,
  startRevenueCategoryCheckout,
} from "@/app/lib/listingPlans/revenueCategoryCheckoutClient";
import { RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT } from "@/app/lib/listingPlans/revenueCategoryCheckoutPayload";
import { buildDashboardMisAnunciosReturnPath } from "@/app/lib/listingPlans/revenueOsReturnPath";

export type RestauranteDashboardCouponAddonCheckoutResult =
  | { ok: true; checkoutUrl: string }
  | { ok: false; userMessage: string };

export function restauranteCouponInactiveDashboardHint(lang: "es" | "en"): string {
  return lang === "es"
    ? "Para agregar ofertas destacadas, entra a Editar restaurante y abre la sección Ofertas y cupones."
    : "To add featured offers, open Edit restaurant and go to Featured offers and coupons.";
}

export function restauranteCouponEditSuccessLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Editar ofertas ahora" : "Edit offers now";
}

export function resolveRestauranteOffersAddonSuccessPrimaryCta(input: {
  packageKey: string | null;
  listingId: string | null;
  leonixAdId: string | null;
  lang: "es" | "en";
}): { href: string; label: string } | null {
  if (input.packageKey !== "restaurantes_offers_addon") return null;
  const listingId = input.listingId?.trim();
  if (!listingId) return null;
  return {
    href: restauranteCouponEditHref({
      lang: input.lang,
      listingId,
      leonixAdId: input.leonixAdId,
      returnPanel: "restaurantes",
    }),
    label: restauranteCouponEditSuccessLabel(input.lang),
  };
}

export function restauranteCouponAddonUpgradeLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Destacar ofertas +$99/mes" : "Feature offers +$99/mo";
}

export function restauranteCouponAddonUpgradeFooterHint(lang: "es" | "en"): string {
  return lang === "es"
    ? "Agrega hasta 4 ofertas/cupones destacados a tu anuncio para atraer más clientes."
    : "Add up to 4 featured offers/coupons to your listing to attract more customers.";
}

export function restauranteCouponEditFooterHint(lang: "es" | "en"): string {
  return lang === "es"
    ? "Administra hasta 4 ofertas destacadas de este anuncio."
    : "Manage up to 4 featured offers for this listing.";
}

export function restauranteCouponEditLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Editar ofertas" : "Edit offers";
}

export function restauranteOffersModuleHeading(lang: "es" | "en"): string {
  return lang === "es" ? "Ofertas y cupones destacados" : "Featured offers and coupons";
}

export function restauranteCouponAddonUpgradeBusyLabel(lang: "es" | "en"): string {
  return lang === "es" ? "Iniciando pago…" : "Starting checkout…";
}

export async function startRestauranteDashboardCouponAddonCheckout(input: {
  listingId: string;
  leonixAdId?: string | null;
  lang: "es" | "en";
  customerEmail?: string | null;
  returnPath?: string | null;
}): Promise<RestauranteDashboardCouponAddonCheckoutResult> {
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "Se requiere un anuncio publicado para activar el módulo de cupones."
          : "A published listing is required to enable the coupon module.",
    };
  }

  const returnPath =
    input.returnPath?.trim() || buildDashboardMisAnunciosReturnPath(input.lang, "restaurantes");
  const checkout = await startRevenueCategoryCheckout({
    category: RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT.category,
    packageKey: RESTAURANTES_OFFERS_ADDON_DASHBOARD_CHECKOUT.packageKey,
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

export async function redirectRestauranteDashboardCouponAddonCheckout(
  input: Parameters<typeof startRestauranteDashboardCouponAddonCheckout>[0],
): Promise<RestauranteDashboardCouponAddonCheckoutResult> {
  const result = await startRestauranteDashboardCouponAddonCheckout(input);
  if (result.ok) {
    redirectToRevenueCategoryCheckout(result.checkoutUrl);
  }
  return result;
}

export function restaurantListingJsonCouponEnabled(listingJson: unknown): boolean {
  if (!listingJson || typeof listingJson !== "object") return false;
  return (listingJson as Record<string, unknown>).couponUpgradeEnabled === true;
}

export function restaurantCouponAddonUpgradeEligible(input: {
  status: string;
  listingJson?: unknown;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "published") return false;
  return !restaurantListingJsonCouponEnabled(input.listingJson);
}

export function restaurantCouponEditEligible(input: {
  status: string;
  listingJson?: unknown;
}): boolean {
  const status = String(input.status ?? "").trim().toLowerCase();
  if (status !== "published") return false;
  return restaurantListingJsonCouponEnabled(input.listingJson);
}

export async function hydrateRestauranteListingForCouponEdit(input: {
  listingId: string;
  lang: "es" | "en";
}): Promise<{ ok: true } | { ok: false; userMessage: string }> {
  const listingId = input.listingId.trim();
  if (!listingId) {
    return {
      ok: false,
      userMessage:
        input.lang === "es" ? "No se encontró el anuncio del restaurante." : "Restaurant listing not found.",
    };
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data: auth, error: authError } = await supabase.auth.getUser();
    const userId = auth.user?.id?.trim();
    if (authError || !userId) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "Inicia sesión para editar los cupones de tu anuncio."
            : "Sign in to edit coupons on your listing.",
      };
    }

    const { data, error } = await supabase
      .from("restaurantes_public_listings")
      .select("listing_json, draft_listing_id")
      .eq("id", listingId)
      .eq("owner_user_id", userId)
      .maybeSingle();

    if (error || !data?.listing_json) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "No se pudo cargar el anuncio para editar cupones."
            : "Could not load the listing to edit coupons.",
      };
    }

    if (!restaurantListingJsonCouponEnabled(data.listing_json)) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "Activa el módulo de cupones antes de editar."
            : "Enable the coupon module before editing.",
      };
    }

    const merged = mergeRestauranteDraft(data.listing_json);
    const stableDraftId =
      typeof data.draft_listing_id === "string" && data.draft_listing_id.trim()
        ? data.draft_listing_id.trim()
        : merged.draftListingId;
    merged.draftListingId = stableDraftId;
    merged.couponUpgradeEnabled = true;

    const saved = await saveRestauranteDraftToStorageResolved(merged);
    if (!saved) {
      return {
        ok: false,
        userMessage:
          input.lang === "es"
            ? "No se pudo preparar el borrador para editar cupones."
            : "Could not prepare the draft for coupon editing.",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      userMessage:
        input.lang === "es"
          ? "No se pudo cargar el anuncio para editar cupones."
          : "Could not load the listing to edit coupons.",
    };
  }
}

export function buildDashboardRestaurantesReturnPath(lang: "es" | "en"): string {
  return appendLangToPath("/dashboard/restaurantes", lang);
}

export function restauranteListingEditHref(input: {
  lang: "es" | "en";
  listingId: string;
  leonixAdId?: string | null;
  returnPanel?: "restaurantes" | "mis-anuncios";
}): string {
  const listingId = input.listingId.trim();
  const params = new URLSearchParams({
    source: "dashboard",
    mode: "listing-edit",
    listingId,
  });
  const leonix = input.leonixAdId?.trim();
  if (leonix) params.set("leonixAdId", leonix);
  if (input.returnPanel === "restaurantes") params.set("returnPanel", "restaurantes");
  return appendLangToPath(`/publicar/restaurantes?${params.toString()}`, input.lang);
}

export function restauranteCouponEditHref(input: {
  lang: "es" | "en";
  listingId: string;
  leonixAdId?: string | null;
  returnPanel?: "restaurantes" | "mis-anuncios";
}): string {
  const listingId = input.listingId.trim();
  const params = new URLSearchParams({
    focus: "coupon-upgrade",
    source: "dashboard",
    mode: "coupon-edit",
    listingId,
  });
  const leonix = input.leonixAdId?.trim();
  if (leonix) params.set("leonixAdId", leonix);
  if (input.returnPanel === "restaurantes") params.set("returnPanel", "restaurantes");
  return appendLangToPath(`/publicar/restaurantes?${params.toString()}`, input.lang);
}

export function restauranteCouponAddonHref(input: {
  lang: "es" | "en";
  listingId: string;
  leonixAdId?: string | null;
  returnPanel?: "restaurantes" | "mis-anuncios";
}): string {
  const listingId = input.listingId.trim();
  const params = new URLSearchParams({
    focus: "coupon-upgrade",
    source: "dashboard",
    mode: "coupon-addon",
    listingId,
  });
  const leonix = input.leonixAdId?.trim();
  if (leonix) params.set("leonixAdId", leonix);
  if (input.returnPanel === "restaurantes") params.set("returnPanel", "restaurantes");
  return appendLangToPath(`/publicar/restaurantes?${params.toString()}`, input.lang);
}
