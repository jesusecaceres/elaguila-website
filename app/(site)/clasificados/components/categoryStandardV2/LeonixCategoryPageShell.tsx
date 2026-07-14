import type { ReactNode } from "react";
import type { LeonixCategoryPageShellProps } from "./types";
import {
  LEONIX_HEADER_SAFE_TOP,
  LEONIX_LANDING_BG,
  LEONIX_LANDING_SHELL,
  LEONIX_RESULTS_PAGE_BG,
  LEONIX_RESULTS_SHELL,
  LEONIX_TEXTURE_GRID,
  LEONIX_TEXTURE_RADIAL,
} from "./constants";

/**
 * Leonix Category Page Shell
 * 
 * This component provides the global page shell for category landing and results pages.
 * It uses the exact Rentas/Bienes visual system with background, texture, and content lane.
 * 
 * Source: app/(site)/clasificados/rentas/landing/RentasLandingShell.tsx
 * 
 * @param surface - "landing" or "results"
 * @param children - Page content
 * @param topSlot - Optional slot above content (e.g., lang switch)
 * @param className - Optional className override
 */
export function LeonixCategoryPageShell({
  surface,
  children,
  topSlot,
  className,
}: LeonixCategoryPageShellProps) {
  const isLanding = surface === "landing";

  const bgClass = isLanding ? LEONIX_LANDING_BG : LEONIX_RESULTS_PAGE_BG;
  const laneClass = isLanding ? LEONIX_LANDING_SHELL : LEONIX_RESULTS_SHELL;

  return (
    <div className={`relative min-h-screen overflow-x-hidden ${bgClass} ${className || ""}`}>
      {/* Rentas/Bienes subtle texture layers */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: LEONIX_TEXTURE_RADIAL,
        }}
        aria-hidden
      />
      <div
        className={`pointer-events-none absolute inset-0 ${LEONIX_TEXTURE_GRID}`}
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px),repeating-linear-gradient(0deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 52px)",
        }}
        aria-hidden
      />

      <div className="relative z-[1]">
        {topSlot}

        <div className={`${laneClass} ${LEONIX_HEADER_SAFE_TOP}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
