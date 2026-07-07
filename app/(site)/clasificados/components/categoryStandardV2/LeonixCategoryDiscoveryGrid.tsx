"use client";

import Link from "next/link";
import {
  LEONIX_LANDING_SECTION,
  LEONIX_LANDING_SECTION_PAD,
  LEONIX_DISCOVERY_GRID,
  LEONIX_DISCOVERY_CARD,
  LEONIX_DISCOVERY_ICON,
  LEONIX_DISCOVERY_LABEL,
  LEONIX_DISCOVERY_HINT,
} from "./constants";
import type { DiscoveryGridProps } from "./types";

/**
 * Leonix Category Discovery Grid
 *
 * Landing-only discovery card grid with Rentas/Bienes visual style.
 *
 * Visual contract:
 * - Grid: mt-4 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4
 * - Card: min-h-[4.75rem] sm:min-h-[5rem], rounded-xl, border, gradient
 * - Icon: h-8 w-8 sm:h-9 sm:w-9, rounded-lg
 * - Label: font-serif text-sm font-bold
 * - Hint: text-[10px] sm:text-[11px]
 *
 * HARD RULE:
 * If surface === "results", returns null.
 * No landing discovery grid on results pages.
 */
export function LeonixCategoryDiscoveryGrid({
  heading,
  subtitle,
  items,
  surface,
}: DiscoveryGridProps) {
  // Hard block on results surface
  if (surface === "results") {
    return null;
  }

  return (
    <section className={LEONIX_LANDING_SECTION} aria-labelledby="leonix-discovery-heading">
      <div className={LEONIX_LANDING_SECTION_PAD}>
        <h2 id="leonix-discovery-heading" className="font-serif text-lg font-bold text-[#2A4536] sm:text-xl">
          {heading}
        </h2>
        {subtitle ? (
          <p className="mt-1 text-xs text-[#5C5346]/90">{subtitle}</p>
        ) : null}

        <div className={LEONIX_DISCOVERY_GRID}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={LEONIX_DISCOVERY_CARD}
              >
                <span className={LEONIX_DISCOVERY_ICON}>
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
