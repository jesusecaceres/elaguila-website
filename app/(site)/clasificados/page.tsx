"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_HUB } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { RENTAS_PUBLICAR_HUB } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import RecentlyViewedSection from "./components/RecentlyViewedSection";
import { ClasificadosFeaturedOfertasModule } from "./_components/ClasificadosFeaturedOfertasModule";
import { ClasificadosHubCategoryCard } from "./_components/ClasificadosHubCategoryCard";
import { ClasificadosLandingLaunchBanner } from "./_components/ClasificadosLandingLaunchBanner";
import type { HubCategoryKey, Lang } from "./config/clasificadosHub";
import {
  getPublicCategoryCardCopy,
} from "@/app/lib/clasificados/publicCategoryCopyGuard";
import { getClasificadosHubPageCopy } from "@/app/lib/clasificados/clasificadosHubPageCopy";
import { navCopyLang, type SupportedLang } from "@/app/lib/language";
import {
  appendLangToPath,
  buildHubCategoryPageUrl,
  buildHubPostEntryHref,
  resolveRouteLang,
} from "./lib/hubUrl";
import { CategoryVisibilityCta } from "./components/categoryStandard/CategoryVisibilityCta";

/** Gate C1.1 — hub landing display order (browse routes unchanged). */
const C1_CATEGORY_ORDER: readonly HubCategoryKey[] = [
  "en-venta",
  "rentas",
  "empleos",
  "bienes-raices",
  "servicios",
  "autos",
  "restaurantes",
  "travel",
  "comunidad",
  "clases",
  "busco",
  "mascotas-y-perdidos",
];

/** Canonical category publish entry paths (dispatcher / redirect pages). */
const CATEGORY_PUBLISH_PATH: Record<HubCategoryKey, string> = {
  "en-venta": "/clasificados/publicar/en-venta",
  rentas: RENTAS_PUBLICAR_HUB,
  empleos: "/clasificados/publicar/empleos",
  "bienes-raices": BR_PUBLICAR_HUB,
  servicios: "/clasificados/publicar/servicios",
  autos: "/publicar/autos",
  restaurantes: "/publicar/restaurantes",
  travel: "/publicar/viajes",
  comunidad: "/clasificados/publicar/comunidad",
  clases: "/clasificados/publicar/clases",
  busco: "/clasificados/publicar/busco",
  "mascotas-y-perdidos": "/clasificados/publicar/mascotas-y-perdidos",
};

function buildCategoryPublishHref(category: HubCategoryKey, lang: SupportedLang): string {
  return appendLangToPath(CATEGORY_PUBLISH_PATH[category], lang);
}

const PRIORITY_KEYS = new Set<HubCategoryKey>(["en-venta", "rentas", "empleos"]);

function DealerMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="#2A4536"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-7 w-7"
      aria-hidden
    >
      <path d="M3 10h18v10H3z" />
      <path d="M5 10V7h14v3" />
      <path d="M7 14h4M7 17h6" />
      <circle cx="7.5" cy="20" r="1.5" />
      <circle cx="16.5" cy="20" r="1.5" />
    </svg>
  );
}

function ClasificadosPageInner() {
  const params = useSearchParams();
  const routeLang = resolveRouteLang(params?.get("lang"));
  const t = useMemo(() => getClasificadosHubPageCopy(routeLang), [routeLang]);
  const dealerCopy = useMemo(() => getPublicCategoryCardCopy("dealers-de-autos", routeLang), [routeLang]);

  const postEntryHref = buildHubPostEntryHref(routeLang);
  const dealerBrowseHref = appendLangToPath("/clasificados/dealers-de-autos", routeLang);
  const dealerPublishHref = appendLangToPath("/publicar/autos/negocios", routeLang);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#FAF6EE] pb-20 text-[#1F241C]">
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden
        style={{
          backgroundImage: `
            radial-gradient(ellipse 110% 65% at 50% -5%, rgba(201, 168, 74, 0.1), transparent 52%),
            radial-gradient(ellipse 45% 35% at 100% 20%, rgba(255, 255, 255, 0.35), transparent 48%)
          `,
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pt-24 sm:px-6 lg:px-8">
        {/* 1 — Marketplace hero */}
        <section className="max-w-3xl" aria-labelledby="clasificados-hero-title">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{t.eyebrow}</p>
          <h1
            id="clasificados-hero-title"
            className="mt-3 font-serif text-4xl font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl"
          >
            {t.title}
          </h1>
          <p className="mt-4 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{t.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.description}</p>

          {/* 2 — Primary actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={postEntryHref}
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
            >
              {t.ctaPost}
            </Link>
            <a
              href="#categorias"
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
            >
              {t.ctaExplore}
            </a>
          </div>
          <div className="mt-4 max-w-2xl">
            <CategoryVisibilityCta lang={navCopyLang(routeLang) as Lang} category="clasificados" surface="hub" compact />
          </div>
        </section>

        {/* Launch 25 opportunity */}
        <div className="mt-10 max-w-3xl">
          <ClasificadosLandingLaunchBanner routeLang={routeLang} />
        </div>

        {/* Featured Ofertas Locales */}
        <div className="mt-8">
          <ClasificadosFeaturedOfertasModule routeLang={routeLang} />
        </div>

        {/* Category grid */}
        <section id="categorias" className="mt-14 sm:mt-16" aria-labelledby="clasificados-browse-title">
          <h2
            id="clasificados-browse-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sectionBrowse}
          </h2>

          <ul className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {C1_CATEGORY_ORDER.map((k) => {
              const copy = getPublicCategoryCardCopy(k, routeLang);
              const browseHref = buildHubCategoryPageUrl(k, routeLang);
              const publishHref =
                k === "autos"
                  ? appendLangToPath("/publicar/autos/privado", routeLang)
                  : buildCategoryPublishHref(k, routeLang);
              const priority = PRIORITY_KEYS.has(k);

              return (
                <li key={k} className="flex h-full">
                  <ClasificadosHubCategoryCard
                    category={k}
                    lang={routeLang}
                    browseHref={browseHref}
                    publishHref={publishHref}
                    label={copy.label}
                    description={copy.desc}
                    publishLabel={copy.post}
                    priority={priority}
                  />
                </li>
              );
            })}
            <li className="flex h-full">
              <ClasificadosHubCategoryCard
                lang={routeLang}
                browseHref={dealerBrowseHref}
                publishHref={dealerPublishHref}
                label={dealerCopy.label}
                description={dealerCopy.desc}
                publishLabel={dealerCopy.post}
                icon={<DealerMark />}
                accent="default"
              />
            </li>
          </ul>
        </section>

        {/* Trust note */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs font-medium leading-relaxed text-[#3D3428]/70 sm:text-sm">
          {t.trustLine}
        </p>

        <section className="mt-12">
          <RecentlyViewedSection lang={navCopyLang(routeLang)} />
        </section>
      </div>
    </main>
  );
}

export default function ClasificadosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF6EE] px-4 pt-28">
          <div className="mx-auto max-w-6xl animate-pulse text-sm text-[#3D3428]">…</div>
        </main>
      }
    >
      <ClasificadosPageInner />
    </Suspense>
  );
}
