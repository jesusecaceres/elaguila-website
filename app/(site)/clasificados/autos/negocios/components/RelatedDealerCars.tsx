"use client";

import Link from "next/link";
import type { RelatedDealerListing as RelatedRow } from "../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";
import { AutosDealerInventoryVehicleCard } from "./AutosDealerInventoryVehicleCard";

const SECTION =
  "rounded-[20px] border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-4 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.08)] sm:p-5";

export function RelatedDealerCars({
  listings,
  fullInventoryHref,
  hasMore,
  previewOnly = false,
}: {
  listings: RelatedRow[];
  fullInventoryHref?: string | null;
  hasMore?: boolean;
  /** Draft preview: cards are visible but not navigable. */
  previewOnly?: boolean;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const { title, subtitle, details } = t.preview.related;

  if (listings.length === 0) return null;

  return (
    <section className={SECTION}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-[color:var(--lx-text)] sm:text-xl">{title}</h2>
          <p className="mt-1 text-sm text-[color:var(--lx-muted)]">{subtitle}</p>
        </div>
        {hasMore && fullInventoryHref ? (
          <Link
            href={withLangParam(fullInventoryHref, lang)}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[12px] border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 text-sm font-bold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
          >
            {lang === "es" ? "Ver inventario completo" : "View full inventory"}
          </Link>
        ) : null}
      </div>
      <div className="mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:gap-5">
        {listings.map((car) => (
          <AutosDealerInventoryVehicleCard
            key={car.id}
            car={{
              id: car.id,
              imageUrl: car.imageUrl,
              year: car.year,
              make: car.make,
              model: car.model,
              trim: car.trim,
              price: car.price,
              mileage: car.mileage,
              city: car.city,
              state: car.state,
              href: car.href,
            }}
            lang={lang}
            ctaLabel={details}
            previewOnly={previewOnly}
          />
        ))}
      </div>
    </section>
  );
}
