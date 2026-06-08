"use client";

import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosPreviewCaptureBannerHelper,
  autosPreviewCaptureBannerTitle,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";

export function AutosNegociosPreviewCaptureBanner({ lang }: { lang: AutosClassifiedsLang }) {
  return (
    <section
      id="autos-negocios-preview-capture"
      className="mx-auto max-w-[1200px] px-4 pt-4 sm:px-6"
      aria-label={autosPreviewCaptureBannerTitle(lang)}
    >
      <div className="rounded-2xl border border-[#E8DFD0] bg-[#FFFCF7] px-4 py-3 shadow-[0_6px_24px_-12px_rgba(42,36,22,0.12)] sm:px-5 sm:py-4">
        <p className="text-sm font-bold tracking-tight text-[#2A2620]">{autosPreviewCaptureBannerTitle(lang)}</p>
        <p className="mt-1 text-xs leading-relaxed text-[#6E5418]">{autosPreviewCaptureBannerHelper(lang)}</p>
      </div>
    </section>
  );
}
