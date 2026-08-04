import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_DESTINATION_COLLECTIONS } from "../data/viajesLandingSampleData";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";
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
      <ul className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {VIAJES_DESTINATION_COLLECTIONS.map((d) => {
          const line = ui.destinations.byId[d.id]?.supportingLine ?? d.supportingLine;
          return (
            <li key={d.id} className="w-[112px] shrink-0 sm:w-[128px]">
              <Link href={viajesResultsBrowseUrl(ui.lang, d.browse)} className="group flex flex-col items-center text-center">
                <span className="relative h-[112px] w-[112px] overflow-hidden rounded-full border-2 border-[color:var(--lx-gold-border)] shadow-md sm:h-[128px] sm:w-[128px]">
                  <Image
                    src={d.imageSrc}
                    alt={d.imageAlt}
                    fill
                    sizes="128px"
                    className="object-cover transition duration-500 group-hover:scale-[1.05]"
                  />
                </span>
                <span className="mt-2 line-clamp-2 text-sm font-bold text-[color:var(--lx-text)]">{d.name}</span>
                <span className="mt-0.5 line-clamp-2 text-[11px] text-[color:var(--lx-muted)]">{line}</span>
              </Link>
            </li>
          );
        })}
      </ul>
      <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
    </section>
  );
}
