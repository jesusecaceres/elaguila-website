"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { BR_PUBLICAR_HUB } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import { RENTAS_PUBLICAR_HUB } from "@/app/clasificados/rentas/shared/utils/rentasPublishRoutes";
import RecentlyViewedSection from "./components/RecentlyViewedSection";
import type { HubCategoryKey, Lang } from "./config/clasificadosHub";
import { getClasificadosHubCopy } from "./config/clasificadosHubCopy";
import {
  appendLangToPath,
  buildHubCategoryPageUrl,
  buildHubPostEntryHref,
  resolveHubCopyLang,
  resolveRouteLang,
} from "./lib/hubUrl";

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

type CategoryCardCopy = {
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  noteEs?: string;
  noteEn?: string;
};

const C1_CATEGORY_COPY: Record<HubCategoryKey, CategoryCardCopy> = {
  "en-venta": {
    labelEs: "Varios",
    labelEn: "Miscellaneous",
    descEs: "Artículos, muebles, herramientas, ropa y cosas útiles para la comunidad.",
    descEn: "Items, furniture, tools, clothing, and useful things for the community.",
    noteEs: "Publicaciones comunitarias y artículos varios.",
    noteEn: "Community posts and miscellaneous items.",
  },
  rentas: {
    labelEs: "Rentas",
    labelEn: "Rentals",
    descEs: "Cuartos, apartamentos, espacios y oportunidades de vivienda.",
    descEn: "Rooms, apartments, spaces, and housing opportunities.",
  },
  empleos: {
    labelEs: "Empleos",
    labelEn: "Jobs",
    descEs: "Oportunidades de trabajo y negocios que están contratando.",
    descEn: "Job opportunities and businesses that are hiring.",
  },
  autos: {
    labelEs: "Autos",
    labelEn: "Autos",
    descEs: "Autos privados, vehículos y oportunidades de compra local.",
    descEn: "Private autos, vehicles, and local buying opportunities.",
  },
  "bienes-raices": {
    labelEs: "Bienes Raíces",
    labelEn: "Real Estate",
    descEs: "Casas, propiedades, terrenos y oportunidades inmobiliarias.",
    descEn: "Homes, properties, land, and real estate opportunities.",
  },
  servicios: {
    labelEs: "Servicios",
    labelEn: "Services",
    descEs: "Profesionales y servicios confiables cerca de ti.",
    descEn: "Trusted professionals and services near you.",
  },
  restaurantes: {
    labelEs: "Restaurantes",
    labelEn: "Restaurants",
    descEs: "Comida local, antojos, menús y lugares para visitar.",
    descEn: "Local food, cravings, menus, and places to visit.",
  },
  travel: {
    labelEs: "Viajes",
    labelEn: "Travel",
    descEs: "Ofertas, agencias y recursos para planear tu viaje.",
    descEn: "Offers, agencies, and resources to plan your trip.",
  },
  comunidad: {
    labelEs: "Comunidad y Eventos",
    labelEn: "Community & Events",
    descEs: "Eventos, actividades y conexiones locales.",
    descEn: "Events, activities, and local connections.",
  },
  clases: {
    labelEs: "Clases",
    labelEn: "Classes",
    descEs: "Cursos, talleres y aprendizaje para la comunidad.",
    descEn: "Courses, workshops, and learning for the community.",
  },
  busco: {
    labelEs: "Busco / Se busca",
    labelEn: "Wanted / Looking for",
    descEs: "Peticiones, necesidades, oportunidades y búsquedas locales.",
    descEn: "Requests, needs, opportunities, and local searches.",
  },
  "mascotas-y-perdidos": {
    labelEs: "Mascotas y Perdidos",
    labelEn: "Pets & Lost",
    descEs: "Mascotas, adopciones, objetos perdidos y apoyo comunitario.",
    descEn: "Pets, adoptions, lost items, and community support.",
  },
};

function buildCategoryPublishHref(category: HubCategoryKey, lang: Lang): string {
  return appendLangToPath(CATEGORY_PUBLISH_PATH[category], lang);
}

function postInCategoryLabel(lang: Lang, category: HubCategoryKey): string {
  const label = lang === "es" ? C1_CATEGORY_COPY[category].labelEs : C1_CATEGORY_COPY[category].labelEn;
  return lang === "es" ? `Publicar en ${label}` : `Post in ${label}`;
}

const PAGE_COPY = {
  es: {
    eyebrow: "LEONIX CLASIFICADOS",
    title: "Clasificados",
    subtitle: "Encuentra y publica oportunidades locales en un espacio hecho para nuestra comunidad.",
    description:
      "Explora artículos en venta, rentas, empleos, autos, servicios, eventos y más. Los anuncios comunitarios mantienen visible lo que nuestra gente busca, ofrece y comparte.",
    ctaPost: "Publicar anuncio",
    ctaExplore: "Explorar categorías",
    sectionBrowse: "Explorar por categoría",
    explore: "EXPLORAR",
    trustLine:
      "Un espacio confiable, familiar y comunitario. Los anuncios gratis siempre permanecen visibles en la búsqueda.",
  },
  en: {
    eyebrow: "LEONIX CLASSIFIEDS",
    title: "Classifieds",
    subtitle: "Find and post local opportunities in a space built for our community.",
    description:
      "Explore items for sale, rentals, jobs, autos, services, events, and more. Community listings keep visible what our people are looking for, offering, and sharing.",
    ctaPost: "Post listing",
    ctaExplore: "Explore categories",
    sectionBrowse: "Browse by category",
    explore: "EXPLORE",
    trustLine:
      "A trusted, family-safe, community-first marketplace. Free listings always remain visible in search.",
  },
} as const;

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
  lang: Lang;
  browseHref: string;
  publishHref: string;
  exploreLabel: string;
  priority?: boolean;
}) {
  const copy = C1_CATEGORY_COPY[category];
  const label = lang === "es" ? copy.labelEs : copy.labelEn;
  const desc = lang === "es" ? copy.descEs : copy.descEn;
  const note = lang === "es" ? copy.noteEs : copy.noteEn;
  const postLabel = postInCategoryLabel(lang, category);

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
      <h3 className="mt-4 text-base font-bold text-[#1F241C]">{label}</h3>
      {note ? <p className="mt-1 text-xs font-medium text-[#556B3E]">{note}</p> : null}
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{desc}</p>
      <div className="mt-auto flex flex-col gap-3 pt-5">
        <Link
          href={browseHref}
          className="text-xs font-bold uppercase tracking-[0.1em] text-[#7A1E2C] transition hover:text-[#5e1721]"
        >
          {exploreLabel} →
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {postLabel}
        </Link>
      </div>
    </article>
  );
}

export default function ClasificadosPage() {
  const params = useSearchParams();
  const routeLang = resolveRouteLang(params?.get("lang"));
  const lang = resolveHubCopyLang(params?.get("lang"));

  const hub = useMemo(() => getClasificadosHubCopy(lang), [lang]);
  const t = PAGE_COPY[lang];

  const postEntryHref = buildHubPostEntryHref(routeLang as Lang);

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
            {C1_CATEGORY_ORDER.map((k) => {
              const browseHref = buildHubCategoryPageUrl(k, routeLang as Lang);
              const publishHref = buildCategoryPublishHref(k, routeLang as Lang);
              const priority = PRIORITY_KEYS.has(k);

              return (
                <li key={k} className="flex h-full">
                  <CategoryCard
                    category={k}
                    lang={lang}
                    browseHref={browseHref}
                    publishHref={publishHref}
                    exploreLabel={t.explore}
                    priority={priority}
                  />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Trust note */}
        <p className="mx-auto mt-10 max-w-2xl text-center text-xs font-medium leading-relaxed text-[#3D3428]/70 sm:text-sm">
          {hub.trustLine}
        </p>

        <section className="mt-12">
          <RecentlyViewedSection lang={lang} />
        </section>
      </div>
    </main>
  );
}
