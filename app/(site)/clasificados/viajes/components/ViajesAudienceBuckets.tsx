import Image from "next/image";
import Link from "next/link";

import { VIAJES_AUDIENCE_BUCKETS } from "../data/viajesLandingSampleData";
import { ViajesSectionHeader } from "./ViajesSectionHeader";

export function ViajesAudienceBuckets() {
  return (
    <section className="mt-12 sm:mt-14 md:mt-16">
      <ViajesSectionHeader title="Viajes para cada plan" className="mb-6 sm:mb-8" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {VIAJES_AUDIENCE_BUCKETS.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="group block overflow-hidden rounded-2xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] shadow-[0_12px_40px_-16px_rgba(42,36,22,0.2)] transition hover:shadow-[0_20px_48px_-14px_rgba(42,36,22,0.22)]"
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
                <p className="text-lg font-bold text-white drop-shadow-md">{card.label}</p>
              </div>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-sm leading-relaxed text-[color:var(--lx-text-2)]">{card.subline}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
