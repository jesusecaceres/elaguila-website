"use client";

import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import newLogo from "@/public/logo.png";
import { useAutosNegociosPreviewCopy } from "../lib/AutosNegociosPreviewLocaleContext";
import { withLangParam } from "../lib/autosNegociosLang";

export const AUTO_DEALER_PREVIEW_PAGE_BG = {
  backgroundColor: "var(--lx-page)",
  backgroundImage: `
    radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.2), transparent 55%),
    radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.45), transparent 52%),
    radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.1), transparent 50%)
  `,
} as const;

/** Shared Leonix shell: branding, breadcrumbs, optional back link — same for listing and empty preview. */
export function AutoDealerPreviewChrome({
  editBackHref,
  children,
}: {
  editBackHref?: string;
  children: ReactNode;
}) {
  const { lang, t } = useAutosNegociosPreviewCopy();
  const c = t.preview.chrome;
  const classifiedsHref = withLangParam("/clasificados", lang);
  const autosHref = withLangParam("/clasificados/autos", lang);

  return (
    <div className="min-h-screen overflow-x-hidden pb-16 pt-4 text-[color:var(--lx-text)] sm:pt-6 md:pb-20" style={AUTO_DEALER_PREVIEW_PAGE_BG}>
      <header className="mx-auto max-w-[1280px] px-4 md:px-5 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 shrink-0 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <Link href={classifiedsHref} className="block w-[min(160px,52vw)] max-w-[180px] sm:w-[min(200px,42vw)] sm:max-w-[200px]">
              <Image src={newLogo} alt="LEONIX" className="h-auto w-full object-contain object-left" priority />
            </Link>
            <nav aria-label="Breadcrumb" className="hidden min-w-0 pt-1 text-sm text-[color:var(--lx-muted)] sm:block">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link href={classifiedsHref} className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]">
                    {c.breadcrumbClassifieds}
                  </Link>
                </li>
                <li aria-hidden className="text-[color:var(--lx-muted)]">
                  /
                </li>
                <li>
                  <Link href={autosHref} className="font-medium text-[color:var(--lx-text-2)] hover:text-[color:var(--lx-gold)]">
                    {c.breadcrumbAutos}
                  </Link>
                </li>
                <li aria-hidden className="text-[color:var(--lx-muted)]">
                  /
                </li>
                <li className="font-semibold text-[color:var(--lx-text)]">{c.breadcrumbDealers}</li>
              </ol>
            </nav>
          </div>
        </div>
        <nav aria-label="Breadcrumb" className="mt-3 text-sm text-[color:var(--lx-muted)] sm:hidden">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={classifiedsHref} className="font-medium text-[color:var(--lx-text-2)]">
                {c.breadcrumbClassifieds}
              </Link>
            </li>
            <span className="text-[color:var(--lx-muted)]">/</span>
            <li>
              <Link href={autosHref} className="font-medium text-[color:var(--lx-text-2)]">
                {c.breadcrumbAutos}
              </Link>
            </li>
            <span className="text-[color:var(--lx-muted)]">/</span>
            <li className="font-semibold text-[color:var(--lx-text)]">{c.breadcrumbDealers}</li>
          </ol>
        </nav>
        {editBackHref ? (
          <div className="mt-4 flex justify-end">
            <Link
              href={editBackHref}
              className="text-sm font-semibold text-[color:var(--lx-text-2)] underline decoration-[color:var(--lx-gold-border)] underline-offset-4 transition hover:text-[color:var(--lx-gold)]"
            >
              {c.backToEdit}
            </Link>
          </div>
        ) : null}
      </header>

      {children}
    </div>
  );
}
