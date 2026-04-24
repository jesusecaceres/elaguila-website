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
    <section className="mt-12" aria-labelledby="br-spotlight-heading">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8A6F3A]/90">Leonix</p>
          <h2 id="br-spotlight-heading" className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#1E1810] sm:text-[1.75rem]">
            {copy.spotlightTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5C5346]/88 sm:text-[0.95rem]">{copy.spotlightSubtitle}</p>
        </div>
        <span className="hidden rounded-full border border-[#C9B46A]/45 bg-gradient-to-r from-[#FFF8E8] to-[#FFFCF7] px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#6E5418] shadow-sm sm:inline-flex">
          {copy.spotlightBadge}
        </span>
      </div>
      <div className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-3 pt-1 sm:mx-0 sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3">
        {listings.map((listing) => (
          <div
            key={listing.id}
            className="min-w-[min(100%,340px)] shrink-0 snap-start sm:min-w-0 sm:shrink"
          >
            <div className="rounded-[24px] border border-[#D4C4A8]/40 bg-gradient-to-b from-[#FFFCF7] via-white to-[#F9F4EC] p-[3px] shadow-[0_20px_56px_-24px_rgba(138,111,58,0.38)]">
              <BienesRaicesNegocioCard listing={listing} sellerKindLabels={copy.sellerKindLabels} lang={lang} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
