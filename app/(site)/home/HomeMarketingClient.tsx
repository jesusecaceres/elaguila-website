"use client";

import React, { Suspense } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import type { HomeMarketingResolved } from "@/app/lib/siteSectionContent/homeMarketingMerge";

export function HomeMarketingClient({ content }: { content: HomeMarketingResolved }) {
  return (
    <Suspense fallback={null}>
      <HomeMarketingInner content={content} />
    </Suspense>
  );
}

function HomeMarketingInner({ content }: { content: HomeMarketingResolved }) {
  const searchParams = useSearchParams();
  const lang = (searchParams?.get("lang") || "es") as "es" | "en";
  const L = content[lang];
  const magazineLink = `/magazine?lang=${lang}`;

  const injectLang = (href: string | null | undefined): string | null => {
    if (!href) return null;
    const trimmed = href.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("//")) return trimmed;
    const [base, hash] = trimmed.split("#");
    const joiner = base.includes("?") ? "&" : "?";
    const withParam = `${base}${joiner}lang=${lang}`;
    return hash ? `${withParam}#${hash}` : withParam;
  };

  const primaryHref = injectLang(content.ctaPrimaryHref) || magazineLink;
  const advertiseHref =
    injectLang(content.ctaSecondaryHref) ||
    `/login?mode=post&lang=${lang}&redirect=${encodeURIComponent(`/clasificados/publicar/en-venta?lang=${lang}`)}`;

  const announcementText = L.announcement.trim();
  const showAnnouncement = content.modules.showAnnouncement && announcementText.length > 0;

  return (
    <main className="relative min-h-[calc(100vh-4rem)] w-full overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
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

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,24rem)] lg:gap-x-14 lg:gap-y-8 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,26rem)] xl:gap-x-16">
          {/* Copy column */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center lg:text-left"
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
                <a
                  href={advertiseHref}
                  className="inline-flex min-h-[2.875rem] items-center justify-center rounded-full border-2 border-[#7A1E2C]/85 bg-[#FFFDF7] px-8 py-2.5 text-sm font-bold text-[#7A1E2C] transition hover:border-[#7A1E2C] hover:bg-[#FBF7EF] sm:text-[0.9375rem]"
                >
                  {L.ctaSecondary}
                </a>
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

          {/* Magazine cover */}
          {content.modules.showHeroImage ? (
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.75 }}
              className="flex justify-center lg:justify-end"
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
    </main>
  );
}
