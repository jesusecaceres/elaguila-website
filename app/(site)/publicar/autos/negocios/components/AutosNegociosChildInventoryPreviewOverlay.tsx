"use client";

import { useEffect } from "react";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { AutoDealerPreviewPage } from "@/app/clasificados/autos/negocios/components/AutoDealerPreviewPage";
import { AutosNegociosPreviewLocaleProvider } from "@/app/clasificados/autos/negocios/lib/AutosNegociosPreviewLocaleContext";
import { AutosNegociosPreviewCaptureBanner } from "@/app/clasificados/autos/negocios/components/AutosNegociosPreviewCaptureBanner";
import { AutosNegociosResultsCardPreview } from "@/app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  buildRelatedDraftPreviewListings,
  mapInheritedDealerPreviewListing,
} from "@/app/lib/clasificados/autos/autosInventoryInheritedPreview";
import {
  autosChildInventoryPreviewHelper,
  autosChildInventoryPreviewTitle,
  autosRelatedInventoryDraftNote,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

type Props = {
  lang: AutosNegociosLang;
  parentListing: AutoDealerListing;
  child: AutosAdditionalInventoryVehicleDraft;
  allAdditional: AutosAdditionalInventoryVehicleDraft[];
  backToEditLabel: string;
  onBackToEdit: () => void;
};

export function AutosNegociosChildInventoryPreviewOverlay({
  lang,
  parentListing,
  child,
  allAdditional,
  backToEditLabel,
  onBackToEdit,
}: Props) {
  const merged = mapInheritedDealerPreviewListing(parentListing, child);
  merged.relatedDealerListings = buildRelatedDraftPreviewListings(
    parentListing,
    allAdditional,
    child.id,
    lang,
  );
  merged.relatedDealerInventoryHasMore = allAdditional.length > 3;
  merged.relatedDealerInventoryHref = null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onBackToEdit();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onBackToEdit]);

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col bg-[color:var(--lx-page)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="autos-child-inventory-preview-title"
      data-autos-child-inventory-preview="1"
    >
      <div className="sticky top-0 z-10 border-b border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)]/95 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="autos-child-inventory-preview-title" className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">
              {autosChildInventoryPreviewTitle(lang)}
            </h2>
            <p className="mt-1 text-sm text-[color:var(--lx-text-2)]">{autosChildInventoryPreviewHelper(lang)}</p>
            <p className="mt-1 text-[11px] text-[color:var(--lx-muted)]">{autosRelatedInventoryDraftNote(lang)}</p>
          </div>
          <button
            type="button"
            onClick={onBackToEdit}
            className="shrink-0 rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-4 py-2 text-sm font-bold text-[color:var(--lx-text)] hover:bg-[color:var(--lx-nav-hover)]"
          >
            {backToEditLabel}
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <AutosNegociosPreviewLocaleProvider lang={lang}>
          <AutosNegociosPreviewCaptureBanner lang={lang} />
          <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
            <AutosNegociosResultsCardPreview lang={lang} listing={merged} additionalCount={allAdditional.length} />
          </div>
          <AutoDealerPreviewPage data={merged} relatedPreviewOnly />
        </AutosNegociosPreviewLocaleProvider>
      </div>
    </div>
  );
}
