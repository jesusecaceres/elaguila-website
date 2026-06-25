"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import type { AutosNegociosBuyerPreviewInventoryCard } from "@/app/lib/clasificados/autos/mapAutosNegociosBuyerPreviewViewModel";
import {
  autosInventoryBundleAdditionalLabel,
  autosPreviewInventorySectionHelper,
  autosPreviewInventorySectionTitle,
  autosRelatedInventoryAvailableAfterPublish,
  autosRelatedInventoryDraftCardLabel,
  autosRelatedInventoryFullDraftDeferral,
  autosRelatedInventoryWillPublishWithRequest,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  AUTOS_PREVIEW_MAX_RELATED_VISIBLE,
  autosPreviewPremiumCardClass,
  autosPreviewSectionEyebrowClass,
  autosPreviewSectionTitleClass,
  autosRelatedInventoryShelfCardShellClass,
  autosRelatedInventoryShelfScrollClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

export function AutosNegociosPreviewInventorySection({
  lang,
  parentListing,
  additionalVehicles,
  viewModelCards,
}: {
  lang: AutosNegociosLang;
  parentListing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
  viewModelCards?: AutosNegociosBuyerPreviewInventoryCard[];
}) {
  void parentListing;
  if (additionalVehicles.length === 0) return null;

  const cards =
    viewModelCards ??
    additionalVehicles.map((v) => ({
      id: v.id,
      title: v.id,
      coverUrl: null,
      price: null,
      mileage: null,
      location: null,
      specLine: null,
      draftNote: lang === "es" ? "ID Leonix se generará al publicar" : "Leonix ID generated on publish",
    }));

  const visible = cards.slice(0, AUTOS_PREVIEW_MAX_RELATED_VISIBLE);
  const hiddenCount = Math.max(0, cards.length - visible.length);

  return (
    <section
      className="mx-auto mb-10 max-w-[1280px] px-4 md:px-5 lg:px-6"
      data-autos-related-inventory-preview-only="1"
      data-autos-related-inventory-shelf="1"
    >
      <p className={autosPreviewSectionEyebrowClass}>
        {lang === "es" ? "Inventario incluido" : "Included inventory"}
      </p>
      <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>{autosPreviewInventorySectionTitle(lang)}</h2>
      <p className="mt-2 max-w-3xl text-sm text-[#5C5346]">{autosPreviewInventorySectionHelper(lang)}</p>
      {hiddenCount > 0 ? (
        <p
          className="mt-3 inline-flex max-w-full rounded-full border border-[#D6C7AD]/80 bg-[#FBF7EF] px-3 py-1.5 text-[11px] font-semibold text-[#5C5346]"
          data-autos-related-inventory-draft-deferral="1"
        >
          {autosRelatedInventoryFullDraftDeferral(lang)}
        </p>
      ) : null}
      <div className={`mt-5 ${autosRelatedInventoryShelfScrollClass}`}>
        {visible.map((card) => (
          <article
            key={card.id}
            className={`${autosPreviewPremiumCardClass} overflow-hidden ${autosRelatedInventoryShelfCardShellClass}`}
          >
            <div className="aspect-[4/3] bg-[#F5F0E8]">
              {card.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[#8A7A68]">
                  {lang === "es" ? "Sin imagen" : "No image"}
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8A6B1F]">
                {autosInventoryBundleAdditionalLabel(lang)} · {autosRelatedInventoryDraftCardLabel(lang)}
              </p>
              <h3 className="mt-1 font-serif text-base font-bold text-[#1F241C]">{card.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#5C5346]">
                {card.price ? <span className="font-semibold text-[#7A1E2C]">{card.price}</span> : null}
                {card.mileage ? <span>{card.mileage}</span> : null}
                {card.location ? <span>{card.location}</span> : null}
              </div>
              {card.specLine ? <p className="mt-1 text-xs text-[#8A7A68]">{card.specLine}</p> : null}
              <p className="mt-2 text-[10px] text-[#8A7A68]">{autosRelatedInventoryWillPublishWithRequest(lang)}</p>
              <p className="mt-2 text-[10px] text-[#8A7A68]">{card.draftNote}</p>
              <span
                className="mt-3 inline-flex min-h-[36px] w-full cursor-default items-center justify-center rounded-full border border-[#D6C7AD]/70 bg-[#FBF7EF] px-3 text-[11px] font-semibold text-[#8A7A68]"
                aria-disabled="true"
                data-autos-related-inventory-draft-cta="1"
              >
                {autosRelatedInventoryAvailableAfterPublish(lang)}
              </span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
