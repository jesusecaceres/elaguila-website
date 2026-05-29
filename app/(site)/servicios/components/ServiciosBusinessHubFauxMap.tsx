import { FiMapPin } from "react-icons/fi";
import { SV } from "./serviciosDesignTokens";

const HUB_PIN = "#7A1E2C";

/**
 * Decorative faux map panel — no external APIs, tiles, or geolocation claims.
 */
export function ServiciosBusinessHubFauxMap() {
  return (
    <div
      className="relative mt-3 aspect-[16/9] w-full max-w-full overflow-hidden rounded-xl border shadow-inner"
      style={{
        borderColor: SV.border,
        background: `linear-gradient(165deg, ${SV.bg} 0%, #E8DFCF 42%, #DDD4C4 100%)`,
      }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="hub-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="rgba(47, 42, 35, 0.06)"
              strokeWidth="1"
            />
          </pattern>
          <linearGradient id="hub-map-water" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(122, 30, 44, 0.06)" />
            <stop offset="100%" stopColor="rgba(59, 33, 23, 0.1)" />
          </linearGradient>
        </defs>
        <rect width="400" height="225" fill="url(#hub-map-grid)" />
        <ellipse cx="320" cy="48" rx="72" ry="40" fill="url(#hub-map-water)" />
        <rect x="24" y="52" width="88" height="56" rx="6" fill="rgba(255, 253, 247, 0.55)" stroke="rgba(232, 215, 184, 0.7)" strokeWidth="1" />
        <rect x="128" y="36" width="64" height="72" rx="5" fill="rgba(255, 253, 247, 0.45)" stroke="rgba(232, 215, 184, 0.65)" strokeWidth="1" />
        <rect x="208" y="88" width="96" height="48" rx="6" fill="rgba(255, 253, 247, 0.5)" stroke="rgba(232, 215, 184, 0.7)" strokeWidth="1" />
        <rect x="48" y="128" width="112" height="64" rx="7" fill="rgba(255, 253, 247, 0.4)" stroke="rgba(232, 215, 184, 0.6)" strokeWidth="1" />
        <rect x="272" y="120" width="80" height="72" rx="6" fill="rgba(255, 253, 247, 0.48)" stroke="rgba(232, 215, 184, 0.65)" strokeWidth="1" />
        <path
          d="M 0 112 Q 80 96 160 112 T 320 108 T 400 118"
          fill="none"
          stroke="rgba(122, 30, 44, 0.1)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M 40 0 L 40 225 M 120 0 L 120 225 M 200 0 L 200 225 M 280 0 L 280 225"
          fill="none"
          stroke="rgba(47, 42, 35, 0.05)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M 0 72 L 400 72 M 0 152 L 400 152"
          fill="none"
          stroke="rgba(47, 42, 35, 0.05)"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </svg>

      <div
        className="pointer-events-none absolute left-1/2 top-[44%] z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
        aria-hidden
      >
        <div
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white shadow-lg sm:h-12 sm:w-12"
          style={{
            backgroundColor: HUB_PIN,
            boxShadow: "0 8px 20px rgba(30, 24, 16, 0.18), 0 0 0 4px rgba(201, 168, 74, 0.28)",
          }}
        >
          <FiMapPin className="h-5 w-5 text-white sm:h-6 sm:w-6" aria-hidden />
        </div>
      </div>
    </div>
  );
}
