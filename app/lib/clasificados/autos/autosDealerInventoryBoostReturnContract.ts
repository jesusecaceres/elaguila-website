/**
 * A5.MONETIZATION-03 — Autos Negocios Inventory Boost payment return routing.
 * Draft vs dashboard/manage success CTA contract for locked-site safety.
 */

import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import {
  autosDealerInventoryEditHref,
  autosDealerInventoryPackEditSuccessLabel,
} from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import { AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";
import {
  buildDashboardMisAnunciosReturnPath,
  sanitizeRevenueOsReturnPath,
  type RevenueOsLang,
} from "@/app/lib/listingPlans/revenueOsReturnPath";

export type AutosInventoryBoostReturnSource = "draft" | "dashboard" | "manage_inventory" | "unknown";

export const AUTOS_NEGOCIOS_PUBLISH_BASE = "/publicar/autos/negocios";

export function isAutosNegociosPublishPath(pathname: string): boolean {
  const normalized = pathname.replace(/\/$/, "") || "";
  return normalized === AUTOS_NEGOCIOS_PUBLISH_BASE || normalized.endsWith(AUTOS_NEGOCIOS_PUBLISH_BASE);
}

function parseInternalReturnUrl(returnTo: string): URL | null {
  const trimmed = returnTo.trim();
  if (!trimmed.startsWith("/")) return null;
  try {
    return new URL(trimmed, "http://local");
  } catch {
    return null;
  }
}

export function classifyAutosInventoryBoostReturnSource(input: {
  returnTo?: string | null;
  boostSource?: string | null;
}): AutosInventoryBoostReturnSource {
  const explicit = input.boostSource?.trim().toLowerCase();
  if (explicit === "draft") return "draft";
  if (explicit === "dashboard") return "dashboard";
  if (explicit === "manage_inventory") return "manage_inventory";

  const returnTo = input.returnTo?.trim();
  if (!returnTo) return "unknown";

  const url = parseInternalReturnUrl(returnTo);
  if (!url || !isAutosNegociosPublishPath(url.pathname)) return "unknown";

  const source = url.searchParams.get("source")?.trim().toLowerCase();
  const mode = url.searchParams.get("mode")?.trim().toLowerCase();
  if (source === "dashboard") {
    if (mode === "inventory-edit" || mode === "inventory-addon") return "manage_inventory";
    return "dashboard";
  }

  return "draft";
}

export function buildAutosNegociosDraftBoostFallbackPath(lang: RevenueOsLang): string {
  const params = new URLSearchParams({ focus: "inventory-pack" });
  return appendLangToPath(`${AUTOS_NEGOCIOS_PUBLISH_BASE}?${params.toString()}`, lang);
}

/** Preserve lang + inventory focus on draft application return without storing draft payload in URL. */
export function ensureAutosNegociosDraftBoostReturnFocus(
  returnTo: string | null | undefined,
  lang: RevenueOsLang,
): string {
  const fallback = buildAutosNegociosDraftBoostFallbackPath(lang);
  const trimmed = returnTo?.trim();
  if (!trimmed) return fallback;

  const url = parseInternalReturnUrl(trimmed);
  if (!url || !isAutosNegociosPublishPath(url.pathname)) return fallback;

  url.searchParams.set("focus", "inventory-pack");
  if (!url.searchParams.has("lang")) {
    url.searchParams.set("lang", lang);
  }
  const qs = url.searchParams.toString();
  return qs ? `${url.pathname}?${qs}` : url.pathname;
}

export function appendAutosInventoryBoostSuccessQuery(
  successUrl: string,
  source: AutosInventoryBoostReturnSource,
): string {
  if (source !== "draft") return successUrl;
  const sep = successUrl.includes("?") ? "&" : "?";
  return `${successUrl}${sep}boost_source=draft`;
}

export type AutosDealerInventoryPackPaymentSuccessPresentation = {
  source: AutosInventoryBoostReturnSource;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string } | null;
  bodyOverride?: string;
};

export function resolveAutosDealerInventoryPackPaymentSuccessPresentation(input: {
  packageKey: string | null;
  listingId: string | null;
  leonixAdId?: string | null;
  lang: RevenueOsLang;
  returnTo?: string | null;
  boostSource?: string | null;
}): AutosDealerInventoryPackPaymentSuccessPresentation | null {
  if (input.packageKey !== AUTOS_DEALER_INVENTORY_PACK_PACKAGE_KEY) return null;
  const listingId = input.listingId?.trim();
  if (!listingId) return null;

  const lang = input.lang;
  const dashboardHref = buildDashboardMisAnunciosReturnPath(lang, "autos");
  const source = classifyAutosInventoryBoostReturnSource({
    returnTo: input.returnTo,
    boostSource: input.boostSource,
  });
  const manageHref = autosDealerInventoryEditHref({
    lang,
    listingId,
    leonixAdId: input.leonixAdId,
  });

  if (source === "draft") {
    const href = sanitizeRevenueOsReturnPath(
      ensureAutosNegociosDraftBoostReturnFocus(input.returnTo, lang),
      buildAutosNegociosDraftBoostFallbackPath(lang),
    );
    return {
      source,
      primaryCta: {
        href,
        label: lang === "es" ? "Regresar a la solicitud" : "Return to application",
      },
      secondaryCta: {
        href: dashboardHref,
        label: lang === "es" ? "Volver a mi panel" : "Back to my dashboard",
      },
      bodyOverride:
        lang === "es"
          ? "Inventory Boost está activo. Regresa a tu solicitud de Autos para continuar agregando vehículos."
          : "Inventory Boost is active. Return to your Autos application to continue adding vehicles.",
    };
  }

  if (source === "dashboard" || source === "manage_inventory") {
    const safeReturn = input.returnTo?.trim()
      ? sanitizeRevenueOsReturnPath(input.returnTo, manageHref)
      : null;
    const href =
      safeReturn &&
      isAutosNegociosPublishPath(safeReturn.split("?")[0] ?? "") &&
      safeReturn.includes("source=dashboard")
        ? safeReturn
        : manageHref;
    return {
      source,
      primaryCta: {
        href,
        label: autosDealerInventoryPackEditSuccessLabel(lang),
      },
      secondaryCta: {
        href: dashboardHref,
        label: lang === "es" ? "Volver a mi panel" : "Back to my dashboard",
      },
    };
  }

  const safeReturn = input.returnTo?.trim()
    ? sanitizeRevenueOsReturnPath(input.returnTo, manageHref)
    : null;
  if (
    safeReturn &&
    isAutosNegociosPublishPath(safeReturn.split("?")[0] ?? "") &&
    !safeReturn.includes("source=dashboard")
  ) {
    return {
      source: "draft",
      primaryCta: {
        href: safeReturn,
        label: lang === "es" ? "Regresar a la solicitud" : "Return to application",
      },
      secondaryCta: {
        href: dashboardHref,
        label: lang === "es" ? "Volver a mi panel" : "Back to my dashboard",
      },
      bodyOverride:
        lang === "es"
          ? "Inventory Boost está activo. Regresa a tu solicitud de Autos para continuar agregando vehículos."
          : "Inventory Boost is active. Return to your Autos application to continue adding vehicles.",
    };
  }

  return {
    source: "unknown",
    primaryCta: {
      href: manageHref,
      label: autosDealerInventoryPackEditSuccessLabel(lang),
    },
    secondaryCta:
      safeReturn && safeReturn !== manageHref
        ? { href: safeReturn, label: lang === "es" ? "Continuar" : "Continue" }
        : { href: dashboardHref, label: lang === "es" ? "Volver a mi panel" : "Back to my dashboard" },
  };
}
