import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_LOCAL_DEPARTURES } from "../data/viajesLandingSampleData";
import { viajesResultsBrowseUrl } from "../lib/viajesBrowseContract";
import { ViajesLandingBrowseMore } from "./ViajesLandingBrowseMore";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

type ViajesLocalDeparturesProps = {
  ui: ViajesUi;
  browseAllHref: string;
};

export function ViajesLocalDepartures({ ui, browseAllHref }: ViajesLocalDeparturesProps) {
  return (
    <section className="mt-10 sm:mt-12">
      <ViajesSectionHeader
        title={ui.localDepartures.title}
        subtitle={ui.localDepartures.subtitle}
        showRail
        eyebrow={ui.landing.tier1Eyebrow}
        headingScale="primary"
        className="mb-6 sm:mb-8"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-2 lg:gap-6 xl:grid-cols-4">
        {VIAJES_LOCAL_DEPARTURES.map((card) => {
          const copy = ui.localDepartures.byId[card.id];
          return (
            <article
              key={card.id}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffefb] shadow-[0_12px_40px_-20px_rgba(30,24,16,0.12)] transition hover:-translate-y-[2px] hover:shadow-[0_20px_48px_-22px_rgba(30,50,70,0.14)]"
            >
              <div className="relative aspect-[16/10] w-full min-w-0 overflow-hidden">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover object-center"
                />
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">{copy?.title ?? card.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy?.description ?? card.description}</p>
                <div className="mt-4 flex flex-col gap-3 border-t border-[color:var(--lx-nav-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <span className="hidden text-xs text-[color:var(--lx-muted)] sm:inline" aria-hidden>
                    📍
                  </span>
                  <Link
                    href={viajesResultsBrowseUrl(ui.lang, card.browse)}
                    className="inline-flex min-h-[44px] w-full min-w-0 items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-4 py-2 text-center text-xs font-bold text-[#FFFCF7] transition hover:bg-[color:var(--lx-cta-dark-hover)] sm:w-auto sm:shrink-0"
                  >
                    {ui.localDepartures.cta}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      <ViajesLandingBrowseMore href={browseAllHref} label={ui.landing.browseAllTrips} />
    </section>
  );
}
