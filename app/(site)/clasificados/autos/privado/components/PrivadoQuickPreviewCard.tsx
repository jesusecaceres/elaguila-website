"use client";

import Image from "next/image";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { formatCityStateZipLine, formatMiles, formatUsd } from "@/app/clasificados/autos/negocios/components/autoDealerFormatters";
import { buildVehicleTitle, normalizeVehicleSegment } from "@/app/(site)/publicar/autos/negocios/lib/autoDealerTitle";
import { withNormalizedVehicleIdentityForDisplay } from "@/app/lib/clasificados/autos/autosListingDisplayIdentity";
import { useAutosPrivadoPreviewCopy } from "../lib/AutosPrivadoPreviewLocaleContext";

const CARD = "rounded-[20px] border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)]";

export function PrivadoQuickPreviewCard({ data }: { data: AutoDealerListing }) {
  const { lang } = useAutosPrivadoPreviewCopy();
  const isEs = lang === "es";

  const display = withNormalizedVehicleIdentityForDisplay(data);
  const canonicalTitle = buildVehicleTitle(display.year, display.make, display.model, display.trim).trim();
  const loc = formatCityStateZipLine(display.city, display.state, display.zip);
  const priceOk = display.price !== undefined && Number.isFinite(display.price);
  const showMileage = display.mileage !== undefined && Number.isFinite(display.mileage);

  // Build YMMT line for compact display
  const ymmtParts: string[] = [];
  if (display.year != null && Number.isFinite(display.year)) ymmtParts.push(String(Math.round(display.year)));
  const mk = normalizeVehicleSegment(display.make);
  const md = normalizeVehicleSegment(display.model);
  const tr = normalizeVehicleSegment(display.trim);
  if (mk) ymmtParts.push(mk);
  if (md) ymmtParts.push(md);
  if (tr) ymmtParts.push(tr);
  const ymmtLine = ymmtParts.join(" ");

  // Get hero image if available
  const heroImage = display.mediaImages?.find((img) => img.isPrimary)?.url || display.mediaImages?.[0]?.url || display.heroImages?.[0];
  const hasImage = Boolean(heroImage);

  return (
    <section className={CARD}>
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--lx-muted)]">
        {isEs ? "Resultado / Vista rápida" : "Result / Quick view"}
      </p>
      <div className="mt-4 flex gap-4">
        {/* Thumbnail */}
        {hasImage ? (
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFDF7]">
            <Image
              src={heroImage!}
              alt={canonicalTitle || "Vehicle"}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFDF7]">
            <span className="text-3xl">🚗</span>
          </div>
        )}

        {/* Info */}
        <div className="min-w-0 flex-1">
          {canonicalTitle ? (
            <p className="truncate text-sm font-bold leading-tight text-[color:var(--lx-text)]">
              {canonicalTitle}
            </p>
          ) : null}
          {ymmtLine ? (
            <p className="mt-1 truncate text-xs text-[color:var(--lx-text-2)]">
              {ymmtLine}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            {priceOk ? (
              <span className="font-bold text-[#7A1E2C]">{formatUsd(display.price)}</span>
            ) : null}
            {loc ? (
              <span className="text-[color:var(--lx-text-2)]">{loc}</span>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--lx-text-2)]">
            {showMileage ? (
              <span>{formatMiles(display.mileage)}</span>
            ) : null}
            {display.transmission ? (
              <span>{display.transmission}</span>
            ) : null}
            {display.fuelType ? (
              <span>{display.fuelType}</span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
