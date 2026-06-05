"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import type { HomeMarketingResolved } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { navCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import { AdvertiseDropdown } from "@/app/components/AdvertiseDropdown";
import { HomeDestacadosSection } from "./HomeDestacadosSection";
import { getPopulatedFeaturedBusinesses } from "./homeFeaturedBusinesses";
import { HOME_PAGE_COPY, type HomePageLang } from "./homePageCopy";

export function HomeMarketingClient({ content }: { content: HomeMarketingResolved }) {
  return (
    <Suspense fallback={null}>
      <HomeMarketingInner content={content} />
    </Suspense>
  );
}

function HomeMarketingInner({ content }: { content: HomeMarketingResolved }) {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const lang = navCopyLang(routeLang) as HomePageLang;
  const L = content[lang];
  const pageCopy = HOME_PAGE_COPY[lang];
  const magazineLink = replaceLangInHref("/magazine", routeLang);

  const injectLang = (href: string | null | undefined): string | null => {
    if (!href) return null;
    const trimmed = href.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) return trimmed;
    const hashIndex = trimmed.indexOf("#");
    const base = hashIndex >= 0 ? trimmed.slice(0, hashIndex) : trimmed;
    const hash = hashIndex >= 0 ? trimmed.slice(hashIndex) : "";
    return replaceLangInHref(base, routeLang) + hash;
  };

  const withLang = (href: string) => replaceLangInHref(href, routeLang);

  const primaryHref = injectLang(content.ctaPrimaryHref) || magazineLink;
  const advertiseOverrideHref = injectLang(content.ctaSecondaryHref);

  const announcementText = L.announcement.trim();
  const showAnnouncement = content.modules.showAnnouncement && announcementText.length > 0;
  const featuredBusinesses = getPopulatedFeaturedBusinesses();

  return (
    <main className="relative w-full overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 110% 65% at 50% -5%, rgba(201, 168, 74, 0.12), transparent 52%),
            radial-gradient(ellipse 45% 35% at 100% 15%, rgba(255, 255, 255, 0.4), transparent 48%)
          `,
        }}
        aria-hidden
      />

      {showAnnouncement ? (
        <div className="relative z-20 border-b border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-2 text-center text-sm font-medium text-[#3D3428]">
          {announcementText}
        </div>
      ) : null}

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pb-14 sm:pt-20 lg:pb-16 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,24rem)] lg:gap-x-14 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,26rem)] xl:gap-x-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left lg:self-center"
          >
            <h1 className="font-serif text-[2.625rem] font-bold leading-none tracking-tight text-[#2A4536] sm:text-5xl xl:text-[3.5rem]">
              {L.title}
            </h1>

            <p className="mt-3.5 text-lg font-semibold leading-snug text-[#1F241C] sm:text-xl">{L.identity}</p>

            <p className="mt-2 text-sm font-medium leading-snug text-[#3D3428] sm:text-base">{L.precedent}</p>

            <div className="mx-auto mt-6 max-w-xl space-y-3 lg:mx-0 lg:max-w-[34rem]">
              <p className="text-sm leading-[1.65] text-[#3D3428] sm:text-[0.9375rem]">{L.valuePrimary}</p>
              <p className="text-sm leading-[1.65] text-[#3D3428]/90 sm:text-[0.9375rem]">{L.valueSecondary}</p>
            </div>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <a
                href={primaryHref}
                className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[#7A1E2C] px-8 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721] sm:text-[0.9375rem]"
              >
                {L.ctaPrimary}
              </a>

              {content.modules.showSecondaryLine ? (
                advertiseOverrideHref ? (
                  <a
                    href={advertiseOverrideHref}
                    className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:text-[0.9375rem]"
                  >
                    {L.ctaSecondary}
                  </a>
                ) : (
                  <AdvertiseDropdown lang={lang} variant="outline" buttonLabel={L.ctaSecondary} />
                )
              ) : null}
            </div>

            <p className="mt-3.5 text-xs font-medium tracking-wide text-[#3D3428]/70 sm:text-sm">{L.microcopy}</p>

            <ul
              className="mx-auto mt-6 flex max-w-md flex-col gap-2 border-t border-[#D6C7AD]/70 pt-5 text-left sm:max-w-none sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-0 lg:mx-0"
              aria-label={lang === "es" ? "Pilares de Leonix" : "Leonix pillars"}
            >
              {L.valueLabels.map((label, i) => (
                <li
                  key={label}
                  className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[#3D3428]/80 sm:text-[0.6875rem]"
                >
                  {i > 0 ? (
                    <span className="mx-3 hidden h-1 w-1 shrink-0 rounded-full bg-[#C9A84A] sm:inline-block" aria-hidden />
                  ) : null}
                  <span className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#C9A84A]/90" aria-hidden />
                    {label}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {content.modules.showHeroImage ? (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.75 }}
              className="flex justify-center lg:justify-end lg:self-center"
            >
              <a
                href={primaryHref}
                className="block w-full max-w-[18.5rem] sm:max-w-[20rem] lg:max-w-[24rem] xl:max-w-[26rem]"
              >
                <div className="overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-1 shadow-[0_24px_56px_-18px_rgba(31,36,28,0.28)] ring-1 ring-[#C9A84A]/20">
                  <Image
                    src={content.coverImageSrc}
                    alt={L.coverAlt}
                    width={680}
                    height={880}
                    className="h-auto w-full object-contain"
                    priority
                    sizes="(max-width: 1024px) 320px, (max-width: 1280px) 384px, 416px"
                  />
                </div>
              </a>
            </motion.div>
          ) : null}
        </div>
      </section>

      <HomeDestacadosSection lang={lang} routeLang={routeLang} businesses={featuredBusinesses} />

      {/* Ecosystem */}
      <section className="border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/50 py-12 sm:py-14" aria-labelledby="home-ecosystem-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{pageCopy.ecosystem.eyebrow}</p>
          <h2
            id="home-ecosystem-title"
            className="mt-2 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {pageCopy.ecosystem.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{pageCopy.ecosystem.intro}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-3 sm:gap-5">
            {pageCopy.ecosystem.points.map((point) => (
              <li
                key={point}
                className="rounded-xl border border-[#D6C7AD]/80 bg-[#FAF6EE] px-4 py-4 text-sm leading-relaxed text-[#3D3428] sm:px-5 sm:py-5 sm:text-[0.9375rem]"
              >
                <span className="mb-2 inline-block h-1 w-8 rounded-full bg-[#C9A84A]/80" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Core paths */}
      <section className="py-12 sm:py-14" aria-labelledby="home-pillars-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{pageCopy.pillars.eyebrow}</p>
          <h2
            id="home-pillars-title"
            className="mt-2 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]"
          >
            {pageCopy.pillars.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">{pageCopy.pillars.intro}</p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {pageCopy.pillars.items.map((item) => (
              <li key={item.href}>
                <a
                  href={withLang(item.href)}
                  className="group flex h-full flex-col rounded-xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.2)] transition hover:border-[#C9A84A]/55 hover:shadow-[0_12px_28px_-14px_rgba(31,36,28,0.24)]"
                >
                  <h3 className="text-base font-bold text-[#2A4536] group-hover:text-[#7A1E2C]">{item.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428]">{item.description}</p>
                  <span className="mt-4 text-xs font-bold uppercase tracking-[0.1em] text-[#7A1E2C]">
                    {lang === "es" ? "Explorar →" : "Explore →"}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Newsletter / advertise conversion */}
      <section className="py-14 sm:py-16" aria-labelledby="home-convert-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-[#2A4536]/20 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.55)] sm:p-8">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A]">{pageCopy.convert.eyebrow}</p>
            <h2
              id="home-convert-title"
              className="mt-3 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#F8F4EA] sm:text-[1.75rem]"
            >
              {pageCopy.convert.title}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#EDE6D6] sm:text-base">{pageCopy.convert.body}</p>

            <form
              action="/newsletter"
              method="get"
              className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
              aria-label={pageCopy.convert.newsletterAria}
            >
              <input type="hidden" name="source" value="home" />
              <input type="hidden" name="lang" value={routeLang} />
              <label htmlFor="home-newsletter-email" className="sr-only">
                {pageCopy.convert.emailLabel}
              </label>
              <input
                id="home-newsletter-email"
                type="email"
                name="email"
                placeholder={pageCopy.convert.newsletterPlaceholder}
                autoComplete="email"
                className="min-h-[3rem] min-w-0 flex-1 rounded-full border border-[#C9A84A]/45 bg-[#FFFDF7] px-4 text-sm text-[#1F241C] placeholder:text-[#3D3428]/55 focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40"
              />
              <button
                type="submit"
                className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5e1721]"
              >
                {pageCopy.convert.newsletterCta}
              </button>
            </form>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {advertiseOverrideHref ? (
                <a
                  href={advertiseOverrideHref}
                  className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full border-2 border-[#C9A84A]/60 bg-transparent px-6 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#C9A84A]/15"
                >
                  {pageCopy.convert.advertiseCta}
                </a>
              ) : (
                <AdvertiseDropdown
                  lang={lang}
                  variant="onDark"
                  buttonLabel={pageCopy.convert.advertiseCta}
                />
              )}
              <a
                href={withLang("/contacto")}
                className="inline-flex min-h-[2.75rem] items-center justify-center rounded-full bg-[#FFFDF7]/10 px-6 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#FFFDF7]/20"
              >
                {pageCopy.convert.contactCta}
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
