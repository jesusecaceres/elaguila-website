"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import newLogo from "../../public/logo.png";
import { BR_PUBLICAR_HUB } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import RecentlyViewedSection from "./components/RecentlyViewedSection";
import { HUB_CATEGORY_ORDER, type Lang } from "./config/clasificadosHub";
import { getClasificadosHubCopy } from "./config/clasificadosHubCopy";
import { appendLangToPath, buildHubCategoryPageUrl, buildHubPostEntryHref } from "./lib/hubUrl";
import { LEONIX_CATEGORY_VISUALS } from "./config/categoryVisuals";

export default function ClasificadosPage() {
  const params = useSearchParams();
  const lang = (params?.get("lang") === "en" ? "en" : "es") as Lang;

  const t = useMemo(() => getClasificadosHubCopy(lang), [lang]);

  const postEntryHref = buildHubPostEntryHref(lang);

  const withLang = (path: string) => appendLangToPath(path, lang);

  return (
    <div
      className="min-h-screen text-[color:var(--lx-text)] pb-24"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage:
          "radial-gradient(ellipse at top, rgba(201, 180, 106, 0.18), transparent 65%)",
      }}
    >
      <section className="mx-auto max-w-6xl px-6 pt-28">
        <div className="rounded-3xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] p-6 shadow-[0_18px_48px_rgba(42,36,22,0.10)] sm:p-8">
          <div className="flex flex-wrap justify-end gap-2">
            <a
              href={withLang(t.routeLogin)}
              className="rounded-lg border border-[color:var(--lx-nav-border)] bg-white/60 px-4 py-2 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-white/80 transition"
            >
              {t.authSignIn}
            </a>
            <a
              href={withLang(t.routeLogin)}
              className="rounded-lg border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-hover)] px-4 py-2 text-sm font-semibold text-[color:var(--lx-text-2)] hover:bg-[color:var(--lx-nav-active)] transition"
            >
              {t.authCreate}
            </a>
          </div>

          <div className="mt-4 text-center">
            <Image src={newLogo} alt="LEONIX" width={280} className="mx-auto mb-5" />

            <h1 className="text-5xl font-extrabold tracking-tight text-[color:var(--lx-text)] md:text-6xl">{t.pageTitle}</h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-[color:var(--lx-text-2)]/85 md:text-xl">{t.subtitle}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={postEntryHref}
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-nav-active)] px-5 py-2.5 text-sm font-bold text-[color:var(--lx-text)] shadow-sm hover:bg-[color:var(--lx-nav-hover)] transition"
              >
                {t.ctaPost}
              </a>
              <a
                href="#categorias"
                className="rounded-full border border-[color:var(--lx-nav-border)] bg-white/60 px-5 py-2.5 text-sm font-semibold text-[color:var(--lx-text)] hover:bg-white/80 transition"
              >
                {lang === "es" ? "Explorar categorías" : "Explore categories"}
              </a>
            </div>

            <div className="mx-auto mt-6 max-w-3xl text-sm text-[color:var(--lx-muted)]">{t.trustLine}</div>
          </div>
        </div>
      </section>

      <section id="categorias" className="mx-auto mt-10 max-w-6xl px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold text-[color:var(--lx-text)] md:text-4xl">{t.sectionBrowse}</h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_CATEGORY_ORDER.map((k) => {
            const meta = (t.cat as Record<string, { label: string; hint: string }>)[k];
            const visual = LEONIX_CATEGORY_VISUALS[k];
            const browseHref = buildHubCategoryPageUrl(k, lang);

            if (k === "bienes-raices") {
              return (
                <div
                  key={k}
                  className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${visual.tint} ${visual.border} ${visual.glow} transition-all duration-150 hover:-translate-y-0.5`}
                >
                  <Link href={browseHref} className="relative block px-4 py-4 focus:outline-none focus:ring-2 focus:ring-[#A98C2A]/35 focus:ring-offset-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#3D2C12] ${visual.chipBg}`}
                    >
                      {visual.emoji}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-[#3D2C12]">
                      {visual.emoji} {meta.label}
                    </h3>
                    <p className="mt-1 text-sm text-[#5D4A25]/82">{meta.hint}</p>
                    <span className="mt-3 inline-flex text-xs font-semibold text-[#6E4E18]">
                      {lang === "es" ? "Explorar" : "Explore"}
                    </span>
                    <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
                  </Link>
                  <div className="border-t border-[#3D2C12]/10 px-4 pb-4 pt-3">
                    <Link
                      href={withLang(BR_PUBLICAR_HUB)}
                      className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-[#C9B46A]/50 bg-[#2A2620] px-3 py-2.5 text-center text-sm font-bold text-[#FAF7F2] shadow-sm transition hover:bg-[#1E1810] sm:w-auto sm:justify-start"
                    >
                      <span aria-hidden>{visual.emoji}</span>
                      {lang === "es" ? "Publicar en Bienes Raíces" : "Post in Real estate"}
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={k}
                href={browseHref}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${visual.tint} ${visual.border} ${visual.glow} px-4 py-4 transition-all duration-150 hover:-translate-y-0.5`}
              >
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold text-[#3D2C12] ${visual.chipBg}`}>
                  {visual.emoji}
                </span>
                <h3 className="mt-2 text-lg font-bold text-[#3D2C12]">
                  {visual.emoji} {meta.label}
                </h3>
                <p className="mt-1 text-sm text-[#5D4A25]/82">{meta.hint}</p>
                <span className="mt-3 inline-flex text-xs font-semibold text-[#6E4E18]">
                  {lang === "es" ? "Explorar" : "Explore"}
                </span>
                <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 bg-white/20" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-6">
        <RecentlyViewedSection lang={lang} />
      </section>
    </div>
  );
}
