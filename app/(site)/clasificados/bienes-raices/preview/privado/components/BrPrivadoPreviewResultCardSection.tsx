"use client";

/**
 * Item 210 — BR Privado's own results-card preview step, mirroring the already-proven Rentas
 * pattern (`RentasPreviewResultCardSection`). Renders the real, live `BienesRaicesNegocioCard`
 * component (the same one the actual results grid uses) at realistic size, not an approximation.
 */

import { BienesRaicesNegocioCard } from "@/app/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard";
import type { BrNegocioListing } from "@/app/clasificados/bienes-raices/resultados/cards/listingTypes";

export function BrPrivadoPreviewResultCardSection({
  listing,
  lang,
}: {
  listing: BrNegocioListing;
  lang: "es" | "en";
}) {
  return (
    <section className="mx-auto w-full max-w-[1180px] px-3 pt-3 sm:px-5 lg:px-7">
      <div className="rounded-[1.45rem] border border-[#E8DFD0]/90 bg-[#FFFCF7] p-4 shadow-[0_16px_44px_-30px_rgba(42,36,22,0.28)] ring-1 ring-[#C9B46A]/10 sm:p-5">
        <p className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-[#8A6F3A]">
          {lang === "en" ? "Search preview" : "Vista en resultados"}
        </p>
        <h2 className="mt-1 font-serif text-xl font-bold leading-tight text-[#1E1810]">
          {lang === "en" ? "Results card preview" : "Vista previa de la tarjeta"}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C5346]">
          {lang === "es"
            ? "Así se verá tu anuncio en resultados. La vista completa del inmueble aparece abajo."
            : "This is how your listing appears in results. The full property preview is below."}
        </p>
        <div className="mt-4 flex justify-center">
          <div className="w-full max-w-[368px] rounded-[1.35rem] border border-[#C9B46A]/35 bg-[#FBF7EF] p-3 shadow-[0_14px_36px_-24px_rgba(42,36,22,0.32)] sm:p-4">
            <div className="pointer-events-none select-none">
              <BienesRaicesNegocioCard listing={listing} lang={lang} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
