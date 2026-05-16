"use client";

import Image from "next/image";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import type { RelatedDealerListing as RelatedRow } from "../types/autoDealerListing";
import { formatCityStateLabel, formatMiles, formatUsd } from "./autoDealerFormatters";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";

const SECTION =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)]";

export function RelatedDealerCars({
  listings,
  fullInventoryHref,
  hasMore,
}: {
  listings: RelatedRow[];
  fullInventoryHref?: string | null;
  hasMore?: boolean;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const { title, subtitle, details } = t.preview.related;

  if (listings.length === 0) return null;

  return (
    <section className={SECTION}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)]">{title}</h2>
          <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{subtitle}</p>
        </div>
        {hasMore && fullInventoryHref ? (
          <Link
            href={withLangParam(fullInventoryHref, lang)}
            className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-[12px] border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-3 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {lang === "es" ? "Ver inventario completo" : "View full inventory"}
          </Link>
        ) : null}
      </div>
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
                {car.trim ? ` ${car.trim}` : ""}
              </h3>
              <p className="mt-2 text-lg font-bold text-[color:var(--lx-text)]">{formatUsd(car.price)}</p>
              <p className="mt-1 text-xs font-medium text-[color:var(--lx-muted)]">{formatMiles(car.mileage)}</p>
              {formatCityStateLabel(car.city, car.state) ? (
                <p className="mt-1 text-xs font-medium text-[color:var(--lx-muted)]">{formatCityStateLabel(car.city, car.state)}</p>
              ) : null}
              <Link
                href={car.href.startsWith("/") ? withLangParam(car.href, lang) : car.href}
                className="mt-4 inline-flex h-10 items-center justify-center gap-1 rounded-[12px] border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
              >
                {details}
                <FiChevronRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
