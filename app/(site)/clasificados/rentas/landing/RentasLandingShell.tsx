import type { ReactNode } from "react";
import { rentasLandingPaperBgClass } from "../rentasLandingTheme";

export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className={"min-h-screen text-[#2C2416] " + rentasLandingPaperBgClass}>
      <div className="mx-auto max-w-[1320px] px-4 pb-16 pt-20 sm:px-5 sm:pb-20 sm:pt-24">{children}</div>
    </div>
  );
}
