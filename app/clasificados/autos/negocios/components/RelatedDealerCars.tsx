import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import type { RelatedDealerListing as RelatedRow } from "../types/autoDealerListing";
import { formatMiles, formatUsd } from "./autoDealerFormatters";

const SECTION =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)]";

export function RelatedDealerCars({ listings }: { listings: RelatedRow[] }) {
  if (listings.length === 0) return null;

  return (
    <section className={SECTION}>
      <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)]">Más autos de este negocio</h2>
      <p className="mt-1 text-sm text-[color:var(--lx-muted)]">Solo inventario del mismo concesionario</p>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {listings.map((car) => (
          <article
            key={car.id}
            className="flex flex-col overflow-hidden rounded-[14px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] shadow-sm"
          >
            <div className="relative aspect-[16/10]">
              <Image
                src={car.imageUrl}
                alt={`${car.year} ${car.make} ${car.model}`}
                fill
                className="object-cover"
                sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              />
            </div>
            <div className="flex flex-1 flex-col p-3">
              <h3 className="text-sm font-bold leading-snug text-[color:var(--lx-text)]">
                {new Intl.NumberFormat("en-US").format(car.year)} {car.make} {car.model}
              </h3>
              <p className="mt-2 text-lg font-bold text-[color:var(--lx-text)]">{formatUsd(car.price)}</p>
              <p className="mt-1 text-xs font-medium text-[color:var(--lx-muted)]">{formatMiles(car.mileage)}</p>
              <Link
                href={car.href}
                className="mt-4 inline-flex h-10 items-center justify-center gap-1 rounded-[12px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
              >
                Ver detalles
                <FiChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
