import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_LOCAL_DEPARTURES } from "../data/viajesLandingSampleData";
import { setLangOnHref } from "../lib/viajesLangHref";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

export function ViajesLocalDepartures({ ui }: { ui: ViajesUi }) {
  return (
    <section className="mt-14 sm:mt-16 md:mt-[4.5rem]">
      <ViajesSectionHeader title={ui.localDepartures.title} showRail className="mb-7 sm:mb-9" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VIAJES_LOCAL_DEPARTURES.map((card) => {
          const copy = ui.localDepartures.byId[card.id];
          return (
            <article
              key={card.id}
              className="flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffefb] shadow-[0_12px_40px_-20px_rgba(30,24,16,0.12)] transition hover:-translate-y-[2px] hover:shadow-[0_20px_48px_-22px_rgba(30,50,70,0.14)]"
            >
              <div className="relative aspect-[16/10] w-full">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">{copy?.title ?? card.title}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{copy?.description ?? card.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:var(--lx-nav-border)] pt-4">
                  <span className="text-xs text-[color:var(--lx-muted)]" aria-hidden>
                    📍
                  </span>
                  <Link
                    href={setLangOnHref(card.href, ui.lang)}
                    className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] transition hover:bg-[color:var(--lx-cta-dark-hover)]"
                  >
                    {ui.localDepartures.cta}
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
