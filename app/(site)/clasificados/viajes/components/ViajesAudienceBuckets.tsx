import Image from "next/image";
import Link from "next/link";

import type { ViajesUi } from "../data/viajesUiCopy";
import { VIAJES_AUDIENCE_BUCKETS } from "../data/viajesLandingSampleData";
import { setLangOnHref } from "../lib/viajesLangHref";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

export function ViajesAudienceBuckets({ ui }: { ui: ViajesUi }) {
  return (
    <section className="mt-14 sm:mt-16 md:mt-[4.5rem]">
      <ViajesSectionHeader title={ui.audience.title} showRail className="mb-7 sm:mb-9" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VIAJES_AUDIENCE_BUCKETS.map((card) => {
          const copy = ui.audience.byId[card.id];
          return (
            <Link
              key={card.id}
              href={setLangOnHref(card.href, ui.lang)}
              className="group block overflow-hidden rounded-2xl border border-[color:var(--lx-gold-border)] bg-[#fffefb] shadow-[0_12px_40px_-20px_rgba(30,24,16,0.12)] transition hover:-translate-y-[2px] hover:shadow-[0_22px_52px_-24px_rgba(30,50,80,0.16)]"
            >
              <div className="relative aspect-[5/4] w-full overflow-hidden">
                <Image
                  src={card.imageSrc}
                  alt={card.imageAlt}
                  fill
                  sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-[1.03]"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-90"
                  aria-hidden
                />
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
    </section>
  );
}
