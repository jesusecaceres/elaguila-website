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
    <section className="mx-auto w-full max-w-[1180px] px-3 pt-3 sm:px-5 lg:px-7">
      <div className="rounded-[1.45rem] border border-[#D6C7AD]/75 bg-[#FFFDF7] p-4 shadow-[0_16px_44px_-30px_rgba(31,36,28,0.32)] ring-1 ring-[#C9A84A]/10 sm:p-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">
          {lang === "en" ? "Search preview" : "Vista en resultados"}
        </p>
        <h2 className="mt-1 font-serif text-xl font-bold leading-tight text-[#1F241C]">
          {lang === "en" ? "Results card preview" : "Vista previa de la tarjeta"}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C5346]">
          {lang === "es"
            ? "Así se verá tu anuncio en resultados. La vista completa del inmueble aparece abajo."
            : "This is how your listing appears in results. The full property preview is below."}
        </p>
        <div className="mt-4 flex justify-center">
          <div className="w-full max-w-[368px] rounded-[1.35rem] border border-[#C9A84A]/35 bg-[#FBF7EF] p-3 shadow-[0_14px_36px_-24px_rgba(31,36,28,0.38)] sm:p-4">
            <div className="pointer-events-none select-none">
              <RentasResultCard listing={{ ...listing, layout: "vertical" }} copy={copy} lang={lang} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
