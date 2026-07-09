"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import newLogo from "@/public/branding/leonix-media-wordmark-slogan.png";
import { withLangParam } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";
import { AUTO_DEALER_PREVIEW_PAGE_BG } from "@/app/clasificados/autos/shared/components/autosPreviewChromeBg";

export type PrivadoPreviewChromeLabels = {
  breadcrumbClassifieds: string;
  breadcrumbAutos: string;
  breadcrumbTail: string;
  backToEdit: string;
};

/**
 * Private seller preview chrome with premium header and private-seller-specific messaging.
 */
export function PrivadoPreviewChrome({
  lang,
  labels,
  editBackHref,
  children,
}: {
  lang: AutosNegociosLang;
  labels: PrivadoPreviewChromeLabels;
  editBackHref?: string;
  children: ReactNode;
}) {
  const classifiedsHref = withLangParam("/clasificados", lang);
  const autosHref = withLangParam("/clasificados/autos", lang);
  const isEs = lang === "es";

  return (
    <div className="min-h-screen overflow-x-hidden pb-16 pt-4 text-[color:var(--lx-text)] sm:pt-6 md:pb-20" style={AUTO_DEALER_PREVIEW_PAGE_BG}>
      {/* Premium header */}
      <header className="mx-auto max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className="flex flex-col gap-4 rounded-[20px] border border-[color:var(--lx-gold-border)] bg-[#FFFDF7] p-5 shadow-[0_8px_32px_-8px_rgba(42,36,22,0.12)] sm:flex-row sm:items-start sm:justify-between sm:p-6">
          {/* Left: Logo + Title + Subtitle */}
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <Link href={classifiedsHref} className="block w-[min(140px,40vw)] max-w-[160px] shrink-0">
              <Image src={newLogo} alt="LEONIX MEDIA" className="h-auto w-full object-contain" priority />
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-extrabold tracking-tight text-[#7A1E2C] sm:text-2xl">
                {isEs ? "Autos en Leonix" : "Autos on Leonix"}
              </h1>
              <p className="mt-1 text-sm font-medium text-[color:var(--lx-text-2)] sm:text-base">
                {isEs
                  ? "Vendedores particulares y compradores en una experiencia clara."
                  : "Private sellers and buyers in one clear experience."}
              </p>
            </div>
          </div>

          {/* Right: Breadcrumb + Back to Edit */}
          <div className="flex min-w-0 flex-col gap-3 sm:items-end sm:gap-2">
            <nav aria-label="Breadcrumb" className="text-sm text-[color:var(--lx-muted)]">
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
            {editBackHref ? (
              <Link
                href={editBackHref}
                className="touch-manipulation inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[color:var(--lx-gold-border)] bg-[#FFFCF7] px-4 text-sm font-semibold text-[color:var(--lx-text)] transition hover:border-[color:var(--lx-gold)] hover:bg-[color:var(--lx-nav-hover)] sm:min-h-0"
              >
                {labels.backToEdit}
              </Link>
            ) : null}
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
