import type { ReactNode } from "react";

/**
 * Rentas landing neighborhood scene — CSS-only layered skyline behind hero + intent tiles.
 * Creates one intentional “city-living doorway” band (v2: golden-hour warmth, rooflines, apartment blocks).
 */
export function RentasLandingSceneBand({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#D6C7AD]/50 shadow-[0_14px_44px_-22px_rgba(42,36,22,0.32)]">
      {/* Ivory/cream base */}
      <div className="pointer-events-none absolute inset-0 bg-[#FFFDF7]" aria-hidden />

      {/* Golden-hour sky — stronger warm wash */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(201,168,74,0.22)_0%,rgba(255,248,230,0.45)_22%,rgba(250,246,238,0.72)_48%,rgba(255,253,247,0.94)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_-8%,rgba(255,236,190,0.55),transparent_62%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_85%_15%,rgba(122,30,44,0.06),transparent_55%)]"
        aria-hidden
      />

      {/* Soft neighborhood ground */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(180deg,transparent_0%,rgba(85,107,62,0.05)_35%,rgba(85,107,62,0.12)_100%)]"
        aria-hidden
      />

      {/* Distant apartment blocks — mid row */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[36%] opacity-[0.11]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 190" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 155 L40 155 L40 110 L80 110 L80 85 L120 85 L120 125 L160 125 L160 95 L200 95 L200 140 L240 140 L240 105 L280 105 L280 155 L320 155 L320 75 L360 75 L360 155 L400 155 L400 120 L440 120 L440 160 L480 160 L480 90 L520 90 L520 160 L560 160 L560 130 L600 130 L600 165 L640 165 L640 100 L680 100 L680 165 L720 165 L720 125 L760 125 L760 170 L800 170 L800 105 L840 105 L840 170 L880 170 L880 140 L920 140 L920 175 L960 175 L960 115 L1000 115 L1000 175 L1040 175 L1040 150 L1080 150 L1080 175 L1120 175 L1120 160 L1200 160 L1200 190 L0 190 Z"
            fill="#556B3E"
          />
          {/* Balcony ledges */}
          <rect x="125" y="118" width="28" height="3" rx="0.5" fill="#2A4536" opacity="0.35" />
          <rect x="325" y="98" width="24" height="3" rx="0.5" fill="#2A4536" opacity="0.3" />
          <rect x="645" y="108" width="26" height="3" rx="0.5" fill="#2A4536" opacity="0.32" />
        </svg>
      </div>

      {/* Foreground homes + rooflines — stronger */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%] opacity-[0.15] sm:opacity-[0.13]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 175" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 135 L65 135 L65 88 L105 88 L105 55 L145 55 L145 98 L185 98 L185 72 L225 72 L225 115 L265 115 L265 80 L305 80 L305 125 L345 125 L345 62 L385 62 L385 125 L425 125 L425 95 L465 95 L465 135 L505 135 L505 75 L545 75 L545 135 L585 135 L585 108 L625 108 L625 140 L665 140 L665 85 L705 85 L705 140 L745 140 L745 105 L785 105 L785 145 L825 145 L825 88 L865 88 L865 145 L905 145 L905 115 L945 115 L945 150 L985 150 L985 95 L1025 95 L1025 150 L1065 150 L1065 125 L1105 125 L1105 150 L1200 150 L1200 175 L0 175 Z"
            fill="#2A4536"
          />
          {/* Warm window glow */}
          <rect x="115" y="102" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.65" />
          <rect x="128" y="102" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.42" />
          <rect x="395" y="82" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.55" />
          <rect x="555" y="92" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.48" />
          <rect x="715" y="102" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.58" />
          <rect x="875" y="102" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.4" />
          <rect x="995" y="108" width="9" height="11" rx="1" fill="#C9A84A" opacity="0.52" />
          {/* Roof accents — burgundy/gold */}
          <path d="M145 55 L165 32 L185 55" stroke="#C9A84A" strokeWidth="1.75" opacity="0.55" />
          <path d="M345 62 L365 38 L385 62" stroke="#C9A84A" strokeWidth="1.75" opacity="0.5" />
          <path d="M665 85 L685 58 L705 85" stroke="#7A1E2C" strokeWidth="1.25" opacity="0.35" />
          <path d="M505 75 L525 52 L545 75" stroke="#C9A84A" strokeWidth="1.5" opacity="0.48" />
        </svg>
      </div>

      {/* Tree silhouettes — neighborhood depth */}
      <div className="pointer-events-none absolute bottom-[8%] left-[6%] h-16 w-12 opacity-[0.08]" aria-hidden>
        <svg viewBox="0 0 48 64" fill="none" className="h-full w-full">
          <ellipse cx="24" cy="20" rx="18" ry="16" fill="#556B3E" />
          <rect x="21" y="32" width="6" height="24" rx="1" fill="#2A4536" />
        </svg>
      </div>
      <div className="pointer-events-none absolute bottom-[6%] right-[8%] h-14 w-10 opacity-[0.07]" aria-hidden>
        <svg viewBox="0 0 40 56" fill="none" className="h-full w-full">
          <ellipse cx="20" cy="18" rx="15" ry="14" fill="#556B3E" />
          <rect x="17.5" y="28" width="5" height="20" rx="1" fill="#2A4536" />
        </svg>
      </div>

      {/* Warm side glows */}
      <div className="pointer-events-none absolute -left-20 top-6 h-44 w-44 rounded-full bg-[#C9A84A]/18 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-16 top-12 h-40 w-40 rounded-full bg-[#556B3E]/12 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-0 h-24 w-[70%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,248,230,0.35),transparent_70%)]" aria-hidden />

      <div className="relative">{children}</div>
    </div>
  );
}
