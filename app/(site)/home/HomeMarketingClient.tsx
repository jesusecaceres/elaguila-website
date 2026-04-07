"use client";

import React, { Suspense } from "react";
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

  const primaryHref = content.ctaPrimaryHref || magazineLink;
  const secondaryHref = content.ctaSecondaryHref || null;

  const announcementText = L.announcement.trim();
  const showAnnouncement = content.modules.showAnnouncement && announcementText.length > 0;

  const showPromo = content.modules.showSecondaryLine && L.promoStrip.trim() !== "";

  const calloutsBlock =
    content.modules.showCallouts && content.callouts.length > 0 ? (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="mt-6 flex flex-wrap justify-center gap-2"
      >
        {content.callouts.map((c) => {
          const label = lang === "en" ? (c.labelEn || c.labelEs) : (c.labelEs || c.labelEn);
          if (!label) return null;
          return (
            <a
              key={`${c.href}-${label}`}
              href={c.href}
              className="rounded-full border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-card)] px-3 py-1.5 text-xs font-semibold text-[color:var(--lx-text)] shadow-sm transition hover:opacity-95"
            >
              {label}
            </a>
          );
        })}
      </motion.div>
    ) : null;

  return (
    <main
      className="relative min-h-screen w-full overflow-hidden text-[color:var(--lx-text)]"
      style={{
        backgroundColor: "var(--lx-page)",
        backgroundImage: `
          radial-gradient(ellipse 120% 80% at 50% -20%, rgba(201, 180, 106, 0.22), transparent 55%),
          radial-gradient(ellipse 55% 40% at 100% 30%, rgba(255, 255, 255, 0.55), transparent 52%),
          radial-gradient(ellipse 45% 35% at 0% 75%, rgba(201, 164, 74, 0.10), transparent 50%)
        `,
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      {showAnnouncement && announcementText ? (
        <div className="relative z-20 border-b border-amber-200/60 bg-amber-50/95 px-4 py-2 text-center text-sm font-medium text-amber-950">
          {announcementText}
        </div>
      ) : null}

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-14 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05 }}
          className="text-4xl md:text-6xl font-extrabold tracking-tight text-[color:var(--lx-text)] drop-shadow-[0_10px_28px_rgba(42,36,22,0.10)]"
        >
          {L.title}
        </motion.h1>

        {content.calloutsPlacement === "below_title" ? calloutsBlock : null}

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.9 }}
          className="mt-3 text-base md:text-lg font-medium text-[color:var(--lx-text-2)]/90"
        >
          {L.identity}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.9 }}
          className="mt-2 text-sm md:text-base text-[color:var(--lx-muted)]"
        >
          {L.precedent}
        </motion.p>

        {content.calloutsPlacement === "below_precedent" ? calloutsBlock : null}

        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.22, duration: 0.9 }}
          className="mt-7 md:mt-8 flex flex-col items-center"
        >
          {content.modules.showHeroImage ? (
            <a href={primaryHref} className="block">
              <div className="rounded-2xl border border-[color:var(--lx-nav-border)] overflow-hidden shadow-[0_18px_48px_rgba(42,36,22,0.12)] hover:shadow-[0_22px_60px_rgba(42,36,22,0.14)] transition-all duration-300 bg-[color:var(--lx-card)]">
                <div className="w-80 sm:w-[26rem] md:w-[30rem]">
                  <img src={content.coverImageSrc} alt={L.coverAlt} className="w-full h-auto object-cover" />
                </div>
              </div>
            </a>
          ) : null}

          <div className="mt-4 flex flex-col items-center gap-2">
            <a
              href={primaryHref}
              className="inline-flex items-center justify-center rounded-full bg-[color:var(--lx-cta-dark)] px-7 py-3 text-sm md:text-base font-semibold text-[color:var(--lx-cta-light)] shadow-[0_10px_28px_rgba(42,36,22,0.18)] hover:bg-[color:var(--lx-cta-dark-hover)] transition-all duration-300"
            >
              {L.ctaPrimary}
            </a>

            {content.modules.showSecondaryLine ? (
              secondaryHref ? (
                <a
                  href={secondaryHref}
                  className="text-xs md:text-sm font-medium text-[color:var(--lx-muted)] underline underline-offset-2 hover:opacity-90"
                >
                  {L.ctaSecondary}
                </a>
              ) : (
                <p className="text-xs md:text-sm text-[color:var(--lx-muted)]">{L.ctaSecondary}</p>
              )
            ) : null}

            {showPromo ? (
              <p className="mt-2 max-w-xl text-xs md:text-sm text-[color:var(--lx-text-2)]/90">{L.promoStrip}</p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </main>
  );
}
