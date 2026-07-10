"use client";

import type { ReactNode } from "react";
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
  searchSlot: ReactNode;
};

/** Results gateway panel — compact title, count, and search shell only. */
export function BienesRaicesResultsGatewayPanel({
  lang,
  title,
  countLine,
  searchSlot,
}: Props) {
  const eyebrow = lang === "es" ? "Leonix Clasificados · Bienes Raíces" : "Leonix Classifieds · Real Estate";

  return (
    <section aria-labelledby="br-results-gateway-title">
      <div className={`${BR_LANDING_GATEWAY_PANEL} ${BR_LANDING_GATEWAY_PAD}`}>
        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{eyebrow}</p>
          <h1
            id="br-results-gateway-title"
            className="mt-2 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl"
          >
            {title}
          </h1>
          <p className="mt-2 text-sm font-medium text-[#3D3428]">{countLine}</p>
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
