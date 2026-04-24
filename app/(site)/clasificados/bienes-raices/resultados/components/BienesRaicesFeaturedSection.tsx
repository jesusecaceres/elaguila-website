"use client";

import type { BrNegocioListing } from "../cards/listingTypes";
import { BienesRaicesNegocioFeaturedCard } from "../cards/BienesRaicesNegocioFeaturedCard";
import { BienesRaicesMapPreview } from "../map/BienesRaicesMapPreview";
import {
  brLuxuryBodyMutedClass,
  brLuxuryCardClass,
  brLuxuryOverlineClass,
  brLuxurySerifHeadingClass,
} from "../../shared/brResultsTheme";

type Props = {
  listing: BrNegocioListing | null;
  showMap: boolean;
};

export function BienesRaicesFeaturedSection({ listing, showMap }: Props) {
  if (!listing) {
    return (
      <section className={`mt-8 ${brLuxuryCardClass} border-dashed border-[#D4C4A8]/60 p-8 text-center`}>
        <p className={brLuxuryBodyMutedClass}>
          No hay destacado en esta vista de categoría. Ajusta el filtro o explora la cuadrícula.
        </p>
      </section>
    );
  }
  return (
    <section className="mt-8" aria-labelledby="br-featured-heading">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className={brLuxuryOverlineClass}>Negocio · Leonix</p>
          <h2 id="br-featured-heading" className={`mt-1.5 ${brLuxurySerifHeadingClass} text-xl sm:text-2xl`}>
            Propiedad destacada
          </h2>
        </div>
        <p className={`hidden text-right sm:block ${brLuxuryBodyMutedClass} max-w-[14rem] text-xs`}>
          Ubicación premium en resultados — diseñada para conversión.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-12 lg:items-stretch">
        <div className="lg:col-span-7 xl:col-span-8">
          <BienesRaicesNegocioFeaturedCard listing={listing} />
        </div>
        <div className="hidden lg:col-span-5 lg:block xl:col-span-4">
          {showMap ? (
            <BienesRaicesMapPreview />
          ) : (
            <div
              className={`flex h-full min-h-[240px] items-center justify-center border-dashed border-[#D4C4A8]/60 p-6 text-center ${brLuxuryCardClass}`}
            >
              <p className={`${brLuxuryBodyMutedClass} text-sm leading-relaxed`}>
                El mapa es opcional. Actívalo arriba para una vista suave al lado del destacado, sin quitarle protagonismo a las
                tarjetas.
              </p>
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
