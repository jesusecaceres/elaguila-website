import type { ReactNode } from "react";

/**
 * Rentas landing neighborhood scene — CSS-only visual contract v5.
 * Inline SVG + gradient layers (no remote assets, no image generation).
 * Marker: data-rentas-gateway-scene="v5-visual-contract"
 */
export function RentasLandingSceneBand({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative min-h-[32rem] overflow-hidden rounded-2xl border-2 border-[#C9A84A]/45 shadow-[0_28px_72px_-32px_rgba(42,36,22,0.48)] ring-1 ring-[#C9A84A]/20 sm:min-h-[34rem]"
      data-rentas-gateway-scene="v5-visual-contract"
    >
      {/* Golden-hour sky — no opaque base; scene stays visible */}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#E8C98A_0%,#F5D9A8_12%,#FAF0DC_28%,#F7F2E8_52%,#F3EBDD_78%,#EDE4D4_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_120%_70%_at_50%_-5%,rgba(255,200,120,0.85),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_85%_15%,rgba(201,168,74,0.35),transparent_50%)]"
        aria-hidden
      />

      {/* Top legibility wash — fades out so skyline shows below */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[55%] bg-[linear-gradient(180deg,rgba(255,253,247,0.88)_0%,rgba(255,253,247,0.55)_35%,transparent_100%)]"
        aria-hidden
      />

      {/* Horizon */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-[38%] h-px bg-gradient-to-r from-transparent via-[#C9A84A]/65 to-transparent"
        aria-hidden
      />

      {/* Ground */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[52%] bg-[linear-gradient(180deg,transparent_0%,rgba(85,107,62,0.14)_32%,rgba(42,69,54,0.22)_100%)]"
        aria-hidden
      />

      {/* Distant city blocks */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] opacity-[0.34]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 220" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 175 L35 175 L35 125 L70 125 L70 95 L105 95 L105 140 L140 140 L140 105 L175 105 L175 155 L210 155 L210 115 L245 115 L245 175 L280 175 L280 85 L315 85 L315 175 L350 175 L350 135 L385 135 L385 180 L420 180 L420 100 L455 100 L455 180 L490 180 L490 145 L525 145 L525 185 L560 185 L560 110 L595 110 L595 185 L630 185 L630 150 L665 150 L665 190 L700 190 L700 120 L735 120 L735 190 L770 190 L770 155 L805 155 L805 195 L840 195 L840 125 L875 125 L875 195 L910 195 L910 160 L945 160 L945 200 L980 200 L980 130 L1015 130 L1015 200 L1050 200 L1050 170 L1085 170 L1085 200 L1120 200 L1120 185 L1200 185 L1200 220 L0 220 Z"
            fill="#556B3E"
          />
        </svg>
      </div>

      {/* Foreground homes + rooflines */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] opacity-[0.42] sm:opacity-[0.38]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" fill="none">
          <path
            d="M0 155 L60 155 L60 98 L98 98 L98 62 L136 62 L136 108 L174 108 L174 78 L212 78 L212 128 L250 128 L250 88 L288 88 L288 138 L326 138 L326 68 L364 68 L364 138 L402 138 L402 103 L440 103 L440 153 L478 153 L478 83 L516 83 L516 153 L554 153 L554 118 L592 118 L592 158 L630 158 L630 93 L668 93 L668 158 L706 158 L706 118 L744 118 L744 163 L782 163 L782 95 L820 95 L820 163 L858 163 L858 128 L896 128 L896 168 L934 168 L934 103 L972 103 L972 168 L1010 168 L1010 138 L1048 138 L1048 168 L1086 168 L1086 148 L1124 148 L1124 168 L1200 168 L1200 200 L0 200 Z"
            fill="#2A4536"
          />
          <rect x="108" y="115" width="11" height="13" rx="1" fill="#C9A84A" opacity="0.85" />
          <rect x="122" y="115" width="11" height="13" rx="1" fill="#C9A84A" opacity="0.6" />
          <rect x="378" y="92" width="11" height="13" rx="1" fill="#C9A84A" opacity="0.75" />
          <rect x="538" y="102" width="11" height="13" rx="1" fill="#C9A84A" opacity="0.68" />
          <rect x="698" y="118" width="11" height="13" rx="1" fill="#C9A84A" opacity="0.8" />
          <path d="M136 62 L160 32 L184 62" stroke="#C9A84A" strokeWidth="2.5" opacity="0.75" />
          <path d="M326 68 L350 38 L374 68" stroke="#C9A84A" strokeWidth="2.5" opacity="0.7" />
          <path d="M478 83 L502 54 L526 83" stroke="#C9A84A" strokeWidth="2.25" opacity="0.68" />
          <path d="M668 93 L692 64 L716 93" stroke="#C9A84A" strokeWidth="2" opacity="0.65" />
        </svg>
      </div>

      {/* Tree silhouettes */}
      <div className="pointer-events-none absolute inset-x-0 bottom-[18%] h-[22%] opacity-[0.28]" aria-hidden>
        <svg className="h-full w-full" viewBox="0 0 1200 80" preserveAspectRatio="xMidYMax slice" fill="none">
          <ellipse cx="180" cy="55" rx="28" ry="22" fill="#556B3E" />
          <rect x="176" y="55" width="8" height="18" fill="#2A4536" />
          <ellipse cx="520" cy="58" rx="32" ry="24" fill="#556B3E" />
          <rect x="516" y="58" width="8" height="16" fill="#2A4536" />
          <ellipse cx="880" cy="52" rx="26" ry="20" fill="#556B3E" />
          <rect x="876" y="52" width="8" height="18" fill="#2A4536" />
        </svg>
      </div>

      <div className="pointer-events-none absolute -left-32 top-4 h-64 w-64 rounded-full bg-[#C9A84A]/32 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -right-28 top-8 h-56 w-56 rounded-full bg-[#556B3E]/20 blur-3xl" aria-hidden />

      <div className="relative">{children}</div>
    </div>
  );
}
