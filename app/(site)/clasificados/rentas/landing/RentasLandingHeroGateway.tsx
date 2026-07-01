"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiHome } from "react-icons/fi";
import {
  RENTAS_BTN_PRIMARY,
  RENTAS_LANDING_SECTION,
  RENTAS_LANDING_SECTION_PAD,
} from "../shared/rentasLeonixPublicUi";

type Props = {
  lang: "es" | "en";
  title: string;
  intro: string;
  introSecondary: string;
  publishHref: string;
  publishLabel: string;
  searchSlot: ReactNode;
};

/** Rentas-only hero gateway — aligned lane, warm premium treatment, search below copy. */
export function RentasLandingHeroGateway({
  lang,
  title,
  intro,
  introSecondary,
  publishHref,
  publishLabel,
  searchSlot,
}: Props) {
  const eyebrow = lang === "es" ? "Leonix Clasificados" : "Leonix Classifieds";

  return (
    <section
      className={`${RENTAS_LANDING_SECTION} relative overflow-hidden`}
      aria-labelledby="rentas-landing-hero-title"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(90,120,100,0.1)_0%,rgba(250,246,238,0.92)_42%,rgba(255,253,247,1)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[#C9A84A]/12 blur-2xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-6 -left-6 h-28 w-28 rounded-full bg-[#7A1E2C]/08 blur-2xl"
        aria-hidden
      />

      <div className={`${RENTAS_LANDING_SECTION_PAD} relative`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#7A9A82]/35 bg-[#FAF6EE]/95 text-[#2A4536] shadow-sm">
            <FiHome className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{eyebrow}</p>
            <h1
              id="rentas-landing-hero-title"
              className="mt-1.5 font-serif text-[1.5rem] font-bold leading-tight text-[#2A4536] sm:text-[1.75rem]"
            >
              {title}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428]">{intro}</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5C5346]/90">{introSecondary}</p>
          </div>
        </div>

        <div className="mt-4 min-w-0">{searchSlot}</div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Link href={publishHref} className={`${RENTAS_BTN_PRIMARY} w-full sm:w-auto sm:min-w-[11rem]`}>
            {publishLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}
