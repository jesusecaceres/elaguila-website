"use client";

import type { ReactNode } from "react";
import {
  LEONIX_HEADER_SAFE_TOP,
  LEONIX_LANDING_BG,
  LEONIX_LANDING_LANE,
  LEONIX_RADIAL_TEXTURE,
  LEONIX_GRID_TEXTURE,
  LEONIX_TEXT_PRIMARY,
} from "./constants";
import type { Surface } from "./types";

type Props = {
  children: ReactNode;
  /** Surface type (affects background color) */
  surface?: Surface;
  /** Optional top slot (e.g., lang switch) */
  topSlot?: ReactNode;
  /** Additional className */
  className?: string;
};

/**
 * Leonix Category Page Shell
 *
 * Extracted from Rentas/Bienes Raíces visual system.
 * Provides the consistent background, texture, and layout for category pages.
 *
 * Visual contract:
 * - Landing: warm cream background (#F3EBDD) with radial gradient + subtle grid
 * - Results: light cream background (#FAF6EE) with same texture
 * - Centered content lane max-w-[1280px]
 * - Safe top spacing below global navbar
 * - No horizontal overflow
 */
export function LeonixCategoryPageShell({
  children,
  surface = "landing",
  topSlot,
  className = "",
}: Props) {
  const bgClass = surface === "landing" ? LEONIX_LANDING_BG : "bg-[#FAF6EE]";

  return (
    <div className={`relative min-h-screen overflow-x-hidden ${bgClass} ${LEONIX_TEXT_PRIMARY} ${className}`}>
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
        {topSlot ? (
          <div className={`${LEONIX_LANDING_LANE} px-3.5 pt-3 sm:px-4 lg:px-5`}>
            {topSlot}
          </div>
        ) : null}

        <div className={`${LEONIX_LANDING_LANE} px-3.5 pb-14 sm:px-4 lg:px-5 ${LEONIX_HEADER_SAFE_TOP}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
