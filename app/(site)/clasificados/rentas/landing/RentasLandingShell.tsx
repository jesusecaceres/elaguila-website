import type { ReactNode } from "react";
import { RENTAS_LANDING_LANE } from "../shared/rentasLeonixPublicUi";

/** Page shell — warm Leonix neighborhood feel, single content lane, header-safe spacing. */
export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      {/* Soft ambient gradient */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_-10%,rgba(201,168,74,0.14),transparent_55%),radial-gradient(ellipse_80%_50%_at_100%_20%,rgba(85,107,62,0.08),transparent_50%),radial-gradient(ellipse_70%_45%_at_0%_60%,rgba(122,30,44,0.05),transparent_45%)]"
        aria-hidden
      />

      {/* Subtle neighborhood silhouette — CSS only */}
      <div className="pointer-events-none absolute inset-x-0 top-[8rem] h-[min(420px,42vh)] opacity-[0.07] sm:top-[6rem]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 280" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 220 L80 220 L80 170 L120 170 L120 130 L160 130 L160 170 L200 170 L200 100 L240 100 L240 170 L280 170 L280 140 L320 140 L320 190 L360 190 L360 120 L400 120 L400 190 L440 190 L440 150 L480 150 L480 210 L520 210 L520 160 L560 160 L560 220 L600 220 L600 110 L640 110 L640 220 L680 220 L680 145 L720 145 L720 195 L760 195 L760 125 L800 125 L800 195 L840 195 L840 165 L880 165 L880 220 L920 220 L920 135 L960 135 L960 220 L1000 220 L1000 175 L1040 175 L1040 220 L1200 220 L1200 280 L0 280 Z"
            fill="#2A4536"
          />
          <path
            d="M130 170 L150 145 L170 170 M390 190 L410 165 L430 190 M750 195 L770 170 L790 195"
            stroke="#C9A84A"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div
        className={`${RENTAS_LANDING_LANE} relative px-3.5 pb-12 pt-[calc(3.75rem+env(safe-area-inset-top,0px))] sm:px-4 sm:pt-8 lg:px-5 lg:pt-10`}
      >
        {children}
      </div>
    </div>
  );
}
