import type { ReactNode } from "react";
import { rentasLandingContainerClass, rentasLandingPaperBgClass } from "../rentasLandingTheme";

/** Page shell — paper field; scenic hero lives in `RentasLandingHero` (stable stacking, no absolute overlap). */
export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className={"relative min-h-screen overflow-x-hidden text-[#2C2416] " + rentasLandingPaperBgClass}>
      <div className={"relative z-[1] pb-16 pt-6 sm:pb-20 sm:pt-8 md:pb-24 lg:pb-28 lg:pt-10 " + rentasLandingContainerClass}>
        {children}
      </div>
    </div>
  );
}
