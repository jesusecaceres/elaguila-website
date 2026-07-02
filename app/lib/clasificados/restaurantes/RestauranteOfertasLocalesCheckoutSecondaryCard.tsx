"use client";

import Link from "next/link";
import { getRestauranteOfertasLocalesCheckoutSecondaryCopy, restauranteOfertasLocalesPublishHref } from "./restaurantesOffersCheckoutSecondaryCopy";
import type { RestauranteOfertasUpsellLang } from "./restaurantesOffersUpsellCopy";

/**
 * Secondary Ofertas Locales info — clearly separate from today's restaurant checkout.
 * Gate RESTAURANTES-PENDING-PUBLISH-AND-COUPON-OFFERS-TRUTH-01
 */
export function RestauranteOfertasLocalesCheckoutSecondaryCard({
  lang = "es",
}: {
  lang?: RestauranteOfertasUpsellLang;
}) {
  const copy = getRestauranteOfertasLocalesCheckoutSecondaryCopy(lang);
  const href = restauranteOfertasLocalesPublishHref(lang);

  return (
    <section
      className="mt-4 rounded-2xl border border-[#D8C2A0]/60 bg-[#FFFAF3]/90 p-4 sm:p-5"
      aria-labelledby="restaurante-ofertas-secondary-heading"
      data-restaurante-ofertas-checkout-secondary="1"
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8B7E70]">{copy.optionalLabel}</p>
      <h3 id="restaurante-ofertas-secondary-heading" className="mt-1 text-base font-extrabold tracking-tight text-[#1F1A17]">
        {copy.heading}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-[#5A5148]">{copy.body}</p>
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
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#D8C2A0] bg-white px-5 text-sm font-bold text-[#2C1810] transition hover:bg-[#F6EBDD]"
        >
          {copy.cta}
        </Link>
        <p className="text-xs leading-snug text-[#8B7E70]">{copy.helper}</p>
      </div>
    </section>
  );
}
