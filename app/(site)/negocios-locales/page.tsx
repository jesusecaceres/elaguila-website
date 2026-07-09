"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { resolveRouteLang, type SupportedLang } from "@/app/lib/language";
import { NegociosLocalesBusinessCard } from "./_components/NegociosLocalesBusinessCard";
import { NegociosLocalesFeaturedOfertasModule } from "./_components/NegociosLocalesFeaturedOfertasModule";
import { NegociosLocalesLaunchBanner } from "./_components/NegociosLocalesLaunchBanner";
import {
  buildBusinessAdvertiseEntryHref,
  buildNegociosAdvertiseHref,
  buildNegociosExploreHref,
  NEGOCIOS_LANE_COPY,
  NEGOCIOS_SECTOR_GRID_ORDER,
  type BusinessLaneKey,
} from "./_lib/negociosLocalesLanes";

type PageLang = "es" | "en";

const PAGE_COPY = {
  es: {
    eyebrow: "LEONIX NEGOCIOS LOCALES",
    title: "Negocios Locales",
    subtitle: "Encuentra negocios, servicios y profesionales cerca de tu comunidad.",
    description:
      "Explora servicios, restaurantes, dealers de autos y bienes raíces en un espacio creado para conectar negocios locales con familias, clientes y oportunidades reales.",
    ctaExplore: "Explorar negocios",
    ctaAdvertise: "Anunciar mi negocio",
    sectionLanes: "Explorar por sector",
    sponsorEyebrow: "REVISTA · DIGITAL · COMUNIDAD",
    sponsorTitle: "Patrocinadores de Leonix",
    sponsorSubtitle:
      "Negocios locales con presencia premium en Leonix Media, revista impresa/digital y campañas comunitarias.",
    sponsorSupporting:
      "Ideal para restaurantes, servicios, tiendas, dealers de autos, profesionales y marcas que quieren ser vistos por la comunidad.",
    sponsorCtaPrimary: "Quiero patrocinar en Leonix",
    sponsorCtaSecondary: "Ver sectores",
    sponsorChips: [
      "Revista impresa",
      "Revista digital",
      "Perfil de negocio",
      "Campañas locales",
      "Portada / premium",
      "Contacto directo",
    ],
    promoTitle: "Haz que tu negocio ruja con Leonix",
    promoDescription:
      "Crea presencia local con perfil de negocio, enlaces de contacto, opciones de revista y visibilidad digital para tu comunidad.",
    promoButton: "Anunciar mi negocio",
  },
  en: {
    eyebrow: "LEONIX LOCAL BUSINESSES",
    title: "Local Businesses",
    subtitle: "Find businesses, services, and professionals near your community.",
    description:
      "Explore services, restaurants, auto dealers, and real estate in one place built to connect local businesses with families, customers, and real opportunities.",
    ctaExplore: "Explore businesses",
    ctaAdvertise: "Advertise my business",
    sectionLanes: "Explore by sector",
    sponsorEyebrow: "MAGAZINE · DIGITAL · COMMUNITY",
    sponsorTitle: "Leonix Sponsors",
    sponsorSubtitle:
      "Local businesses with premium visibility across Leonix Media, print/digital magazine, and community campaigns.",
    sponsorSupporting:
      "Built for restaurants, services, shops, auto dealers, professionals, and brands that want to be seen by the community.",
    sponsorCtaPrimary: "Sponsor with Leonix",
    sponsorCtaSecondary: "View sectors",
    sponsorChips: [
      "Print magazine",
      "Digital magazine",
      "Business profile",
      "Local campaigns",
      "Cover / premium",
      "Direct contact",
    ],
    promoTitle: "Help your business roar with Leonix",
    promoDescription:
      "Build local presence with a business profile, contact links, magazine options, and digital visibility for your community.",
    promoButton: "Advertise my business",
  },
} as const;

const PRIORITY_LANES = new Set<BusinessLaneKey>(["servicios", "restaurantes", "autos-dealer"]);

function pageLangFromRoute(routeLang: SupportedLang): PageLang {
  return routeLang === "es" ? "es" : "en";
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
            <Link
              href={advertiseEntryHref}
              className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF]"
            >
              {t.ctaAdvertise}
            </Link>
          </div>
        </section>

        <div className="mt-10 max-w-3xl">
          <NegociosLocalesLaunchBanner routeLang={routeLang} />
        </div>

        <div className="mt-8">
          <NegociosLocalesFeaturedOfertasModule routeLang={routeLang} />
        </div>

        <section
          className="mt-12 rounded-2xl border border-[#C9A84A]/35 bg-[#FFFDF7]/95 p-5 sm:mt-14 sm:p-6"
          aria-labelledby="negocios-sponsors-title"
        >
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{t.sponsorEyebrow}</p>
          <h2
            id="negocios-sponsors-title"
            className="mt-2 font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sponsorTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{t.sponsorSubtitle}</p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-[#5C5346] sm:text-sm">{t.sponsorSupporting}</p>

          <div className="mt-5 flex flex-wrap gap-2 sm:mt-6">
            {t.sponsorChips.map((chip) => (
              <span
                key={chip}
                className="inline-flex rounded-full border border-[#C9A84A]/40 bg-[#FAF6EE] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6E5418] sm:text-[11px]"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link
              href={advertiseEntryHref}
              className="inline-flex min-h-[2.625rem] items-center justify-center rounded-full bg-[#7A1E2C] px-6 py-2 text-sm font-bold text-[#FFFDF7] shadow-[0_8px_24px_-12px_rgba(122,30,44,0.4)] transition hover:bg-[#5e1721] sm:min-h-[2.75rem] sm:px-8 sm:py-2.5"
            >
              {t.sponsorCtaPrimary}
            </Link>
            <a
              href="#sectores"
              className="inline-flex min-h-[2.625rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/70 bg-[#FFFDF7] px-6 py-2 text-sm font-bold text-[#3D3428] transition hover:border-[#C9A84A] hover:bg-[#FBF7EF] sm:min-h-[2.75rem] sm:px-8 sm:py-2.5"
            >
              {t.sponsorCtaSecondary}
            </a>
          </div>
        </section>

        <section id="sectores" className="mt-14 sm:mt-16" aria-labelledby="negocios-lanes-title">
          <h2
            id="negocios-lanes-title"
            className="font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {t.sectionLanes}
          </h2>

          <ul className="mt-8 grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {NEGOCIOS_SECTOR_GRID_ORDER.map((lane) => {
              const copy = NEGOCIOS_LANE_COPY[lane];
              const label = pageLang === "es" ? copy.labelEs : copy.labelEn;
              const desc = pageLang === "es" ? copy.descEs : copy.descEn;
              const note = pageLang === "es" ? copy.noteEs : copy.noteEn;
              const advertiseLabel = pageLang === "es" ? copy.advertiseEs : copy.advertiseEn;
              const priority = PRIORITY_LANES.has(lane);
              const accent = lane === "autos-dealer" ? "gold" : undefined;

              return (
                <li key={lane} className="flex h-full">
                  <NegociosLocalesBusinessCard
                    lang={routeLang}
                    browseHref={buildNegociosExploreHref(lane, routeLang)}
                    advertiseHref={buildNegociosAdvertiseHref(lane, routeLang)}
                    label={label}
                    description={desc}
                    advertiseLabel={advertiseLabel}
                    note={note}
                    priority={priority}
                    accent={accent}
                    icon={<LaneMark lane={lane} />}
                  />
                </li>
              );
            })}
          </ul>
        </section>

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
          <Link
            href={advertiseEntryHref}
            className="mt-8 inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.45)] transition hover:bg-[#5e1721]"
          >
            {t.promoButton}
          </Link>
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
