"use client";

import Link from "next/link";
import { FiExternalLink, FiTag } from "react-icons/fi";
import type { RestauranteLinkedOfferPreview } from "@/app/lib/clasificados/restaurantes/restaurantesLinkedOffersTypes";

const STRIP_UI = {
  es: {
    title: "Ofertas y especiales",
    expires: "Válido hasta",
    viewOffer: "Ver oferta",
    viewHub: "Explorar ofertas locales",
  },
  en: {
    title: "Offers & specials",
    expires: "Valid until",
    viewOffer: "View offer",
    viewHub: "Browse local deals",
  },
} as const;

function formatExpiry(iso: string | null | undefined, lang: "es" | "en"): string | null {
  const raw = (iso ?? "").trim();
  if (!raw) return null;
  try {
    return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-US", { dateStyle: "medium" }).format(
      new Date(raw),
    );
  } catch {
    return null;
  }
}

export function RestauranteOffersPreviewStrip({
  offers,
  lang = "es",
}: {
  offers: RestauranteLinkedOfferPreview[];
  lang?: "es" | "en";
}) {
  if (!offers.length) return null;

  const ui = STRIP_UI[lang];
  const hubHref = `/clasificados/ofertas-locales?lang=${lang}`;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-[#D8C2A0] bg-[#FFFAF3] shadow-[0_4px_20px_-8px_rgba(212,165,116,0.14)]"
      aria-labelledby="restaurante-offers-strip-heading"
      data-restaurante-offers-strip="1"
    >
      <div className="border-b border-[#D8C2A0]/60 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="restaurante-offers-strip-heading"
            className="flex items-center gap-2 text-lg font-bold tracking-tight text-[#1F1A17] md:text-xl"
          >
            <FiTag className="h-5 w-5 shrink-0 text-[#C9A84A]" aria-hidden />
            {ui.title}
          </h2>
          <Link
            href={hubHref}
            className="text-xs font-semibold text-[#5A5148] underline decoration-[#D8C2A0] underline-offset-2 hover:text-[#1F1A17]"
          >
            {ui.viewHub}
          </Link>
        </div>
      </div>
      <ul className="grid gap-2 p-4 sm:grid-cols-2 sm:gap-3 sm:p-5 lg:grid-cols-3">
        {offers.map((offer) => {
          const expiry = formatExpiry(offer.expiresAt, lang);
          return (
            <li key={offer.id}>
              <Link
                href={offer.href}
                className="flex h-full min-h-[88px] flex-col rounded-xl border border-[#D8C2A0]/80 bg-white p-3 shadow-sm transition hover:border-[#C9A84A]/45 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45"
              >
                <span className="line-clamp-2 text-sm font-bold leading-snug text-[#1F1A17]">{offer.title}</span>
                {offer.description ? (
                  <span className="mt-1 line-clamp-2 text-xs leading-snug text-[#5A5148]">{offer.description}</span>
                ) : null}
                <span className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] font-semibold text-[#8B7E70]">
                  {expiry ? (
                    <span>
                      {ui.expires}: {expiry}
                    </span>
                  ) : (
                    <span />
                  )}
                  <span className="inline-flex items-center gap-1 text-[#2C1810]">
                    {ui.viewOffer}
                    <FiExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
