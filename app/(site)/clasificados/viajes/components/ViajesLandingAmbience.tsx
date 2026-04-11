"use client";

import { VIAJES_PAGE_AMBIENCE } from "../data/viajesLandingSampleData";

/**
 * Full-page layered scenic wash behind Viajes landing content.
 * Hero keeps the strongest image; this continues atmosphere mid/lower without fighting cards.
 */
export function ViajesLandingAmbience() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 min-h-full overflow-hidden" aria-hidden>
      {/* Warm sand → cream vertical rhythm */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #f0e6d8 0%, #f5ebe0 18%, #f8f2e8 42%, #faf6f0 68%, #fffcf7 100%)",
        }}
      />
      {/* Soft mid scenic — low contrast */}
      <div
        className="absolute inset-0 opacity-[0.14] mix-blend-multiply"
        style={{
          backgroundImage: `url('${VIAJES_PAGE_AMBIENCE.midScenicSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 28%",
        }}
      />
      {/* Lower coastal wash — fades in down the page */}
      <div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage: `url('${VIAJES_PAGE_AMBIENCE.lowerWashSrc}')`,
          backgroundSize: "cover",
          backgroundPosition: "center 100%",
        }}
      />
      {/* Ocean / travel blue atmospheric veil */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(30, 90, 120, 0.07) 0%, rgba(30, 90, 120, 0.02) 38%, rgba(245, 235, 220, 0.65) 72%, rgba(255, 252, 247, 0.92) 100%)",
        }}
      />
      {/* Soft light well — keeps center content readable */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 50% -8%, rgba(255, 252, 247, 0.55), transparent 52%)",
        }}
      />
      {/* Side vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 50% 100%, rgba(30, 24, 16, 0.04), transparent 55%)",
        }}
      />
    </div>
  );
}
