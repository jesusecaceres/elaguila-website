"use client";

import type { ReactNode } from "react";
import {
  LEONIX_RESULTS_BG,
  LEONIX_TEXT_PRIMARY,
  LEONIX_RADIAL_TEXTURE,
  LEONIX_GRID_TEXTURE,
  LEONIX_RESULTS_SHELL,
} from "./constants";
import type { Surface } from "./types";

type Props = {
  children: ReactNode;
  /** Optional lower visibility strip */
  lowerVisibility?: ReactNode;
  /** Additional className */
  className?: string;
};

/**
 * Leonix Category Results Shell
 *
 * Extracted from Rentas/Bienes Raíces visual system.
 * Provides the consistent background, texture, and layout for results pages.
 *
 * Visual contract:
 * - Light cream background (#FAF6EE) with radial gradient + subtle grid
 * - Centered content lane max-w-[1280px]
 * - Safe top spacing below global navbar
 * - No horizontal overflow
 *
 * HARD RULES:
 * - Does NOT accept partnerSection prop
 * - Does NOT accept discoveryGrid prop
 * - Does NOT accept shortcutSections prop
 * - Does NOT accept randomCtaRows prop
 * - Results pages cannot render landing-only sections
 *
 * Final results order:
 * 1. Hero/search shell
 * 2. Active filters if active
 * 3. Result count + sort/view controls
 * 4. Cards/items/listings or compact empty state
 * 5. Optional pagination
 * 6. Optional lower visibility strip if explicitly allowed
 */
export function LeonixCategoryResultsShell({
  children,
  lowerVisibility,
  className = "",
}: Props) {
  return (
    <div className={`min-h-screen overflow-x-hidden ${LEONIX_RESULTS_BG} pb-20 ${LEONIX_TEXT_PRIMARY} ${className}`}>
      {/* Radial gradient texture layer */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_75%_at_50%_-8%,rgba(201,168,74,0.22),transparent_52%),radial-gradient(ellipse_65%_45%_at_100%_0%,rgba(85,107,62,0.1),transparent_48%),radial-gradient(ellipse_60%_40%_at_0%_25%,rgba(122,30,44,0.06),transparent_42%)]"
        aria-hidden
      />
      {/* Subtle grid pattern texture layer */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px),repeating-linear-gradient(0deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px)",
        }}
        aria-hidden
      />

      {/* Content lane */}
      <div className="relative z-[1]">
        <div className={LEONIX_RESULTS_SHELL}>
          {children}
        </div>

        {lowerVisibility ? (
          <div className="mx-auto max-w-[1280px] min-w-0 px-3.5 pb-14 pt-3 sm:px-4 lg:px-5">
            {lowerVisibility}
          </div>
        ) : null}
      </div>
    </div>
  );
}
