import type { ReactNode } from "react";
import {
  rentasLandingContainerClass,
  rentasLandingHeroGradientClass,
  rentasLandingHeroPhotoLayerClass,
  rentasLandingHeroScenicImage,
  rentasLandingHeroVignetteClass,
  rentasLandingPaperBgClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";

/** Category-owned results layout — follows Leonix design system */
export function RentasResultsShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FFFAF0] text-[#1A1A1A]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden rounded-b-[2rem] border-b border-[#D4A574]/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
        aria-hidden
      >
        <div className="relative min-h-[120px] sm:min-h-[min(28vh,240px)] md:min-h-[min(32vh,280px)]">
          <div
            className="absolute inset-0 bg-gradient-to-b from-[#D4A574]/20 to-[#FFFAF0] min-h-[120px] sm:min-h-[min(28vh,240px)] md:min-h-[min(32vh,280px)]"
            style={{ backgroundImage: `url('${rentasLandingHeroScenicImage}')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#D4A574]/30 via-[#D4A574]/10 to-transparent min-h-[120px] sm:min-h-[min(28vh,240px)] md:min-h-[min(32vh,280px)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FFFAF0] via-transparent to-transparent min-h-[120px] sm:min-h-[min(28vh,240px)] md:min-h-[min(32vh,280px)]" />
        </div>
      </div>
      <div className="relative z-[1] mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8 lg:pb-24">
        {children}
      </div>
    </div>
  );
}
