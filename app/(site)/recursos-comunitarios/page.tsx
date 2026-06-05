"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Lang = "es" | "en";

type ResourceLaneKey =
  | "comunidad"
  | "clases"
  | "iglesias"
  | "busco"
  | "mascotas-y-perdidos"
  | "ayuda-comunitaria";

const LANE_ORDER: readonly ResourceLaneKey[] = [
  "comunidad",
  "clases",
  "iglesias",
  "busco",
  "mascotas-y-perdidos",
  "ayuda-comunitaria",
];

const LANE_EXPLORE_PATH: Record<ResourceLaneKey, string> = {
  comunidad: "/clasificados/comunidad",
  clases: "/clasificados/clases",
  iglesias: "/iglesias",
  busco: "/clasificados/busco",
  "mascotas-y-perdidos": "/clasificados/mascotas-y-perdidos",
  "ayuda-comunitaria": "/clasificados/busco",
};

const LANE_PUBLISH_PATH: Record<ResourceLaneKey, string> = {
  comunidad: "/clasificados/publicar/comunidad",
  clases: "/clasificados/publicar/clases",
  iglesias: "/clasificados/publicar",
  busco: "/clasificados/publicar/busco",
  "mascotas-y-perdidos": "/clasificados/publicar/mascotas-y-perdidos",
  "ayuda-comunitaria": "/clasificados/publicar",
};

type LaneCopy = {
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  publishEs: string;
  publishEn: string;
};

const LANE_COPY: Record<ResourceLaneKey, LaneCopy> = {
  comunidad: {
    labelEs: "Comunidad y Eventos",
    labelEn: "Community & Events",
    descEs: "Eventos, actividades, reuniones y conexiones locales para la comunidad.",
    descEn: "Events, activities, gatherings, and local connections for the community.",
    publishEs: "Publicar en Comunidad y Eventos",
    publishEn: "Post in Community & Events",
  },
  clases: {
    labelEs: "Clases",
    labelEn: "Classes",
    descEs: "Cursos, talleres y oportunidades de aprendizaje para todas las edades.",
    descEn: "Courses, workshops, and learning opportunities for all ages.",
    publishEs: "Publicar en Clases",
    publishEn: "Post in Classes",
  },
  iglesias: {
    labelEs: "Iglesias",
    labelEn: "Churches",
    descEs: "Espacios de fe, comunidad y conexión espiritual.",
    descEn: "Spaces for faith, community, and spiritual connection.",
    publishEs: "Publicar iglesia",
    publishEn: "Post church",
  },
  busco: {
    labelEs: "Busco / Se busca",
    labelEn: "Wanted / Looking for",
    descEs: "Peticiones, necesidades, oportunidades y búsquedas locales.",
    descEn: "Requests, needs, opportunities, and local searches.",
    publishEs: "Publicar solicitud",
    publishEn: "Post request",
  },
  "mascotas-y-perdidos": {
    labelEs: "Mascotas y Perdidos",
    labelEn: "Pets & Lost",
    descEs: "Mascotas, adopciones, objetos perdidos y apoyo comunitario.",
    descEn: "Pets, adoptions, lost items, and community support.",
    publishEs: "Publicar en Mascotas y Perdidos",
    publishEn: "Post in Pets & Lost",
  },
  "ayuda-comunitaria": {
    labelEs: "Ayuda comunitaria",
    labelEn: "Community Help",
    descEs: "Recursos gratuitos, apoyo local e información útil para familias y vecinos.",
    descEn: "Free resources, local support, and useful information for families and neighbors.",
    publishEs: "Publicar recurso",
    publishEn: "Post resource",
  },
};

const PAGE_COPY = {
  es: {
    eyebrow: "LEONIX RECURSOS COMUNITARIOS",
    title: "Recursos Comunitarios",
    subtitle: "Conecta con eventos, clases, iglesias y apoyo local para nuestra comunidad.",
    description:
      "Encuentra espacios comunitarios, actividades, aprendizaje, ayuda y conexiones locales en un solo lugar. Esta sección reúne recursos útiles para familias, organizaciones y vecinos.",
    ctaExplore: "Explorar recursos",
    ctaPost: "Publicar recurso",
    sectionLanes: "Explorar por recurso",
    explore: "EXPLORAR",
    searchEyebrow: "BÚSQUEDA COMUNITARIA",
    searchTitle: "Busca recursos por tema, ciudad o necesidad",
    searchDescription:
      "Muy pronto cada categoría tendrá una búsqueda clara con filtros consistentes para encontrar recursos, anuncios y oportunidades locales con menos pasos.",
    searchPlaceholder: "Buscar recurso, evento, clase o ayuda...",
    locationPlaceholder: "Ciudad o ZIP",
    searchButton: "Buscar",
    searchPreviewNote: "Vista previa visual — la búsqueda estará disponible pronto en cada categoría.",
    filterEventos: "Eventos",
    filterClases: "Clases",
    filterIglesias: "Iglesias",
    filterAyuda: "Ayuda",
    filterMascotas: "Mascotas",
    filterSolicitudes: "Solicitudes",
    promoTitle: "¿Tienes un recurso para compartir?",
    promoDescription:
      "Publica eventos, clases, ayuda comunitaria o información útil para que más personas puedan encontrarla.",
    promoButton: "Publicar recurso",
  },
  en: {
    eyebrow: "LEONIX COMMUNITY RESOURCES",
    title: "Community Resources",
    subtitle: "Connect with events, classes, churches, and local support for our community.",
    description:
      "Find community spaces, activities, learning, support, and local connections in one place. This section brings together useful resources for families, organizations, and neighbors.",
    ctaExplore: "Explore resources",
    ctaPost: "Post resource",
    sectionLanes: "Explore by resource",
    explore: "EXPLORE",
    searchEyebrow: "COMMUNITY SEARCH",
    searchTitle: "Search resources by topic, city, or need",
    searchDescription:
      "Soon each category will use a clear search experience with consistent filters to find resources, listings, and local opportunities with fewer steps.",
    searchPlaceholder: "Search resource, event, class, or help...",
    locationPlaceholder: "City or ZIP",
    searchButton: "Search",
    searchPreviewNote: "Visual preview — search will be available soon in each category.",
    filterEventos: "Events",
    filterClases: "Classes",
    filterIglesias: "Churches",
    filterAyuda: "Help",
    filterMascotas: "Pets",
    filterSolicitudes: "Requests",
    promoTitle: "Have a resource to share?",
    promoDescription:
      "Post events, classes, community help, or useful information so more people can find it.",
    promoButton: "Post resource",
  },
} as const;

type PageCopy = (typeof PAGE_COPY)[Lang];

function appendLangToPath(path: string, lang: Lang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

function buildExploreHref(lane: ResourceLaneKey, lang: Lang): string {
  return appendLangToPath(LANE_EXPLORE_PATH[lane], lang);
}

function buildPublishHref(lane: ResourceLaneKey, lang: Lang): string {
  return appendLangToPath(LANE_PUBLISH_PATH[lane], lang);
}

function buildPostResourceEntryHref(lang: Lang): string {
  const redirect = encodeURIComponent(`/clasificados/publicar?lang=${lang}`);
  return `/login?mode=post&lang=${lang}&redirect=${redirect}`;
}

function LaneMark({ lane }: { lane: ResourceLaneKey }) {
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

  switch (lane) {
    case "comunidad":
      return (
        <svg {...common} aria-hidden>
          <rect x="4" y="5" width="16" height="14" rx="1.5" />
          <path d="M8 3v4M16 3v4M4 10h16" />
          <circle cx="9" cy="14" r="1.25" />
          <circle cx="15" cy="14" r="1.25" />
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
    case "iglesias":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 4v16" />
          <path d="M8 8h8" />
          <path d="M6 20h12" />
          <path d="M10 20V12h4v8" />
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
        </svg>
      );
    case "ayuda-comunitaria":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 4v6" />
          <path d="M8 8c2-2 8-2 8 0v2c0 3-2 5-4 6-2-1-4-3-4-6V8z" />
          <path d="M9 20h6" />
        </svg>
      );
    default:
      return null;
  }
}

function ResourceLaneCard({
  lane,
  lang,
  exploreHref,
  publishHref,
  exploreLabel,
}: {
  lane: ResourceLaneKey;
  lang: Lang;
  exploreHref: string;
  publishHref: string;
  exploreLabel: string;
}) {
  const copy = LANE_COPY[lane];
  const label = lang === "es" ? copy.labelEs : copy.labelEn;
  const desc = lang === "es" ? copy.descEs : copy.descEn;
  const publishLabel = lang === "es" ? copy.publishEs : copy.publishEn;

  return (
    <article className="flex h-full min-h-[17.5rem] flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.15)]">
      <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#C9A84A]/35 bg-[#FAF6EE] text-[#2A4536]">
        <LaneMark lane={lane} />
      </span>
      <h3 className="mt-4 text-base font-bold text-[#1F241C]">{label}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{desc}</p>
      <div className="mt-auto flex flex-col gap-4 border-t border-[#D6C7AD]/50 pt-6">
        <Link
          href={exploreHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FAF6EE] px-4 py-2.5 text-center text-sm font-bold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FFFDF7]"
        >
          {exploreLabel}
        </Link>
        <Link
          href={publishHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {publishLabel}
        </Link>
      </div>
    </article>
  );
}

function SearchFilterPreview({
  lang,
  t,
  filterLinks,
  searchActionHref,
}: {
  lang: Lang;
  t: PageCopy;
  filterLinks: { label: string; href: string }[];
  searchActionHref: string;
}) {
  return (
    <section
      className="mt-14 rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.12)] sm:p-6"
      aria-labelledby="recursos-search-title"
    >
      <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{t.searchEyebrow}</p>
      <h2 id="recursos-search-title" className="mt-2 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">
        {t.searchTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428]">{t.searchDescription}</p>
      <p className="mt-2 text-xs font-medium text-[#556B3E]/90">{t.searchPreviewNote}</p>

      <div
        className="mt-6 rounded-lg border border-[#D6C7AD]/80 bg-[#FAF6EE] p-4"
        role="group"
        aria-label={lang === "es" ? "Vista previa de búsqueda" : "Search preview"}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <label className="sr-only" htmlFor="recursos-search-q">
            {t.searchPlaceholder}
          </label>
          <input
            id="recursos-search-q"
            type="search"
            readOnly
            tabIndex={-1}
            placeholder={t.searchPlaceholder}
            className="min-h-[2.75rem] flex-1 cursor-default rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-sm text-[#3D3428] placeholder:text-[#3D3428]/50"
            aria-describedby="recursos-search-preview-note"
          />
          <label className="sr-only" htmlFor="recursos-search-loc">
            {t.locationPlaceholder}
          </label>
          <input
            id="recursos-search-loc"
            type="text"
            readOnly
            tabIndex={-1}
            placeholder={t.locationPlaceholder}
            className="min-h-[2.75rem] w-full cursor-default rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 text-sm text-[#3D3428] placeholder:text-[#3D3428]/50 sm:max-w-[10rem]"
            aria-describedby="recursos-search-preview-note"
          />
          <Link
            href={searchActionHref}
            className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-lg bg-[#7A1E2C] px-6 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
          >
            {t.searchButton}
          </Link>
        </div>
        <p id="recursos-search-preview-note" className="sr-only">
          {t.searchPreviewNote}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {filterLinks.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex min-h-[2rem] items-center rounded-full border border-[#C9A84A]/50 bg-[#FFFDF7] px-3.5 text-xs font-semibold text-[#2A4536] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
            >
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function RecursosComunitariosInner() {
  const lang = (useSearchParams()?.get("lang") === "en" ? "en" : "es") as Lang;
  const t = PAGE_COPY[lang];
  const postEntryHref = buildPostResourceEntryHref(lang);

  const filterLinks = [
    { label: t.filterEventos, href: buildExploreHref("comunidad", lang) },
    { label: t.filterClases, href: buildExploreHref("clases", lang) },
    { label: t.filterIglesias, href: buildExploreHref("iglesias", lang) },
    { label: t.filterAyuda, href: buildExploreHref("ayuda-comunitaria", lang) },
    { label: t.filterMascotas, href: buildExploreHref("mascotas-y-perdidos", lang) },
    { label: t.filterSolicitudes, href: buildExploreHref("busco", lang) },
  ];

  const searchActionHref = buildExploreHref("comunidad", lang);

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
        {/* 1 — Community hero */}
        <section className="max-w-3xl" aria-labelledby="recursos-hero-title">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{t.eyebrow}</p>
          <h1
            id="recursos-hero-title"
            className="mt-3 font-serif text-4xl font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl"
          >
            {t.title}
          </h1>
          <p className="mt-4 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{t.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#recursos"
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
            >
              {t.ctaExplore}
            </a>
            <a
              href={postEntryHref}
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
            >
              {t.ctaPost}
            </a>
          </div>
        </section>

        {/* 2 — Resource category grid */}
        <section id="recursos" className="mt-14 sm:mt-16" aria-labelledby="recursos-lanes-title">
          <h2
            id="recursos-lanes-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sectionLanes}
          </h2>

          <ul className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {LANE_ORDER.map((lane) => (
              <li key={lane} className="flex h-full">
                <ResourceLaneCard
                  lane={lane}
                  lang={lang}
                  exploreHref={buildExploreHref(lane, lang)}
                  publishHref={buildPublishHref(lane, lang)}
                  exploreLabel={t.explore}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* 3 — Search/filter preview (visual only) */}
        <SearchFilterPreview lang={lang} t={t} filterLinks={filterLinks} searchActionHref={searchActionHref} />

        {/* 4 — Community CTA */}
        <section
          className="mt-14 rounded-2xl border border-[#C9A84A]/40 bg-[#2A4536] px-6 py-10 text-[#FFFDF7] shadow-[0_16px_40px_-20px_rgba(31,36,28,0.35)] sm:px-10 sm:py-12"
          aria-labelledby="recursos-promo-title"
        >
          <h2 id="recursos-promo-title" className="font-serif text-2xl font-bold leading-snug sm:text-[1.75rem]">
            {t.promoTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#FAF6EE]/90 sm:text-[0.9375rem]">
            {t.promoDescription}
          </p>
          <a
            href={postEntryHref}
            className="mt-8 inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
          >
            {t.promoButton}
          </a>
        </section>
      </div>
    </main>
  );
}

export default function RecursosComunitariosPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF6EE] px-4 pt-28">
          <div className="mx-auto max-w-6xl animate-pulse text-sm text-[#3D3428]">…</div>
        </main>
      }
    >
      <RecursosComunitariosInner />
    </Suspense>
  );
}
