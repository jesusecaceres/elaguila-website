"use client";

import { useEffect, useState } from "react";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import {
  autosInventoryBoostNoPaymentNote,
  autosInventoryBoostPanelIntro,
  autosInventoryBoostPanelSupportingCopy,
  autosInventoryBoostPanelTitle,
  autosInventoryBoostPricingBullets,
  type AutosInventoryBoostReturnContext,
} from "@/app/lib/clasificados/autos/autosInventoryBoostPipeline";
import {
  autosDealerInventoryPackAddonUpgradeBusyLabel,
  autosDealerInventoryPackAddonUpgradeLabel,
  redirectAutosDealerInventoryPackCheckout,
  REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED,
} from "@/app/(site)/dashboard/lib/autosDashboardInventoryAddonCheckout";
import { redirectAutosDealerInventoryPackApplicationCheckout } from "@/app/lib/clasificados/autos/autosDealerInventoryBoostCheckoutClient";
import { ensureAutosNegociosDraftListingForBoost } from "../lib/ensureAutosNegociosDraftListingForBoost";

export type AutosInventoryBoostEditorContext = Omit<AutosInventoryBoostReturnContext, "savedAt" | "status">;

type Props = {
  open: boolean;
  onClose: () => void;
  lang: AutosNegociosLang;
  flushDraft?: () => Promise<void>;
  editorContext: AutosInventoryBoostEditorContext;
  /** Parent dealer listing id when already persisted (dashboard or draft sync). */
  parentListingId?: string | null;
  leonixAdId?: string | null;
  /** Pre-publish application — sync draft listing + application checkout API. */
  prePublishMode?: boolean;
  parentListing?: AutoDealerListing;
};

export function AutosNegociosInventoryBoostPanel({
  open,
  onClose,
  lang,
  flushDraft,
  editorContext,
  parentListingId,
  leonixAdId,
  prePublishMode = false,
  parentListing,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bullets = autosInventoryBoostPricingBullets(lang);
  const checkoutEnabled = REVENUE_OS_AUTOS_DEALER_INVENTORY_PACK_SUPPORTED;

  useEffect(() => {
    if (!open) return;
    setError(null);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleCheckout = async () => {
    setBusy(true);
    setError(null);
    try {
      if (flushDraft) await flushDraft();
      if (!checkoutEnabled) {
        setError(
          lang === "es"
            ? "El checkout de inventario aún no está disponible."
            : "Inventory checkout is not available yet.",
        );
        return;
      }

      const returnPath =
        editorContext.editorPath && editorContext.editorSearch
          ? `${editorContext.editorPath}${editorContext.editorSearch}`
          : undefined;

      let listingId = parentListingId?.trim() || editorContext.parentListingId?.trim() || "";
      let resolvedLeonixAdId = leonixAdId?.trim() || null;

      if (prePublishMode) {
        if (!parentListing) {
          setError(
            lang === "es"
              ? "Guarda tu solicitud antes de activar Inventory Boost."
              : "Save your application before activating Inventory Boost.",
          );
          return;
        }
        const ensured = await ensureAutosNegociosDraftListingForBoost({
          listing: parentListing,
          lang,
        });
        if (!ensured.ok) {
          setError(ensured.userMessage);
          return;
        }
        listingId = ensured.listingId;
        resolvedLeonixAdId = ensured.leonixAdId ?? resolvedLeonixAdId;
      }

      if (!listingId) {
        setError(
          lang === "es"
            ? "No pudimos preparar tu solicitud para Inventory Boost."
            : "We could not prepare your application for Inventory Boost.",
        );
        return;
      }

      const boostReturnContext = {
        ...editorContext,
        parentListingId: listingId,
      };

      const result = prePublishMode
        ? await redirectAutosDealerInventoryPackApplicationCheckout({
            listingId,
            leonixAdId: resolvedLeonixAdId,
            lang,
            returnPath: returnPath ?? null,
            boostReturnContext,
          })
        : await redirectAutosDealerInventoryPackCheckout({
            listingId,
            leonixAdId: resolvedLeonixAdId,
            lang,
            returnPath: returnPath ?? null,
          });

      if (!result.ok) {
        setError(result.userMessage);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[75] flex items-end justify-center lg:items-center lg:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autos-inventory-boost-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1810]/45 backdrop-blur-[2px]"
        aria-label={lang === "es" ? "Cerrar" : "Close"}
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(92dvh,640px)] w-full flex-col rounded-t-[24px] border border-[#E8DFD0] bg-[#FAF7F2] shadow-2xl lg:max-w-lg lg:rounded-[24px]">
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[#D4C4A8] lg:hidden" aria-hidden />
        <div className="flex shrink-0 items-center justify-between border-b border-[#E8DFD0] px-4 py-3 sm:px-5">
          <h2 id="autos-inventory-boost-title" className="font-serif text-lg font-semibold text-[#1E1810]">
            {autosInventoryBoostPanelTitle(lang)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-3 py-1.5 text-sm font-semibold text-[#5C5346] hover:bg-[#FDFBF7]"
          >
            {lang === "es" ? "Cerrar" : "Close"}
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <p className="text-sm leading-relaxed text-[#2C2416]">{autosInventoryBoostPanelIntro(lang)}</p>
          <p className="mt-3 text-sm leading-relaxed text-[#2C2416]">{autosInventoryBoostPanelSupportingCopy(lang)}</p>
          <ul className="mt-4 space-y-2.5">
            {bullets.map((line) => (
              <li key={line} className="flex gap-2 text-sm text-[#2C2416]">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9B46A]" aria-hidden />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs font-medium text-[#6E5418]">
            {checkoutEnabled
              ? lang === "es"
                ? "Solo se cobra el paquete de inventario adicional — no se vuelve a cobrar el plan dealer base."
                : "Only the additional inventory pack is charged — your base dealer plan is not charged again."
              : autosInventoryBoostNoPaymentNote(lang)}
          </p>
          {error ? (
            <p className="mt-4 rounded-xl border border-red-200/90 bg-red-50/95 px-4 py-3 text-sm font-medium text-red-950">
              {error}
            </p>
          ) : null}
        </div>
        <div className="shrink-0 border-t border-[#E8DFD0] bg-[#FAF7F2] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5">
          <button
            type="button"
            disabled={busy || !checkoutEnabled}
            onClick={() => void handleCheckout()}
            className="w-full rounded-2xl bg-[#2A2620] py-3.5 text-sm font-bold text-[#FAF7F2] shadow-md hover:bg-[#1E1810] disabled:opacity-60"
          >
            {busy
              ? autosDealerInventoryPackAddonUpgradeBusyLabel(lang)
              : autosDealerInventoryPackAddonUpgradeLabel(lang)}
          </button>
        </div>
      </div>
    </div>
  );
}
