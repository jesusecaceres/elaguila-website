import Image from "next/image";
import type { ReactNode } from "react";

import { VIAJES_HERO_IMAGE } from "../data/viajesLandingSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";

type ViajesHeroProps = {
  searchBar: ReactNode;
  tripPills: ReactNode;
  ui: ViajesUi;
};

export function ViajesHero({ searchBar, tripPills, ui }: ViajesHeroProps) {
  return (
    <section className="relative z-[1] w-full">
      <div className="relative mx-3 mt-2 overflow-hidden rounded-2xl shadow-[0_28px_80px_-36px_rgba(15,50,70,0.45)] sm:mx-4 sm:rounded-3xl md:mx-auto md:max-w-7xl md:px-0">
        <div className="relative min-h-[min(88vw,400px)] sm:min-h-[460px] md:min-h-[500px] lg:min-h-[520px]">
          <Image
            src={VIAJES_HERO_IMAGE.src}
            alt={VIAJES_HERO_IMAGE.alt}
            fill
            priority
            sizes="(max-width:768px) 100vw, min(1280px, 100vw)"
            className="object-cover object-[center_38%]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c2a38]/70 via-[#1a4a5c]/25 to-transparent" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f3ebdd] via-[#f3ebdd]/55 to-[#0a1f2a]/35" aria-hidden />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(255,252,247,0.2),transparent_55%)]" aria-hidden />

          <div className="absolute inset-0 flex flex-col justify-end pb-5 pt-20 sm:pb-7 sm:pt-24 md:pb-9">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/85 drop-shadow-sm sm:text-[11px]">Leonix · Viajes</p>
                <span className="rounded-full border border-white/35 bg-white/15 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/95 backdrop-blur-sm sm:text-[10px]">
                  {ui.heroPrimaryCue}
                </span>
              </div>
              <h1 className="mt-3 max-w-[min(26ch,100%)] text-[clamp(1.45rem,4.5vw,2.85rem)] font-bold leading-[1.08] tracking-tight text-[#FFFCF7] drop-shadow-md">
                {ui.heroTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-white/95 drop-shadow sm:max-w-2xl sm:text-sm md:text-[0.95rem]">
                {ui.heroSubtitle}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl min-w-0 px-4 sm:px-5 lg:px-6">
        <div className="-mt-[3rem] sm:-mt-[3.75rem] md:-mt-[4.25rem]">{searchBar}</div>
        <div className="mt-4 sm:mt-5">{tripPills}</div>
      </div>
    </section>
  );
}
