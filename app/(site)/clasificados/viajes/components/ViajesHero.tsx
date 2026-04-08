import Image from "next/image";
import type { ReactNode } from "react";

import { VIAJES_HERO_IMAGE } from "../data/viajesLandingSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";

type ViajesHeroProps = {
  searchBar: ReactNode;
  ui: ViajesUi;
};

export function ViajesHero({ searchBar, ui }: ViajesHeroProps) {
  return (
    <section className="relative w-full overflow-hidden">
      <div className="relative min-h-[min(100vw,420px)] sm:min-h-[460px] md:min-h-[520px]">
        <Image
          src={VIAJES_HERO_IMAGE.src}
          alt={VIAJES_HERO_IMAGE.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/25"
          aria-hidden
        />
        <div className="absolute inset-0 flex flex-col justify-end pb-8 pt-20 sm:pb-9 md:pb-11">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-5 lg:px-6">
            <h1 className="max-w-4xl text-[clamp(1.25rem,4.5vw,2.25rem)] font-bold leading-tight tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl md:leading-[1.15]">
              {ui.heroTitle}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/95 sm:text-base md:max-w-3xl">
              {ui.heroSubtitle}
            </p>
          </div>
        </div>
      </div>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-3 sm:px-5 lg:px-6">
        <div className="-mt-[3.25rem] sm:-mt-[3.75rem] md:-mt-[4.5rem]">{searchBar}</div>
      </div>
    </section>
  );
}
