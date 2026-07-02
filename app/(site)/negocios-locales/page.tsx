"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { resolveRouteLang, type SupportedLang } from "@/app/lib/language";

type PageLang = "es" | "en";

type BusinessLaneKey =
  | "ofertas-locales"
  | "servicios"
  | "restaurantes"
  | "comida-local"
  | "autos-dealer"
  | "bienes-raices";

const LANE_ORDER: readonly BusinessLaneKey[] = [
  "ofertas-locales",
  "servicios",
  "restaurantes",
  "comida-local",
  "autos-dealer",
  "bienes-raices",
];

const LANE_EXPLORE_PATH: Record<BusinessLaneKey, string> = {
  "ofertas-locales": "/clasificados/ofertas-locales",
  servicios: "/clasificados/servicios",
  restaurantes: "/clasificados/restaurantes",
  "comida-local": "/clasificados/comida-local",
  "autos-dealer": "/clasificados/autos/resultados",
  "bienes-raices": "/clasificados/bienes-raices",
};

const LANE_ADVERTISE_PATH: Record<BusinessLaneKey, string> = {
  "ofertas-locales": "/publicar/ofertas-locales",
  servicios: "/clasificados/publicar/servicios",
  restaurantes: "/clasificados/publicar/restaurantes",
  "comida-local": "/publicar/comida-local",
  "autos-dealer": "/publicar/autos/negocios",
  "bienes-raices": "/clasificados/publicar/bienes-raices",
};

type LaneCopy = {
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  advertiseEs: string;
  advertiseEn: string;
};

const LANE_COPY: Record<BusinessLaneKey, LaneCopy> = {
  "ofertas-locales": {
    labelEs: "Ofertas Locales",
    labelEn: "Local Deals",
    descEs: "Encuentra especiales, cupones y ofertas semanales de negocios locales.",
    descEn: "Find weekly specials, coupons, and local business offers.",
    advertiseEs: "Publica tus ofertas locales",
    advertiseEn: "Publish your local deals",
  },
  servicios: {
    labelEs: "Servicios",
    labelEn: "Services",
    descEs: "Profesionales y servicios confiables para hogares, negocios y proyectos locales.",
    descEn: "Trusted professionals and services for homes, businesses, and local projects.",
    advertiseEs: "Anunciar en Servicios",
    advertiseEn: "Advertise in Services",
  },
  restaurantes: {
    labelEs: "Restaurantes",
    labelEn: "Restaurants",
    descEs: "Comida local, menús, antojos y lugares para visitar en tu comunidad.",
    descEn: "Local food, menus, cravings, and places to visit in your community.",
    advertiseEs: "Anunciar en Restaurantes",
    advertiseEn: "Advertise in Restaurants",
  },
  "comida-local": {
    labelEs: "Comida Local",
    labelEn: "Local Food",
    descEs: "Puestos, pop-ups, comida casera y vendedores móviles para la comunidad.",
    descEn: "Pop-ups, homemade food, mobile vendors, and local food sellers.",
    advertiseEs: "Publicar tu puesto",
    advertiseEn: "Publish your stand",
  },
  "autos-dealer": {
    labelEs: "Concesionarios de Autos",
    labelEn: "Auto Dealerships",
    descEs: "Agencias y negocios de autos para conectar compradores con opciones locales.",
    descEn: "Auto businesses and dealerships connecting buyers with local options.",
    advertiseEs: "Anunciar concesionario",
    advertiseEn: "Advertise dealership",
  },
  "bienes-raices": {
    labelEs: "Bienes Raíces",
    labelEn: "Real Estate",
    descEs: "Casas, propiedades, agentes y oportunidades inmobiliarias para la comunidad.",
    descEn: "Homes, properties, agents, and real estate opportunities for the community.",
    advertiseEs: "Anunciar en Bienes Raíces",
    advertiseEn: "Advertise in Real Estate",
  },
};

const PAGE_COPY = {
  es: {
    eyebrow: "LEONIX NEGOCIOS LOCALES",
    title: "Negocios Locales",
    subtitle: "Encuentra negocios, servicios y profesionales cerca de tu comunidad.",
    description:
      "Explora servicios, restaurantes, concesionarios y bienes raíces en un espacio creado para conectar negocios locales con familias, clientes y oportunidades reales.",
    ctaExplore: "Explorar negocios",
    ctaAdvertise: "Anunciar mi negocio",
    sectionLanes: "Explorar por sector",
    explore: "EXPLORAR",
    promoTitle: "¿Quieres que tu negocio aparezca en Leonix?",
    promoDescription:
      "Crea presencia local con una página de negocio, opciones de contacto, enlaces útiles y visibilidad dentro de la comunidad.",
    promoButton: "Anunciar mi negocio",
  },
  en: {
    eyebrow: "LEONIX LOCAL BUSINESSES",
    title: "Local Businesses",
    subtitle: "Find businesses, services, and professionals near your community.",
    description:
      "Explore services, restaurants, auto dealerships, and real estate in one place built to connect local businesses with families, customers, and real opportunities.",
    ctaExplore: "Explore businesses",
    ctaAdvertise: "Advertise my business",
    sectionLanes: "Explore by sector",
    explore: "EXPLORE",
    promoTitle: "Want your business to appear on Leonix?",
    promoDescription:
      "Build local presence with a business page, contact options, useful links, and visibility inside the community.",
    promoButton: "Advertise my business",
  },
} as const;

function pageLangFromRoute(routeLang: SupportedLang): PageLang {
  return routeLang === "es" ? "es" : "en";
}

function appendLangToPath(path: string, lang: SupportedLang): string {
  const [base, hash] = path.split("#");
  const joiner = base.includes("?") ? "&" : "?";
  const withParam = `${base}${joiner}lang=${lang}`;
  return hash ? `${withParam}#${hash}` : withParam;
}

function buildExploreHref(lane: BusinessLaneKey, lang: SupportedLang): string {
  if (lane === "autos-dealer") {
    const params = new URLSearchParams({ lang, seller: "dealer" });
    return `${LANE_EXPLORE_PATH[lane]}?${params.toString()}`;
  }
  return appendLangToPath(LANE_EXPLORE_PATH[lane], lang);
}

function buildAdvertiseHref(lane: BusinessLaneKey, lang: SupportedLang): string {
  return appendLangToPath(LANE_ADVERTISE_PATH[lane], lang);
}

function buildBusinessAdvertiseEntryHref(lang: SupportedLang): string {
  const redirect = encodeURIComponent(`/clasificados/publicar?lang=${lang}`);
  return `/login?mode=post&lang=${lang}&redirect=${redirect}`;
}

function LaneMark({ lane }: { lane: BusinessLaneKey }) {
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
    case "ofertas-locales":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 8h16v12H4z" />
          <path d="M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
          <path d="M9 13h6M9 17h4" />
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
          <path d="M8 3v9M6 3h4" />
          <path d="M16 3v18M14 3h4" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      );
    case "comida-local":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 10h16" />
          <path d="M6 10V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
          <path d="M8 14h8" />
          <circle cx="9" cy="18" r="1.5" />
          <circle cx="15" cy="18" r="1.5" />
          <path d="M5 10l-1 4h16l-1-4" />
        </svg>
      );
    case "autos-dealer":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 18h16" />
          <path d="M6 18l1.5-5h9L18 18" />
          <circle cx="8" cy="18" r="1.5" />
          <circle cx="16" cy="18" r="1.5" />
          <path d="M9 13h6M10 8h4v5" />
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
    default:
      return null;
  }
}

function BusinessLaneCard({
  lane,
  lang,
  exploreHref,
  advertiseHref,
  exploreLabel,
}: {
  lane: BusinessLaneKey;
  lang: PageLang;
  exploreHref: string;
  advertiseHref: string;
  exploreLabel: string;
}) {
  const copy = LANE_COPY[lane];
  const label = lang === "es" ? copy.labelEs : copy.labelEn;
  const desc = lang === "es" ? copy.descEs : copy.descEn;
  const advertiseLabel = lang === "es" ? copy.advertiseEs : copy.advertiseEn;

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
          href={advertiseHref}
          className="inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2.5 text-center text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
        >
          {advertiseLabel}
        </Link>
      </div>
    </article>
  );
}

function NegociosLocalesInner() {
  const routeLang = resolveRouteLang(useSearchParams()?.get("lang"));
  const pageLang = pageLangFromRoute(routeLang);
  const t = PAGE_COPY[pageLang];
  const advertiseEntryHref = buildBusinessAdvertiseEntryHref(routeLang);

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
        {/* 1 — Business hero */}
        <section className="max-w-3xl" aria-labelledby="negocios-hero-title">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-[#556B3E]">{t.eyebrow}</p>
          <h1
            id="negocios-hero-title"
            className="mt-3 font-serif text-4xl font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl"
          >
            {t.title}
          </h1>
          <p className="mt-4 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{t.subtitle}</p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#sectores"
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
            >
              {t.ctaExplore}
            </a>
            <a
              href={advertiseEntryHref}
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
            >
              {t.ctaAdvertise}
            </a>
          </div>
        </section>

        {/* 2 — Business lane grid */}
        <section id="sectores" className="mt-14 sm:mt-16" aria-labelledby="negocios-lanes-title">
          <h2
            id="negocios-lanes-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sectionLanes}
          </h2>

          <ul className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2">
            {LANE_ORDER.map((lane) => (
              <li key={lane} className="flex h-full">
                <BusinessLaneCard
                  lane={lane}
                  lang={pageLang}
                  exploreHref={buildExploreHref(lane, routeLang)}
                  advertiseHref={buildAdvertiseHref(lane, routeLang)}
                  exploreLabel={t.explore}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* 3 — Business advertising CTA */}
        <section
          className="mt-14 rounded-2xl border border-[#C9A84A]/40 bg-[#2A4536] px-6 py-10 text-[#FFFDF7] shadow-[0_16px_40px_-20px_rgba(31,36,28,0.35)] sm:px-10 sm:py-12"
          aria-labelledby="negocios-promo-title"
        >
          <h2 id="negocios-promo-title" className="font-serif text-2xl font-bold leading-snug sm:text-[1.75rem]">
            {t.promoTitle}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#FAF6EE]/90 sm:text-[0.9375rem]">
            {t.promoDescription}
          </p>
          <a
            href={advertiseEntryHref}
            className="mt-8 inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
          >
            {t.promoButton}
          </a>
        </section>
      </div>
    </main>
  );
}

export default function NegociosLocalesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF6EE] px-4 pt-28">
          <div className="mx-auto max-w-6xl animate-pulse text-sm text-[#3D3428]">…</div>
        </main>
      }
    >
      <NegociosLocalesInner />
    </Suspense>
  );
}
