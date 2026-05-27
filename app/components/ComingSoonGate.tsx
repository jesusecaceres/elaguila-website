"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState } from "react";

type Lang = "es" | "en";

type NavItem = { label: string; href: string };

type CategoryCard = { title: string; subtitle: string; tagline: string };

type FeatureItem = { title: string; description: string };

type Copy = {
  langToggle: { es: string; en: string };
  nav: NavItem[];
  navLaunch: string;
  badge: string;
  heroTitle: string;
  heroLines: [string, string, string];
  heroParagraph: string;
  ctaAdvertise: string;
  ctaMediaKit: string;
  ctaLaunch: string;
  trustChips: [string, string, string];
  cards: CategoryCard[];
  features: FeatureItem[];
  launchTitle: string;
  launchBody: string;
  emailPlaceholder: string;
  notifyButton: string;
  multilingualTitle: string;
  multilingualBody: string;
  magazineAlt: string;
  socialAria: string;
};

const COPY: Record<Lang, Copy> = {
  es: {
    langToggle: { es: "Español", en: "English" },
    nav: [
      { label: "Inicio", href: "#inicio" },
      { label: "Anúnciate", href: "#anunciate" },
      { label: "Ediciones", href: "#ediciones" },
      { label: "Beneficios", href: "#beneficios" },
      { label: "Sobre Nosotros", href: "#sobre" },
      { label: "Contacto", href: "/contact?lang=es" },
    ],
    navLaunch: "Únete al lanzamiento",
    badge: "PRÓXIMAMENTE",
    heroTitle: "Leonix Media",
    heroLines: [
      "Publicidad impresa en español.",
      "Exposición digital bilingüe.",
      "Acceso multilingüe por QR.",
    ],
    heroParagraph:
      "Conectando negocios locales con la comunidad latina a través de una revista premium, visibilidad digital y herramientas que generan acción.",
    ctaAdvertise: "Anúnciate con nosotros",
    ctaMediaKit: "Descargar Media Kit",
    ctaLaunch: "Únete al lanzamiento",
    trustChips: ["Hecho para nuestra comunidad", "Confianza local", "Resultados reales"],
    cards: [
      {
        title: "Clasificados",
        subtitle: "Rentas, empleos y varios.",
        tagline: "¡Vende tus cosas gratis!",
      },
      {
        title: "Nuestros Negocios",
        subtitle: "Restaurantes, servicios, bienes raíces, autos y viajes.",
        tagline: "",
      },
      {
        title: "Comunidad",
        subtitle: "Clases, recursos y conexiones locales.",
        tagline: "",
      },
    ],
    features: [
      {
        title: "Revista mensual premium",
        description: "Contenido local que informa, inspira y conecta.",
      },
      {
        title: "Edición digital semanal",
        description: "Accede desde cualquier dispositivo, donde estés.",
      },
      {
        title: "QR + CTAs",
        description: "Conecta tu anuncio con llamadas, mensajes, mapas y más.",
      },
      {
        title: "Un solo enlace para tu negocio",
        description: "Toda tu información, ofertas y redes en un solo lugar.",
      },
    ],
    launchTitle: "Sé parte del lanzamiento",
    launchBody:
      "Recibe noticias, oportunidades y el lanzamiento oficial de Leonix Media.",
    emailPlaceholder: "Tu correo electrónico",
    notifyButton: "Notifícame",
    multilingualTitle: "Escanea. Traduce. Conecta.",
    multilingualBody:
      "Los lectores pueden usar herramientas de escaneo y traducción para ver contenido en su idioma preferido.",
    magazineAlt: "Vista previa decorativa de la revista Leonix Media",
    socialAria: "Redes sociales (próximamente)",
  },
  en: {
    langToggle: { es: "Español", en: "English" },
    nav: [
      { label: "Home", href: "#inicio" },
      { label: "Advertise", href: "#anunciate" },
      { label: "Editions", href: "#ediciones" },
      { label: "Benefits", href: "#beneficios" },
      { label: "About Us", href: "#sobre" },
      { label: "Contact", href: "/contact?lang=en" },
    ],
    navLaunch: "Join the launch",
    badge: "COMING SOON",
    heroTitle: "Leonix Media",
    heroLines: [
      "Spanish print advertising.",
      "Bilingual digital exposure.",
      "Multilingual access through QR.",
    ],
    heroParagraph:
      "Connecting local businesses with the Latino community through a premium magazine, digital visibility and action-driven tools.",
    ctaAdvertise: "Advertise with us",
    ctaMediaKit: "Download Media Kit",
    ctaLaunch: "Join the launch",
    trustChips: ["Built for our community", "Local trust", "Real results"],
    cards: [
      {
        title: "Classifieds",
        subtitle: "Rentals, jobs and misc.",
        tagline: "Sell your items free!",
      },
      {
        title: "Local Businesses",
        subtitle: "Restaurants, services, real estate, autos and travel.",
        tagline: "",
      },
      {
        title: "Community",
        subtitle: "Classes, resources and local connections.",
        tagline: "",
      },
    ],
    features: [
      {
        title: "Premium monthly magazine",
        description: "Local content that informs, inspires and connects.",
      },
      {
        title: "Weekly digital edition",
        description: "Access from any device, wherever you are.",
      },
      {
        title: "QR + CTAs",
        description: "Connect your ad with calls, messages, maps and more.",
      },
      {
        title: "One link for your business",
        description: "All your info, offers and socials in one place.",
      },
    ],
    launchTitle: "Be part of the launch",
    launchBody: "Receive news, opportunities and the official Leonix Media launch.",
    emailPlaceholder: "Your email address",
    notifyButton: "Notify Me",
    multilingualTitle: "Scan. Translate. Connect.",
    multilingualBody:
      "Readers can use scan-and-translate tools to view content in their preferred language.",
    magazineAlt: "Decorative Leonix Media magazine preview",
    socialAria: "Social media (coming soon)",
  },
};

function mediaKitHref(lang: Lang) {
  return `/media-kit?lang=${lang}`;
}

function launchHref(lang: Lang) {
  return `/contact?interest=launch&lang=${lang}`;
}

function advertiseHref(lang: Lang) {
  return `/contact?lang=${lang}`;
}

function newsletterAction(lang: Lang) {
  return `/newsletter?source=coming-soon&lang=${lang}`;
}

function SocialPlaceholder({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[#D6C7AD] bg-[#FFFDF7] text-sm font-semibold text-[#5F6258] opacity-70"
    >
      ···
    </button>
  );
}

export function ComingSoonGate() {
  const [lang, setLang] = useState<Lang>("es");
  const emailId = useId();
  const t = COPY[lang];

  useEffect(() => {
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, []);

  return (
    <div
      lang={lang}
      className="fixed inset-0 z-[9999] overflow-y-auto overscroll-none bg-[#F8F4EA] text-[#1F241C]"
      role="dialog"
      aria-modal="true"
      aria-label={lang === "es" ? "Leonix Media — Próximamente" : "Leonix Media — Coming Soon"}
    >
      <header className="sticky top-0 z-10 border-b border-[#D6C7AD]/80 bg-[#FBF7EF]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="#inicio" className="shrink-0">
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                width={140}
                height={48}
                className="h-10 w-auto object-contain sm:h-11"
                priority
              />
            </Link>
            <div
              className="flex rounded-full border border-[#D6C7AD] bg-[#FFFDF7] p-0.5 text-xs font-semibold sm:text-sm"
              role="group"
              aria-label={lang === "es" ? "Idioma" : "Language"}
            >
              {(["es", "en"] as const).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    lang === code
                      ? "bg-[#7A1E2C] text-white shadow-sm"
                      : "text-[#3D3428] hover:bg-[#E8DCC5]/60"
                  }`}
                >
                  {COPY[code].langToggle[code]}
                </button>
              ))}
            </div>
          </div>
          <nav
            className="hidden flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm font-medium text-[#3D3428] lg:flex"
            aria-label={lang === "es" ? "Principal" : "Main"}
          >
            {t.nav.map((item) => (
              <Link key={item.label} href={item.href} className="hover:text-[#7A1E2C]">
                {item.label}
              </Link>
            ))}
            <Link
              href={launchHref(lang)}
              className="rounded-full bg-[#C9A84A] px-3 py-1.5 text-[#1F241C] shadow-sm hover:bg-[#d4bc6a]"
            >
              {t.navLaunch}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
        <section id="inicio" className="scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.95fr)] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-[#7A1E2C]/30 bg-[#7A1E2C]/10 px-3 py-1 text-xs font-bold tracking-wide text-[#7A1E2C]">
                {t.badge}
              </p>
              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-[#7A1E2C] sm:text-5xl">
                {t.heroTitle}
              </h1>
              <ul className="mt-4 space-y-1 text-lg font-semibold text-[#556B3E] sm:text-xl">
                {t.heroLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3D3428] sm:text-lg">
                {t.heroParagraph}
              </p>
              <div id="anunciate" className="mt-8 flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={advertiseHref(lang)}
                  className="inline-flex items-center justify-center rounded-lg bg-[#7A1E2C] px-6 py-3 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#5e1721] sm:text-base"
                >
                  {t.ctaAdvertise}
                </Link>
                <Link
                  href={mediaKitHref(lang)}
                  className="inline-flex items-center justify-center rounded-lg border-2 border-[#C9A84A] bg-[#FFFDF7] px-6 py-3 text-center text-sm font-bold text-[#1F241C] transition hover:bg-[#FBF7EF] sm:text-base"
                >
                  {t.ctaMediaKit}
                </Link>
                <Link
                  href={launchHref(lang)}
                  className="inline-flex items-center justify-center rounded-lg bg-[#556B3E] px-6 py-3 text-center text-sm font-bold text-white shadow-md transition hover:bg-[#445632] sm:text-base"
                >
                  {t.ctaLaunch}
                </Link>
              </div>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label={lang === "es" ? "Confianza" : "Trust"}>
                {t.trustChips.map((chip) => (
                  <li
                    key={chip}
                    className="rounded-full border border-[#D6C7AD] bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#3D3428] sm:text-sm"
                  >
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="ediciones"
              className="scroll-mt-24 overflow-hidden rounded-2xl border-2 border-[#C9A84A]/50 bg-[#FFFDF7] shadow-lg"
            >
              <div className="border-b border-[#D6C7AD] bg-[#7A1E2C] px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-[#F8F4EA]">
                {lang === "es" ? "Revista & digital" : "Magazine & digital"}
              </div>
              <div className="relative aspect-[4/5] w-full max-h-[520px] sm:aspect-[3/4]">
                <Image
                  src="/magazine/leonix-media-launch-es.png"
                  alt={t.magazineAlt}
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 1024px) 100vw, 420px"
                  priority
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#F8F4EA]/90 via-transparent to-transparent"
                  aria-hidden
                />
              </div>
              <p className="px-4 py-3 text-center text-xs text-[#5F6258]">
                {lang === "es"
                  ? "Vista previa visual — el contenido interactivo vive en esta página."
                  : "Visual preview — interactive content lives on this page."}
              </p>
            </div>
          </div>
        </section>

        <section id="beneficios" className="mt-14 scroll-mt-24">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.cards.map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-sm"
              >
                <h2 className="text-lg font-bold text-[#7A1E2C]">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{card.subtitle}</p>
                {card.tagline ? (
                  <p className="mt-3 text-sm font-bold text-[#C9A84A]">{card.tagline}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <div className="grid gap-4 sm:grid-cols-2">
            {t.features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-xl border-l-4 border-[#C9A84A] bg-[#FBF7EF] p-5 pl-4"
              >
                <h3 className="text-base font-bold text-[#556B3E]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="sobre"
          className="mt-14 scroll-mt-24 rounded-2xl border border-[#7A1E2C]/25 bg-gradient-to-br from-[#7A1E2C] to-[#5e1721] p-6 text-[#F8F4EA] sm:p-8"
        >
          <h2 className="text-xl font-bold sm:text-2xl">{t.launchTitle}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed opacity-95 sm:text-base">{t.launchBody}</p>
          <form
            className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row"
            action={newsletterAction(lang)}
            method="get"
          >
            <label htmlFor={emailId} className="sr-only">
              {t.emailPlaceholder}
            </label>
            <input
              id={emailId}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t.emailPlaceholder}
              className="min-w-0 flex-1 rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] placeholder:text-[#5F6258]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#C9A84A] px-6 py-3 text-sm font-bold text-[#1F241C] shadow-md transition hover:bg-[#d4bc6a] sm:text-base"
            >
              {t.notifyButton}
            </button>
          </form>
        </section>

        <section className="mt-10 flex flex-col gap-6 border-t border-[#D6C7AD] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <h2 className="text-lg font-bold text-[#7A1E2C]">{t.multilingualTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{t.multilingualBody}</p>
          </div>
          <div className="flex gap-2" aria-label={t.socialAria}>
            <SocialPlaceholder label="Facebook" />
            <SocialPlaceholder label="Instagram" />
            <SocialPlaceholder label="LinkedIn" />
          </div>
        </section>
      </main>
    </div>
  );
}
