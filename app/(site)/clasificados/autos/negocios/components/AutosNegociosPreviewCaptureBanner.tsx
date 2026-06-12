"use client";

import Link from "next/link";
import type { AutosClassifiedsLang } from "@/app/lib/clasificados/autos/autosClassifiedsTypes";
import {
  autosPreviewCaptureBannerHelper,
  autosPreviewCaptureBannerTitle,
} from "@/app/lib/clasificados/autos/autosNegociosInventoryBundleCopy";
import { getAutosNegociosCopy } from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy";

export function AutosNegociosPreviewCaptureBanner({
  lang,
  editBackHref,
}: {
  lang: AutosClassifiedsLang;
  editBackHref?: string;
}) {
  const backLabel = getAutosNegociosCopy(lang).preview.chrome.backToEdit;

  return (
    <section
      id="autos-negocios-preview-capture"
      className="mx-auto max-w-[1280px] px-4 pt-4 md:px-5 lg:px-6"
      aria-label={autosPreviewCaptureBannerTitle(lang)}
    >
      <div className="rounded-2xl border border-[color:var(--lx-gold-border)]/70 bg-[#FFFCF7] px-4 py-3 shadow-[0_8px_28px_-12px_rgba(42,36,22,0.12)] sm:px-5 sm:py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[color:var(--lx-gold)]">
              {lang === "es" ? "Vista previa del anuncio" : "Listing preview"}
            </p>
            <p className="mt-1 text-sm font-bold tracking-tight text-[color:var(--lx-text)]">
              {autosPreviewCaptureBannerTitle(lang)}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--lx-text-2)]">
              {autosPreviewCaptureBannerHelper(lang)}
            </p>
          </div>
          {editBackHref ? (
            <Link
              href={editBackHref}
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-4 text-sm font-bold text-[color:var(--lx-text)] shadow-sm transition hover:border-[color:var(--lx-gold-border)] hover:text-[color:var(--lx-gold)]"
            >
              {backLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
