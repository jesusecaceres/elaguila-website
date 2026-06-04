"use client";

import Link from "next/link";
import { LEONIX_GLOBAL_CONTACT_PATH } from "@/app/data/leonixGlobalContact";

type Lang = "es" | "en";

const PAGE_BG = "#FAF6EE";
const CARD_BG = "#FFFDF7";
const BURGUNDY = "#7A1E2C";
const GOLD_BORDER = "#D6C7AD";
const CHARCOAL = "#2A2826";
const MUTED = "#5C5346";
const GREEN_ACCENT = "#556B3E";

function contactHref(lang: Lang): string {
  return `${LEONIX_GLOBAL_CONTACT_PATH}?lang=${lang}`;
}

function PromoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="6" y="10" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 14h20M16 10V6M12 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 18v4M13 20h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type IconKey = "apparel" | "calendar" | "events" | "business" | "print" | "package";

function CategoryIcon({ kind }: { kind: IconKey }) {
  const cls = "h-6 w-6";
  switch (kind) {
    case "apparel":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M8 4l4 3 4-3v3l-2 14H10L8 7V4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "calendar":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M4 9h16M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "events":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 10h16v10H4V10z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 6v4M16 6v4M4 14h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "business":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 20V8l8-4 8 4v12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M9 20v-6h6v6" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "print":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <rect x="5" y="4" width="14" height="16" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 8h16v12H4V8z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 8V6a4 4 0 018 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

const COPY = {
  es: {
    eyebrow: "LEONIX PRODUCTOS PROMOCIONALES",
    title: "Productos Promocionales",
    subtitle: "Artículos personalizados para que tu marca llegue más lejos.",
    description:
      "Desde playeras, gorras y calendarios hasta materiales para eventos y campañas locales, Leonix ayuda a negocios a convertir su marca en presencia física y memorable.",
    ctaPrimary: "Solicitar información",
    ctaSecondary: "Ver opciones",
    categoriesTitle: "Categorías de productos",
    categoriesLead: "Opciones profesionales para visibilidad, eventos y presencia de marca — sin inventario ficticio ni precios publicados aquí.",
    categories: [
      {
        key: "apparel" as const,
        title: "Ropa personalizada",
        desc: "Playeras, gorras y prendas con tu marca para equipos, eventos o clientes.",
        link: "Consultar opciones",
      },
      {
        key: "calendar" as const,
        title: "Calendarios",
        desc: "Calendarios impresos para mantener tu negocio visible durante todo el año.",
        link: "Consultar opciones",
      },
      {
        key: "events" as const,
        title: "Material para eventos",
        desc: "Artículos y materiales para ferias, lanzamientos, iglesias, escuelas y campañas.",
        link: "Consultar opciones",
      },
      {
        key: "business" as const,
        title: "Artículos para negocios",
        desc: "Productos útiles para clientes, empleados y presencia local.",
        link: "Consultar opciones",
      },
      {
        key: "print" as const,
        title: "Impresos promocionales",
        desc: "Flyers, tarjetas, menús, inserts y materiales para conectar con más personas.",
        link: "Consultar opciones",
      },
      {
        key: "package" as const,
        title: "Paquetes personalizados",
        desc: "Combinaciones preparadas según tu campaña, presupuesto y objetivo.",
        link: "Consultar opciones",
      },
    ],
    useCasesTitle: "Hecho para negocios que quieren ser recordados",
    useCases: [
      "Lanzamientos y eventos",
      "Regalos para clientes",
      "Presencia en mostradores",
      "Campañas con QR",
      "Promociones de temporada",
      "Distribución junto a la revista",
    ],
    processTitle: "Cómo funciona",
    processSteps: [
      "Cuéntanos qué necesitas",
      "Revisamos opciones y cantidades",
      "Preparamos propuesta",
      "Producimos y coordinamos entrega",
    ],
    ctaBandTitle: "¿Quieres crear productos con tu marca?",
    ctaBandDesc:
      "Cuéntanos qué producto tienes en mente y te ayudamos a preparar una opción profesional para tu negocio.",
    ctaBandBtn: "Solicitar información",
    magazineNote:
      "Ideal para combinar con campañas locales, distribución de revista y promoción de negocios en Leonix.",
  },
  en: {
    eyebrow: "LEONIX PROMOTIONAL PRODUCTS",
    title: "Promotional Products",
    subtitle: "Custom products that help your brand go further.",
    description:
      "From shirts, hats, and calendars to materials for events and local campaigns, Leonix helps businesses turn their brand into a physical, memorable presence.",
    ctaPrimary: "Request information",
    ctaSecondary: "View options",
    categoriesTitle: "Product categories",
    categoriesLead:
      "Professional options for visibility, events, and brand presence — no fictional inventory or published pricing on this page.",
    categories: [
      {
        key: "apparel" as const,
        title: "Custom apparel",
        desc: "Shirts, hats, and branded wear for teams, events, or customers.",
        link: "Ask about options",
      },
      {
        key: "calendar" as const,
        title: "Calendars",
        desc: "Printed calendars to keep your business visible all year.",
        link: "Ask about options",
      },
      {
        key: "events" as const,
        title: "Event materials",
        desc: "Items for fairs, launches, churches, schools, and campaigns.",
        link: "Ask about options",
      },
      {
        key: "business" as const,
        title: "Business items",
        desc: "Useful products for customers, staff, and local presence.",
        link: "Ask about options",
      },
      {
        key: "print" as const,
        title: "Promotional print",
        desc: "Flyers, cards, menus, inserts, and materials to reach more people.",
        link: "Ask about options",
      },
      {
        key: "package" as const,
        title: "Custom packages",
        desc: "Bundles tailored to your campaign, budget, and goals.",
        link: "Ask about options",
      },
    ],
    useCasesTitle: "Built for businesses that want to be remembered",
    useCases: [
      "Launches and events",
      "Client gifts",
      "Counter and storefront presence",
      "QR-linked campaigns",
      "Seasonal promotions",
      "Distribution alongside the magazine",
    ],
    processTitle: "How it works",
    processSteps: [
      "Tell us what you need",
      "We review options and quantities",
      "We prepare a proposal",
      "We produce and coordinate delivery",
    ],
    ctaBandTitle: "Want to create products with your brand?",
    ctaBandDesc:
      "Tell us what product you have in mind and we’ll help prepare a professional option for your business.",
    ctaBandBtn: "Request information",
    magazineNote:
      "A strong fit for local campaigns, magazine distribution, and Leonix business promotion.",
  },
} as const;

export function ProductCatalog({ lang }: { lang: Lang }) {
  const t = COPY[lang];
  const contact = contactHref(lang);

  return (
    <div className="min-h-screen overflow-x-hidden pb-16" style={{ background: PAGE_BG, color: CHARCOAL }}>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:py-12">
        {/* Hero */}
        <section
          className="relative overflow-hidden rounded-xl border px-5 py-7 shadow-[0_12px_40px_-24px_rgba(42,36,22,0.22)] sm:px-8 sm:py-9"
          style={{ borderColor: GOLD_BORDER, background: CARD_BG }}
          aria-labelledby="pp-hero-title"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_0%_0%,rgba(213,181,118,0.14),transparent_55%),linear-gradient(135deg,rgba(255,253,247,0.98),rgba(250,246,238,0.92))]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
            <span
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border text-[#7A1E2C]"
              style={{ borderColor: GOLD_BORDER, background: PAGE_BG }}
            >
              <PromoMark />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.14em]" style={{ color: GREEN_ACCENT }}>
                {t.eyebrow}
              </p>
              <h1 id="pp-hero-title" className="mt-2 font-serif text-2xl font-bold leading-tight sm:text-[1.85rem]">
                {t.title}
              </h1>
              <p className="mt-2 text-base font-semibold leading-snug" style={{ color: MUTED }}>
                {t.subtitle}
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed sm:text-[0.9375rem]">{t.description}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={contact}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-6 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721]"
                >
                  {t.ctaPrimary}
                </Link>
                <a
                  href="#pp-opciones"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border px-6 text-sm font-bold transition hover:bg-[#FAF6EE]"
                  style={{ borderColor: GOLD_BORDER, color: BURGUNDY }}
                >
                  {t.ctaSecondary}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section id="pp-opciones" className="mt-10 scroll-mt-6 sm:mt-12" aria-labelledby="pp-categories-title">
          <h2 id="pp-categories-title" className="font-serif text-xl font-bold sm:text-2xl">
            {t.categoriesTitle}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: MUTED }}>
            {t.categoriesLead}
          </p>
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.categories.map((cat) => (
              <li key={cat.key} className="flex h-full">
                <article
                  className="flex h-full w-full flex-col rounded-lg border p-5 shadow-[0_8px_28px_-18px_rgba(42,36,22,0.18)]"
                  style={{ borderColor: GOLD_BORDER, background: CARD_BG }}
                >
                  <span
                    className="inline-flex h-11 w-11 items-center justify-center rounded-md border"
                    style={{ borderColor: `${GOLD_BORDER}99`, color: GREEN_ACCENT, background: PAGE_BG }}
                  >
                    <CategoryIcon kind={cat.key} />
                  </span>
                  <h3 className="mt-4 font-serif text-lg font-semibold">{cat.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed" style={{ color: MUTED }}>
                    {cat.desc}
                  </p>
                  <Link
                    href={contact}
                    className="mt-4 inline-flex text-sm font-bold hover:underline"
                    style={{ color: BURGUNDY }}
                  >
                    {cat.link} →
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        </section>

        {/* Use cases */}
        <section className="mt-10 sm:mt-12" aria-labelledby="pp-usecases-title">
          <div
            className="rounded-xl border px-5 py-7 sm:px-8"
            style={{ borderColor: GOLD_BORDER, background: CARD_BG }}
          >
            <h2 id="pp-usecases-title" className="font-serif text-xl font-bold sm:text-2xl">
              {t.useCasesTitle}
            </h2>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {t.useCases.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm font-medium"
                  style={{ borderColor: `${GOLD_BORDER}80`, background: PAGE_BG }}
                >
                  <span
                    className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: GREEN_ACCENT }}
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed" style={{ color: MUTED }}>
              {t.magazineNote}
            </p>
          </div>
        </section>

        {/* Process */}
        <section className="mt-10 sm:mt-12" aria-labelledby="pp-process-title">
          <h2 id="pp-process-title" className="font-serif text-xl font-bold sm:text-2xl">
            {t.processTitle}
          </h2>
          <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.processSteps.map((step, i) => (
              <li
                key={step}
                className="rounded-lg border px-4 py-5"
                style={{ borderColor: GOLD_BORDER, background: CARD_BG }}
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-bold text-[#FFFDF7]"
                  style={{ background: GREEN_ACCENT }}
                  aria-hidden
                >
                  {i + 1}
                </span>
                <p className="mt-3 text-sm font-semibold leading-snug">{step}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* CTA */}
        <section
          className="mt-10 rounded-xl border px-6 py-8 text-center sm:mt-12 sm:px-10 sm:py-10"
          style={{ borderColor: GOLD_BORDER, background: `linear-gradient(165deg, ${CARD_BG}, ${PAGE_BG})` }}
          aria-labelledby="pp-cta-title"
        >
          <h2 id="pp-cta-title" className="font-serif text-xl font-bold sm:text-2xl">
            {t.ctaBandTitle}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed" style={{ color: MUTED }}>
            {t.ctaBandDesc}
          </p>
          <Link
            href={contact}
            className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-lg px-8 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-12px_rgba(122,30,44,0.45)] transition hover:opacity-95"
            style={{ background: BURGUNDY }}
          >
            {t.ctaBandBtn}
          </Link>
        </section>
      </div>
    </div>
  );
}
