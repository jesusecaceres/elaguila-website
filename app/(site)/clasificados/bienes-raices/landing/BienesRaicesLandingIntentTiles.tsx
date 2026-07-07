"use client";

import Link from "next/link";
import type { BienesGatewayTile } from "./bienesRaicesLandingGateway";
import { BIENES_INTENT_TILES } from "./bienesRaicesLandingGateway";
import {
  BR_LANDING_TILES_ACCENT,
  BR_LANDING_TILES_INTEGRATED,
} from "@/app/clasificados/bienes-raices/shared/bienesRaicesLeonixPublicUi";
import { buildBrResultsUrl } from "@/app/clasificados/bienes-raices/shared/constants/brResultsRoutes";

const ACCENT: Record<BienesGatewayTile["accent"], { card: string; icon: string; ring: string }> = {
  burgundy: {
    card: "from-[#7A1E2C]/14 via-white/95 to-white/88 border-[#7A1E2C]/30 hover:border-[#7A1E2C]/55 hover:shadow-[0_12px_32px_-14px_rgba(122,30,44,0.28)]",
    icon: "bg-[#7A1E2C]/14 text-[#7A1E2C] ring-[#7A1E2C]/25",
    ring: "group-hover:ring-[#7A1E2C]/35",
  },
  green: {
    card: "from-[#556B3E]/14 via-white/95 to-white/88 border-[#556B3E]/30 hover:border-[#556B3E]/50 hover:shadow-[0_12px_32px_-14px_rgba(85,107,62,0.24)]",
    icon: "bg-[#556B3E]/14 text-[#556B3E] ring-[#556B3E]/22",
    ring: "group-hover:ring-[#556B3E]/32",
  },
  gold: {
    card: "from-[#C9A84A]/16 via-white/95 to-white/88 border-[#C9A84A]/40 hover:border-[#C9A84A]/65 hover:shadow-[0_12px_32px_-14px_rgba(201,168,74,0.3)]",
    icon: "bg-[#C9A84A]/16 text-[#B8954A] ring-[#C9A84A]/28",
    ring: "group-hover:ring-[#C9A84A]/40",
  },
};

type Props = {
  lang: "es" | "en";
  routeLang: string;
  headingEs: string;
  headingEn: string;
  /** Inside integrated gateway panel — transparent, no color-shift band. */
  embedded?: boolean;
};

export function BienesRaicesLandingIntentTiles({ lang, routeLang, headingEs, headingEn, embedded = false }: Props) {
  const tiles = BIENES_INTENT_TILES.filter((t) => t.wired);

  const sectionClass = embedded
    ? BR_LANDING_TILES_INTEGRATED
    : "mt-6 rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 px-4 py-5 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] sm:mt-7 sm:px-6 sm:py-6";

  return (
    <section className={sectionClass} aria-labelledby="br-intent-tiles-heading">
      {embedded ? <div className={BR_LANDING_TILES_ACCENT} aria-hidden /> : null}
      <h2 id="br-intent-tiles-heading" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
        {lang === "es" ? headingEs : headingEn}
      </h2>
      <p className="mt-1 text-xs text-[#5C5346]/90">
        {lang === "es" ? "Elige una opción para empezar." : "Pick an option to get started."}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {tiles.map((tile) => {
          const href = buildBrResultsUrl({ ...tile.params, lang: routeLang });
          const label = lang === "es" ? tile.labelEs : tile.labelEn;
          const hint = lang === "es" ? tile.hintEs : tile.hintEn;
          const Icon = tile.Icon;
          const accent = ACCENT[tile.accent];
          return (
            <Link
              key={tile.labelEn}
              href={href}
              className={`group flex min-h-[4.75rem] flex-col rounded-xl border bg-gradient-to-br p-3 shadow-[0_4px_18px_-12px_rgba(42,36,22,0.18)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[5rem] ${accent.card}`}
            >
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ring-1 transition sm:h-9 sm:w-9 ${accent.icon} ${accent.ring}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
              </span>
              <span className="mt-2.5 font-serif text-sm font-bold leading-tight text-[#2A4536] group-hover:text-[#7A1E2C]">
                {label}
              </span>
              {hint ? (
                <span className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#5C5346]/85 sm:text-[11px]">{hint}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
