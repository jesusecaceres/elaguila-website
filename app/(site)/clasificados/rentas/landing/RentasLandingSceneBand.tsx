import type { ReactNode } from "react";

/**
 * Rentas landing neighborhood scene — CSS-only layered skyline behind hero + intent tiles.
 * Creates one intentional “city-living doorway” band.
 */
export function RentasLandingSceneBand({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D6C7AD]/45 shadow-[0_12px_40px_-24px_rgba(42,36,22,0.28)]">
      {/* Golden-hour sky */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(201,168,74,0.18)_0%,rgba(250,246,238,0.55)_28%,rgba(255,253,247,0.92)_58%,rgba(250,246,238,0.98)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(255,248,230,0.5),transparent_60%)]"
        aria-hidden
      />

      {/* Mid-ground hills */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(180deg,transparent_0%,rgba(85,107,62,0.06)_40%,rgba(85,107,62,0.1)_100%)]"
        aria-hidden
      />

      {/* Layered skyline — back row (lighter) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] opacity-[0.09]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 160 L60 160 L60 120 L100 120 L100 90 L140 90 L140 130 L180 130 L180 100 L220 100 L220 150 L260 150 L260 110 L300 110 L300 160 L340 160 L340 85 L380 85 L380 160 L420 160 L420 125 L460 125 L460 165 L500 165 L500 95 L540 95 L540 165 L580 165 L580 140 L620 140 L620 170 L660 170 L660 105 L700 105 L700 170 L740 170 L740 135 L780 135 L780 175 L820 175 L820 115 L860 115 L860 175 L900 175 L900 145 L940 145 L940 180 L980 180 L980 120 L1020 120 L1020 180 L1060 180 L1060 155 L1100 155 L1100 180 L1200 180 L1200 200 L0 200 Z"
            fill="#556B3E"
          />
        </svg>
      </div>

      {/* Foreground skyline — stronger */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] opacity-[0.13] sm:opacity-[0.11]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 180" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 140 L70 140 L70 95 L110 95 L110 60 L150 60 L150 100 L190 100 L190 75 L230 75 L230 120 L270 120 L270 85 L310 85 L310 130 L350 130 L350 70 L390 70 L390 130 L430 130 L430 100 L470 100 L470 140 L510 140 L510 80 L550 80 L550 140 L590 140 L590 115 L630 115 L630 145 L670 145 L670 90 L710 90 L710 145 L750 145 L750 110 L790 110 L790 150 L830 150 L830 95 L870 95 L870 150 L910 150 L910 120 L950 120 L950 155 L990 155 L990 100 L1030 100 L1030 155 L1070 155 L1070 130 L1110 130 L1110 155 L1200 155 L1200 180 L0 180 Z"
            fill="#2A4536"
          />
          {/* Window hints */}
          <rect x="120" y="108" width="8" height="10" rx="1" fill="#C9A84A" opacity="0.6" />
          <rect x="132" y="108" width="8" height="10" rx="1" fill="#C9A84A" opacity="0.4" />
          <rect x="400" y="88" width="8" height="10" rx="1" fill="#C9A84A" opacity="0.5" />
          <rect x="560" y="98" width="8" height="10" rx="1" fill="#C9A84A" opacity="0.45" />
          <rect x="720" y="108" width="8" height="10" rx="1" fill="#C9A84A" opacity="0.55" />
          <rect x="880" y="108" width="8" height="10" rx="1" fill="#C9A84A" opacity="0.4" />
          {/* Roof accents */}
          <path d="M150 60 L170 40 L190 60" stroke="#C9A84A" strokeWidth="1.5" opacity="0.5" />
          <path d="M350 70 L370 50 L390 70" stroke="#C9A84A" strokeWidth="1.5" opacity="0.45" />
          <path d="M670 90 L690 68 L710 90" stroke="#C9A84A" strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>

      {/* Warm side glows */}
      <div className="pointer-events-none absolute -left-16 top-8 h-40 w-40 rounded-full bg-[#C9A84A]/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-12 top-16 h-36 w-36 rounded-full bg-[#556B3E]/10 blur-3xl" aria-hidden />

      <div className="relative">{children}</div>
    </div>
  );
}
