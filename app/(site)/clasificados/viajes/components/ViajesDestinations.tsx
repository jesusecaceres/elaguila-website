import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_DESTINATION_COLLECTIONS } from "../data/viajesLandingSampleData";
import { setLangOnHref } from "../lib/viajesLangHref";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

const VIAJES_ACCENT = "#D97706";

export function ViajesDestinations({ ui }: { ui: ViajesUi }) {
  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader title={ui.destinations.title} className="mb-6 sm:mb-8" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VIAJES_DESTINATION_COLLECTIONS.map((d) => {
          const line = ui.destinations.byId[d.id]?.supportingLine ?? d.supportingLine;
          return (
            <article
              key={d.id}
              className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(42,36,22,0.2)]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <Image
                  src={d.imageSrc}
                  alt={d.imageAlt}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <h3 className="text-lg font-bold text-[color:var(--lx-text)]">{d.name}</h3>
                <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-[color:var(--lx-text-2)]">{line}</p>
                <Link
                  href={setLangOnHref(d.href, ui.lang)}
                  className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm transition hover:brightness-105"
                  style={{ backgroundColor: VIAJES_ACCENT }}
                >
                  {ui.destinations.cta}
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
