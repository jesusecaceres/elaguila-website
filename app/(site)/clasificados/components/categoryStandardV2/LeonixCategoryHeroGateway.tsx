"use client";

import type { ReactNode } from "react";
import type { LeonixCategoryHeroGatewayProps } from "./types";
import {
  LEONIX_EYEBROW,
  LEONIX_GATEWAY_ICON,
  LEONIX_GATEWAY_PAD,
  LEONIX_GATEWAY_PANEL,
  LEONIX_H1,
  LEONIX_INTRO,
  LEONIX_INTRO_SECONDARY,
  LEONIX_SEARCH_SLOT,
  LEONIX_TAGLINE,
} from "./constants";

/**
 * Leonix Category Hero Gateway
 * 
 * This component provides the hero gateway for category landing and results pages.
 * It uses the exact Rentas/Bienes visual system with icon, eyebrow, title, tagline, intro, and search slot.
 * 
 * Source: app/(site)/clasificados/rentas/landing/RentasLandingHeroGateway.tsx
 * Source: app/(site)/clasificados/bienes-raices/landing/BienesRaicesLandingHeroGateway.tsx
 * 
 * HARD RULE: For results surface, this component must render only hero/search identity and search slot.
 * It must NOT render landing discovery sections, partner section, visibility CTA, or extra pills.
 * 
 * @param lang - "es" or "en"
 * @param surface - "landing" or "results"
 * @param title - Main title
 * @param tagline - Italic tagline
 * @param intro - Primary intro paragraph
 * @param introSecondary - Secondary intro paragraph
 * @param searchSlot - Search canvas component
 * @param tilesSlot - Optional intent tiles (landing only)
 * @param eyebrow - Optional eyebrow text (defaults to category-specific)
 */
export function LeonixCategoryHeroGateway({
  lang,
  surface,
  title,
  tagline,
  intro,
  introSecondary,
  searchSlot,
  tilesSlot,
  eyebrow,
}: LeonixCategoryHeroGatewayProps) {
  // For results, tilesSlot is ignored (hard rule)
  const showTiles = surface === "landing" && tilesSlot;

  return (
    <section aria-labelledby="leonix-category-hero-title">
      <div className={`${LEONIX_GATEWAY_PANEL} ${LEONIX_GATEWAY_PAD}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          {/* Icon wrapper - category should provide appropriate icon */}
          <span className={LEONIX_GATEWAY_ICON}>
            {/* Icon should be passed via children or category-specific wrapper */}
            <span className="flex h-6 w-6 items-center justify-center" aria-hidden>
              {/* Default placeholder - category should override */}
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </span>
          
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className={LEONIX_EYEBROW}>{eyebrow}</p>
            ) : null}
            
            <h1
              id="leonix-category-hero-title"
              className={LEONIX_H1}
            >
              {title}
            </h1>
            
            <p className={LEONIX_TAGLINE}>{tagline}</p>
            <p className={LEONIX_INTRO}>{intro}</p>
            <p className={LEONIX_INTRO_SECONDARY}>{introSecondary}</p>
          </div>
        </div>

        <div className={LEONIX_SEARCH_SLOT}>{searchSlot}</div>

        {showTiles ? <div className="min-w-0">{tilesSlot}</div> : null}
      </div>
    </section>
  );
}
