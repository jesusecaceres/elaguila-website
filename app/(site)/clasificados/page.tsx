"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_HUB } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { RENTAS_PUBLICAR_HUB } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import RecentlyViewedSection from "./components/RecentlyViewedSection";
import { OfertasLocalesHubCategoryCard } from "./ofertas-locales/OfertasLocalesHubCategoryCard";
import { DealersDeAutosHubCategoryCard } from "./autos/components/public/DealersDeAutosHubCategoryCard";
import type { HubCategoryKey, Lang } from "./config/clasificadosHub";
import {
  getPublicCategoryCardCopy,
  getPublicCategoryExploreLabel,
} from "@/app/lib/clasificados/publicCategoryCopyGuard";
import {
  getClasificadosCategoryCopy,
  getClasificadosHubPageCopy,
} from "@/app/lib/clasificados/clasificadosHubPageCopy";
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

function CategoryMark({ category }: { category: HubCategoryKey }) {
  const stroke = "#2A4536";
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-7 w-7",
  };

  switch (category) {
    case "en-venta":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="4" width="7" height="7" rx="1" />
          <rect x="13" y="4" width="7" height="7" rx="1" />
          <rect x="4" y="13" width="7" height="7" rx="1" />
          <rect x="13" y="13" width="7" height="7" rx="1" />
        </svg>
      );
    case "rentas":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 10l8-6 8 6v10H4z" />
          <path d="M10 20v-6h4v6" />
          <circle cx="17" cy="7" r="2.5" />
          <path d="M17 9.5v3.5" />
        </svg>
      );
    case "empleos":
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="7" width="18" height="12" rx="1.5" />
          <path d="M8 7V6a4 4 0 018 0v1" />
        </svg>
      );
    case "autos":
      return (
        <svg {...common} aria-hidden>
          <path d="M5 16h14l-1.5-5H6.5L5 16z" />
          <circle cx="8" cy="17" r="1.5" />
          <circle cx="16" cy="17" r="1.5" />
        </svg>
      );
    case "bienes-raices":
      return (
        <svg {...common} aria-hidden>
          <path d="M3 20h18" />
          <path d="M6 20V9l6-4 6 4v11" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "servicios":
      return (
        <svg {...common} aria-hidden>
          <path d="M14 4l2 2-8 8-2-2 8-8z" />
          <path d="M16 6l2 2" />
          <path d="M6 18l-2 2" />
        </svg>
      );
    case "restaurantes":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 4v8M6 4h4" />
          <path d="M16 4v16M14 4h4" />
        </svg>
      );
    case "travel":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2" />
          <path d="M7 7l1.5 1.5M15.5 15.5L17 17M7 17l1.5-1.5M15.5 8.5L17 7" />
        </svg>
      );
    case "comunidad":
      return (
        <svg {...common} aria-hidden>
          <circle cx="9" cy="9" r="2.5" />
          <circle cx="15" cy="9" r="2.5" />
          <path d="M4 19c1.5-3 4-4.5 8-4.5s6.5 1.5 8 4.5" />
        </svg>
      );
    case "clases":
      return (
        <svg {...common} aria-hidden>
          <path d="M5 6h14v12H5z" />
          <path d="M9 6V4h6v2" />
          <path d="M8 11h8M8 14h5" />
        </svg>
      );
    case "busco":
      return (
        <svg {...common} aria-hidden>
          <circle cx="10" cy="10" r="5.5" />
          <path d="M14.5 14.5L19 19" />
        </svg>
      );
    case "mascotas-y-perdidos":
      return (
        <svg {...common} aria-hidden>
          <ellipse cx="8" cy="14" rx="2.5" ry="3" />
          <ellipse cx="12" cy="11" rx="2" ry="2.5" />
          <ellipse cx="16" cy="14" rx="2.5" ry="3" />
          <ellipse cx="10" cy="7" rx="2" ry="2.5" />
          <ellipse cx="14" cy="7" rx="2" ry="2.5" />
          <path d="M18 18l3 3" />
          <circle cx="19.5" cy="16.5" r="2.5" />
        </svg>
      );
    default:
      return (
        <span className="text-xs font-bold tracking-wide text-[#2A4536]" aria-hidden>
          LM
        </span>
      );
  }
}

function CategoryCard({
  category,
  lang,
  browseHref,
  publishHref,
  exploreLabel,
  priority,
}: {
  category: HubCategoryKey;
  lang: SupportedLang;
  browseHref: string;
  publishHref: string;
  exploreLabel: string;
  priority?: boolean;
}) {
  const copy = getPublicCategoryCardCopy(category, lang);
  const note = getClasificadosCategoryCopy(lang, category).note;

  return (
    <article
      className={`flex h-full min-h-[17.5rem] flex-col rounded-xl border bg-[#FFFDF7] p-5 ${
        priority
          ? "border-[#C9A84A]/45 border-t-[3px] border-t-[#C9A84A] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]"
          : "border-[#D6C7AD] shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]"
      }`}
    >
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C9A84A]/35 bg-[#FAF6EE] text-[#2A4536]">
        <CategoryMark category={category} />
      </span>
      <h3 className="mt-4 text-base font-bold text-[#1F241C]">{copy.label}</h3>
      {note ? <p className="mt-1 text-xs font-medium text-[#556B3E]">{note}</p> : null}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{copy.desc}</p>
      <div className="mt-auto flex flex-col gap-4 border-t border-[#D6C7AD]/50 pt-6">
        <Link
          href={browseHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FAF6EE] px-4 py-2.5 text-center text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
        >
          {exploreLabel}
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {copy.post}
        </Link>
      </div>
    </article>
  );
}

export default function ClasificadosPage() {
  const params = useSearchParams();
  const routeLang = resolveRouteLang(params?.get("lang"));
  const t = useMemo(() => getClasificadosHubPageCopy(routeLang), [routeLang]);

  const postEntryHref = buildHubPostEntryHref(routeLang);

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
            <a
              href={postEntryHref}
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
            >
              {t.ctaPost}
            </a>
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

        <section className="mt-10 rounded-2xl border border-[#7A1E2C]/25 bg-[#7A1E2C]/5 p-5 sm:p-6" aria-labelledby="ofertas-locales-hub-title">
          <h2 id="ofertas-locales-hub-title" className="text-xl font-bold text-[#1E1814]">
            {t.ofertasLocalesTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[#1E1814]/75">{t.ofertasLocalesDesc}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href={appendLangToPath("/clasificados/ofertas-locales", routeLang)}
              className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#6a1926]"
            >
              {t.ofertasLocalesBrowse}
            </Link>
            <Link
              href={appendLangToPath("/publicar/ofertas-locales", routeLang)}
              className="inline-flex min-h-[2.5rem] items-center justify-center rounded-lg border border-[#7A1E2C]/35 bg-white px-4 py-2.5 text-sm font-bold text-[#7A1E2C] hover:bg-white/90"
            >
              {t.ofertasLocalesPublish}
            </Link>
          </div>
        </section>

        {/* 3 — Category grid */}
        <section id="categorias" className="mt-14 sm:mt-16" aria-labelledby="clasificados-browse-title">
          <h2
            id="clasificados-browse-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sectionBrowse}
          </h2>

          <ul className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <li className="flex h-full">
              <OfertasLocalesHubCategoryCard routeLang={routeLang} priority />
            </li>
            {C1_CATEGORY_ORDER.map((k) => {
              const browseHref = buildHubCategoryPageUrl(k, routeLang);
              const publishHref =
                k === "autos"
                  ? appendLangToPath("/publicar/autos/privado", routeLang)
                  : buildCategoryPublishHref(k, routeLang);
              const priority = PRIORITY_KEYS.has(k);

              return (
                <li key={k} className="flex h-full">
                  <CategoryCard
                    category={k}
                    lang={routeLang}
                    browseHref={browseHref}
                    publishHref={publishHref}
                    exploreLabel={getPublicCategoryExploreLabel(routeLang)}
                    priority={priority}
                  />
                </li>
              );
            })}
            <li className="flex h-full">
              <DealersDeAutosHubCategoryCard routeLang={routeLang} />
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
