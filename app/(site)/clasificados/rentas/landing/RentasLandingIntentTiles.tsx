"use client";

import Link from "next/link";
import type { RentasGatewayTile } from "./rentasLandingGateway";
import { RENTAS_INTENT_TILES } from "./rentasLandingGateway";
import { RENTAS_LANDING_SECTION_PAD } from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

const ACCENT: Record<RentasGatewayTile["accent"], { card: string; icon: string; ring: string }> = {
  burgundy: {
    card: "from-[#7A1E2C]/12 via-[#FFFDF7]/95 to-[#FFFDF7]/80 border-[#7A1E2C]/28 hover:border-[#7A1E2C]/55 hover:shadow-[0_10px_28px_-12px_rgba(122,30,44,0.28)]",
    icon: "bg-[#7A1E2C]/12 text-[#7A1E2C] ring-[#7A1E2C]/20",
    ring: "group-hover:ring-[#7A1E2C]/30",
  },
  green: {
    card: "from-[#556B3E]/14 via-[#FFFDF7]/95 to-[#FFFDF7]/80 border-[#556B3E]/30 hover:border-[#556B3E]/52 hover:shadow-[0_10px_28px_-12px_rgba(85,107,62,0.24)]",
    icon: "bg-[#556B3E]/12 text-[#556B3E] ring-[#556B3E]/18",
    ring: "group-hover:ring-[#556B3E]/28",
  },
  gold: {
    card: "from-[#C9A84A]/16 via-[#FFFDF7]/95 to-[#FFFDF7]/80 border-[#C9A84A]/42 hover:border-[#C9A84A]/65 hover:shadow-[0_10px_28px_-12px_rgba(201,168,74,0.3)]",
    icon: "bg-[#C9A84A]/14 text-[#B8954A] ring-[#C9A84A]/22",
    ring: "group-hover:ring-[#C9A84A]/35",
  },
};

type Props = {
  lang: "es" | "en";
  routeLang: string;
  headingEs: string;
  headingEn: string;
  /** Inside scene band — no outer card wrapper. */
  embedded?: boolean;
};

export function RentasLandingIntentTiles({ lang, routeLang, headingEs, headingEn, embedded = false }: Props) {
  const tiles = RENTAS_INTENT_TILES.filter((t) => t.wired);

  return (
    <section
      className={embedded ? "border-t border-[#D6C7AD]/35" : "mt-5 rounded-xl border border-[#D6C7AD]/55 bg-[#FFFDF7]/95 shadow-[0_6px_24px_-18px_rgba(42,36,22,0.14)] sm:mt-6"}
      aria-labelledby="rentas-intent-tiles-heading"
    >
      <div className={RENTAS_LANDING_SECTION_PAD}>
        <h2 id="rentas-intent-tiles-heading" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
          {lang === "es" ? headingEs : headingEn}
        </h2>
        <p className="mt-1 text-xs text-[#5C5346]/85">
          {lang === "es" ? "Elige un tipo de espacio para empezar." : "Pick a space type to get started."}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-2.5 lg:grid-cols-4">
          {tiles.map((tile) => {
            const href = buildRentasResultsUrl({ ...tile.params, lang: routeLang });
            const label = lang === "es" ? tile.labelEs : tile.labelEn;
            const hint = lang === "es" ? tile.hintEs : tile.hintEn;
            const Icon = tile.Icon;
            const accent = ACCENT[tile.accent];
            return (
              <Link
                key={tile.labelEn}
                href={href}
                className={`group flex min-h-[4.25rem] flex-col rounded-lg border bg-gradient-to-br p-2.5 backdrop-blur-[1px] shadow-[0_3px_14px_-12px_rgba(42,36,22,0.2)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[4.5rem] sm:p-3 ${accent.card}`}
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-md ring-1 transition sm:h-8 sm:w-8 sm:rounded-lg ${accent.icon} ${accent.ring}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="mt-2 font-serif text-xs font-bold leading-tight text-[#2A4536] group-hover:text-[#7A1E2C] sm:text-sm">
                  {label}
                </span>
                {hint ? (
                  <span className="mt-0.5 hidden line-clamp-2 text-[10px] leading-snug text-[#5C5346]/85 sm:block sm:text-[11px]">{hint}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
