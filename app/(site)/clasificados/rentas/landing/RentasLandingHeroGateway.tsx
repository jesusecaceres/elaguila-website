"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { FiHome } from "react-icons/fi";
import {
  RENTAS_BTN_PRIMARY,
  RENTAS_LANDING_SECTION_PAD,
} from "../shared/rentasLeonixPublicUi";

type Props = {
  lang: "es" | "en";
  title: string;
  tagline: string;
  intro: string;
  introSecondary: string;
  publishHref: string;
  publishLabel: string;
  searchSlot: ReactNode;
};

/** Rentas gateway anchor — sits inside scene band, warm depth, search as centerpiece. */
export function RentasLandingHeroGateway({
  lang,
  title,
  tagline,
  intro,
  introSecondary,
  publishHref,
  publishLabel,
  searchSlot,
}: Props) {
  const eyebrow = lang === "es" ? "Leonix Clasificados · Rentas" : "Leonix Classifieds · Rentals";

  return (
    <section className="relative" aria-labelledby="rentas-landing-hero-title">
      <div className="pointer-events-none absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/50 to-transparent sm:inset-x-5" aria-hidden />

      <div className={`${RENTAS_LANDING_SECTION_PAD} relative`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7]/90 text-[#2A4536] shadow-[0_4px_16px_-8px_rgba(201,168,74,0.35)] ring-1 ring-[#FFFDF7]/80">
            <FiHome className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{eyebrow}</p>
            <h1
              id="rentas-landing-hero-title"
              className="mt-1.5 font-serif text-[1.55rem] font-bold leading-tight text-[#2A4536] sm:text-[1.85rem]"
            >
              {title}
            </h1>
            <p className="mt-1.5 font-serif text-sm font-semibold italic text-[#7A1E2C]/90 sm:text-base">{tagline}</p>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#3D3428]">{intro}</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-[#5C5346]/90">{introSecondary}</p>
          </div>
        </div>

        <div className="relative mt-4 min-w-0">{searchSlot}</div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Link href={publishHref} className={`${RENTAS_BTN_PRIMARY} w-full sm:w-auto sm:min-w-[11rem]`}>
            {publishLabel}
          </Link>
          <p className="text-xs text-[#5C5346]/80">
            {lang === "es" ? "Publica cuarto, estudio, ADU o casa en renta." : "List a room, studio, ADU, or home for rent."}
          </p>
        </div>
      </div>
    </section>
  );
}
