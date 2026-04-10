import type { ReactNode } from "react";

import { RESTAURANTES_LANDING_HERO_BG } from "./restaurantesLandingAssets";

export function RestaurantesLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FDFBF7] text-[#2D241E] antialiased">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[min(58vh,560px)] w-full overflow-hidden rounded-b-[24px]"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-[center_42%]"
          style={{ backgroundImage: `url('${RESTAURANTES_LANDING_HERO_BG}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D241E]/50 via-[#fdfbf7]/90 to-[#FDFBF7]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,119,6,0.14),transparent_58%)]" />
      </div>
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
