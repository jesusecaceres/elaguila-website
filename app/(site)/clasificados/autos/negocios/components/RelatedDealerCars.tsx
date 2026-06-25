"use client";

import Link from "next/link";
import type { RelatedDealerListing as RelatedRow } from "../types/autoDealerListing";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";
import { AutosDealerInventoryVehicleCard } from "./AutosDealerInventoryVehicleCard";
import {
  autosPreviewInventorySectionHelper,
  autosRelatedInventoryFullDraftDeferral,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import {
  AUTOS_PREVIEW_MAX_RELATED_VISIBLE,
  autosPreviewPremiumCardClass,
  autosPreviewSectionEyebrowClass,
  autosPreviewSectionTitleClass,
  autosRelatedInventoryShelfCardShellClass,
  autosRelatedInventoryShelfScrollClass,
} from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

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
  const { title, details } = t.preview.related;
  const subtitle = previewOnly ? autosPreviewInventorySectionHelper(lang) : t.preview.related.subtitle;
  const visible = listings.slice(0, AUTOS_PREVIEW_MAX_RELATED_VISIBLE);
  const hiddenCount = Math.max(0, listings.length - visible.length);
  const showDraftDeferral = previewOnly && (hiddenCount > 0 || Boolean(hasMore));

  if (visible.length === 0) return null;

  return (
    <section
      className={`${autosPreviewPremiumCardClass} p-4 sm:p-5`}
      data-autos-related-inventory-preview-only={previewOnly ? "1" : undefined}
      data-autos-related-inventory-shelf="1"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className={autosPreviewSectionEyebrowClass}>
            {lang === "es" ? "Inventario del dealer" : "Dealer inventory"}
          </p>
          <h2 className={`mt-1 ${autosPreviewSectionTitleClass}`}>{title}</h2>
          <p className="mt-1 text-sm text-[#5C5346]">{subtitle}</p>
        </div>
        {!previewOnly && hasMore && fullInventoryHref ? (
          <Link
            href={withLangParam(fullInventoryHref, lang)}
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full border-2 border-[#C9A84A] bg-[#FFFDF7] px-4 text-sm font-bold text-[#1F241C] transition hover:border-[#b89742] hover:bg-[#FBF7EF]"
          >
            {lang === "es" ? "Ver inventario completo" : "View full inventory"}
          </Link>
        ) : null}
      </div>
      {showDraftDeferral ? (
        <p
          className="mt-4 inline-flex max-w-full rounded-full border border-[#D6C7AD]/80 bg-[#FBF7EF] px-3 py-1.5 text-[11px] font-semibold text-[#5C5346]"
          data-autos-related-inventory-draft-deferral="1"
        >
          {autosRelatedInventoryFullDraftDeferral(lang)}
        </p>
      ) : null}
      <div className={`mt-5 ${autosRelatedInventoryShelfScrollClass}`}>
        {visible.map((car) => (
          <div key={car.id} className={autosRelatedInventoryShelfCardShellClass}>
            <AutosDealerInventoryVehicleCard
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
              shelfLayout
            />
          </div>
        ))}
      </div>
    </section>
  );
}
