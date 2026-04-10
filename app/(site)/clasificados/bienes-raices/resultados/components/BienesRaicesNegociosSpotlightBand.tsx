"use client";

import type { Lang } from "@/app/clasificados/config/clasificadosHub";
import type { BrNegocioListing } from "../cards/listingTypes";
import { BienesRaicesNegocioCard } from "../cards/BienesRaicesNegocioCard";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";

export function BienesRaicesNegociosSpotlightBand({
  listings,
  copy,
  lang,
}: {
  listings: BrNegocioListing[];
  copy: BrResultsCopy;
  lang: Lang;
}) {
  if (listings.length === 0) return null;

  return (
    <section className="mt-10" aria-labelledby="br-spotlight-heading">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="br-spotlight-heading" className="font-serif text-xl font-semibold text-[#1E1810] sm:text-2xl">
            {copy.spotlightTitle}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#5C5346]/88">{copy.spotlightSubtitle}</p>
        </div>
        <span className="hidden rounded-full border border-[#C9B46A]/50 bg-[#FFF6E7] px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-[#6E5418] sm:inline-flex">
          {copy.spotlightBadge}
        </span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 pt-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="min-w-[min(100%,320px)] shrink-0 snap-start sm:min-w-0 sm:shrink"
          >
            <div className="rounded-2xl border border-[#C9B46A]/35 bg-gradient-to-b from-[#FFFCF7] to-white p-1 shadow-[0_12px_40px_-18px_rgba(184,149,74,0.45)]">
              <BienesRaicesNegocioCard listing={listing} sellerKindLabels={copy.sellerKindLabels} lang={lang} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
