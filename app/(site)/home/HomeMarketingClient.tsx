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
    <main className="relative min-h-screen w-full overflow-x-hidden bg-[#FAF6EE] text-[#1F241C]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 120% 70% at 50% -10%, rgba(201, 168, 74, 0.14), transparent 55%),
            radial-gradient(ellipse 50% 40% at 100% 20%, rgba(255, 255, 255, 0.45), transparent 50%)
          `,
        }}
        aria-hidden
      />

      {showAnnouncement ? (
        <div className="relative z-20 border-b border-[#D6C7AD]/80 bg-[#FFFDF7] px-4 py-2 text-center text-sm font-medium text-[#3D3428]">
          {announcementText}
        </div>
      ) : null}

      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-24">
        <div className="grid items-center gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] md:gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,22rem)] lg:gap-14">
          {/* Copy column — serif title, sans body */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75 }}
            className="order-2 text-center md:order-1 md:text-left"
          >
            <h1 className="font-serif text-4xl font-bold tracking-tight text-[#2A4536] sm:text-5xl lg:text-[3.25rem] lg:leading-none">
              {L.title}
            </h1>

            <p className="mt-3 text-base font-semibold text-[#1F241C] sm:text-lg">{L.identity}</p>

            <p className="mt-1.5 text-sm font-medium text-[#3D3428] sm:text-base">{L.precedent}</p>

            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem] md:mx-0 md:max-w-none">
              {L.valuePrimary}
            </p>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-[#3D3428]/90 sm:text-[0.9375rem] md:mx-0 md:max-w-none">
              {L.valueSecondary}
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
              <a
                href={primaryHref}
                className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-full bg-[#7A1E2C] px-7 py-2.5 text-sm font-semibold text-[#FFFDF7] shadow-[0_8px_24px_-8px_rgba(122,30,44,0.55)] transition hover:bg-[#5e1721] sm:w-auto sm:text-base"
              >
                {L.ctaPrimary}
              </a>

              {content.modules.showSecondaryLine ? (
                <a
                  href={advertiseHref}
                  className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-full border border-[#7A1E2C] bg-[#FFFDF7] px-7 py-2.5 text-sm font-semibold text-[#7A1E2C] transition hover:bg-[#FBF7EF] sm:w-auto sm:text-base"
                >
                  {L.ctaSecondary}
                </a>
              ) : null}
            </div>

            <p className="mt-4 text-xs font-medium tracking-wide text-[#3D3428]/75 sm:text-sm">{L.microcopy}</p>
          </motion.div>

          {/* Magazine cover — clean standalone asset */}
          {content.modules.showHeroImage ? (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.12, duration: 0.8 }}
              className="order-1 flex justify-center md:order-2 md:justify-end"
            >
              <a href={primaryHref} className="block max-w-[17rem] sm:max-w-[19rem] md:max-w-full">
                <div className="overflow-hidden rounded-2xl border border-[#D6C7AD] bg-[#FFFDF7] shadow-[0_20px_48px_-16px_rgba(31,36,28,0.22)] ring-1 ring-[#C9A84A]/15">
                  <Image
                    src={content.coverImageSrc}
                    alt={L.coverAlt}
                    width={640}
                    height={820}
                    className="h-auto w-full object-contain"
                    priority
                    sizes="(max-width: 768px) 304px, 352px"
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
