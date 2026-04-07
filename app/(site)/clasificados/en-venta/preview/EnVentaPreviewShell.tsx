"use client";

import Link from "next/link";
import type { ReactNode } from "react";

const COPY = {
  es: {
    back: "Volver a editar",
    switchPro: "Ver versión Pro",
    switchFree: "Ver versión gratis",
    publishFree: "Publicar gratis",
    publishPro: "Publicar anuncio Pro",
  },
  en: {
    back: "Back to edit",
    switchPro: "See Pro version",
    switchFree: "See Free version",
    publishFree: "Publish free",
    publishPro: "Publish Pro listing",
  },
} as const;

const LISTING_PUBLISH_HASH = "listing-publish";

function hrefWithListingPublishFocus(editBackHref: string) {
  const base = editBackHref.split("#")[0] ?? editBackHref;
  return `${base}#${LISTING_PUBLISH_HASH}`;
}

const pillOutline =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-[#E8DFD0] bg-white/90 px-3.5 py-1.5 text-xs font-bold text-[#3D3428] shadow-sm transition hover:border-[#D4C4A8] hover:bg-[#FFFCF7]";

const pillPublishNav =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-[#C9B46A]/55 bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-3.5 py-1.5 text-xs font-bold text-[#1E1810] shadow-[0_4px_16px_-4px_rgba(201,164,74,0.4)] transition hover:brightness-[1.03] active:scale-[0.99]";

export type EnVentaPreviewShellProps = {
  lang: "es" | "en";
  plan: "free" | "pro";
  /** Centered header title (e.g. Vista previa Pro / Free preview). */
  previewTitle: string;
  /** Full URL for back-to-edit (full page load via native anchor). */
  editBackHref: string;
  previewHrefFree: string;
  previewHrefPro: string;
  children: ReactNode;
};

export function EnVentaPreviewShell({
  lang,
  plan,
  previewTitle,
  editBackHref,
  previewHrefFree,
  previewHrefPro,
  children,
}: EnVentaPreviewShellProps) {
  const t = COPY[lang];

  const publishLabel = plan === "free" ? t.publishFree : t.publishPro;
  const editPublishFocusHref = hrefWithListingPublishFocus(editBackHref);

  const switchHref = plan === "free" ? previewHrefPro : previewHrefFree;
  const switchLabel = plan === "free" ? t.switchPro : t.switchFree;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky top — seller-only */}
      <div className="sticky top-0 z-40 border-b border-[#E8DFD0]/90 bg-[#FFFCF7]/95 shadow-[0_8px_24px_-12px_rgba(42,36,22,0.12)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-2 py-1.5 sm:px-4">
          <div className="relative flex items-center gap-1.5">
            <div className="min-w-0 flex-1" aria-hidden />
            <h1 className="pointer-events-none absolute left-1/2 z-0 max-w-[min(100%,16rem)] -translate-x-1/2 text-center text-sm font-extrabold leading-tight tracking-tight text-[#1E1810] sm:max-w-[min(100%,24rem)] sm:text-base">
              <span className="relative inline-block border-b-2 border-[#C9A84A]/90 pb-0.5 text-[#2C2416] drop-shadow-[0_1px_0_rgba(255,252,247,0.95)]">
                {previewTitle}
              </span>
            </h1>
            <nav
              className="relative z-10 flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 sm:gap-1.5"
              aria-label={lang === "es" ? "Acciones de vista previa" : "Preview actions"}
            >
              <a href={editBackHref} className={pillOutline}>
                {t.back}
              </a>
              <Link href={switchHref} className={pillOutline}>
                {switchLabel}
              </Link>
              <a href={editPublishFocusHref} className={pillPublishNav}>
                {publishLabel}
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="flex-1">{children}</div>

      {/* Mobile sticky bottom — repeat key seller actions */}
      <div className="sticky bottom-0 z-40 border-t border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-2.5 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
          <a
            href={editPublishFocusHref}
            className="rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 py-2 text-xs font-bold text-[#1E1810] shadow-md"
          >
            {publishLabel}
          </a>
          <Link
            href={plan === "free" ? previewHrefPro : previewHrefFree}
            className="rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#3D3428]"
          >
            {plan === "free" ? t.switchPro : t.switchFree}
          </Link>
        </div>
      </div>
    </div>
  );
}
