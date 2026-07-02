import type { ReactNode } from "react";

/**
 * Rentas landing neighborhood scene — CSS-only (v4: horizon band, stronger skyline, golden wash).
 * No external images. Visible at 100% browser zoom.
 */
export function RentasLandingSceneBand({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-[30rem] overflow-hidden rounded-2xl border-2 border-[#C9A84A]/40 shadow-[0_24px_64px_-28px_rgba(42,36,22,0.42)] ring-1 ring-[#C9A84A]/15 sm:min-h-[32rem]"
      data-rentas-gateway-scene="v4"
    >
      <div className="pointer-events-none absolute inset-0 bg-[#FFFDF7]" aria-hidden />

      {/* Golden-hour sky */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(201,168,74,0.45)_0%,rgba(255,228,175,0.62)_16%,rgba(250,246,238,0.82)_40%,rgba(255,253,247,0.97)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_65%_at_50%_-12%,rgba(255,210,130,0.72),transparent_55%)]"
        aria-hidden
      />

      {/* Horizon accent */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[36%] h-px bg-gradient-to-r from-transparent via-[#C9A84A]/55 to-transparent"
        aria-hidden
      />

      {/* Neighborhood ground */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(180deg,transparent_0%,rgba(85,107,62,0.1)_28%,rgba(42,69,54,0.16)_100%)]"
        aria-hidden
      />

      {/* Distant blocks */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] opacity-[0.28]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 210" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 170 L40 170 L40 120 L80 120 L80 90 L120 90 L120 135 L160 135 L160 100 L200 100 L200 150 L240 150 L240 110 L280 110 L280 170 L320 170 L320 80 L360 80 L360 170 L400 170 L400 130 L440 130 L440 175 L480 175 L480 95 L520 95 L520 175 L560 175 L560 140 L600 140 L600 180 L640 180 L640 105 L680 105 L680 180 L720 180 L720 135 L760 135 L760 185 L800 185 L800 110 L840 110 L840 185 L880 185 L880 150 L920 150 L920 190 L960 190 L960 120 L1000 120 L1000 190 L1040 190 L1040 160 L1080 160 L1080 190 L1120 190 L1120 175 L1200 175 L1200 210 L0 210 Z"
            fill="#556B3E"
          />
        </svg>
      </div>

      {/* Foreground homes */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] opacity-[0.36] sm:opacity-[0.32]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 195" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 150 L65 150 L65 95 L105 95 L105 58 L145 58 L145 105 L185 105 L185 75 L225 75 L225 125 L265 125 L265 85 L305 85 L305 135 L345 135 L345 65 L385 65 L385 135 L425 135 L425 100 L465 100 L465 150 L505 150 L505 80 L545 80 L545 150 L585 150 L585 115 L625 115 L625 155 L665 155 L665 90 L705 90 L705 155 L745 155 L745 115 L785 115 L785 160 L825 160 L825 92 L865 92 L865 160 L905 160 L905 125 L945 125 L945 165 L985 165 L985 100 L1025 100 L1025 165 L1065 165 L1065 135 L1105 135 L1105 165 L1200 165 L1200 195 L0 195 Z"
            fill="#2A4536"
          />
          <rect x="115" y="112" width="10" height="12" rx="1" fill="#C9A84A" opacity="0.8" />
          <rect x="128" y="112" width="10" height="12" rx="1" fill="#C9A84A" opacity="0.55" />
          <rect x="395" y="88" width="10" height="12" rx="1" fill="#C9A84A" opacity="0.7" />
          <rect x="555" y="98" width="10" height="12" rx="1" fill="#C9A84A" opacity="0.62" />
          <rect x="715" y="112" width="10" height="12" rx="1" fill="#C9A84A" opacity="0.75" />
          <path d="M145 58 L168 30 L191 58" stroke="#C9A84A" strokeWidth="2.25" opacity="0.7" />
          <path d="M345 65 L368 35 L391 65" stroke="#C9A84A" strokeWidth="2.25" opacity="0.65" />
          <path d="M505 80 L528 52 L551 80" stroke="#C9A84A" strokeWidth="2" opacity="0.62" />
        </svg>
      </div>

      <div className="pointer-events-none absolute -left-28 top-6 h-56 w-56 rounded-full bg-[#C9A84A]/28 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-24 top-10 h-52 w-52 rounded-full bg-[#556B3E]/18 blur-3xl" aria-hidden />

      <div className="relative">{children}</div>
    </div>
  );
}
