"use client";

import type { ReactNode } from "react";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const SAFETY_COPY = {
  es: {
    guardTitle: "Seguridad",
    guardBody:
      "Los anuncios se publican al instante, pero el sistema puede ocultarlos automáticamente si detecta spam o contenido inapropiado.",
    report: "Reportar anuncio",
  },
  en: {
    guardTitle: "Safety",
    guardBody:
      "Listings appear immediately, but the system may auto-hide them if it detects spam or inappropriate content.",
    report: "Report listing",
  },
} as const;

export function CommunityQuickPublicDetailShell({
  lang,
  mode,
  topBar,
  adBody,
  sidebar,
  onReport,
}: {
  lang: Lang;
  mode: "preview" | "published";
  topBar: ReactNode;
  adBody: ReactNode;
  sidebar: ReactNode;
  onReport?: () => void;
}) {
  const t = SAFETY_COPY[lang];
  const showReport = mode === "published" && onReport;

  return (
    <div
      className="bg-[#D9D9D9] min-h-screen text-[#111111] pb-28"
      data-testid="leonix-public-detail-shell"
      data-shell-mode={mode}
    >
      <Navbar />

      <section className="max-w-screen-2xl mx-auto px-6 pt-28">
        {topBar}

        <div className={cx("grid grid-cols-1 lg:grid-cols-12 gap-8", "mt-10")}>
          <div className="lg:col-span-8">
            <div
              className={cx(
                "rounded-2xl border p-8",
                "border-[#C9B46A]/50 bg-[#FCF9F2] text-[#2A2626] shadow-sm ring-1 ring-[#C9B46A]/20",
              )}
              data-testid="community-quick-ad-body"
            >
              {adBody}
            </div>

            <div className="mt-6 rounded-2xl border border-[#C9B46A]/55 bg-[#F5F5F5] backdrop-blur ring-1 ring-[#C9B46A]/25 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.85)] p-6">
              <div className="text-lg font-bold text-yellow-200">{t.guardTitle}</div>
              <div className="mt-2 text-[#111111]">{t.guardBody}</div>
              {showReport ? (
                <div className="mt-4">
                  <button
                    type="button"
                    className="cta-free px-5 py-2.5 rounded-full border border-gray-300 bg-white text-[#111111] font-semibold hover:bg-gray-50 transition"
                    onClick={onReport}
                  >
                    {t.report}
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6" data-testid="community-public-detail-sidebar">
            {sidebar}
          </div>
        </div>
      </section>
    </div>
  );
}
