import { FiMapPin } from "react-icons/fi";

/**
 * Decorative faux map panel — no external APIs, tiles, or geolocation claims.
 */
export function RestaurantContactHubFauxMap() {
  return (
    <div
      className="relative mt-3 aspect-[16/9] w-full max-w-full overflow-hidden rounded-xl border border-[color:var(--lx-gold-border)] bg-[color:var(--lx-section)] shadow-inner"
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full text-[color:var(--lx-muted)]"
        viewBox="0 0 400 225"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="rest-hub-map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <path
              d="M 28 0 L 0 0 0 28"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="400" height="225" fill="url(#rest-hub-map-grid)" />
        <rect
          x="24"
          y="52"
          width="88"
          height="56"
          rx="6"
          fill="var(--lx-card)"
          fillOpacity="0.55"
          stroke="var(--lx-gold-border)"
          strokeOpacity="0.7"
          strokeWidth="1"
        />
        <rect
          x="128"
          y="36"
          width="64"
          height="72"
          rx="5"
          fill="var(--lx-card)"
          fillOpacity="0.45"
          stroke="var(--lx-gold-border)"
          strokeOpacity="0.65"
          strokeWidth="1"
        />
        <rect
          x="208"
          y="88"
          width="96"
          height="48"
          rx="6"
          fill="var(--lx-card)"
          fillOpacity="0.5"
          stroke="var(--lx-gold-border)"
          strokeOpacity="0.7"
          strokeWidth="1"
        />
        <rect
          x="48"
          y="128"
          width="112"
          height="64"
          rx="7"
          fill="var(--lx-card)"
          fillOpacity="0.4"
          stroke="var(--lx-gold-border)"
          strokeOpacity="0.6"
          strokeWidth="1"
        />
        <rect
          x="272"
          y="120"
          width="80"
          height="72"
          rx="6"
          fill="var(--lx-card)"
          fillOpacity="0.48"
          stroke="var(--lx-gold-border)"
          strokeOpacity="0.65"
          strokeWidth="1"
        />
        <path
          d="M 0 112 Q 80 96 160 112 T 320 108 T 400 118"
          fill="none"
          stroke="var(--lx-muted)"
          strokeOpacity="0.2"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>

      <div
        className="pointer-events-none absolute left-1/2 top-[44%] z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center"
        aria-hidden
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[color:var(--lx-card)] bg-[color:var(--lx-gold)] shadow-lg sm:h-12 sm:w-12">
          <FiMapPin className="h-5 w-5 text-[color:var(--lx-cta-dark)] sm:h-6 sm:w-6" aria-hidden />
        </div>
        <div className="mt-0.5 h-2 w-2 rotate-45 bg-[color:var(--lx-gold)]" />
      </div>
    </div>
  );
}
