"use client";

import Link from "next/link";
import type { AutoDealerListing } from "@/app/clasificados/autos/negocios/types/autoDealerListing";
import { useAutosPrivadoPreviewCopy } from "@/app/clasificados/autos/privado/lib/AutosPrivadoPreviewLocaleContext";
import { FiMapPin } from "react-icons/fi";
import { PreviewPrivadoDescriptionCard } from "./PreviewPrivadoDescriptionCard";
import { PreviewPrivadoFeaturesCard } from "./PreviewPrivadoFeaturesCard";
import { PreviewPrivadoGallery } from "./PreviewPrivadoGallery";
import { PreviewPrivadoHeroSpecsStrip } from "./PreviewPrivadoHeroSpecsStrip";
import { PreviewPrivadoSellerRail } from "./PreviewPrivadoSellerRail";
import { PreviewPrivadoSpecsCard } from "./PreviewPrivadoSpecsCard";
import { PreviewPrivadoTrustStrip } from "./PreviewPrivadoTrustStrip";
import { previewPrivadoCopy } from "./previewPrivadoCopy";
import { buildPreviewPrivadoVm } from "./previewPrivadoFields";
import {
  previewPrivadoCanvasClass,
  previewPrivadoHeroTitleClass,
  previewPrivadoMainGridClass,
  previewPrivadoPageMaxWidthClass,
  previewPrivadoPillClass,
  previewPrivadoPriceClass,
} from "./previewPrivadoTokens";

export function AutosPrivadoVehiclePreviewPage({
  data,
  editBackHref,
}: {
  data: AutoDealerListing;
  editBackHref?: string;
}) {
  const { lang } = useAutosPrivadoPreviewCopy();
  const cardLang = lang === "en" ? "en" : "es";
  const copy = previewPrivadoCopy(cardLang);
  const vm = buildPreviewPrivadoVm(data, cardLang);
  const showGallery = vm.photos.length > 0 || vm.hasVideo;

  return (
    <div className={`${previewPrivadoCanvasClass} min-h-screen pb-16 pt-4 sm:pt-6`}>
      <div
        className={`mx-auto ${previewPrivadoPageMaxWidthClass} px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6 lg:px-8`}
      >
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8A6B1F]">{copy.previewKicker}</p>
          {editBackHref ? (
            <Link
              href={editBackHref}
              className="inline-flex min-h-[44px] items-center text-sm font-semibold text-[#7A1E2C] underline-offset-4 hover:underline"
            >
              {copy.backToEdit}
            </Link>
          ) : null}
        </div>

        <div className={previewPrivadoMainGridClass}>
          <div className="min-w-0 flex flex-col gap-6">
            <header className="min-w-0">
              {vm.title ? <h1 className={previewPrivadoHeroTitleClass}>{vm.title}</h1> : null}
              {vm.conditionPill || vm.bodyPill ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {vm.bodyPill ? <span className={previewPrivadoPillClass}>{vm.bodyPill}</span> : null}
                  {vm.conditionPill ? <span className={previewPrivadoPillClass}>{vm.conditionPill}</span> : null}
                </div>
              ) : null}
              {vm.priceLabel ? (
                <p className={`mt-4 lg:hidden ${previewPrivadoPriceClass}`}>{vm.priceLabel}</p>
              ) : null}
              {vm.location || vm.mileageLabel || vm.vin ? (
                <div className="mt-3 flex flex-col gap-1.5 text-sm text-[#5C5346]">
                  {vm.location ? (
                    <p className="flex min-w-0 items-start gap-1.5 font-semibold">
                      <FiMapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A84A]" aria-hidden />
                      <span className="min-w-0 break-words">{vm.location}</span>
                    </p>
                  ) : null}
                  <p className="flex flex-wrap gap-x-3 gap-y-1">
                    {vm.mileageLabel ? (
                      <span>
                        {copy.mileage}: {vm.mileageLabel}
                      </span>
                    ) : null}
                    {vm.vin ? (
                      <span className="font-mono">
                        {copy.vin}: {vm.vin}
                      </span>
                    ) : null}
                  </p>
                </div>
              ) : null}
            </header>

            {showGallery ? (
              <PreviewPrivadoGallery
                photos={vm.photos}
                videoUrls={vm.videoUrls}
                hasVideo={vm.hasVideo}
                title={vm.title}
                lang={cardLang}
              />
            ) : null}

            <PreviewPrivadoHeroSpecsStrip items={vm.compactSpecs} />
            <PreviewPrivadoSpecsCard rows={vm.specRows} lang={cardLang} />
            <PreviewPrivadoFeaturesCard
              features={vm.features}
              customEquipment={vm.customEquipment}
              lang={cardLang}
            />
            <PreviewPrivadoDescriptionCard description={vm.description} lang={cardLang} />
          </div>

          <aside className="min-w-0 lg:sticky lg:top-8 lg:self-start">
            <PreviewPrivadoSellerRail vm={vm} lang={cardLang} editBackHref={editBackHref} />
          </aside>
        </div>

        <div className="mt-8">
          <PreviewPrivadoTrustStrip lang={cardLang} />
        </div>
      </div>
    </div>
  );
}
