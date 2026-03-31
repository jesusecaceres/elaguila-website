"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import newLogo from "../../public/logo.png";
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
    <div className="min-h-screen bg-[#F6F0E2] text-[#3D2C12] pb-24 bg-[radial-gradient(ellipse_at_top,rgba(169,140,42,0.14),transparent_65%)]">
      <section className="mx-auto max-w-6xl px-6 pt-28">
        <div className="rounded-3xl border border-[#D8C79A]/70 bg-[#FFFDF7] p-6 shadow-[0_18px_48px_rgba(113,84,22,0.10)] sm:p-8">
          <div className="flex flex-wrap justify-end gap-2">
            <a
              href={withLang(t.routeLogin)}
              className="rounded-lg border border-[#D8C79A]/70 bg-[#FFFCF4] px-4 py-2 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF0DA] transition"
            >
              {t.authSignIn}
            </a>
            <a
              href={withLang(t.routeLogin)}
              className="rounded-lg border border-[#B28A2F]/45 bg-[#B28A2F]/12 px-4 py-2 text-sm font-semibold text-[#6E4E18] hover:bg-[#B28A2F]/20 transition"
            >
              {t.authCreate}
            </a>
          </div>

          <div className="mt-4 text-center">
            <Image src={newLogo} alt="LEONIX" width={280} className="mx-auto mb-5" />

            <h1 className="text-5xl font-extrabold tracking-tight text-[#3D2C12] md:text-6xl">{t.pageTitle}</h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-[#5D4A25]/85 md:text-xl">{t.subtitle}</p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a
                href={postEntryHref}
                className="rounded-full border border-[#B28A2F]/55 bg-[#B28A2F]/18 px-5 py-2.5 text-sm font-bold text-[#6E4E18] shadow-sm hover:bg-[#B28A2F]/26 transition"
              >
                {t.ctaPost}
              </a>
              <a
                href="#categorias"
                className="rounded-full border border-[#D8C79A]/75 bg-[#FFFCF4] px-5 py-2.5 text-sm font-semibold text-[#3D2C12] hover:bg-[#FFF0DA] transition"
              >
                {lang === "es" ? "Explorar categorías" : "Explore categories"}
              </a>
            </div>

            <div className="mx-auto mt-6 max-w-3xl text-sm text-[#5D4A25]/80">{t.trustLine}</div>
          </div>
        </div>
      </section>

      <section id="categorias" className="mx-auto mt-10 max-w-6xl px-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-bold text-[#3D2C12] md:text-4xl">{t.sectionBrowse}</h2>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {HUB_CATEGORY_ORDER.map((k) => {
            const meta = (t.cat as Record<string, { label: string; hint: string }>)[k];
            const visual = LEONIX_CATEGORY_VISUALS[k];
            return (
              <Link
                key={k}
                href={buildHubCategoryPageUrl(k, lang)}
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
