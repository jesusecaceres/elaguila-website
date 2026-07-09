"use client";

import type { ReactNode } from "react";
import { FiHome } from "react-icons/fi";

/** Rentas/Bienes gateway panel classes for Restaurantes */
const RESTAURANTES_LANDING_GATEWAY_PANEL =
  "relative w-full overflow-hidden rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7]/88 shadow-[0_16px_48px_-24px_rgba(42,36,22,0.28)] backdrop-blur-[2px] sm:rounded-2xl";

const RESTAURANTES_LANDING_GATEWAY_PAD = "px-4 py-6 sm:px-7 sm:py-7";

type Props = {
  lang: "es" | "en";
  title: string;
  tagline: string;
  intro: string;
  introSecondary: string;
  searchSlot: ReactNode;
  tilesSlot?: ReactNode;
};

/** Rentas/Bienes integrated landing gateway for Restaurantes — hero text, search anchor, and tiles in one panel. */
export function RestaurantesLandingHeroGateway({
  lang,
  title,
  tagline,
  intro,
  introSecondary,
  searchSlot,
  tilesSlot,
}: Props) {
  const eyebrow = lang === "es" ? "Leonix Clasificados · Restaurantes" : "Leonix Classifieds · Restaurants";

  return (
    <section aria-labelledby="restaurantes-landing-hero-title">
      <div className={`${RESTAURANTES_LANDING_GATEWAY_PANEL} ${RESTAURANTES_LANDING_GATEWAY_PAD}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-[#C9A84A]/45 bg-white/90 text-[#2A4536] shadow-[0_8px_28px_-10px_rgba(201,168,74,0.45)]">
            <FiHome className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{eyebrow}</p>
            <h1
              id="restaurantes-landing-hero-title"
              className="mt-2 font-serif text-[2.1rem] font-bold leading-[1.1] text-[#2A4536] sm:text-[2.5rem] lg:text-[2.65rem]"
            >
              {title}
            </h1>
            <p className="mt-2 font-serif text-lg font-semibold italic text-[#7A1E2C] sm:text-xl">{tagline}</p>
            <p className="mt-3 max-w-3xl text-[0.9375rem] leading-relaxed text-[#3D3428] sm:text-base">{intro}</p>
            <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#5C5346]">{introSecondary}</p>
          </div>
        </div>

        <div className="relative mt-5 min-w-0 sm:mt-6">{searchSlot}</div>

        {tilesSlot ? <div className="min-w-0">{tilesSlot}</div> : null}
      </div>
    </section>
  );
}
