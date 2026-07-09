import Link from "next/link";
import type { LeonixCategoryDiscoveryGridProps, CardAccent } from "./types";
import {
  LEONIX_ACCENT_BURGUNDY,
  LEONIX_ACCENT_GOLD,
  LEONIX_ACCENT_GREEN,
  LEONIX_DISCOVERY_CARD,
  LEONIX_DISCOVERY_GRID,
  LEONIX_DISCOVERY_HINT,
  LEONIX_DISCOVERY_ICON,
  LEONIX_DISCOVERY_LABEL,
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_LANDING_TILES_ACCENT,
  LEONIX_LANDING_TILES_INTEGRATED,
} from "./constants";

/**
 * Leonix Category Discovery Grid
 * 
 * This component provides the discovery grid for category landing pages.
 * It uses the exact Rentas/Bienes visual system with card grid and accent colors.
 * 
 * Source: app/(site)/clasificados/rentas/landing/RentasLandingIntentTiles.tsx
 * 
 * HARD RULE: If surface === "results", return null.
 * No landing discovery grid on results.
 * 
 * @param lang - "es" or "en"
 * @param surface - "landing" or "results"
 * @param heading - Section heading
 * @param subtitle - Section subtitle
 * @param items - Discovery grid items
 */
export function LeonixCategoryDiscoveryGrid({
  lang,
  surface,
  heading,
  subtitle,
  items,
}: LeonixCategoryDiscoveryGridProps) {
  // Hard rule: no discovery grid on results
  if (surface === "results") {
    return null;
  }

  const accentMap: Record<CardAccent, { card: string; icon: string; ring: string }> = {
    burgundy: LEONIX_ACCENT_BURGUNDY,
    green: LEONIX_ACCENT_GREEN,
    gold: LEONIX_ACCENT_GOLD,
  };

  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="leonix-discovery-heading">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <h2 id="leonix-discovery-heading" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
          {heading}
        </h2>
        <p className="mt-1 text-xs text-[#5C5346]/90">{subtitle}</p>
        <div className={LEONIX_DISCOVERY_GRID}>
          {items.map((item) => {
            const Icon = item.icon;
            const accent = accentMap[item.id as CardAccent] || accentMap.gold;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${LEONIX_DISCOVERY_CARD} ${accent.card}`}
              >
                <span
                  className={`${LEONIX_DISCOVERY_ICON} ${accent.icon} ${accent.ring}`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                </span>
                <span className={LEONIX_DISCOVERY_LABEL}>{item.label}</span>
                {item.hint ? (
                  <span className={LEONIX_DISCOVERY_HINT}>{item.hint}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
