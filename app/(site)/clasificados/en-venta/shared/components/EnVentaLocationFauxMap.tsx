"use client";

import { useId } from "react";

const PIN_BURGUNDY = "#7A1E2C";
const PIN_GOLD = "#C9A84A";

/**
 * Decorative faux map panel for Varios contact card — no external APIs or image assets.
 * Visual reference: Servicios `ServiciosBusinessHubFauxMap` (read-only).
 */
export function EnVentaLocationFauxMap() {
  const uid = useId().replace(/:/g, "");
  const gridId = `ev-map-grid-${uid}`;
  const washId = `ev-map-wash-${uid}`;
  const vignetteId = `ev-map-vig-${uid}`;

  return (
    <div
      className="relative mt-3 aspect-[2/1] w-full max-w-full overflow-hidden rounded-lg border border-[#C9A84A]/25 shadow-sm"
      style={{
        background: "linear-gradient(160deg, #2A2620 0%, #1E1814 38%, #2F241F 72%, #1A1612 100%)",
        maxHeight: "7.5rem",
      }}
      aria-hidden
      data-testid="ev-location-faux-map"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 200"
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
        <rect width="400" height="200" fill={`url(#${gridId})`} />
        <rect width="400" height="200" fill={`url(#${washId})`} />
        <path
          d="M 0 100 Q 100 88 200 100 T 400 96"
          fill="none"
          stroke="rgba(255, 252, 247, 0.22)"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 0 100 Q 100 88 200 100 T 400 96"
          fill="none"
          stroke="rgba(201, 168, 74, 0.35)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M 88 0 L 88 200 M 188 0 L 188 200 M 288 0 L 288 200"
          fill="none"
          stroke="rgba(255, 252, 247, 0.12)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 0 62 L 400 62 M 0 138 L 400 138"
          fill="none"
          stroke="rgba(255, 252, 247, 0.1)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <rect x="20" y="42" width="58" height="44" rx="4" fill="rgba(255, 252, 247, 0.08)" stroke="rgba(201, 168, 74, 0.28)" strokeWidth="1" />
        <rect x="98" y="28" width="72" height="56" rx="5" fill="rgba(122, 30, 44, 0.18)" stroke="rgba(201, 168, 74, 0.32)" strokeWidth="1" />
        <rect x="188" y="68" width="88" height="40" rx="4" fill="rgba(255, 252, 247, 0.07)" stroke="rgba(201, 168, 74, 0.25)" strokeWidth="1" />
        <rect x="42" y="108" width="96" height="52" rx="5" fill="rgba(255, 252, 247, 0.06)" stroke="rgba(201, 168, 74, 0.22)" strokeWidth="1" />
        <rect x="268" y="98" width="78" height="62" rx="5" fill="rgba(122, 30, 44, 0.14)" stroke="rgba(201, 168, 74, 0.3)" strokeWidth="1" />
        <rect width="400" height="200" fill={`url(#${vignetteId})`} />
      </svg>

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84A]/50 to-transparent"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-1/2 top-[44%] z-10 flex -translate-x-1/2 flex-col items-center"
        aria-hidden
      >
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#FFFCF7] sm:h-10 sm:w-10"
          style={{
            backgroundColor: PIN_BURGUNDY,
            boxShadow: "0 8px 22px rgba(30, 24, 16, 0.45), 0 0 0 4px rgba(201, 168, 74, 0.35)",
          }}
        >
          <svg className="h-4 w-4 text-white sm:h-[18px] sm:w-[18px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
          </svg>
        </div>
        <span
          className="mt-0.5 h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: PIN_GOLD, boxShadow: "0 0 6px rgba(201, 168, 74, 0.6)" }}
        />
      </div>
    </div>
  );
}
