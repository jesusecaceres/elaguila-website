"use client";

import Link from "next/link";
import {
  getRestauranteOfertasLocalesUpsellCopy,
  restauranteOfertasLocalesPublishHref,
  type RestauranteOfertasUpsellLang,
} from "./restaurantesOffersUpsellCopy";

/**
 * Informational Ofertas Locales combo upsell — display/link only (REST-OFFERS-UPSELL1).
 * Does not block publish, change checkout, or imply purchased add-on.
 */
export function RestauranteOfertasLocalesUpsellCard({ lang = "es" }: { lang?: RestauranteOfertasUpsellLang }) {
  const copy = getRestauranteOfertasLocalesUpsellCopy(lang);
  const href = restauranteOfertasLocalesPublishHref(lang);

  return (
    <section
      className="mt-4 rounded-2xl border border-[#D8C2A0]/70 bg-gradient-to-br from-[#FFFAF3] to-[#F6EBDD]/80 p-4 shadow-[0_10px_32px_-12px_rgba(42,36,22,0.12)] sm:p-5"
      aria-labelledby="restaurante-ofertas-upsell-heading"
      data-restaurante-ofertas-upsell="1"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8B7E70]">{copy.optionalLabel}</p>
      <h3 id="restaurante-ofertas-upsell-heading" className="mt-1 text-base font-extrabold tracking-tight text-[#1F1A17]">
        {copy.heading}
      </h3>
      <p className="mt-2 text-sm font-bold text-[#2C1810]">{copy.packageName}</p>
      <div className="mt-2 space-y-1 text-sm leading-relaxed text-[#5A5148]">
        <p>{copy.baseLine}</p>
        <p>{copy.addonLine}</p>
        <p className="font-semibold text-[#1F1A17]">{copy.comboLine}</p>
        <p className="text-xs font-medium text-emerald-900/90">{copy.savingsLine}</p>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#5A5148]">{copy.valueLine}</p>
      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
        {copy.bullets.map((line) => (
          <li key={line} className="flex gap-2 text-xs font-medium text-[#5A5148]">
            <span className="mt-0.5 shrink-0 text-[#C9A84A]" aria-hidden>
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <Link
          href={href}
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-[#2C1810] px-5 text-sm font-bold text-[#FFFAF3] shadow-md transition hover:bg-[#1A1412]"
        >
          {copy.cta}
        </Link>
        <p className="text-xs leading-snug text-[#8B7E70]">{copy.helper}</p>
      </div>
    </section>
  );
}
