"use client";

import { useId } from "react";
import { FiMapPin } from "react-icons/fi";

const PIN_BURGUNDY = "#7A1E2C";
const PIN_GOLD = "#C9A84A";

/**
 * Compact decorative faux map — Leonix burgundy/gold/charcoal (Gate R-C1).
 * No external APIs, tiles, or geolocation claims.
 */
export function RestaurantContactHubFauxMap() {
  const uid = useId().replace(/:/g, "");
  const gridId = `rest-hub-map-grid-${uid}`;
  const washId = `rest-hub-map-wash-${uid}`;
  const vignetteId = `rest-hub-map-vig-${uid}`;

  return (
    <div
      className="relative aspect-[2.1/1] max-h-[148px] w-full max-w-full overflow-hidden rounded-lg sm:max-h-[156px]"
      style={{
        background: "linear-gradient(160deg, #2A2620 0%, #1E1814 38%, #2F241F 72%, #1A1612 100%)",
      }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 190"
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
        <rect width="400" height="190" fill={`url(#${gridId})`} />
        <rect width="400" height="190" fill={`url(#${washId})`} />
        <path
          d="M 0 96 Q 100 82 200 96 T 400 92"
          fill="none"
          stroke="rgba(255, 252, 247, 0.22)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 0 96 Q 100 82 200 96 T 400 92"
          fill="none"
          stroke="rgba(201, 168, 74, 0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <rect x="20" y="40" width="58" height="44" rx="4" fill="rgba(255, 252, 247, 0.08)" stroke="rgba(201, 168, 74, 0.28)" strokeWidth="1" />
        <rect x="98" y="28" width="72" height="56" rx="5" fill="rgba(122, 30, 44, 0.18)" stroke="rgba(201, 168, 74, 0.32)" strokeWidth="1" />
        <rect x="188" y="68" width="88" height="40" rx="4" fill="rgba(255, 252, 247, 0.07)" stroke="rgba(201, 168, 74, 0.25)" strokeWidth="1" />
        <rect width="400" height="190" fill={`url(#${vignetteId})`} />
      </svg>

      <div
        className="pointer-events-none absolute left-1/2 top-[40%] z-10 flex -translate-x-1/2 flex-col items-center"
        aria-hidden
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-[#FFFCF7] shadow-lg sm:h-11 sm:w-11"
          style={{
            backgroundColor: PIN_BURGUNDY,
            boxShadow: `0 8px 22px rgba(30, 24, 16, 0.45), 0 0 0 4px rgba(201, 168, 74, 0.35)`,
          }}
        >
          <FiMapPin className="h-5 w-5 text-white sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
        </div>
        <span
          className="mt-0.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: PIN_GOLD, boxShadow: "0 0 6px rgba(201, 168, 74, 0.6)" }}
        />
      </div>
    </div>
  );
}
