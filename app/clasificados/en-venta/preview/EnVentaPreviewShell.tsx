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
    upgradePro: "Mejorar a Pro — $9.99",
  },
  en: {
    back: "Back to edit",
    switchPro: "See Pro version",
    switchFree: "See Free version",
    publishFree: "Publish free",
    publishPro: "Publish Pro listing",
    upgradePro: "Upgrade to Pro — $9.99",
  },
} as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type EnVentaPreviewShellProps = {
  lang: "es" | "en";
  plan: "free" | "pro";
  shellPlanLabel: string;
  shellStatusLine: string;
  /** Full URL for back-to-edit (full page load via native anchor). */
  editBackHref: string;
  previewHrefFree: string;
  previewHrefPro: string;
  proUpgradeHref: string;
  publishing: boolean;
  publishErr: string | null;
  onPublish: () => void;
  children: ReactNode;
};

export function EnVentaPreviewShell({
  lang,
  plan,
  shellPlanLabel,
  shellStatusLine,
  editBackHref,
  previewHrefFree,
  previewHrefPro,
  proUpgradeHref,
  publishing,
  publishErr,
  onPublish,
  children,
}: EnVentaPreviewShellProps) {
  const t = COPY[lang];

  const publishLabel = plan === "free" ? t.publishFree : t.publishPro;

  const publishDisabled = publishing;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Sticky top — seller-only */}
      <div className="sticky top-0 z-40 border-b border-[#E8DFD0]/90 bg-[#FFFCF7]/95 shadow-[0_8px_24px_-12px_rgba(42,36,22,0.12)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <span className="inline-flex max-w-full truncate rounded-full border border-[#C9B46A]/45 bg-gradient-to-r from-[#FBF7EF] to-[#F3EBDD] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#5C4E2E]">
                {shellPlanLabel}
              </span>
              <span className="text-xs font-medium text-[#7A7164]/95">{shellStatusLine}</span>
            </div>
            <a
              href={editBackHref}
              className="shrink-0 text-sm font-semibold text-[#3D3428] underline-offset-2 hover:underline"
            >
              ← {t.back}
            </a>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={publishDisabled}
              onClick={() => void onPublish()}
              className={cx(
                "inline-flex min-h-[42px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold text-[#1E1810] shadow-md transition disabled:cursor-not-allowed disabled:opacity-55",
                "bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A]",
                "shadow-[0_8px_28px_-4px_rgba(201,164,74,0.45),inset_0_1px_0_rgba(255,255,255,0.35)]",
                "hover:brightness-[1.03] active:scale-[0.99]"
              )}
            >
              {publishing
                ? lang === "es"
                  ? "Publicando…"
                  : "Publishing…"
                : publishLabel}
            </button>
            {plan === "free" ? (
              <Link
                href={previewHrefPro}
                className="inline-flex rounded-2xl border border-[#C9B46A]/55 bg-white/80 px-3 py-2 text-xs font-bold text-[#3D3428] shadow-sm transition hover:bg-[#FFFCF7]"
              >
                {t.switchPro}
              </Link>
            ) : (
              <Link
                href={previewHrefFree}
                className="inline-flex rounded-2xl border border-[#E8DFD0] bg-white/80 px-3 py-2 text-xs font-bold text-[#3D3428] shadow-sm transition hover:bg-[#FFFCF7]"
              >
                {t.switchFree}
              </Link>
            )}
          </div>

          {publishErr ? <p className="text-sm font-medium text-red-700">{publishErr}</p> : null}
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
