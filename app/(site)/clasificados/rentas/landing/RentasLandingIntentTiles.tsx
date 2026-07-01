"use client";

import Link from "next/link";
import type { RentasGatewayTile } from "./rentasLandingGateway";
import { RENTAS_INTENT_TILES } from "./rentasLandingGateway";
import { buildRentasResultsUrl } from "@/app/clasificados/rentas/shared/utils/rentasResultsRoutes";

const ACCENT: Record<RentasGatewayTile["accent"], string> = {
  burgundy: "from-[#7A1E2C]/08 to-[#FFFDF7] border-[#7A1E2C]/22 hover:border-[#7A1E2C]/45",
  green: "from-[#556B3E]/10 to-[#FFFDF7] border-[#556B3E]/25 hover:border-[#556B3E]/45",
  gold: "from-[#C9A84A]/12 to-[#FFFDF7] border-[#C9A84A]/35 hover:border-[#C9A84A]/55",
};

const ICON_COLOR: Record<RentasGatewayTile["accent"], string> = {
  burgundy: "text-[#7A1E2C]",
  green: "text-[#556B3E]",
  gold: "text-[#B8954A]",
};

type Props = {
  lang: "es" | "en";
  routeLang: string;
  headingEs: string;
  headingEn: string;
};

export function RentasLandingIntentTiles({ lang, routeLang, headingEs, headingEn }: Props) {
  const tiles = RENTAS_INTENT_TILES.filter((t) => t.wired);

  return (
    <section className="mt-6" aria-labelledby="rentas-intent-tiles-heading">
      <h2 id="rentas-intent-tiles-heading" className="font-serif text-base font-bold text-[#2A4536] sm:text-lg">
        {lang === "es" ? headingEs : headingEn}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {tiles.map((tile) => {
          const href = buildRentasResultsUrl({ ...tile.params, lang: routeLang });
          const label = lang === "es" ? tile.labelEs : tile.labelEn;
          const Icon = tile.Icon;
          return (
            <Link
              key={tile.labelEn}
              href={href}
              className={`group flex min-h-[4.5rem] flex-col justify-between rounded-xl border bg-gradient-to-br p-3 shadow-[0_4px_16px_-12px_rgba(42,36,22,0.2)] transition ${ACCENT[tile.accent]}`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${ICON_COLOR[tile.accent]}`} aria-hidden />
              <span className="mt-2 font-serif text-sm font-bold leading-tight text-[#2A4536] group-hover:text-[#7A1E2C]">
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
