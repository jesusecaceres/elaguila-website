import type { ReactNode } from "react";
import { rentasLandingPaperBgClass } from "../rentasLandingTheme";

export function RentasLandingShell({ children }: { children: ReactNode }) {
  return (
    <div className={"relative min-h-screen overflow-x-hidden text-[#2C2416] " + rentasLandingPaperBgClass}>
      {/* Atmospheric hero band — scenic wash + cool gradient (content stays legible below) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-0 min-h-[min(44vh,440px)] w-full overflow-hidden rounded-b-[2rem] border-b border-[#C4B8A8]/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
        aria-hidden
      >
        <div
          className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=60&auto=format&fit=crop')] bg-cover bg-[center_30%] opacity-[0.1] mix-blend-multiply"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#E8EEF4]/78 via-[#F6F0E8]/93 to-[#F6F0E8]" />
      </div>
      <div className="relative z-[1] mx-auto max-w-[1320px] px-4 pb-16 pt-20 sm:px-5 sm:pb-20 sm:pt-24">{children}</div>
    </div>
  );
}
