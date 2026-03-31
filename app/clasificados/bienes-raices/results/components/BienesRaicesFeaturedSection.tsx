"use client";

import type { BrNegocioListing } from "../cards/listingTypes";
import { BienesRaicesNegocioFeaturedCard } from "../cards/BienesRaicesNegocioFeaturedCard";
import { BienesRaicesMapPreview } from "../map/BienesRaicesMapPreview";

type Props = {
  listing: BrNegocioListing;
  showMap: boolean;
};

export function BienesRaicesFeaturedSection({ listing, showMap }: Props) {
  return (
    <section className="mt-8" aria-labelledby="br-featured-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 id="br-featured-heading" className="font-serif text-lg font-semibold text-[#1E1810] sm:text-xl">
          Anuncio destacado
        </h2>
        <p className="text-xs text-[#5C5346]/75">Negocio · Leonix Clasificados</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7 xl:col-span-8">
          <BienesRaicesNegocioFeaturedCard listing={listing} />
        </div>
        <div className="hidden lg:col-span-5 lg:block xl:col-span-4">
          {showMap ? (
            <BienesRaicesMapPreview />
          ) : (
            <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-[#E8DFD0] bg-[#FDFBF7]/80 p-6 text-center text-sm leading-relaxed text-[#5C5346]/75">
              El mapa es opcional. Actívalo arriba para una vista suave al lado del destacado, sin quitarle protagonismo a las
              tarjetas.
            </div>
          )}
        </div>
      </div>
      {showMap ? (
        <div className="mt-6 lg:hidden">
          <BienesRaicesMapPreview />
        </div>
      ) : null}
    </section>
  );
}
