import type { ReactNode } from "react";
import { RENTAS_LANDING_LANE } from "../shared/rentasLeonixPublicUi";

/** Page shell — warm Leonix city-living atmosphere, single content lane. */
export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-5%,rgba(201,168,74,0.16),transparent_50%),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(85,107,62,0.07),transparent_45%),radial-gradient(ellipse_55%_35%_at_0%_30%,rgba(122,30,44,0.04),transparent_40%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 48px),repeating-linear-gradient(0deg,#2A4536 0px,#2A4536 1px,transparent 1px,transparent 48px)",
        }}
        aria-hidden
      />

      <div
        className={`${RENTAS_LANDING_LANE} relative px-3.5 pb-12 pt-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:px-4 sm:pt-8 lg:px-5 lg:pt-10`}
      >
        {children}
      </div>
    </div>
  );
}
