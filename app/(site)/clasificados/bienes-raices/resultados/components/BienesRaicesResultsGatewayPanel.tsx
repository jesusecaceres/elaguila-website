"use client";

import type { ReactNode } from "react";
import { FiHome } from "react-icons/fi";
import {
  BR_LANDING_GATEWAY_PAD,
  BR_LANDING_GATEWAY_PANEL,
  BR_LANDING_HERO_SEARCH_SHELL,
  BR_LANDING_HERO_SEARCH_GLOW,
} from "@/app/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi";

type Props = {
  lang: "es" | "en";
  title: string;
  countLine: string;
  publishHref: string;
  publishLabel: string;
  searchSlot: ReactNode;
};

/** Results gateway panel — matches landing visual standard without landing-only discovery content. */
export function BienesRaicesResultsGatewayPanel({
  lang,
  title,
  countLine,
  publishHref,
  publishLabel,
  searchSlot,
}: Props) {
  const eyebrow = lang === "es" ? "Leonix Clasificados · Bienes Raíces" : "Leonix Classifieds · Real Estate";
  const tagline = lang === "es" ? "Tu búsqueda, tus reglas." : "Your search, your rules.";
  const intro = lang === "es"
    ? "Encuentra propiedades en venta o renta con claridad y confianza. Un solo lugar para particulares y profesionales."
    : "Find properties for sale or rent with clarity and confidence. One place for private owners and professionals.";
  const introSecondary = lang === "es"
    ? "Sin filtros ocultos, sin anuncios ambiguos. Usa la búsqueda, elige un tipo de propiedad o explora por presupuesto."
    : "No hidden filters, no vague listings. Use search, choose a property type, or explore by budget.";

  return (
    <section aria-labelledby="br-results-gateway-title">
      <div className={`${BR_LANDING_GATEWAY_PANEL} ${BR_LANDING_GATEWAY_PAD}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[0_8px_28px_-10px_rgba(201,168,74,0.45)]">
            <FiHome className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{eyebrow}</p>
            <h1
              id="br-results-gateway-title"
              className="mt-2 font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]"
            >
              {title}
            </h1>
            <p className="mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl">{tagline}</p>
            <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base">{intro}</p>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]">{introSecondary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 sm:mt-4">
              <span className="text-sm font-medium text-[#3D3428]">{countLine}</span>
              <a
                href={publishHref}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] shadow-[0_4px_14px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3rem] sm:px-5"
              >
                {publishLabel}
              </a>
            </div>
          </div>
        </div>

        <div className="relative mt-5 min-w-0 sm:mt-6">
          <div className={BR_LANDING_HERO_SEARCH_SHELL}>
            <div className={BR_LANDING_HERO_SEARCH_GLOW} aria-hidden />
            {searchSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
