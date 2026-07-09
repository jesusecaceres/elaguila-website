"use client";

import type { OfertasLocalesAppLang } from "@/app/lib/ofertas-locales/useOfertasLocalesAppLang";
import { OFERTAS_LOCALES_PREVIEW_COPY } from "./ofertasLocalesPreviewCopy";

const CARD =
  "rounded-2xl border border-dashed border-[#D4C4A8]/80 bg-[#FDF8F0]/50 p-4 opacity-75";

/** FUTURE WIRING: connect to saved shopping list table / dashboard saved offers. */
export function OfertasFutureShoppingListCard({ lang }: { lang: OfertasLocalesAppLang }) {
  return (
    <div className={CARD} aria-disabled="true">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#B8860B]">
        {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.comingSoonEn : OFERTAS_LOCALES_PREVIEW_COPY.comingSoonEs}
      </p>
      <h3 className="mt-2 font-serif text-lg font-semibold text-[#1E1814]/70">
        {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.myListEn : OFERTAS_LOCALES_PREVIEW_COPY.myListEs}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-[#1E1814]/55">
        {lang === "en"
          ? OFERTAS_LOCALES_PREVIEW_COPY.shoppingListFutureEn
          : OFERTAS_LOCALES_PREVIEW_COPY.shoppingListFutureEs}
      </p>
      <button
        type="button"
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-xl border border-[#D4C4A8] bg-white/60 px-4 py-3 text-sm font-medium text-[#1E1814]/40"
      >
        {lang === "en" ? OFERTAS_LOCALES_PREVIEW_COPY.myListEn : OFERTAS_LOCALES_PREVIEW_COPY.myListEs}
      </button>
    </div>
  );
}
