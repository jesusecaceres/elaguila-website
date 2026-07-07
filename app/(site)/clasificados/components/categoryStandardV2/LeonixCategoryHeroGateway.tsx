"use client";

import type { ReactNode } from "react";
import { FiHome } from "react-icons/fi";
import {
  LEONIX_LANDING_GATEWAY_PANEL,
  LEONIX_LANDING_GATEWAY_PAD,
  LEONIX_GATEWAY_ICON,
  LEONIX_EYEBROW,
  LEONIX_HERO_TITLE,
  LEONIX_HERO_TAGLINE,
  LEONIX_HERO_INTRO,
  LEONIX_HERO_INTRO_SECONDARY,
} from "./constants";
import type { Surface } from "./types";

type Props = {
  /** Language */
  lang: "es" | "en";
  /** Category name for eyebrow (e.g., "Rentas", "Bienes Raíces") */
  category: string;
  /** Hero title */
  title: string;
  /** Hero tagline (italic) */
  tagline: string;
  /** Hero intro text */
  intro: string;
  /** Hero secondary intro text */
  introSecondary: string;
  /** Search slot */
  searchSlot: ReactNode;
  /** Optional landing tiles slot (e.g., intent cards) */
  tilesSlot?: ReactNode;
  /** Surface type */
  surface?: Surface;
  /** Optional icon component (defaults to FiHome) */
  icon?: React.ComponentType<{ className?: string }>;
};

/**
 * Leonix Category Hero Gateway
 *
 * Extracted from Rentas/Bienes Raíces visual system.
 * Provides the integrated hero panel with text, search, and optional tiles.
 *
 * Visual contract:
 * - Rounded panel with border, background, shadow, backdrop blur
 * - Icon wrapper with border and shadow
 * - Eyebrow, title, tagline, intro, introSecondary text hierarchy
 * - Search slot below text
 * - Optional tiles slot below search
 * - For results surface: renders only hero/search identity, no landing discovery
 */
export function LeonixCategoryHeroGateway({
  lang,
  category,
  title,
  tagline,
  intro,
  introSecondary,
  searchSlot,
  tilesSlot,
  surface = "landing",
  icon: Icon = FiHome,
}: Props) {
  const eyebrow =
    lang === "es"
      ? `Leonix Clasificados · ${category}`
      : `Leonix Classifieds · ${category}`;

  return (
    <section aria-labelledby="leonix-category-hero-title">
      <div className={`${LEONIX_LANDING_GATEWAY_PANEL} ${LEONIX_LANDING_GATEWAY_PAD}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <span className={LEONIX_GATEWAY_ICON}>
            <Icon className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className={LEONIX_EYEBROW}>{eyebrow}</p>
            <h1
              id="leonix-category-hero-title"
              className={LEONIX_HERO_TITLE}
            >
              {title}
            </h1>
            <p className={LEONIX_HERO_TAGLINE}>{tagline}</p>
            <p className={LEONIX_HERO_INTRO}>{intro}</p>
            <p className={LEONIX_HERO_INTRO_SECONDARY}>{introSecondary}</p>
          </div>
        </div>

        <div className="relative mt-5 min-w-0 sm:mt-6">{searchSlot}</div>

        {/* Tiles slot only on landing surface */}
        {surface === "landing" && tilesSlot ? (
          <div className="min-w-0">{tilesSlot}</div>
        ) : null}
      </div>
    </section>
  );
}
