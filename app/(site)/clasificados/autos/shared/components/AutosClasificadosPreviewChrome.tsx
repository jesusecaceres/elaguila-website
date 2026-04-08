"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import newLogo from "@/public/logo.png";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { AUTO_DEALER_PREVIEW_PAGE_BG } from "./autosPreviewChromeBg";

export type AutosClasificadosPreviewChromeLabels = {
  breadcrumbClassifieds: string;
  breadcrumbAutos: string;
  /** Last breadcrumb segment — Negocios vs Privado lane label */
  breadcrumbTail: string;
  backToEdit: string;
};

/**
 * Single Autos clasificados preview shell: branding + breadcrumb + optional top-right “Volver a editar”.
 * Ad/publishable canvas must be passed only as `children` (below this header).
 */
export function AutosClasificadosPreviewChrome({
  lang,
  labels,
  editBackHref,
  children,
}: {
  lang: AutosNegociosLang;
  labels: AutosClasificadosPreviewChromeLabels;
  editBackHref?: string;
  children: ReactNode;
}) {
  const classifiedsHref = withLangParam("/clasificados", lang);
  const autosHref = withLangParam("/clasificados/autos", lang);

  return (
    <div className="min-h-screen overflow-x-hidden pb-16 pt-4 text-[color:var(--lx-text)] sm:pt-6 md:pb-20" style={AUTO_DEALER_PREVIEW_PAGE_BG}>
      <header className="mx-auto max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <Link href={classifiedsHref} className="block w-[min(160px,52vw)] max-w-[180px] sm:w-[min(200px,42vw)] sm:max-w-[200px]">
              <Image src={newLogo} alt="LEONIX" className="h-auto w-full object-contain object-left" priority />
            </Link>
            <nav aria-label="Breadcrumb" className="min-w-0 pt-0.5 text-sm text-[color:var(--lx-muted)] sm:pt-1">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link
                    href={classifiedsHref}
                    className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]"
                  >
                    {labels.breadcrumbClassifieds}
                  </Link>
                </li>
                <li aria-hidden className="text-[color:var(--lx-muted)]">
                  /
                </li>
                <li>
                  <Link href={autosHref} className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]">
                    {labels.breadcrumbAutos}
                  </Link>
                </li>
                <li aria-hidden className="text-[color:var(--lx-muted)]">
                  /
                </li>
                <li className="font-semibold text-[color:var(--lx-text)]">{labels.breadcrumbTail}</li>
              </ol>
            </nav>
          </div>
          {editBackHref ? (
            <div className="flex shrink-0 justify-end sm:pt-1">
              <Link
                href={editBackHref}
                className="touch-manipulation inline-flex min-h-[44px] items-center justify-end px-1 py-2 text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)] sm:min-h-0 sm:py-0"
              >
                {labels.backToEdit}
              </Link>
            </div>
          ) : null}
        </div>
      </header>

      {children}
    </div>
  );
}
