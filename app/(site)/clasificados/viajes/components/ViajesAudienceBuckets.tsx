import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_AUDIENCE_BUCKETS } from "../data/viajesLandingSampleData";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";
import { ViajesLandingBrowseMore } from "./ViajesLandingBrowseMore";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

type ViajesAudienceBucketsProps = {
  ui: ViajesUi;
  browseAllHref: string;
};

export function ViajesAudienceBuckets({ ui, browseAllHref }: ViajesAudienceBucketsProps) {
  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader
        title={ui.audience.title}
        subtitle={ui.audience.subtitle}
        showRail
        eyebrow={ui.landing.tier2Eyebrow}
        headingScale="secondary"
        className="mb-6 sm:mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {VIAJES_AUDIENCE_BUCKETS.map((card) => {
          const copy = ui.audience.byId[card.id];
          return (
            <Link
              key={card.id}
              href={viajesResultsBrowseUrl(ui.lang, card.browse)}
              className="group block min-w-0 overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffefb] shadow-[0_12px_40px_-20px_rgba(30,24,16,0.12)] transition hover:-translate-y-[2px] hover:shadow-[0_22px_52px_-24px_rgba(30,50,80,0.16)]"
            >
              <div className="relative aspect-[5/4] w-full min-w-0 overflow-hidden">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-90" aria-hidden />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-lg font-bold text-white drop-shadow-md">{copy?.label ?? card.label}</p>
                </div>
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy?.subline ?? card.subline}</p>
              </div>
            </Link>
          );
        })}
      </div>
      <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
    </section>
  );
}
