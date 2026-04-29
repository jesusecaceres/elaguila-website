import type { ReactNode } from "react";
import { rentasLandingContainerClass, rentasLandingPaperBgClass } from "../rentasLandingTheme";

/** Page shell — follows Leonix design system with cream/gold/charcoal colors */
export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FFFAF0] text-[#1A1A1A]">
      <div className="relative z-[1] mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 sm:pt-8 md:pb-24 lg:px-8 lg:pb-28 lg:pt-10">
        {children}
      </div>
    </div>
  );
}
