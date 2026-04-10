import type { ReactNode } from "react";
import {
  rentasLandingHeroBandClass,
  rentasLandingHeroGradientClass,
  rentasLandingHeroPhotoLayerClass,
  rentasLandingHeroScenicImage,
  rentasLandingHeroVignetteClass,
  rentasLandingPaperBgClass,
} from "../rentasLandingTheme";

export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className={"relative min-h-screen overflow-x-hidden text-[#2C2416] " + rentasLandingPaperBgClass}>
      <div className={rentasLandingHeroBandClass} aria-hidden>
        <div
          className={rentasLandingHeroPhotoLayerClass}
          style={{ backgroundImage: `url('${rentasLandingHeroScenicImage}')` }}
        />
        <div className={rentasLandingHeroGradientClass} />
        <div className={rentasLandingHeroVignetteClass} />
      </div>
      <div className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-16 pt-14 sm:px-5 sm:pb-20 sm:pt-16 lg:pt-20">
        {children}
      </div>
    </div>
  );
}
