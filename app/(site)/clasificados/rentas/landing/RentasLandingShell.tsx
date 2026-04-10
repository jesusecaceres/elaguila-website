import type { ReactNode } from "react";
import {
  rentasLandingContainerClass,
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
      <div className={"relative z-[1] pb-20 pt-14 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-[4.75rem] " + rentasLandingContainerClass}>
        {children}
      </div>
    </div>
  );
}
