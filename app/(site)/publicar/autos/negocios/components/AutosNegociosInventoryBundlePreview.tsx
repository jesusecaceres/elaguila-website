"use client";

import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { buildVehicleTitle } from "../lib/autoDealerTitle";
import type { AutosAdditionalInventoryVehicleDraft } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import { additionalInventoryVehicleTitle } from "@/app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import {
  autosInventoryBundleAdditionalLabel,
  autosInventoryBundleEmptyState,
  autosInventoryBundleMainLabel,
  autosInventoryBundleSectionTitle,
  autosInventoryBundleStatusDraft,
  autosInventoryBundleStatusReady,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  formatMileageInputDisplay,
  formatUsdIntegerInputDisplay,
} from "@/app/clasificados/autos/shared/utils/autosNumericInputUi";

function formatPrice(n?: number): string | null {
  if (n === undefined || !Number.isFinite(n)) return null;
  const s = formatUsdIntegerInputDisplay(n);
  return s ? `$${s}` : null;
}

function formatMiles(n?: number): string | null {
  if (n === undefined || !Number.isFinite(n)) return null;
  const s = formatMileageInputDisplay(n);
  return s || null;
}

function mainCoverUrl(listing: AutoDealerListing): string | null {
  const primary = listing.mediaImages?.find((m) => m.isPrimary)?.url ?? listing.mediaImages?.[0]?.url;
  if (primary?.trim()) return primary.trim();
  const hero = listing.heroImages?.[0];
  return hero?.trim() || null;
}

function VehicleCard({
  lang,
  label,
  title,
  price,
  mileage,
  imageUrl,
  statusLabel,
}: {
  lang: AutosNegociosLang;
  label: string;
  title: string;
  price: string | null;
  mileage: string | null;
  imageUrl: string | null;
  statusLabel: string;
}) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] shadow-sm">
      <div className="aspect-[16/10] w-full bg-[#F0E8DC]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-xs font-medium text-[#8A7A68]">
            {lang === "es" ? "Sin imagen" : "No image"}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6E5418]">{label}</p>
        <h4 className="mt-1 text-sm font-bold text-[#1E1810]">{title}</h4>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#5C5346]">
          {price ? <span>{price}</span> : null}
          {mileage ? (
            <span>
              {mileage} {lang === "es" ? "mi" : "mi"}
            </span>
          ) : null}
        </div>
        <p className="mt-auto pt-3 text-[11px] font-semibold text-[#6E5418]">{statusLabel}</p>
      </div>
    </article>
  );
}

export function AutosNegociosInventoryBundlePreview({
  lang,
  listing,
  additionalVehicles,
}: {
  lang: AutosNegociosLang;
  listing: AutoDealerListing;
  additionalVehicles: AutosAdditionalInventoryVehicleDraft[];
}) {
  const mainTitle =
    buildVehicleTitle(listing.year, listing.make, listing.model, listing.trim) ||
    listing.vehicleTitle ||
    (lang === "es" ? "Vehículo principal" : "Main vehicle");
  const mainReady = Boolean(listing.year && listing.make && listing.model);
  const mainStatus = mainReady ? autosInventoryBundleStatusReady(lang) : autosInventoryBundleStatusDraft(lang);

  return (
    <section className="mb-6 rounded-2xl border border-[color:var(--lx-gold-border)]/40 bg-[color:var(--lx-section)]/60 p-5">
      <h3 className="text-base font-extrabold text-[color:var(--lx-text)]">{autosInventoryBundleSectionTitle(lang)}</h3>
      {additionalVehicles.length === 0 ? (
        <p className="mt-2 text-sm text-[color:var(--lx-text-2)]">{autosInventoryBundleEmptyState(lang)}</p>
      ) : null}
      <div
        className={`mt-4 grid gap-4 ${
          additionalVehicles.length >= 3
            ? "sm:grid-cols-2 lg:grid-cols-3"
            : additionalVehicles.length === 1
              ? "max-w-md"
              : "sm:grid-cols-2"
        }`}
      >
        <VehicleCard
          lang={lang}
          label={autosInventoryBundleMainLabel(lang)}
          title={mainTitle}
          price={formatPrice(listing.price)}
          mileage={formatMiles(listing.mileage)}
          imageUrl={mainCoverUrl(listing)}
          statusLabel={mainStatus}
        />
        {additionalVehicles.map((v) => (
          <VehicleCard
            key={v.id}
            lang={lang}
            label={autosInventoryBundleAdditionalLabel(lang)}
            title={additionalInventoryVehicleTitle(v)}
            price={formatPrice(v.price)}
            mileage={formatMiles(v.mileage)}
            imageUrl={v.imageUrl ?? null}
            statusLabel={autosInventoryBundleStatusDraft(lang)}
          />
        ))}
      </div>
    </section>
  );
}
