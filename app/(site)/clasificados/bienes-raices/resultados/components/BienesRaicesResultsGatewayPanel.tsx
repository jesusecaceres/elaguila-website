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

  return (
    <section aria-labelledby="br-results-gateway-title">
      <div className={`${BR_LANDING_GATEWAY_PANEL} ${BR_LANDING_GATEWAY_PAD}`}>
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{eyebrow}</p>
            <h1
              id="br-results-gateway-title"
              className="mt-1.5 font-serif text-xl font-bold leading-tight text-[#2A4536] sm:text-2xl"
            >
              {title}
            </h1>
            <p className="mt-1 text-sm text-[#5C5346]">{countLine}</p>
          </div>
          <a
            href={publishHref}
            className="inline-flex min-h-[2.75rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 text-sm font-bold text-[#FFFDF7] shadow-[0_4px_14px_-6px_rgba(122,30,44,0.35)] transition hover:bg-[#5e1721] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[3rem] sm:px-5"
          >
            {publishLabel}
          </a>
        </div>

        <div className="relative mt-4 min-w-0 sm:mt-5">
          <div className={BR_LANDING_HERO_SEARCH_SHELL}>
            <div className={BR_LANDING_HERO_SEARCH_GLOW} aria-hidden />
            {searchSlot}
          </div>
        </div>
      </div>
    </section>
  );
}
