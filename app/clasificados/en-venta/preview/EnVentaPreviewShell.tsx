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
  publishing: boolean;
  publishErr: string | null;
  onPublish: () => void;
  children: ReactNode;
};

export function EnVentaPreviewShell({
  lang,
  plan,
  previewTitle,
  editBackHref,
  previewHrefFree,
  previewHrefPro,
  publishing,
  publishErr,
  onPublish,
  children,
}: EnVentaPreviewShellProps) {
  const t = COPY[lang];

  const publishLabel = plan === "free" ? t.publishFree : t.publishPro;
  const publishDisabled = publishing;
  const editPublishFocusHref = hrefWithListingPublishFocus(editBackHref);

  const switchHref = plan === "free" ? previewHrefPro : previewHrefFree;
  const switchLabel = plan === "free" ? t.switchPro : t.switchFree;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky top — seller-only */}
      <div className="sticky top-0 z-40 border-b border-[#E8DFD0]/90 bg-[#FFFCF7]/95 shadow-[0_8px_24px_-12px_rgba(42,36,22,0.12)] backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-3 py-2 sm:px-5">
          <div className="relative flex items-center gap-2">
            <div className="min-w-0 flex-1" aria-hidden />
            <h1
              className="pointer-events-none absolute left-1/2 z-0 max-w-[min(100%,14rem)] -translate-x-1/2 text-center text-sm font-extrabold leading-tight tracking-tight sm:max-w-[min(100%,20rem)] sm:text-base"
              style={{ textShadow: "0 1px 0 rgba(255,252,247,0.9)" }}
            >
              <span className="bg-gradient-to-r from-[#3D3428] via-[#1E1810] to-[#3D3428] bg-clip-text text-transparent">
                {previewTitle}
              </span>
            </h1>
            <nav
              className="relative z-10 flex min-w-0 flex-1 items-center justify-end gap-1.5 sm:gap-2"
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
          {publishErr ? <p className="mt-2 text-center text-xs font-medium text-red-700 sm:text-left">{publishErr}</p> : null}
        </div>
      </div>

      <div className="flex-1">{children}</div>

      {/* Mobile sticky bottom — repeat key seller actions */}
      <div className="sticky bottom-0 z-40 border-t border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={publishDisabled}
            onClick={() => void onPublish()}
            className="rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 py-2 text-xs font-bold text-[#1E1810] shadow-md disabled:opacity-50"
          >
            {publishing ? (lang === "es" ? "Publicando…" : "Publishing…") : publishLabel}
          </button>
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
