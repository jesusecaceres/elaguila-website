"use client";

import Link from "next/link";
import type { RentasGatewayTile } from "./rentasLandingGateway";
import { RENTAS_INTENT_TILES } from "./rentasLandingGateway";
import { RENTAS_LANDING_SECTION_PAD } from "@/app/clasificados/rentas/shared/rentasLeonixPublicUi";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

const ACCENT: Record<RentasGatewayTile["accent"], { card: string; icon: string; ring: string }> = {
  burgundy: {
    card: "from-[#7A1E2C]/16 via-[#FFFDF7]/96 to-[#FFFDF7]/85 border-[#7A1E2C]/35 hover:border-[#7A1E2C]/60 hover:shadow-[0_12px_32px_-14px_rgba(122,30,44,0.32)]",
    icon: "bg-[#7A1E2C]/14 text-[#7A1E2C] ring-[#7A1E2C]/25",
    ring: "group-hover:ring-[#7A1E2C]/35",
  },
  green: {
    card: "from-[#556B3E]/18 via-[#FFFDF7]/96 to-[#FFFDF7]/85 border-[#556B3E]/35 hover:border-[#556B3E]/55 hover:shadow-[0_12px_32px_-14px_rgba(85,107,62,0.28)]",
    icon: "bg-[#556B3E]/14 text-[#556B3E] ring-[#556B3E]/22",
    ring: "group-hover:ring-[#556B3E]/32",
  },
  gold: {
    card: "from-[#C9A84A]/20 via-[#FFFDF7]/96 to-[#FFFDF7]/85 border-[#C9A84A]/48 hover:border-[#C9A84A]/70 hover:shadow-[0_12px_32px_-14px_rgba(201,168,74,0.35)]",
    icon: "bg-[#C9A84A]/16 text-[#B8954A] ring-[#C9A84A]/28",
    ring: "group-hover:ring-[#C9A84A]/40",
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
      className={embedded ? "border-t border-[#D6C7AD]/50 bg-[#FFFDF7]/55 backdrop-blur-[1px]" : "mt-6 rounded-2xl border border-[#D6C7AD]/60 bg-[#FFFDF7]/96 shadow-[0_8px_32px_-20px_rgba(42,36,22,0.18)] sm:mt-7"}
      aria-labelledby="rentas-intent-tiles-heading"
    >
      <div className={RENTAS_LANDING_SECTION_PAD}>
        <h2 id="rentas-intent-tiles-heading" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
          {lang === "es" ? headingEs : headingEn}
        </h2>
        <p className="mt-1 text-xs text-[#5C5346]/85">
          {lang === "es" ? "Elige un tipo de espacio para empezar." : "Pick a space type to get started."}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
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
                className={`group flex min-h-[4.75rem] flex-col rounded-xl border bg-gradient-to-br p-3 shadow-[0_4px_18px_-12px_rgba(42,36,22,0.22)] transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/45 sm:min-h-[5rem] ${accent.card}`}
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
      </div>
    </section>
  );
}
