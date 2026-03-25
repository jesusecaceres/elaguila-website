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
    freeTeaserTitle: "¿Qué incluye Leonix Pro?",
    insightsTitle: "Rendimiento (vista previa)",
    insightsSub: "Tras publicar, verás métricas reales en tu panel.",
    metricViews: "Vistas",
    metricSaves: "Guardados",
    metricShares: "Compartidos",
    metricContacts: "Contactos",
    dash: "—",
    tipTitle: "Guía rápida",
    tipBody:
      "Cuando tengas datos, compara vistas con mensajes: muchas vistas y pocos contactos puede indicar que conviene revisar precio o fotos; muchos guardados suelen indicar interés fuerte.",
  },
  en: {
    back: "Back to edit",
    switchPro: "See Pro version",
    switchFree: "See Free version",
    publishFree: "Publish free",
    publishPro: "Publish Pro listing",
    upgradePro: "Upgrade to Pro — $9.99",
    freeTeaserTitle: "What’s in Leonix Pro?",
    insightsTitle: "Performance (preview)",
    insightsSub: "After you publish, real metrics appear in your dashboard.",
    metricViews: "Views",
    metricSaves: "Saves",
    metricShares: "Shares",
    metricContacts: "Contacts",
    dash: "—",
    tipTitle: "Quick guidance",
    tipBody:
      "Once you have data, compare views to messages: high views but few contacts may mean adjusting price or photos; many saves usually signal strong interest.",
  },
} as const;

/** Approved Pro pitch (aligned with MediaUploader upgrade modal). */
const PRO_BULLETS = {
  es: [
    "Hasta 12 fotos",
    "2 videos sobresalientes",
    "2 impulsos de visibilidad",
    "Duración del anuncio: 30 días",
    "Insignia Pro y analíticas del anuncio",
  ],
  en: [
    "Up to 12 photos",
    "2 featured videos",
    "2 visibility boosts",
    "Listing duration: 30 days",
    "Pro badge and listing analytics",
  ],
} as const;

function cx(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type EnVentaPreviewShellProps = {
  lang: "es" | "en";
  plan: "free" | "pro";
  shellPlanLabel: string;
  shellStatusLine: string;
  editHubHref: string;
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
  editHubHref,
  previewHrefFree,
  previewHrefPro,
  proUpgradeHref,
  publishing,
  publishErr,
  onPublish,
  children,
}: EnVentaPreviewShellProps) {
  const t = COPY[lang];
  const bullets = PRO_BULLETS[lang];

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
            <Link
              href={editHubHref}
              className="shrink-0 text-sm font-semibold text-[#3D3428] underline-offset-2 hover:underline"
            >
              ← {t.back}
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
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

            {plan === "pro" ? (
              <a
                href={proUpgradeHref}
                className="inline-flex rounded-2xl bg-[#2A2620] px-3 py-2 text-xs font-bold text-[#FAF7F2] shadow-md transition hover:bg-[#1a1814]"
              >
                {t.upgradePro}
              </a>
            ) : null}

            <button
              type="button"
              disabled={publishDisabled}
              onClick={() => void onPublish()}
              className={cx(
                "ml-auto inline-flex min-h-[44px] items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-bold text-[#1E1810] shadow-md transition disabled:cursor-not-allowed disabled:opacity-55",
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
          </div>

          {plan === "free" ? (
            <div className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FAF7F2]/80 p-3 sm:p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.freeTeaserTitle}</p>
              <ul className="mt-2 grid gap-1.5 text-sm text-[#2C2416]/90 sm:grid-cols-2">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-[#C9A84A]" aria-hidden>
                      ✦
                    </span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {plan === "pro" ? (
            <div className="grid gap-3 rounded-2xl border border-[#C9B46A]/35 bg-[#1E1810]/5 p-3 sm:grid-cols-2 sm:p-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">{t.insightsTitle}</p>
                <p className="mt-1 text-xs text-[#5C5346]/95">{t.insightsSub}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{t.metricViews}</dt>
                    <dd className="font-semibold text-[#1E1810]">{t.dash}</dd>
                  </div>
                  <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{t.metricSaves}</dt>
                    <dd className="font-semibold text-[#1E1810]">{t.dash}</dd>
                  </div>
                  <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{t.metricShares}</dt>
                    <dd className="font-semibold text-[#1E1810]">{t.dash}</dd>
                  </div>
                  <div className="rounded-xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/90 px-3 py-2">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{t.metricContacts}</dt>
                    <dd className="font-semibold text-[#1E1810]">{t.dash}</dd>
                  </div>
                </dl>
              </div>
              <div className="rounded-xl border border-[#E8DFD0]/70 bg-[#FFFCF7]/80 p-3">
                <p className="text-xs font-bold text-[#1E1810]">{t.tipTitle}</p>
                <p className="mt-2 text-xs leading-relaxed text-[#5C5346]/95">{t.tipBody}</p>
              </div>
            </div>
          ) : null}

          {publishErr ? <p className="text-sm font-medium text-red-700">{publishErr}</p> : null}
        </div>
      </div>

      <div className="flex-1">{children}</div>

      {/* Mobile sticky bottom — repeat key seller actions */}
      <div className="sticky bottom-0 z-40 border-t border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2">
          <Link
            href={plan === "free" ? previewHrefPro : previewHrefFree}
            className="rounded-2xl border border-[#E8DFD0] bg-white px-3 py-2 text-xs font-bold text-[#3D3428]"
          >
            {plan === "free" ? t.switchPro : t.switchFree}
          </Link>
          {plan === "pro" ? (
            <a href={proUpgradeHref} className="rounded-2xl bg-[#2A2620] px-3 py-2 text-xs font-bold text-[#FAF7F2]">
              {t.upgradePro}
            </a>
          ) : null}
          <button
            type="button"
            disabled={publishDisabled}
            onClick={() => void onPublish()}
            className="rounded-2xl bg-gradient-to-br from-[#E8D48A] via-[#D4BC6A] to-[#C9A84A] px-4 py-2 text-xs font-bold text-[#1E1810] shadow-md disabled:opacity-50"
          >
            {publishing ? (lang === "es" ? "Publicando…" : "Publishing…") : publishLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
