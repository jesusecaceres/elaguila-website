import type { ReactNode } from "react";
import {
  rentasLandingContainerClass,
  rentasLandingHeroGradientClass,
  rentasLandingHeroPhotoLayerClass,
  rentasLandingHeroScenicImage,
  rentasLandingHeroVignetteClass,
  rentasLandingPaperBgClass,
} from "@/app/clasificados/rentas/rentasLandingTheme";

/** Category-owned results layout — does not depend on Bienes Raíces shells. */
export function RentasResultsShell({ children }: { children: ReactNode }) {
  return (
    <div className={"relative min-h-screen overflow-x-hidden text-[#2C2416] " + rentasLandingPaperBgClass}>
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 w-full overflow-hidden rounded-b-[2rem] border-b border-[#C4B8A8]/28 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
        aria-hidden
      >
        <div className="relative min-h-[140px] sm:min-h-[200px]">
          <div
            className={`${rentasLandingHeroPhotoLayerClass} min-h-[140px] sm:min-h-[200px]`}
            style={{ backgroundImage: `url('${rentasLandingHeroScenicImage}')` }}
          />
          <div className={`${rentasLandingHeroGradientClass} min-h-[140px] sm:min-h-[200px]`} />
          <div className={`${rentasLandingHeroVignetteClass} min-h-[140px] sm:min-h-[200px]`} />
        </div>
      </div>
      <div className={"relative z-[1] pb-16 pt-12 sm:pb-20 sm:pt-14 lg:pb-24 " + rentasLandingContainerClass}>
        {children}
      </div>
    </div>
  );
}
