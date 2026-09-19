"use client";

/**
 * Gate HOME-LAUNCH — public `/home`: introduction + routing layer.
 *
 * Order: hero (identity + current edition) → Discover (#explorar) → Featured businesses →
 * Learn & grow (#aprende) → For businesses (#anunciate) → Stay connected (newsletter).
 * Copy is code-owned in `homePageCopy.ts`; the current edition comes from the shared
 * `app/lib/magazine/currentEdition.ts` source (same as the Revista hub). Every outgoing link
 * preserves `?lang=`.
 */

import React, { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import type { IconType } from "react-icons";
import {
  FiArrowRight,
  FiBookOpen,
  FiCompass,
  FiFileText,
  FiLayers,
  FiLifeBuoy,
  FiMapPin,
  FiMonitor,
  FiPercent,
  FiPrinter,
  FiSun,
} from "react-icons/fi";
import type { HomeMarketingResolved } from "@/app/lib/siteSectionContent/homeMarketingMerge";
import { launchUiCopyLang, normalizeLang, replaceLangInHref } from "@/app/lib/language";
import {
  magazineEditionMonthYear,
  magazineEditionReaderHref,
  magazineEditionTitle,
  type MagazineEdition,
} from "@/app/lib/magazine/currentEdition";
import { magazineHubHref } from "@/app/lib/magazine/qrBridge";
import { HomeDestacadosSection } from "./HomeDestacadosSection";
import { getPopulatedFeaturedBusinesses } from "./homeFeaturedBusinesses";
import { HOME_ANCHORS, HOME_PAGE_COPY, HOME_ROUTES, type HomeDiscoverItemId } from "./homePageCopy";

const DISCOVER_ICONS: Record<HomeDiscoverItemId, IconType> = {
  "ofertas-locales": FiPercent,
  "negocios-locales": FiMapPin,
  revista: FiBookOpen,
  noticias: FiFileText,
  clasificados: FiLayers,
  recursos: FiLifeBuoy,
  viajes: FiCompass,
  iglesias: FiSun,
};

const EYEBROW_CLASS = "text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]";
const H2_CLASS = "mt-2 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#2A4536] sm:text-[1.75rem]";
const INTRO_CLASS = "mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]";
const FOCUS_RING =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]";
const BTN_PRIMARY = `inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full bg-[#7A1E2C] px-7 py-2.5 text-sm font-bold text-[#FFFDF7] shadow-[0_10px_28px_-10px_rgba(122,30,44,0.5)] transition hover:bg-[#5e1721] ${FOCUS_RING} sm:text-[0.9375rem]`;
const BTN_OUTLINE = `inline-flex min-h-[2.875rem] items-center justify-center gap-2 rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-7 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] ${FOCUS_RING} sm:text-[0.9375rem]`;

export function HomeMarketingClient({
  content,
  edition,
}: {
  content: HomeMarketingResolved;
  edition: MagazineEdition;
}) {
  return (
    <Suspense fallback={null}>
      <HomeMarketingInner content={content} edition={edition} />
    </Suspense>
  );
}

function HomeMarketingInner({ content, edition }: { content: HomeMarketingResolved; edition: MagazineEdition }) {
  const searchParams = useSearchParams();
  const routeLang = normalizeLang(searchParams?.get("lang"));
  const lang = launchUiCopyLang(routeLang);
  const copy = HOME_PAGE_COPY[lang];
  const L = content[lang];

  const withLang = (href: string) => replaceLangInHref(href, routeLang);

  const editionTitle = magazineEditionTitle(edition, routeLang);
  const editionMonthYear = magazineEditionMonthYear(edition, routeLang);
  const editionReadHref = magazineEditionReaderHref(edition, routeLang);
  const editionsHref = magazineHubHref(routeLang);

  const announcementText = L.announcement.trim();
  const showAnnouncement = content.modules.showAnnouncement && announcementText.length > 0;
  const featuredBusinesses = getPopulatedFeaturedBusinesses();

  const exploreAnchor = `#${HOME_ANCHORS.explore}`;
  const advertiseAnchor = `#${HOME_ANCHORS.advertise}`;

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

      {/* 1 — Hero: identity + current edition */}
      <section
        className="relative z-10 mx-auto max-w-6xl px-4 pb-12 pt-14 sm:px-6 sm:pb-14 sm:pt-20 lg:pb-16 lg:pt-24"
        aria-labelledby="home-hero-title"
      >
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,22rem)] lg:gap-x-14 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,24rem)] xl:gap-x-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
          >
            <p className="text-[0.72rem] font-bold uppercase tracking-[0.2em] text-[#7A1E2C]">{copy.hero.eyebrow}</p>
            <h1
              id="home-hero-title"
              className="mt-3 font-serif text-[2.5rem] font-bold leading-[1.05] tracking-tight text-[#2A4536] sm:text-5xl xl:text-[3.5rem]"
            >
              {copy.hero.title}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base font-medium leading-relaxed text-[#1F241C] sm:text-lg lg:mx-0">
              {copy.hero.supportPrimary}
            </p>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-[1.65] text-[#3D3428]/90 sm:text-[0.9375rem] lg:mx-0">
              {copy.hero.supportSecondary}
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <a href={exploreAnchor} className={BTN_PRIMARY}>
                {copy.hero.ctaPrimary}
              </a>
              <a href={advertiseAnchor} className={BTN_OUTLINE}>
                {copy.hero.ctaSecondary}
              </a>
            </div>
          </motion.div>

          {content.modules.showHeroImage ? (
            <motion.aside
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.75 }}
              className="mx-auto w-full max-w-[22rem] lg:mx-0 lg:max-w-none lg:justify-self-end"
              aria-labelledby="home-edition-title"
            >
              <div className="overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_24px_56px_-18px_rgba(31,36,28,0.28)] ring-1 ring-[#C9A84A]/25">
                <Link
                  href={editionReadHref}
                  className={`block bg-[#FAF6EE] p-3 ${FOCUS_RING}`}
                  aria-label={`${copy.edition.ctaRead}: ${editionTitle}`}
                >
                  <div className="relative mx-auto aspect-[550/713] w-full max-w-[16rem] overflow-hidden rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_14px_36px_-16px_rgba(31,36,28,0.35)] sm:max-w-[17rem]">
                    <Image
                      src={edition.coverImage}
                      alt={editionTitle}
                      fill
                      className="object-contain"
                      priority
                      sizes="(max-width: 640px) 256px, 272px"
                    />
                  </div>
                </Link>
                <div className="border-t border-[#D6C7AD]/70 px-5 py-4 text-center sm:px-6 sm:py-5">
                  <p className="text-[0.66rem] font-bold uppercase tracking-[0.16em] text-[#556B3E]">{copy.edition.eyebrow}</p>
                  <h2 id="home-edition-title" className="mt-1 font-serif text-xl font-bold leading-snug text-[#2A4536]">
                    {copy.edition.title}
                  </h2>
                  <p className="mt-0.5 text-sm font-semibold text-[#7A1E2C]">{editionMonthYear}</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{copy.edition.body}</p>
                  <div className="mt-4 flex flex-col items-center gap-2">
                    <Link
                      href={editionReadHref}
                      className={`inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-full bg-[#7A1E2C] px-5 py-2 text-sm font-bold text-[#FFFDF7] transition hover:bg-[#5e1721] sm:w-auto ${FOCUS_RING}`}
                    >
                      {copy.edition.ctaRead}
                    </Link>
                    <Link
                      href={editionsHref}
                      className={`inline-flex min-h-[2.5rem] items-center justify-center px-3 text-sm font-semibold text-[#2A4536] underline decoration-[#C9A84A]/60 underline-offset-[0.25em] transition hover:text-[#7A1E2C] ${FOCUS_RING}`}
                    >
                      {copy.edition.ctaAll}
                    </Link>
                  </div>
                </div>
              </div>
            </motion.aside>
          ) : null}
        </div>
      </section>

      {/* 2 — Discover Leonix */}
      <section
        id={HOME_ANCHORS.explore}
        className="scroll-mt-24 border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-12 sm:py-14 lg:py-16"
        aria-labelledby="home-discover-title"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className={EYEBROW_CLASS}>{copy.discover.eyebrow}</p>
          <h2 id="home-discover-title" className={H2_CLASS}>
            {copy.discover.title}
          </h2>
          <p className={INTRO_CLASS}>{copy.discover.intro}</p>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {copy.discover.items.map((item) => {
              const Icon = DISCOVER_ICONS[item.id];
              const featured = item.featured === true;
              return (
                <li key={item.id} className={featured ? "sm:col-span-2" : undefined}>
                  <Link
                    href={withLang(item.href)}
                    className={
                      featured
                        ? `group flex h-full flex-col justify-between gap-5 rounded-2xl border border-[#7A1E2C] bg-[#7A1E2C] p-5 text-[#FFFDF7] shadow-[0_18px_40px_-20px_rgba(122,30,44,0.6)] transition hover:bg-[#6a1a26] sm:flex-row sm:items-center sm:p-6 ${FOCUS_RING}`
                        : `group flex h-full flex-col rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-5 shadow-[0_8px_24px_-16px_rgba(31,36,28,0.2)] transition hover:-translate-y-0.5 hover:border-[#C9A84A]/70 hover:shadow-[0_14px_30px_-14px_rgba(31,36,28,0.26)] ${FOCUS_RING}`
                    }
                  >
                    <div className={featured ? "flex min-w-0 items-start gap-4" : "flex flex-col"}>
                      <span
                        className={
                          featured
                            ? "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/70 bg-[#FFFDF7]/10 text-[#F3D98A]"
                            : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#FAF6EE] text-[#7A1E2C] transition group-hover:border-[#C9A84A]"
                        }
                        aria-hidden
                      >
                        <Icon className={featured ? "h-6 w-6" : "h-5 w-5"} />
                      </span>
                      <div className={featured ? "min-w-0" : "mt-4"}>
                        <h3
                          className={
                            featured
                              ? "font-serif text-2xl font-bold leading-tight text-[#FFFDF7] sm:text-[1.75rem]"
                              : "text-base font-bold text-[#2A4536] transition group-hover:text-[#7A1E2C]"
                          }
                        >
                          {item.title}
                        </h3>
                        <p
                          className={
                            featured
                              ? "mt-1.5 max-w-lg text-sm leading-relaxed text-[#F8F4EA]/90 sm:text-[0.9375rem]"
                              : "mt-1.5 text-sm leading-relaxed text-[#3D3428]"
                          }
                        >
                          {item.description}
                        </p>
                      </div>
                    </div>
                    <span
                      className={
                        featured
                          ? "inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[#C9A84A]/80 px-4 py-2 text-xs font-bold uppercase tracking-[0.1em] text-[#F3D98A] transition group-hover:bg-[#FFFDF7]/10 sm:self-center"
                          : "mt-4 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.1em] text-[#7A1E2C]"
                      }
                    >
                      {copy.discover.exploreLabel}
                      <FiArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* 3 — Featured community businesses */}
      <HomeDestacadosSection lang={lang} routeLang={routeLang} businesses={featuredBusinesses} />

      {/* 4 — Learn & grow (teaser only) */}
      <section
        id={HOME_ANCHORS.learn}
        className="scroll-mt-24 border-t border-[#D6C7AD]/70 py-12 sm:py-14"
        aria-labelledby="home-learn-title"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] p-6 shadow-[0_14px_36px_-22px_rgba(31,36,28,0.25)] sm:p-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
            <div>
              <p className={EYEBROW_CLASS}>{copy.learn.eyebrow}</p>
              <h2 id="home-learn-title" className={H2_CLASS}>
                {copy.learn.title}
              </h2>
              <p className={INTRO_CLASS}>{copy.learn.body}</p>
              <Link href={withLang(HOME_ROUTES.learningCenter)} className={`mt-6 ${BTN_PRIMARY}`}>
                {copy.learn.cta}
                <FiArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            <ul className="flex flex-col gap-3" aria-label={copy.learn.eyebrow}>
              {copy.learn.journeys.map((journey, i) => (
                <li
                  key={journey}
                  className="flex items-center gap-3 rounded-xl border border-[#D6C7AD] bg-[#FAF6EE] px-4 py-3 text-sm font-semibold text-[#2A4536] sm:text-[0.9375rem]"
                >
                  <span
                    className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#2A4536] font-serif text-xs font-bold text-[#F3D98A]"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  {journey}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5 — For businesses: digital presence / magazine + digital */}
      <section
        id={HOME_ANCHORS.advertise}
        className="scroll-mt-24 border-t border-[#D6C7AD]/70 bg-[#FFFDF7]/60 py-12 sm:py-14 lg:py-16"
        aria-labelledby="home-business-title"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className={EYEBROW_CLASS}>{copy.business.eyebrow}</p>
          <h2 id="home-business-title" className={H2_CLASS}>
            {copy.business.title}
          </h2>
          <p className={INTRO_CLASS}>{copy.business.intro}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:gap-6">
            <article className="flex h-full flex-col rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_10px_28px_-18px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15 sm:p-7">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#FAF6EE] text-[#2A4536]"
                aria-hidden
              >
                <FiMonitor className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">{copy.business.digital.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {copy.business.digital.body}
              </p>
              <Link href={withLang(HOME_ROUTES.digitalPresence)} className={`mt-6 self-start ${BTN_PRIMARY}`}>
                {copy.business.digital.cta}
              </Link>
            </article>

            <article className="flex h-full flex-col rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] p-6 shadow-[0_10px_28px_-18px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15 sm:p-7">
              <span
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#FAF6EE] text-[#2A4536]"
                aria-hidden
              >
                <FiPrinter className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-serif text-xl font-bold text-[#2A4536] sm:text-2xl">{copy.business.print.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
                {copy.business.print.body}
              </p>
              <Link href={withLang(HOME_ROUTES.magazineDigital)} className={`mt-6 self-start ${BTN_OUTLINE}`}>
                {copy.business.print.cta}
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* 6 — Stay connected */}
      <section className="py-14 sm:py-16" aria-labelledby="home-convert-title">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="overflow-hidden rounded-2xl border border-[#2A4536]/20 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-6 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.55)] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
              <div>
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A]">{copy.convert.eyebrow}</p>
                <h2
                  id="home-convert-title"
                  className="mt-3 max-w-2xl font-serif text-2xl font-bold leading-snug text-[#F8F4EA] sm:text-[1.75rem]"
                >
                  {copy.convert.title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#EDE6D6] sm:text-base">{copy.convert.body}</p>

                <form
                  action={HOME_ROUTES.newsletter}
                  method="get"
                  className="mt-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-stretch"
                  aria-label={copy.convert.newsletterAria}
                >
                  <input type="hidden" name="source" value="home" />
                  <input type="hidden" name="lang" value={routeLang} />
                  <label htmlFor="home-newsletter-email" className="sr-only">
                    {copy.convert.emailLabel}
                  </label>
                  <input
                    id="home-newsletter-email"
                    type="email"
                    name="email"
                    required
                    placeholder={copy.convert.newsletterPlaceholder}
                    autoComplete="email"
                    className="min-h-[3rem] min-w-0 flex-1 rounded-full border border-[#C9A84A]/45 bg-[#FFFDF7] px-4 text-sm text-[#1F241C] placeholder:text-[#3D3428]/55 focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/40"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[3rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#5e1721] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]"
                  >
                    {copy.convert.newsletterCta}
                  </button>
                </form>
              </div>

              <div className="border-t border-[#C9A84A]/30 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                <p className="text-sm font-medium leading-relaxed text-[#F8F4EA] sm:text-base">{copy.convert.businessLine}</p>
                <a
                  href={advertiseAnchor}
                  className="mt-4 inline-flex min-h-[2.75rem] items-center justify-center gap-2 rounded-full border-2 border-[#C9A84A]/70 bg-transparent px-6 py-2 text-sm font-bold text-[#F8F4EA] transition hover:bg-[#C9A84A]/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A]"
                >
                  {copy.convert.businessCta}
                  <FiArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
