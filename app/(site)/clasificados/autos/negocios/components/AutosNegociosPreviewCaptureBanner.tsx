"use client";

import Link from "next/link";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosPreviewCaptureBannerHelper,
  autosPreviewCaptureBannerTitle,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { getAutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";
import { autosPreviewPremiumCardClass } from "@/app/lib/clasificados/autos/autosNegociosPremiumPreviewTokens";

export function AutosNegociosPreviewCaptureBanner({
  lang,
  editBackHref,
}: {
  lang: AutosClassifiedsLang;
  editBackHref?: string;
}) {
  const backLabel = getAutosNegociosCopy(lang).preview.chrome.backToEdit;

  return (
    <div
      className="sticky top-0 z-30 border-b border-[#D6C7AD]/55 bg-[#FAF7F2]/95 backdrop-blur-sm"
      data-autos-preview-utility-bar="1"
    >
      <section
        id="autos-negocios-preview-capture"
        className="mx-auto max-w-[1320px] px-4 py-2 md:px-6 lg:px-8"
        aria-label={autosPreviewCaptureBannerTitle(lang)}
      >
        <div className={`${autosPreviewPremiumCardClass} px-3 py-2 sm:px-4 sm:py-2.5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6B1F]">
                {lang === "es" ? "Vista previa" : "Preview"}
              </p>
              <p className="truncate text-xs font-semibold text-[#1F241C] sm:text-sm">{autosPreviewCaptureBannerTitle(lang)}</p>
              <p className="hidden text-[11px] leading-snug text-[#5C5346] sm:mt-0.5 sm:block">
                {autosPreviewCaptureBannerHelper(lang)}
              </p>
            </div>
            {editBackHref ? (
              <Link
                href={editBackHref}
                className="inline-flex min-h-[40px] shrink-0 items-center justify-center rounded-full border border-[#D6C7AD] bg-[#FFFDF7] px-3 text-xs font-bold text-[#1F241C] shadow-sm transition hover:border-[#C9A84A] sm:min-h-[44px] sm:px-4 sm:text-sm"
              >
                {backLabel}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
