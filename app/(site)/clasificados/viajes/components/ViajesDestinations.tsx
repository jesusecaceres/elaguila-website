import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_DESTINATION_COLLECTIONS } from "../data/viajesLandingSampleData";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";
import { VIAJES_LANDING_CTA_ORANGE } from "../lib/viajesLandingVisual";
import { ViajesLandingBrowseMore } from "./ViajesLandingBrowseMore";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

type ViajesDestinationsProps = {
  ui: ViajesUi;
  browseAllHref: string;
};

export function ViajesDestinations({ ui, browseAllHref }: ViajesDestinationsProps) {
  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader
        title={ui.destinations.title}
        subtitle={ui.destinations.subtitle}
        showRail
        eyebrow={ui.landing.tier2Eyebrow}
        headingScale="secondary"
        className="mb-6 sm:mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {VIAJES_DESTINATION_COLLECTIONS.map((d) => {
          const line = ui.destinations.byId[d.id]?.supportingLine ?? d.supportingLine;
          return (
            <article
              key={d.id}
              className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffefb] shadow-[0_12px_40px_-20px_rgba(30,50,70,0.14)] transition hover:-translate-y-[2px] hover:shadow-[0_20px_50px_-22px_rgba(30,50,80,0.16)]"
            >
              <div className="relative aspect-[4/3] w-full min-w-0 overflow-hidden">
                <Image
                  src={d.imageSrc}
                  alt={d.imageAlt}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1280px) 50vw, 25vw"
                  className="object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{d.name}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{line}</p>
                <Link
                  href={viajesResultsBrowseUrl(ui.lang, d.browse)}
                  className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-[0_12px_26px_-10px_rgba(234,88,12,0.45)] transition hover:brightness-105"
                  style={{ backgroundColor: VIAJES_LANDING_CTA_ORANGE }}
                >
                  {ui.destinations.cta}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
      <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
    </section>
  );
}
