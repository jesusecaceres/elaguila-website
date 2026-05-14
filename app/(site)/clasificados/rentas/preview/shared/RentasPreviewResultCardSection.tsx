"use client";

import { RENTAS_LANDING_COPY } from "@/app/clasificados/rentas/rentasLandingCopy";
import type { RentasLandingLang } from "@/app/clasificados/rentas/rentasLandingLang";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import { RentasResultCard } from "@/app/clasificados/rentas/results/cards/RentasResultCard";

export function RentasPreviewResultCardSection({
  listing,
  lang,
}: {
  listing: RentasPublicListing;
  lang: RentasLandingLang;
}) {
  const copy = RENTAS_LANDING_COPY[lang];
  return (
    <section className="mx-auto w-full max-w-[1240px] px-4 pt-3 sm:px-6 lg:px-8">
      <h2 className="text-lg font-semibold text-[#1A1A1A]">
        {lang === "en" ? "Results card preview" : "Vista previa de la tarjeta"}
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-[#5C5346]">
        {lang === "es"
          ? "Así se verá tu anuncio en resultados. La vista completa del inmueble aparece abajo."
          : "This is how your listing appears in results. The full property preview is below."}
      </p>
      <div className="mt-4 flex justify-center">
        <div className="w-full max-w-[360px] rounded-2xl border border-[#E8DFD0] bg-[#FFFBF7] p-3 shadow-sm sm:p-4">
          <div className="pointer-events-none select-none">
            <RentasResultCard listing={{ ...listing, layout: "vertical" }} copy={copy} lang={lang} />
          </div>
        </div>
      </div>
    </section>
  );
}
