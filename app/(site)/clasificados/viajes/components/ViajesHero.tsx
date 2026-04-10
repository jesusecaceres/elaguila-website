import Image from "next/image";
import type { ReactNode } from "react";

import { VIAJES_HERO_IMAGE } from "../data/viajesLandingSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";

type ViajesHeroProps = {
  searchBar: ReactNode;
  tripPills: ReactNode;
  ui: ViajesUi;
};

/**
 * Hero + search: single bordered card — image band, then search + pills in a contiguous stack.
 * Avoids negative-margin overlap at any breakpoint while keeping a premium framed look.
 */
export function ViajesHero({ searchBar, tripPills, ui }: ViajesHeroProps) {
  return (
    <section className="relative z-[1] w-full min-w-0 overflow-x-hidden px-3 pt-2 sm:px-4 md:px-5 lg:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)]/45 shadow-[0_28px_80px_-36px_rgba(15,50,70,0.42)] sm:rounded-3xl">
        <div className="relative w-full overflow-hidden">
          <div
            className="relative aspect-[10/11] w-full max-h-[min(76svh,24rem)] sm:aspect-[16/11] sm:max-h-[min(70svh,26rem)] md:aspect-[2.05/1] md:max-h-[min(58svh,26rem)] lg:aspect-[21/9] lg:max-h-none lg:min-h-[16.5rem] xl:min-h-[18rem] 2xl:min-h-[19.5rem]"
          >
            <Image
              src={VIAJES_HERO_IMAGE.src}
              alt={VIAJES_HERO_IMAGE.alt}
              fill
              priority
              sizes="(max-width:640px) 100vw, (max-width:1024px) 100vw, min(1280px, 100vw)"
              className="object-cover object-[center_28%] min-[480px]:object-[center_32%] sm:object-[center_34%] md:object-[center_36%] lg:object-[center_38%]"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0c2a38]/70 via-[#1a4a5c]/25 to-transparent" aria-hidden />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f3ebdd] via-[#f3ebdd]/60 to-[#0a1f2a]/38" aria-hidden />
            <div
              className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_0%,rgba(255,252,247,0.18),transparent_58%)]"
              aria-hidden
            />

            <div className="absolute inset-0 flex flex-col justify-end pb-5 pt-12 sm:pb-6 sm:pt-16 md:pb-7 md:pt-20">
              <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-5 lg:px-6">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="min-w-0 text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 drop-shadow-sm sm:text-[11px] sm:tracking-[0.2em]">
                    Leonix · Viajes
                  </p>
                  <span className="shrink-0 rounded-full border border-white/35 bg-white/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/95 backdrop-blur-sm sm:px-2.5 sm:text-[10px] sm:tracking-[0.12em]">
                    {ui.heroPrimaryCue}
                  </span>
                </div>
                <h1 className="mt-2 max-w-full break-words text-[clamp(1.35rem,4vw+0.45rem,2.65rem)] font-bold leading-[1.12] tracking-tight text-[#FFFCF7] drop-shadow-md sm:mt-3">
                  {ui.heroTitle}
                </h1>
                <p className="mt-2 max-w-full break-words text-[13px] leading-snug text-white/95 drop-shadow [text-wrap:pretty] sm:mt-3 sm:max-w-2xl sm:text-sm md:leading-relaxed lg:max-w-2xl lg:text-[0.95rem]">
                  {ui.heroSubtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[color:var(--lx-gold-border)]/40 bg-[#fffdf9]/[0.99] px-3 py-4 shadow-[inset_0_1px_0_rgba(255,252,247,0.85)] sm:px-5 sm:py-5 md:px-6 md:py-6">
          <div className="min-w-0">{searchBar}</div>
          <div className="mt-3 min-w-0 sm:mt-4">{tripPills}</div>
        </div>
      </div>
    </section>
  );
}
