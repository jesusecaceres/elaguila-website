/**
 * A5.LAUNCH-READINESS-02 — Autos dealer base publish success copy + public profile URL contract.
 */
import { autosLiveVehiclePath } from "@/app/clasificados/autos/filters/autosBrowseFilterContract";
import { appendLangToPath } from "@/app/clasificados/lib/hubUrl";
import { autosDealerInventoryEditHref } from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import { AUTOS_DEALER_MONTHLY_PACKAGE_KEY } from "@/app/lib/listingPlans/publishCheckoutCheckpoint";

export type AutosDealerPublishSuccessLang = "es" | "en";

export function buildAutosDealerPublishedProfileHref(listingId: string, lang: AutosDealerPublishSuccessLang): string {
  const id = listingId.trim();
  return appendLangToPath(autosLiveVehiclePath(id), lang);
}

export type AutosDealerBasePublishSuccessCopy = {
  body: string;
  inventoryFlowNote: string;
  viewProfile: string;
  manageInventory: string;
  pendingBody: string;
};

export function getAutosDealerBasePublishSuccessCopy(lang: AutosDealerPublishSuccessLang): AutosDealerBasePublishSuccessCopy {
  if (lang === "en") {
    return {
      body: "Your Autos dealer listing is active. View your public profile or manage inventory from your dashboard.",
      inventoryFlowNote:
        "Your dealer profile goes live first. After activation, use Manage inventory to add or publish vehicles under this dealership.",
      viewProfile: "View my profile",
      manageInventory: "Manage inventory",
      pendingBody:
        "We are confirming your dealer listing. Your public profile link will appear here once Stripe activates the listing.",
    };
  }
  return {
    body: "Tu perfil de Autos ya está activo. Puedes ver tu perfil público o administrar inventario desde tu panel.",
    inventoryFlowNote:
      "Tu perfil de dealer se activa primero. Después de la activación, usa Administrar inventario para agregar o publicar vehículos bajo este dealer.",
    viewProfile: "Ver mi perfil",
    manageInventory: "Administrar inventario",
    pendingBody:
      "Estamos confirmando tu anuncio de dealer. El enlace a tu perfil público aparecerá aquí cuando Stripe active el listado.",
  };
}

export type AutosDealerBasePublishSuccessPresentation = {
  primaryCta: { href: string; label: string };
  secondaryCta: { href: string; label: string };
  body: string;
  inventoryFlowNote: string;
};

export function resolveAutosDealerBasePublishPaymentSuccessPresentation(input: {
  packageKey: string | null;
  listingId: string | null;
  leonixAdId?: string | null;
  lang: AutosDealerPublishSuccessLang;
  entitlementActive: boolean;
}): AutosDealerBasePublishSuccessPresentation | null {
  if (input.packageKey !== AUTOS_DEALER_MONTHLY_PACKAGE_KEY) return null;
  const listingId = input.listingId?.trim();
  if (!listingId || !input.entitlementActive) return null;

  const copy = getAutosDealerBasePublishSuccessCopy(input.lang);
  return {
    body: copy.body,
    inventoryFlowNote: copy.inventoryFlowNote,
    primaryCta: {
      href: buildAutosDealerPublishedProfileHref(listingId, input.lang),
      label: copy.viewProfile,
    },
    secondaryCta: {
      href: autosDealerInventoryEditHref({
        lang: input.lang,
        listingId,
        leonixAdId: input.leonixAdId,
      }),
      label: copy.manageInventory,
    },
  };
}
