import type { ReactNode } from "react";

import { RESTAURANTES_LANDING_HERO_BG } from "./restaurantesLandingAssets";

export function RestaurantesLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#FDFBF7] text-[#2D241E] antialiased">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[min(40vh,380px)] w-full max-w-[100vw] overflow-hidden rounded-b-[20px] sm:min-h-[min(48vh,480px)] sm:rounded-b-[22px] md:min-h-[min(52vh,520px)] lg:min-h-[min(58vh,560px)] lg:rounded-b-[24px]"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-cover bg-center sm:bg-[center_38%] md:bg-[center_40%] lg:bg-[center_42%]"
          style={{ backgroundImage: `url('${RESTAURANTES_LANDING_HERO_BG}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#2D241E]/[0.52] via-[#fdfbf7]/[0.88] to-[#FDFBF7] sm:from-[#2D241E]/50 sm:via-[#fdfbf7]/90" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,119,6,0.12),transparent_60%)] sm:bg-[radial-gradient(ellipse_at_50%_0%,rgba(217,119,6,0.14),transparent_58%)]" />
      </div>
      <div className="relative z-[1] min-w-0">{children}</div>
    </div>
  );
}
