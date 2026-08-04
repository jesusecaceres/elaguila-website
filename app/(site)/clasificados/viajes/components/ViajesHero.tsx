import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { VIAJES_HERO_IMAGE } from "../data/viajesLandingSampleData";
import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_LANDING_CTA_ORANGE } from "../lib/viajesLandingVisual";

type ViajesHeroProps = {
  searchBar: ReactNode;
  tripPills: ReactNode;
  ui: ViajesUi;
  exploreHref: string;
  publishHref: string;
};

export function ViajesHero({ searchBar, tripPills, ui, exploreHref, publishHref }: ViajesHeroProps) {
  return (
    <section className="relative z-[1] w-full min-w-0 overflow-x-hidden">
      <div className="relative w-full overflow-hidden">
        <div className="relative aspect-[16/10] w-full max-h-[min(52svh,22rem)] sm:max-h-[min(48svh,24rem)] md:aspect-[2.4/1] md:max-h-[min(42svh,26rem)] lg:max-h-[min(38svh,28rem)]">
          <Image
            src={VIAJES_HERO_IMAGE.src}
            alt={VIAJES_HERO_IMAGE.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_32%]"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c2a38]/70 via-[#1a4a5c]/30 to-transparent" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/25" aria-hidden />

          <div className="absolute inset-0 flex flex-col justify-end pb-6 pt-12 sm:pb-8 sm:pt-16">
            <div className="mx-auto w-full min-w-0 max-w-[1280px] px-3.5 sm:px-4 lg:px-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/90 sm:text-[11px]">Leonix · Viajes</p>
              <h1 className="mt-2 max-w-3xl text-[clamp(1.55rem,4.2vw+0.4rem,3rem)] font-bold leading-[1.1] tracking-tight text-white drop-shadow-md">
                {ui.heroTitle}
              </h1>
              <p className="mt-2 max-w-2xl text-[13px] leading-snug text-white/95 sm:text-sm md:text-[0.95rem]">
                {ui.heroSubtitle}
              </p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  href={exploreHref}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-sm font-bold text-white shadow-md"
                  style={{ backgroundColor: VIAJES_LANDING_CTA_ORANGE }}
                >
                  {ui.heroCtaExplore}
                </Link>
                <Link
                  href={publishHref}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/70 bg-white/15 px-5 text-sm font-bold text-white backdrop-blur-sm"
                >
                  {ui.heroCtaPublish}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-[2] mx-auto -mt-6 w-full max-w-[1280px] px-3.5 sm:-mt-8 sm:px-4 lg:px-5">
        <div className="rounded-2xl border border-[color:var(--lx-nav-border)] bg-white p-3 shadow-[0_18px_44px_-24px_rgba(15,50,70,0.32)] sm:p-4">
          <div className="min-w-0">{searchBar}</div>
          <div className="mt-3 min-w-0 border-t border-[color:var(--lx-nav-border)]/70 pt-3">{tripPills}</div>
        </div>
      </div>
    </section>
  );
}
