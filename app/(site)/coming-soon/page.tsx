import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

type Lang = "es" | "en";

const DEEP_RED = "#A30F18";
const DARK_RED = "#7E0D13";

function normalizeLang(v: string | undefined): Lang {
  return v === "en" ? "en" : "es";
}

const COPY = {
  es: {
    meta: {
      title: "Próximamente — Leonix Media",
      description:
        "Publicidad impresa en español. Exposición digital bilingüe. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "English",
    headerCta: "Únete al lanzamiento",
    badge: "PRÓXIMAMENTE",
    heroTitle: "Leonix Media",
    heroTagline: "Publicidad impresa en español.\nExposición digital bilingüe.",
    heroBody:
      "Conectando negocios locales con la comunidad latina a través de una revista premium, visibilidad digital y herramientas que generan acción.",
    cta1: "Anúnciate con nosotros",
    cta2: "Únete al lanzamiento",
    trust: ["Hecho para nuestra comunidad", "Confianza local", "Resultados reales"],
    slogan: "Que Ruja El León — Let The Lion Roar",
    navLabels: ["Inicio", "Anúnciate", "Ediciones", "Beneficios", "Sobre Nosotros", "Contacto"],
    magazine: {
      guide: "Guía de negocios locales",
      connect: "Conecta tu negocio con nuestra comunidad",
      advertise: "Anuncie aquí",
      partner: "Partner oficial",
      sample: "Ejemplo",
    },
    cats: {
      items: [
        { name: "Clasificados", sub: "Rentas, empleos y barrios" },
        {
          name: "Nuestros Negocios",
          sub: "Restaurantes, servicios, bienes raíces, autos y viajes",
        },
        { name: "Comunidad", sub: "Clases, recursos y conexiones locales" },
      ],
    },
    benefits: {
      items: [
        { title: "Revista mensual premium", body: "Contenido local que informa, inspira y conecta." },
        { title: "Edición digital semanal", body: "Accede desde cualquier dispositivo, donde estés." },
        { title: "QR + CTAs", body: "Conecta tu anuncio con llamadas, mensajes, mapas y más." },
        {
          title: "Un solo enlace para tu negocio",
          body: "Toda tu información, ofertas y redes en un solo lugar.",
        },
      ],
    },
    more: {
      title: "Más que un anuncio. Una presencia completa.",
      items: [
        "Revista impresa premium",
        "Exposición digital bilingüe",
        "QR codes que llevan a llamadas, mensajes, mapas y enlaces",
        "Página de negocio con contacto, redes, ofertas y reseñas",
        "Clasificados, cupones y descubrimiento local",
      ],
    },
    signup: {
      title: "Sé parte del lanzamiento",
      sub: "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
      placeholder: "Tu correo electrónico",
      cta: "Notifícame",
    },
    contact: {
      title: "¿Quieres anunciar tu negocio?",
      body: "Estamos conectando con negocios fundadores, restaurantes, servicios, tiendas, profesionales, patrocinadores y aliados comunitarios.",
      cta: "Contactar a Leonix",
    },
    footer: {
      locations: "San José · Silicon Valley · Bay Area · Comunidad Latina",
      rights: "Todos los derechos reservados",
    },
  },
  en: {
    meta: {
      title: "Coming Soon — Leonix Media",
      description:
        "Spanish print advertising. Bilingual digital exposure. San José · Silicon Valley · Bay Area.",
    },
    langSwitch: "Español",
    headerCta: "Join the launch",
    badge: "COMING SOON",
    heroTitle: "Leonix Media",
    heroTagline: "Print advertising in Spanish.\nBilingual digital exposure.",
    heroBody:
      "Connecting local businesses with the Latino community through a premium magazine, digital visibility and tools that drive action.",
    cta1: "Advertise with us",
    cta2: "Join the launch",
    trust: ["Made for our community", "Local trust", "Real results"],
    slogan: "Que Ruja El León — Let The Lion Roar",
    navLabels: ["Home", "Advertise", "Editions", "Benefits", "About Us", "Contact"],
    magazine: {
      guide: "Local business guide",
      connect: "Connect your business with our community",
      advertise: "Advertise here",
      partner: "Official partner",
      sample: "Sample",
    },
    cats: {
      items: [
        { name: "Classifieds", sub: "Rentals, jobs and neighborhoods" },
        {
          name: "Our Businesses",
          sub: "Restaurants, services, real estate, autos and travel",
        },
        { name: "Community", sub: "Classes, resources and local connections" },
      ],
    },
    benefits: {
      items: [
        { title: "Monthly premium magazine", body: "Local content that informs, inspires and connects." },
        { title: "Weekly digital edition", body: "Access from any device, wherever you are." },
        { title: "QR + CTAs", body: "Link your ad to calls, messages, maps and more." },
        {
          title: "One link for your business",
          body: "All your info, deals and networks in one place.",
        },
      ],
    },
    more: {
      title: "More than an ad. A complete presence.",
      items: [
        "Premium print magazine",
        "Bilingual digital exposure",
        "QR codes that drive calls, messages, maps and links",
        "Business page with contact, social, deals and reviews",
        "Classifieds, coupons and local discovery",
      ],
    },
    signup: {
      title: "Be part of the launch",
      sub: "Get news, opportunities and the official Leonix Media launch.",
      placeholder: "Your email address",
      cta: "Notify Me",
    },
    contact: {
      title: "Want to advertise your business?",
      body: "We are connecting with founding businesses, restaurants, services, stores, professionals, sponsors and community allies.",
      cta: "Contact Leonix",
    },
    footer: {
      locations: "San José · Silicon Valley · Bay Area · Latino Community",
      rights: "All rights reserved",
    },
  },
} as const;

const NAV_ANCHORS = ["inicio", "anunciate", "ediciones", "beneficios", "nosotros", "contacto"];

function MagazineCover({ lang }: { lang: Lang }) {
  const m = COPY[lang].magazine;
  return (
    <div
      className="relative w-full max-w-[min(100%,28rem)] lg:max-w-none"
      aria-label="Leonix Media — Vista previa de la revista"
      role="img"
    >
      <div
        className="relative overflow-hidden rounded-sm shadow-[0_32px_80px_-24px_rgba(42,36,22,0.45),0_8px_24px_-8px_rgba(126,13,19,0.35)]"
        style={{
          border: "4px solid var(--lx-lion)",
          background: "var(--lx-card)",
          transform: "perspective(1200px) rotateY(-6deg) rotateX(2deg)",
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4"
          style={{ background: DARK_RED, borderBottom: "3px solid var(--lx-lion)" }}
        >
          <Image
            src="/logo.png"
            alt="Leonix Media"
            width={140}
            height={48}
            className="h-10 w-auto object-contain sm:h-12"
          />
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
            VOL. 1 · 2026
          </span>
        </div>

        <div className="px-4 py-4 sm:px-5 sm:py-5" style={{ background: "var(--lx-page)" }}>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-[11px]" style={{ color: DEEP_RED }}>
            {m.guide}
          </p>
          <p className="mt-2 text-lg font-black leading-tight sm:text-xl" style={{ color: "var(--lx-text)" }}>
            Que Ruja El León
          </p>
          <p className="text-sm font-semibold sm:text-base" style={{ color: "var(--lx-olive)" }}>
            Let The Lion Roar
          </p>
          <p className="mt-3 text-xs leading-snug sm:text-sm" style={{ color: "var(--lx-muted)" }}>
            {m.connect}
          </p>
        </div>

        <div
          className="border-y px-4 py-3 sm:px-5"
          style={{ background: "var(--lx-olive)", borderColor: "var(--lx-lion)" }}
        >
          <p className="text-center text-xs font-black uppercase tracking-[0.18em] text-white sm:text-sm">
            {m.advertise}
          </p>
        </div>

        <div
          className="grid grid-cols-2 gap-px"
          style={{ background: "var(--lx-border)" }}
        >
          <div className="flex min-h-[5.5rem] flex-col justify-between p-3 sm:min-h-[6.25rem] sm:p-3.5" style={{ background: DARK_RED }}>
            <div>
              <p className="text-sm font-black leading-tight text-white sm:text-base">War Fitness</p>
              <p className="mt-1 text-[10px] text-white/75 sm:text-xs">Gym &amp; Entrenamiento</p>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wide sm:text-[11px]" style={{ color: "var(--lx-lion)" }}>
              {m.partner}
            </p>
          </div>
          <div className="flex min-h-[5.5rem] flex-col justify-between p-3 sm:min-h-[6.25rem] sm:p-3.5" style={{ background: "var(--lx-blue)" }}>
            <div>
              <p className="text-sm font-bold leading-tight text-white sm:text-base">Sample Law Office</p>
              <p className="mt-1 text-[10px] text-white/80 sm:text-xs">Inmigración · Familia</p>
            </div>
            <p className="text-[10px] italic text-white/55 sm:text-[11px]">{m.sample}</p>
          </div>
          <div className="flex min-h-[5.5rem] flex-col justify-between p-3 sm:min-h-[6.25rem] sm:p-3.5" style={{ background: DEEP_RED }}>
            <div>
              <p className="text-sm font-bold leading-tight text-white sm:text-base">Sample Restaurant</p>
              <p className="mt-1 text-[10px] text-white/80 sm:text-xs">Cocina auténtica</p>
            </div>
            <p className="text-[10px] italic text-white/55 sm:text-[11px]">{m.sample}</p>
          </div>
          <div
            className="flex min-h-[5.5rem] flex-col justify-between p-3 sm:min-h-[6.25rem] sm:p-3.5"
            style={{ background: "var(--lx-text)" }}
          >
            <div>
              <p className="text-sm font-bold leading-tight text-white sm:text-base">Sample Plumbing</p>
              <p className="mt-1 text-[10px] text-white/80 sm:text-xs">24/7 · Residencial</p>
            </div>
            <p className="text-[10px] italic text-white/55 sm:text-[11px]">{m.sample}</p>
          </div>
          <div
            className="col-span-2 flex min-h-[4.5rem] items-center justify-between gap-3 p-3 sm:min-h-[5rem] sm:p-3.5"
            style={{ background: "var(--lx-section)", borderTop: "2px solid var(--lx-lion)" }}
          >
            <div>
              <p className="text-sm font-bold sm:text-base" style={{ color: "var(--lx-text)" }}>
                Sample Auto Dealer
              </p>
              <p className="text-[10px] sm:text-xs" style={{ color: "var(--lx-muted)" }}>
                Autos · Financiamiento
              </p>
            </div>
            <span className="text-[10px] font-semibold italic sm:text-[11px]" style={{ color: "var(--lx-muted)" }}>
              {m.sample}
            </span>
          </div>
        </div>

        <div
          className="px-4 py-2.5 text-center sm:px-5 sm:py-3"
          style={{ background: DARK_RED, borderTop: "3px solid var(--lx-lion)" }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 sm:text-xs">
            Leonix Media · Gratis · Mensual
          </p>
        </div>
      </div>
      <div
        className="pointer-events-none absolute -inset-4 -z-10 rounded-lg opacity-40 blur-2xl"
        style={{ background: `linear-gradient(135deg, ${DEEP_RED}33, var(--lx-lion)44)` }}
        aria-hidden
      />
    </div>
  );
}

function PageHeader({ c, otherLang }: { c: (typeof COPY)[Lang]; otherLang: Lang }) {
  return (
    <header
      className="sticky top-0 z-50 w-full border-b backdrop-blur-md"
      style={{
        background: "color-mix(in srgb, var(--lx-page) 92%, transparent)",
        borderColor: "var(--lx-border)",
      }}
    >
      <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 lg:py-4">
        <Link href="#inicio" className="shrink-0">
          <Image
            src="/logo.png"
            alt="Leonix Media"
            width={180}
            height={64}
            className="h-11 w-auto object-contain sm:h-12 md:h-14"
            priority
          />
        </Link>

        <nav
          className="order-3 flex w-full flex-wrap items-center justify-center gap-x-1 gap-y-1 sm:order-2 sm:flex-1 sm:gap-x-0 lg:justify-end lg:gap-x-1"
          aria-label="Navegación principal"
        >
          {c.navLabels.map((label, i) => (
            <a
              key={label}
              href={`#${NAV_ANCHORS[i]}`}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold transition hover:underline sm:px-3 sm:text-sm"
              style={{ color: "var(--lx-text)" }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="order-2 ml-auto flex shrink-0 items-center gap-2 sm:order-3 sm:gap-3">
          <Link
            href={`?lang=${otherLang}`}
            className="rounded-full border px-3 py-2 text-xs font-semibold transition sm:text-sm"
            style={{
              borderColor: "var(--lx-border)",
              color: "var(--lx-text)",
              background: "var(--lx-card)",
            }}
          >
            {c.langSwitch}
          </Link>
          <Link
            href="#anunciate"
            className="hidden rounded-xl px-4 py-2.5 text-xs font-bold text-white transition sm:inline-block sm:text-sm"
            style={{ background: DEEP_RED }}
          >
            {c.headerCta}
          </Link>
        </div>
      </div>
    </header>
  );
}

export async function generateMetadata(props: {
  searchParams?: Promise<{ lang?: string }>;
}): Promise<Metadata> {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const c = COPY[lang];
  return { title: c.meta.title, description: c.meta.description };
}

export default async function ComingSoonPage(props: {
  searchParams?: Promise<{ lang?: string }>;
}) {
  const sp = (await props.searchParams) ?? {};
  const lang = normalizeLang(sp.lang);
  const c = COPY[lang];
  const otherLang: Lang = lang === "es" ? "en" : "es";
  const year = new Date().getFullYear();

  return (
    <main className="w-full overflow-x-hidden" style={{ background: "var(--lx-page)", color: "var(--lx-text)" }}>
      <PageHeader c={c} otherLang={otherLang} />

      {/* Hero */}
      <section
        id="inicio"
        className="relative w-full"
        style={{
          background: "linear-gradient(165deg, var(--lx-section) 0%, var(--lx-page) 55%, var(--lx-canvas) 100%)",
          borderBottom: "1px solid var(--lx-border)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div
            className="absolute -right-24 top-0 h-96 w-96 rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--lx-lion)" }}
          />
          <div
            className="absolute -left-16 bottom-0 h-72 w-72 rounded-full opacity-15 blur-3xl"
            style={{ background: "var(--lx-olive)" }}
          />
        </div>

        <div className="relative mx-auto grid max-w-[90rem] grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[52%_48%] lg:gap-12 lg:py-20 xl:py-24">
          <div className="flex min-w-0 flex-col gap-6 lg:gap-7">
            <span
              className="inline-flex w-fit items-center rounded-full border px-4 py-1.5 text-xs font-black uppercase tracking-[0.22em] sm:text-sm"
              style={{
                borderColor: "var(--lx-lion)",
                background: "var(--lx-card)",
                color: DEEP_RED,
              }}
            >
              {c.badge}
            </span>

            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl md:text-7xl lg:text-[4.25rem] xl:text-[4.75rem]">
              {c.heroTitle}
            </h1>

            <p
              className="text-2xl font-bold leading-snug whitespace-pre-line sm:text-3xl md:text-[2rem] md:leading-tight"
              style={{ color: "var(--lx-lion)" }}
            >
              {c.heroTagline}
            </p>

            <p className="max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: "var(--lx-muted)" }}>
              {c.heroBody}
            </p>

            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                href={`/contacto?lang=${lang}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl px-7 py-3.5 text-sm font-bold text-white transition sm:text-base"
                style={{ background: DEEP_RED }}
              >
                {c.cta1}
              </Link>
              <Link
                href="#anunciate"
                className="inline-flex min-h-[48px] items-center justify-center rounded-xl border-2 px-7 py-3.5 text-sm font-bold transition sm:text-base"
                style={{
                  borderColor: "var(--lx-olive)",
                  color: "var(--lx-olive)",
                  background: "var(--lx-card)",
                }}
              >
                {c.cta2}
              </Link>
            </div>

            <ul className="flex flex-wrap gap-2 sm:gap-3">
              {c.trust.map((t) => (
                <li
                  key={t}
                  className="flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold sm:text-sm"
                  style={{
                    borderColor: "var(--lx-border)",
                    background: "var(--lx-card)",
                    color: "var(--lx-text)",
                  }}
                >
                  <span className="font-bold" style={{ color: "var(--lx-olive)" }} aria-hidden>
                    ✓
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            <p className="text-sm font-medium italic sm:text-base" style={{ color: "var(--lx-muted)" }}>
              {c.slogan}
            </p>

            <Link
              href="#anunciate"
              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-6 py-3.5 text-sm font-bold text-white sm:hidden"
              style={{ background: DEEP_RED }}
            >
              {c.headerCta}
            </Link>
          </div>

          <div className="flex justify-center lg:justify-end lg:pr-2">
            <MagazineCover lang={lang} />
          </div>
        </div>
      </section>

      {/* Category strip */}
      <section id="ediciones" className="w-full px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-5 lg:gap-6">
          {c.cats.items.map((cat, i) => (
            <article
              key={cat.name}
              className="group flex min-h-[9rem] flex-col justify-end rounded-2xl border-2 p-6 transition sm:min-h-[10.5rem] sm:p-7 lg:min-h-[11.5rem]"
              style={{
                background: "var(--lx-card)",
                borderColor: i === 1 ? "var(--lx-lion)" : "var(--lx-border)",
                boxShadow: "0 12px 40px -20px rgba(42,36,22,0.18)",
              }}
            >
              <h2 className="text-xl font-black sm:text-2xl" style={{ color: DEEP_RED }}>
                {cat.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
                {cat.sub}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Benefits strip */}
      <section
        id="beneficios"
        className="w-full border-y px-4 py-14 sm:px-6 sm:py-16 lg:py-20"
        style={{ background: "var(--lx-canvas)", borderColor: "var(--lx-border)" }}
      >
        <div className="mx-auto grid max-w-[90rem] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {c.benefits.items.map((b, i) => (
            <article
              key={b.title}
              className="flex flex-col gap-3 rounded-2xl border p-6 sm:p-7"
              style={{
                background: "var(--lx-card)",
                borderColor: i === 0 ? "var(--lx-lion)" : "var(--lx-border)",
              }}
            >
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
                style={{ background: i % 2 === 0 ? DEEP_RED : "var(--lx-olive)" }}
                aria-hidden
              >
                {i + 1}
              </span>
              <h3 className="text-lg font-bold leading-snug sm:text-xl">{b.title}</h3>
              <p className="text-sm leading-relaxed sm:text-base" style={{ color: "var(--lx-muted)" }}>
                {b.body}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* More than an ad */}
      <section
        id="nosotros"
        className="w-full px-4 py-14 sm:px-6 sm:py-16 lg:py-20"
        style={{ background: "var(--lx-section)" }}
      >
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-black sm:text-3xl md:text-4xl">{c.more.title}</h2>
          <ul className="mt-10 flex flex-col gap-4 sm:gap-5">
            {c.more.items.map((item) => (
              <li key={item} className="flex items-start gap-4">
                <span
                  className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: DEEP_RED }}
                  aria-hidden
                >
                  ✦
                </span>
                <span className="text-base leading-relaxed sm:text-lg" style={{ color: "var(--lx-text)" }}>
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Signup strip */}
      <section id="anunciate" className="w-full px-4 py-14 sm:px-6 sm:py-16 lg:py-20" style={{ background: DEEP_RED }}>
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">{c.signup.title}</h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">{c.signup.sub}</p>
          <form
            action="/contacto"
            method="get"
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-stretch"
          >
            <input type="hidden" name="lang" value={lang} />
            <input
              type="email"
              name="prefillMessage"
              placeholder={c.signup.placeholder}
              className="min-h-[48px] flex-1 rounded-xl border px-4 py-3 text-base outline-none"
              style={{
                background: "rgba(255,253,247,0.12)",
                color: "#FFFDF7",
                borderColor: "rgba(255,253,247,0.28)",
              }}
              autoComplete="email"
            />
            <button
              type="submit"
              className="min-h-[48px] rounded-xl px-8 py-3 text-base font-bold transition"
              style={{ background: "var(--lx-lion)", color: DARK_RED }}
            >
              {c.signup.cta}
            </button>
          </form>
        </div>
      </section>

      {/* Contact strip */}
      <section
        id="contacto"
        className="w-full px-4 py-14 sm:px-6 sm:py-16 lg:py-20"
        style={{ background: "var(--lx-olive)" }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-black text-white sm:text-3xl md:text-4xl">{c.contact.title}</h2>
          <p className="mt-4 text-sm leading-relaxed text-white/90 sm:text-base">{c.contact.body}</p>
          <Link
            href={`/contacto?lang=${lang}`}
            className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-xl px-8 py-3.5 text-base font-bold transition"
            style={{ background: "var(--lx-page)", color: "var(--lx-olive)" }}
          >
            {c.contact.cta}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="w-full px-4 py-10 text-center sm:px-6 sm:py-12"
        style={{ background: "var(--lx-text)", color: "var(--lx-page)" }}
      >
        <p className="text-sm font-semibold sm:text-base">{c.footer.locations}</p>
        <p className="mt-3 text-sm italic opacity-80 sm:text-base">{c.slogan}</p>
        <p className="mt-6 text-xs opacity-55 sm:text-sm">
          © {year} Leonix Media / Leonix Global LLC · {c.footer.rights}
        </p>
      </footer>
    </main>
  );
}
