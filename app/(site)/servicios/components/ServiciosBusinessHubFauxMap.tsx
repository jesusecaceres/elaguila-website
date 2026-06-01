"use client";

import { useId } from "react";
import { FiMapPin } from "react-icons/fi";

const PIN_BURGUNDY = "#7A1E2C";
const PIN_GOLD = "#C9A84A";

/**
 * Decorative faux map panel — no external APIs, tiles, or geolocation claims (Gate 16).
 */
export function ServiciosBusinessHubFauxMap() {
  const uid = useId().replace(/:/g, "");
  const gridId = `hub-map-grid-${uid}`;
  const washId = `hub-map-wash-${uid}`;
  const vignetteId = `hub-map-vig-${uid}`;

  return (
    <div
      className="relative aspect-[16/9] w-full max-w-full overflow-hidden rounded-lg"
      style={{
        background: "linear-gradient(160deg, #2A2620 0%, #1E1814 38%, #2F241F 72%, #1A1612 100%)",
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
          <pattern id={gridId} width="22" height="22" patternUnits="userSpaceOnUse">
            <path d="M 22 0 L 0 0 0 22" fill="none" stroke="rgba(201, 168, 74, 0.14)" strokeWidth="0.75" />
          </pattern>
          <linearGradient id={washId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(122, 30, 44, 0.22)" />
            <stop offset="55%" stopColor="rgba(30, 24, 20, 0.08)" />
            <stop offset="100%" stopColor="rgba(201, 168, 74, 0.12)" />
          </linearGradient>
          <radialGradient id={vignetteId} cx="50%" cy="50%" r="68%">
            <stop offset="55%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
          </radialGradient>
        </defs>
        <rect width="400" height="225" fill={`url(#${gridId})`} />
        <rect width="400" height="225" fill={`url(#${washId})`} />
        {/* Main roads */}
        <path
          d="M 0 112 Q 100 98 200 112 T 400 108"
          fill="none"
          stroke="rgba(255, 252, 247, 0.22)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M 0 112 Q 100 98 200 112 T 400 108"
          fill="none"
          stroke="rgba(201, 168, 74, 0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 88 0 L 88 225 M 188 0 L 188 225 M 288 0 L 288 225"
          fill="none"
          stroke="rgba(255, 252, 247, 0.12)"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M 0 68 L 400 68 M 0 158 L 400 158"
          fill="none"
          stroke="rgba(255, 252, 247, 0.1)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* City blocks */}
        <rect x="20" y="48" width="58" height="48" rx="4" fill="rgba(255, 252, 247, 0.08)" stroke="rgba(201, 168, 74, 0.28)" strokeWidth="1" />
        <rect x="98" y="32" width="72" height="62" rx="5" fill="rgba(122, 30, 44, 0.18)" stroke="rgba(201, 168, 74, 0.32)" strokeWidth="1" />
        <rect x="188" y="78" width="88" height="44" rx="4" fill="rgba(255, 252, 247, 0.07)" stroke="rgba(201, 168, 74, 0.25)" strokeWidth="1" />
        <rect x="42" y="118" width="96" height="58" rx="5" fill="rgba(255, 252, 247, 0.06)" stroke="rgba(201, 168, 74, 0.22)" strokeWidth="1" />
        <rect x="268" y="108" width="78" height="68" rx="5" fill="rgba(122, 30, 44, 0.14)" stroke="rgba(201, 168, 74, 0.3)" strokeWidth="1" />
        <ellipse cx="318" cy="42" rx="58" ry="32" fill="rgba(30, 24, 20, 0.35)" stroke="rgba(201, 168, 74, 0.15)" strokeWidth="1" />
        <rect width="400" height="225" fill={`url(#${vignetteId})`} />
      </svg>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/50 to-transparent"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[42%] z-10 flex -translate-x-1/2 flex-col items-center"
        aria-hidden
      >
        <div
          className="flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-[#FFFCF7] shadow-lg sm:h-[3.25rem] sm:w-[3.25rem]"
          style={{
            backgroundColor: PIN_BURGUNDY,
            boxShadow: `0 10px 28px rgba(30, 24, 16, 0.45), 0 0 0 5px rgba(201, 168, 74, 0.35)`,
          }}
        >
          <FiMapPin className="h-6 w-6 text-white sm:h-7 sm:w-7" aria-hidden />
        </div>
        <span
          className="mt-1 h-2 w-2 rounded-full"
          style={{ backgroundColor: PIN_GOLD, boxShadow: "0 0 8px rgba(201, 168, 74, 0.6)" }}
        />
      </div>
    </div>
  );
}
