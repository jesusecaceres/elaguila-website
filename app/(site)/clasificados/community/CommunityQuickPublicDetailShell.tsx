"use client";

import type { ReactNode } from "react";

import Navbar from "@/app/components/Navbar";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

const REPORT_LABEL = { es: "Reportar anuncio", en: "Report listing" } as const;

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
  /** Sidebar slot — rendered as a compact action strip below the main body on all screens. */
  sidebar: ReactNode;
  onReport?: () => void;
}) {
  const showReport = mode === "published" && onReport;

  return (
    <div
      className="min-h-screen overflow-x-hidden pb-28 text-[#3D3428]"
      style={{
        backgroundColor: "#F8F4EA",
        backgroundImage: [
          "radial-gradient(ellipse 120% 70% at 50% -10%, rgba(201,168,74,0.10), transparent 55%)",
          "radial-gradient(ellipse 45% 35% at 100% 18%, rgba(255,253,247,0.55), transparent 50%)",
        ].join(","),
      }}
      data-testid="leonix-public-detail-shell"
      data-shell-mode={mode}
    >
      <Navbar />

      {/* ── Breadcrumb/top-bar row ─────────────────────────────────── */}
      <section className="mx-auto w-full max-w-4xl px-4 pt-24 sm:px-6 sm:pt-28">
        {topBar}
      </section>

      {/* ── Main content ──────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-4xl min-w-0 px-4 pb-6 pt-6 sm:px-6">
        <div data-testid="community-quick-ad-body">
          {adBody}
        </div>

        {/* Sidebar slot — rendered as a compact action strip below ad body */}
        {sidebar ? (
          <div className="mt-4" data-testid="community-public-detail-sidebar">
            {sidebar}
          </div>
        ) : null}

        {/* Report — inline trust footer */}
        {showReport ? (
          <div className="mt-5 flex items-center justify-end">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D6C7AD]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#7A7164] transition hover:bg-[#F5EDD8] hover:text-[#7A1E2C]"
              onClick={onReport}
            >
              {REPORT_LABEL[lang]}
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
}
