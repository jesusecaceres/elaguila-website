"use client";

import type { ReactNode } from "react";
import {
  RENTAS_LANDING_GATEWAY_PAD,
  RENTAS_LANDING_GATEWAY_PANEL,
  RENTAS_LANDING_HERO_SEARCH_SHELL,
  RENTAS_LANDING_HERO_SEARCH_GLOW,
} from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";

type Props = {
  lang: "es" | "en";
  title: string;
  countLine: string;
  searchSlot: ReactNode;
};

/** Results gateway panel — compact title, count, and search shell only. */
export function RentasResultsGatewayPanel({
  lang,
  title,
  countLine,
  searchSlot,
}: Props) {
  const eyebrow = lang === "es" ? "Leonix Clasificados · Rentas" : "Leonix Classifieds · Rentals";

  return (
    <section aria-labelledby="rentas-results-gateway-title">
      <div className={`${RENTAS_LANDING_GATEWAY_PANEL} ${RENTAS_LANDING_GATEWAY_PAD}`}>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{eyebrow}</p>
          <h1
            id="rentas-results-gateway-title"
            className="mt-2 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl"
          >
            {title}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#3D3428]">{countLine}</p>
        </div>

        <div className="relative mt-5 min-w-0 sm:mt-6">
          <div className={RENTAS_LANDING_HERO_SEARCH_SHELL}>
            <div className={RENTAS_LANDING_HERO_SEARCH_GLOW} aria-hidden />
            {searchSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
