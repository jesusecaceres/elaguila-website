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
  autosRelatedInventoryWillPublishWithRequest,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

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

  return (
    <section
      className="mx-auto mb-10 max-w-[1280px] px-4 md:px-5 lg:px-6"
      data-autos-related-inventory-preview-only="1"
    >
      <h2 className="text-xl font-extrabold tracking-tight text-[color:var(--lx-text)] sm:text-2xl">
        {autosPreviewInventorySectionTitle(lang)}
      </h2>
      <p className="mt-2 max-w-3xl text-sm text-[color:var(--lx-text-2)]">{autosPreviewInventorySectionHelper(lang)}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className="overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_8px_28px_-12px_rgba(42,36,22,0.1)]"
          >
            <div className="aspect-[16/10] bg-[color:var(--lx-section)]">
              {card.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-[color:var(--lx-muted)]">
                  {lang === "es" ? "Sin imagen" : "No image"}
                </div>
              )}
            </div>
            <div className="p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--lx-gold)]">
                {autosInventoryBundleAdditionalLabel(lang)} · {autosRelatedInventoryDraftCardLabel(lang)}
              </p>
              <h3 className="mt-1 text-base font-bold text-[color:var(--lx-text)]">{card.title}</h3>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[color:var(--lx-text-2)]">
                {card.price ? <span className="font-semibold text-[color:var(--lx-text)]">{card.price}</span> : null}
                {card.mileage ? <span>{card.mileage}</span> : null}
                {card.location ? <span>{card.location}</span> : null}
              </div>
              {card.specLine ? <p className="mt-1 text-xs text-[color:var(--lx-muted)]">{card.specLine}</p> : null}
              <p className="mt-2 text-[10px] text-[color:var(--lx-muted)]">{autosRelatedInventoryWillPublishWithRequest(lang)}</p>
              <p className="mt-3 text-[10px] text-[color:var(--lx-muted)]">{card.draftNote}</p>
              <span
                className="mt-3 inline-flex min-h-[36px] w-full cursor-default items-center justify-center rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] px-3 text-[11px] font-semibold text-[color:var(--lx-muted)]"
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
