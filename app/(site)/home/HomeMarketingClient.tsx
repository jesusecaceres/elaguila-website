"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { HomeMarketingResolved } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import {
  LEONIX_MAGAZINE_LAUNCH_COVER,
  leonixBodyClass,
  leonixPrimaryCtaClass,
  leonixSecondaryCtaClass,
  leonixSectionEyebrowClass,
  leonixSectionTitleClass,
} from "@/app/lib/leonixPremiumBrand";

export function HomeMarketingClient({ content }: { content: HomeMarketingResolved }) {
  return (
    <Suspense fallback={null}>
      <HomeMarketingInner content={content} />
    </Suspense>
  );
}

type Lang = "es" | "en";

const COPY = {
  es: {
    heroBadge: "Medios locales premium",
    valueLines: [
      { plain: "Publicidad impresa en ", accent: "español", suffix: "." },
      { plain: "Exposición digital ", accent: "bilingüe", suffix: "." },
      { plain: "Conexión ", accent: "comunitaria", suffix: " y visibilidad empresarial." },
    ],
    pillarsEyebrow: "NUESTRO ECOSISTEMA",
    pillarsTitle: "Tres pilares para conectar negocios y comunidad",
    pillarsIntro:
      "Leonix Media reúne clasificados, negocios locales y recursos comunitarios en una plataforma pensada para el Bay Area y el norte de California.",
    pillarClasificadosTitle: "Clasificados",
    pillarClasificadosBody:
      "Anuncios locales organizados por categoría — desde autos y bienes raíces hasta empleos y más — con presencia bilingüe.",
    pillarNegociosTitle: "Negocios Locales",
    pillarNegociosBody:
      "Perfiles empresariales con teléfono, ubicación, fotos y enlaces de contacto para que los clientes encuentren y confíen en tu negocio.",
    pillarComunidadTitle: "Recursos Comunitarios",
    pillarComunidadBody:
      "Eventos, clases y conexiones comunitarias que mantienen viva la red local que Leonix Media sirve.",
    ecosystemEyebrow: "PRESENCIA COMPLETA",
    ecosystemTitle: "Revista impresa, digital y acción real",
    ecosystemIntro:
      "Más que un anuncio: una presencia editorial premium que conecta la revista impresa con herramientas digitales y acciones concretas.",
    ecosystemPrint: "Revista impresa premium",
    ecosystemPrintBody: "Tu negocio en una publicación diseñada para la comunidad latina y multicultural local.",
    ecosystemDigital: "Edición digital bilingüe",
    ecosystemDigitalBody: "Presencia digital clara, profesional y fácil de compartir desde cualquier dispositivo.",
    ecosystemQr: "QR y acciones reales",
    ecosystemQrBody: "Del anuncio impreso al celular: llamadas, mapas, mensajes y enlaces en un solo paso.",
    ecosystemHub: "Un hub empresarial conectado",
    ecosystemHubBody: "Negocios Locales organiza tu información en un solo lugar dentro del ecosistema Leonix.",
    advertisersEyebrow: "PATROCINADORES PREMIUM",
    advertisersTitle: "Espacio reservado para anunciantes destacados",
    advertisersIntro:
      "Esta zona está preparada para los socios premium de mayor visibilidad. Los espacios se activarán conforme se confirmen patrocinios reales.",
    advertisersPlaceholder: "Espacio reservado",
    newsletterEyebrow: "MANTENTE CONECTADO",
    newsletterTitle: "Recibe noticias y oportunidades de Leonix Media",
    newsletterBody: "Actualizaciones sobre la revista, lanzamientos y oportunidades para negocios locales.",
    newsletterPlaceholder: "Tu correo electrónico",
    newsletterButton: "Notifícame",
    contactCta: "Contáctanos",
    advertiseCta: "Anúnciate con nosotros",
    magazineCta: "Explorar la revista",
    learnMore: "Conocer más",
  },
  en: {
    heroBadge: "Premium local media",
    valueLines: [
      { plain: "Spanish-first ", accent: "print", suffix: " advertising." },
      { plain: "Bilingual ", accent: "digital", suffix: " exposure." },
      { plain: "Community ", accent: "connection", suffix: " and business visibility." },
    ],
    pillarsEyebrow: "OUR ECOSYSTEM",
    pillarsTitle: "Three pillars connecting businesses and community",
    pillarsIntro:
      "Leonix Media brings together classifieds, local businesses, and community resources on one platform built for the Bay Area and Northern California.",
    pillarClasificadosTitle: "Classifieds",
    pillarClasificadosBody:
      "Local listings organized by category — from autos and real estate to jobs and more — with bilingual presence.",
    pillarNegociosTitle: "Local Businesses",
    pillarNegociosBody:
      "Business profiles with phone, location, photos, and contact links so customers can find and trust your business.",
    pillarComunidadTitle: "Community Resources",
    pillarComunidadBody:
      "Events, classes, and community connections that keep the local network Leonix Media serves alive.",
    ecosystemEyebrow: "COMPLETE PRESENCE",
    ecosystemTitle: "Print magazine, digital edition, and real action",
    ecosystemIntro:
      "More than an ad: a premium editorial presence connecting the print magazine with digital tools and concrete actions.",
    ecosystemPrint: "Premium print magazine",
    ecosystemPrintBody: "Your business in a publication designed for the local Latino and multicultural community.",
    ecosystemDigital: "Bilingual digital edition",
    ecosystemDigitalBody: "Clear, professional digital presence that's easy to share from any device.",
    ecosystemQr: "QR and real actions",
    ecosystemQrBody: "From print ad to phone: calls, maps, messages, and links in one step.",
    ecosystemHub: "One connected business hub",
    ecosystemHubBody: "Local Businesses organizes your information in one place within the Leonix ecosystem.",
    advertisersEyebrow: "PREMIUM SPONSORS",
    advertisersTitle: "Reserved space for featured advertisers",
    advertisersIntro:
      "This zone is prepared for highest-visibility premium partners. Slots will activate as real sponsorships are confirmed.",
    advertisersPlaceholder: "Reserved space",
    newsletterEyebrow: "STAY CONNECTED",
    newsletterTitle: "Receive news and opportunities from Leonix Media",
    newsletterBody: "Updates on the magazine, launches, and opportunities for local businesses.",
    newsletterPlaceholder: "Your email address",
    newsletterButton: "Notify me",
    contactCta: "Contact us",
    advertiseCta: "Advertise with us",
    magazineCta: "Explore the magazine",
    learnMore: "Learn more",
  },
} as const;

function HomeMarketingInner({ content }: { content: HomeMarketingResolved }) {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") as Lang;
  const L = content[lang];
  const C = COPY[lang];
  const q = `?lang=${lang}`;

  const magazineSrc = content.coverImageSrc.includes("leonix-media-launch-es")
    ? content.coverImageSrc
    : LEONIX_MAGAZINE_LAUNCH_COVER;

  const advertiseHref = `/contact?interest=advertise&lang=${lang}`;
  const magazineHref = `/magazine${q}`;
  const newsletterHref = `/newsletter?source=home&lang=${lang}`;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      {/* Hero */}
      <section className="border-b border-[#D6C7AD]/60 pt-24 pb-12 sm:pt-28 sm:pb-14 lg:pb-16" aria-labelledby="home-hero-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:items-center lg:gap-10 xl:gap-12">
            <div className="min-w-0">
              <p className="inline-flex border border-[#C9A84A]/65 bg-[#FFFDF7] px-3 py-1 text-[0.68rem] font-bold tracking-[0.14em] text-[#7A1E2C] sm:text-xs">
                {C.heroBadge}
              </p>

              <h1
                id="home-hero-title"
                className="mt-5 font-serif text-[2.15rem] font-bold leading-[1.08] tracking-tight text-[#2A4536] sm:mt-6 sm:text-5xl lg:text-[3rem]"
              >
                {L.title}
              </h1>

              <ul className="mt-6 space-y-2 border-l-[3px] border-[#C9A84A]/55 pl-4 sm:space-y-2.5 sm:pl-5">
                {C.valueLines.map((line, i) => (
                  <li
                    key={i}
                    className="text-[1.05rem] font-semibold leading-snug tracking-tight text-[#3D3428] sm:text-xl"
                  >
                    {line.plain}
                    <span className="font-bold text-[#7A1E2C]">{line.accent}</span>
                    {line.suffix}
                  </li>
                ))}
              </ul>

              <p className={`mt-6 max-w-[38rem] ${leonixBodyClass}`}>{L.identity}</p>
              <p className="mt-3 max-w-[38rem] text-sm leading-relaxed text-[#5F6258] sm:text-[0.9375rem]">
                {L.precedent}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link href={advertiseHref} className={leonixPrimaryCtaClass}>
                  {C.advertiseCta}
                </Link>
                <Link href={magazineHref} className={leonixSecondaryCtaClass}>
                  {L.ctaPrimary || C.magazineCta}
                </Link>
              </div>
            </div>

            <aside className="w-full min-w-0 lg:justify-self-stretch" aria-label={L.coverAlt}>
              <div className="mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,26rem)] lg:mx-0 lg:max-w-none">
                <Link href={magazineHref} className="block">
                  <div className="overflow-hidden border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_20px_48px_-20px_rgba(31,36,28,0.38)] ring-1 ring-[#C9A84A]/12">
                    <Image
                      src={magazineSrc}
                      alt={L.coverAlt}
                      width={1792}
                      height={1344}
                      className="block h-auto w-full max-w-full"
                      sizes="(max-width: 640px) 352px, (max-width: 1024px) 416px, 512px"
                      priority
                    />
                  </div>
                </Link>
                <p className="mt-3 text-center text-xs font-medium text-[#556B3E] sm:text-sm">
                  {lang === "es" ? "Revista premium + presencia digital" : "Premium magazine + digital presence"}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Core pillars */}
      <section className="border-b border-[#D6C7AD]/60 py-12 sm:py-14" aria-labelledby="home-pillars-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className={leonixSectionEyebrowClass}>{C.pillarsEyebrow}</p>
          <h2 id="home-pillars-title" className={`mt-3 max-w-3xl ${leonixSectionTitleClass}`}>
            {C.pillarsTitle}
          </h2>
          <p className={`mt-4 max-w-2xl ${leonixBodyClass}`}>{C.pillarsIntro}</p>

          <ul className="mt-8 grid list-none gap-5 p-0 md:grid-cols-3">
            {[
              {
                title: C.pillarClasificadosTitle,
                body: C.pillarClasificadosBody,
                href: `/clasificados${q}`,
                accent: "border-l-[#7A1E2C]",
              },
              {
                title: C.pillarNegociosTitle,
                body: C.pillarNegociosBody,
                href: `/clasificados/servicios${q}`,
                accent: "border-l-[#C9A84A]",
              },
              {
                title: C.pillarComunidadTitle,
                body: C.pillarComunidadBody,
                href: `/clasificados/comunidad${q}`,
                accent: "border-l-[#2A4536]",
              },
            ].map((pillar) => (
              <li key={pillar.title}>
                <Link
                  href={pillar.href}
                  className={`flex h-full flex-col border border-[#D6C7AD]/85 border-l-[3px] bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] transition hover:shadow-[0_14px_32px_-14px_rgba(31,36,28,0.22)] sm:p-6 ${pillar.accent}`}
                >
                  <h3 className="font-serif text-lg font-bold leading-snug text-[#7A1E2C] sm:text-xl">
                    {pillar.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                    {pillar.body}
                  </p>
                  <span className="mt-4 text-xs font-semibold text-[#7A1E2C]">{C.learnMore} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="border-b border-[#D6C7AD]/60 py-12 sm:py-14" aria-labelledby="home-ecosystem-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className={leonixSectionEyebrowClass}>{C.ecosystemEyebrow}</p>
          <h2 id="home-ecosystem-title" className={`mt-3 max-w-3xl ${leonixSectionTitleClass}`}>
            {C.ecosystemTitle}
          </h2>
          <p className={`mt-4 max-w-2xl ${leonixBodyClass}`}>{C.ecosystemIntro}</p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {[
              { title: C.ecosystemPrint, body: C.ecosystemPrintBody },
              { title: C.ecosystemDigital, body: C.ecosystemDigitalBody },
              { title: C.ecosystemQr, body: C.ecosystemQrBody },
              { title: C.ecosystemHub, body: C.ecosystemHubBody },
            ].map((item) => (
              <article
                key={item.title}
                className="border border-[#D6C7AD]/85 bg-[#FFFDF7] p-5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.15)] sm:p-6"
              >
                <h3 className="font-serif text-lg font-bold text-[#2A4536]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Premium advertiser placeholder */}
      <section
        id="premium-advertisers-placeholder"
        className="border-b border-[#D6C7AD]/60 py-12 sm:py-14"
        aria-labelledby="home-advertisers-title"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className={leonixSectionEyebrowClass}>{C.advertisersEyebrow}</p>
          <h2 id="home-advertisers-title" className={`mt-3 max-w-3xl ${leonixSectionTitleClass}`}>
            {C.advertisersTitle}
          </h2>
          <p className={`mt-4 max-w-2xl ${leonixBodyClass}`}>{C.advertisersIntro}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((slot) => (
              <div
                key={slot}
                className="flex min-h-[7rem] flex-col justify-center border border-dashed border-[#C9A84A]/55 bg-[#FFFDF7]/80 px-5 py-6"
                aria-hidden={slot > 0}
                aria-label={slot === 0 ? C.advertisersPlaceholder : undefined}
              >
                <div className="h-3 w-16 rounded-sm bg-[#D6C7AD]/50" aria-hidden />
                <div className="mt-3 h-2.5 w-full max-w-[12rem] rounded-sm bg-[#D6C7AD]/35" aria-hidden />
                <div className="mt-2 h-2.5 w-3/4 max-w-[9rem] rounded-sm bg-[#D6C7AD]/25" aria-hidden />
                {slot === 0 && (
                  <p className="mt-4 text-xs font-medium uppercase tracking-wider text-[#8A6B1F]">
                    {C.advertisersPlaceholder}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter / contact conversion */}
      <section className="py-12 sm:py-14" aria-labelledby="home-newsletter-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-[#2A4536]/20 bg-[#2A4536] p-6 shadow-[0_16px_40px_-18px_rgba(42,69,54,0.55)] sm:p-8">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A] sm:text-xs">
                {C.newsletterEyebrow}
              </p>
              <h2 id="home-newsletter-title" className="mt-3 font-serif text-xl font-bold text-[#F8F4EA] sm:text-2xl">
                {C.newsletterTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#EDE6D6] sm:text-base">{C.newsletterBody}</p>
              <form
                action="/newsletter"
                method="get"
                className="mt-5 flex min-w-0 flex-col gap-3 sm:flex-row"
                aria-label={C.newsletterTitle}
              >
                <input type="hidden" name="source" value="home" />
                <input type="hidden" name="lang" value={lang} />
                <label htmlFor="home-newsletter-email" className="sr-only">
                  {C.newsletterPlaceholder}
                </label>
                <input
                  id="home-newsletter-email"
                  type="email"
                  name="email"
                  placeholder={C.newsletterPlaceholder}
                  autoComplete="email"
                  className="min-h-[2.75rem] min-w-0 flex-1 rounded-md border border-[#C9A84A]/45 bg-[#FFFDF7] px-4 text-sm text-[#1F241C] placeholder:text-[#3D3428]/55 focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-md bg-[#7A1E2C] px-6 text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721]"
                >
                  {C.newsletterButton}
                </button>
              </form>
            </div>

            <div className="flex flex-col justify-center border border-[#D6C7AD]/85 bg-[#FFFDF7] p-6 sm:p-8">
              <h3 className="font-serif text-xl font-bold text-[#2A4536]">
                {lang === "es" ? "¿Listo para aparecer con Leonix?" : "Ready to appear with Leonix?"}
              </h3>
              <p className={`mt-3 ${leonixBodyClass}`}>
                {lang === "es"
                  ? "Reserva tu espacio en la revista y conecta tu negocio con la comunidad latina y multicultural del Bay Area."
                  : "Reserve your space in the magazine and connect your business with the Latino and multicultural Bay Area community."}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href={advertiseHref} className={leonixPrimaryCtaClass}>
                  {C.advertiseCta}
                </Link>
                <Link href={`/contacto${q}`} className={leonixSecondaryCtaClass}>
                  {C.contactCta}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
