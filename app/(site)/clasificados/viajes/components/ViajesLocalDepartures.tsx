import Image from "next/image";
import Link from "next/link";

import { VIAJES_LOCAL_DEPARTURES } from "../data/viajesLandingSampleData";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

export function ViajesLocalDepartures() {
  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader title="Saliendo desde tu área" className="mb-6 sm:mb-8" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VIAJES_LOCAL_DEPARTURES.map((card) => (
          <article
            key={card.id}
            className="flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_10px_36px_-14px_rgba(42,36,22,0.18)]"
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
              <h3 className="text-base font-bold text-[color:var(--lx-text)] sm:text-lg">{card.title}</h3>
              <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{card.description}</p>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:var(--lx-nav-border)] pt-4">
                <span className="text-xs text-[color:var(--lx-muted)]" aria-hidden>
                  📍
                </span>
                <Link
                  href={card.href}
                  className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-xl bg-[color:var(--lx-cta-dark)] px-4 py-2 text-xs font-bold text-[#FFFCF7] transition hover:bg-[color:var(--lx-cta-dark-hover)]"
                >
                  Ver ofertas
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
