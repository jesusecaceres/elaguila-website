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
      <h2 className="text-lg font-semibold text-[#1A1A1A]">Vista previa de la tarjeta</h2>
      <div className="mt-3 rounded-3xl border border-[#E8DFD0] bg-[#FFFBF7] p-3 sm:p-4">
        <div className="pointer-events-none select-none">
          <RentasResultCard listing={{ ...listing, layout: "vertical" }} copy={copy} lang={lang} />
        </div>
      </div>
    </section>
  );
}
