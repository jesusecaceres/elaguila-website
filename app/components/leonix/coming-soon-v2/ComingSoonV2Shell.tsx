"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { LeonixHeaderLanguageSelector } from "@/app/(site)/magazine/components/LeonixHeaderLanguageSelector";
import { getComingSoonV2Copy } from "@/app/components/leonix/coming-soon-v2/comingSoonV2Copy/languages";
import { MagazinePrintQrBridge } from "@/app/(site)/magazine/components/MagazinePrintQrBridge";
import {
  MAGAZINE_KIT_PDF_EN,
  MAGAZINE_KIT_PDF_ES,
  magazineJune2026ReaderHref,
  showDualMediaKitPdfButtons,
} from "@/app/lib/magazine/qrBridge";
import type {
  HeroAccent,
  HeroCta,
  HeroLine,
  MediaKitPreviewCard,
  MarketplaceCategoryCard,
  MarketplaceFeaturedCategoryCard,
  NavItem,
  ProcessStep,
  QrBenefitCard,
  WhatYouGetCard,
  WhatYouGetCardAccent,
} from "@/app/components/leonix/coming-soon-v2/comingSoonV2Copy/types";
import {
  resolveLeonixSiteLang,
  withLeonixLang,
  type LeonixSiteLang,
} from "@/app/lib/lang";
import type { SupportedLang } from "@/app/lib/language";
import { ComingSoonLaunchSignupForm } from "@/app/components/leonix/coming-soon-v2/ComingSoonLaunchSignupForm";
import {
  buildGoogleTranslateWebsiteUrl,
  LEONIX_TRANSLATE_SITE_ORIGIN,
} from "@/app/lib/googleTranslateWebsite";
import { LENS_WEB_URL } from "@/app/lib/magazine/translatorGateway";
import { magazinePrintGuideHref } from "@/app/lib/magazine/qrRouteHelpers";

/** Official Leonix lion emblem — transparent PNG, use object-contain (never /logo.png). */
const HEADER_LOGO_SRC = "/logo-clean.png";


const heroAccentClass: Record<HeroAccent, string> = {
  burgundy: "font-bold text-[#7A1E2C]",
  gold: "font-bold text-[#8A6B1F] underline decoration-[#C9A84A] decoration-2 underline-offset-[0.2em]",
};

const heroLineClass =
  "text-[1rem] font-semibold leading-snug tracking-tight text-[#3D3428] sm:text-xl sm:leading-snug";

/** Sticky header clearance — taller on mobile where nav pills stack below the bar. */
const ANCHOR_SCROLL = "scroll-mt-32 lg:scroll-mt-28";

function comingSoonQrReaderHref(
  lang: SupportedLang,
  sourceCta: "hero_qr_steps" | "qr_steps",
): string {
  const base = magazineJune2026ReaderHref(lang, { source: "print" });
  return `${base}&sourcePage=coming-soon-v2&sourceCta=${sourceCta}`;
}

const sectionShellClass = `${ANCHOR_SCROLL} border-t border-[#D6C7AD]/55 py-5 sm:py-12 lg:py-14`;

const sectionEyebrowClass =
  "text-[0.65rem] font-bold uppercase tracking-[0.14em] text-[#556B3E] sm:text-xs sm:tracking-[0.16em]";

const sectionTitleClass =
  "mt-1.5 max-w-3xl font-serif text-lg font-bold leading-snug tracking-tight text-balance text-[#2A4536] sm:mt-3 sm:text-[1.75rem] lg:max-w-4xl lg:text-3xl xl:max-w-5xl";

const sectionIntroClass =
  "mt-2 max-w-2xl text-[0.9375rem] leading-snug text-[#3D3428] sm:mt-4 sm:text-[1.0625rem] sm:leading-relaxed lg:max-w-3xl xl:max-w-[42rem]";

const cardShellClass =
  "rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] shadow-[0_10px_28px_-16px_rgba(31,36,28,0.2)]";

function HeroLineText({ line }: { line: HeroLine }) {
  return (
    <>
      {line.parts.map((part, index) =>
        part.accent ? (
          <span key={`${part.text}-${index}`} className={heroAccentClass[part.accent]}>
            {part.text}
          </span>
        ) : (
          <span key={`${part.text}-${index}`}>{part.text}</span>
        )
      )}
    </>
  );
}

function isExternalHref(href: string): boolean {
  return href.startsWith("http") || href.endsWith(".pdf");
}

function heroPromoProductsCta(lang: LeonixSiteLang): HeroCta {
  return {
    label: lang === "en" ? "Promotional products" : "Productos promocionales",
    href: withLeonixLang("/productos-promocion", lang),
    variant: "secondary",
  };
}

function HeroCtaLink({ cta }: { cta: HeroCta }) {
  const base =
    cta.variant === "primary"
      ? "inline-flex min-h-[3rem] w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold transition sm:min-h-[3.125rem] sm:w-auto sm:text-[0.9375rem]"
      : "inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-full px-5 py-2.5 text-center text-[0.8125rem] font-bold transition sm:min-h-[3.125rem] sm:w-auto sm:px-6 sm:py-3 sm:text-[0.9375rem]";
  const styles = {
    primary: `${base} bg-[#7A1E2C] text-white shadow-[0_8px_20px_-6px_rgba(122,30,44,0.5)] hover:bg-[#5e1721]`,
    secondary: `${base} border-2 border-[#C9A84A] bg-[#FFFDF7] text-[#1F241C] shadow-sm hover:border-[#b89742] hover:bg-[#FBF7EF]`,
    green: `${base} bg-[#2A4536] text-[#F8F4EA] shadow-[0_6px_16px_-6px_rgba(42,69,54,0.45)] hover:bg-[#223528]`,
  };
  return (
    <Link
      href={cta.href}
      className={`${styles[cta.variant]} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C]`}
      {...(cta.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {cta.label}
    </Link>
  );
}

function TrustChipIcon() {
  return (
    <span
      className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#C9A84A]/12 text-[#8A6B1F]"
      aria-hidden
    >
      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2 4.2 4.7.7-3.4 3.3.8 4.7L12 14.2 7.9 16l.8-4.7-3.4-3.3 4.7-.7L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function HeroMediaVisual({
  label,
  qrOverlay,
  magazineAlt,
}: {
  label: string;
  qrOverlay: string;
  magazineAlt: string;
}) {
  return (
    <aside className="w-full min-w-0 lg:justify-self-stretch" aria-label={label}>
      <div className="mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-[min(100%,26rem)] lg:mx-0 lg:max-w-none">
        <div className="w-full overflow-hidden rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] shadow-[0_20px_48px_-20px_rgba(31,36,28,0.38)] ring-1 ring-[#C9A84A]/12">
          <Image
            src="/magazine/leonix-media-launch-es.png"
            alt={magazineAlt}
            width={1792}
            height={1344}
            className="block h-auto w-full max-w-full"
            sizes="(max-width: 640px) 352px, (max-width: 1024px) 416px, 512px"
            priority
          />
        </div>

        <div className="mt-2.5 flex flex-col items-center gap-1.5 sm:mt-3.5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-2.5 lg:items-start lg:justify-start">
          <p className="inline-flex max-w-full rounded-full border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 py-1.5 text-center text-[0.65rem] font-bold uppercase tracking-[0.11em] text-[#2A4536] shadow-sm sm:text-[0.68rem]">
            {label}
          </p>
          <p className="inline-flex max-w-full rounded-full border border-[#C9A84A]/45 bg-[#2A4536] px-3 py-1.5 text-center font-serif text-[0.75rem] font-bold leading-snug text-[#F8F4EA] shadow-[0_6px_16px_-10px_rgba(42,69,54,0.65)] sm:text-[0.8125rem]">
            {qrOverlay}
          </p>
        </div>
      </div>
    </aside>
  );
}

const cardAccentStyles: Record<
  WhatYouGetCardAccent,
  { iconRing: string; iconBg: string; iconText: string; articleExtra?: string }
> = {
  burgundy: {
    iconRing: "border-[#7A1E2C]/35",
    iconBg: "bg-[#7A1E2C]/10",
    iconText: "text-[#7A1E2C]",
  },
  gold: {
    iconRing: "border-[#C9A84A]/45",
    iconBg: "bg-[#C9A84A]/12",
    iconText: "text-[#8A6B1F]",
  },
  green: {
    iconRing: "border-[#2A4536]/35",
    iconBg: "bg-[#2A4536]/10",
    iconText: "text-[#2A4536]",
  },
  qr: {
    iconRing: "border-[#C9A84A]/55",
    iconBg: "bg-[#FFFDF7]",
    iconText: "text-[#7A1E2C]",
  },
  founder: {
    iconRing: "border-[#C9A84A]/55",
    iconBg: "bg-gradient-to-br from-[#7A1E2C]/12 to-[#C9A84A]/15",
    iconText: "text-[#7A1E2C]",
    articleExtra: "ring-1 ring-[#C9A84A]/35",
  },
};

function WhatYouGetCardIcon({ accent }: { accent: WhatYouGetCardAccent }) {
  const s = cardAccentStyles[accent];
  return (
    <span
      className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 sm:mb-4 sm:h-11 sm:w-11 ${s.iconRing} ${s.iconBg} ${s.iconText}`}
      aria-hidden
    >
      {accent === "qr" ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <path
            d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h3v3h-3v-3z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </span>
  );
}

function WhatYouGetCardArticle({
  card,
  index,
  isOpen,
  expandMore,
  expandLess,
  onToggle,
}: {
  card: WhatYouGetCard;
  index: number;
  isOpen: boolean;
  expandMore: string;
  expandLess: string;
  onToggle: () => void;
}) {
  const detailId = `wyg-detail-${index}`;
  const extra = cardAccentStyles[card.accent].articleExtra ?? "";

  return (
    <article
      className={`flex h-full flex-col ${cardShellClass} p-3 sm:p-6 ${extra} ${
        card.accent === "founder"
          ? "bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF]"
          : ""
      } ${card.accent === "green" ? "border-l-[3px] border-l-[#2A4536]/50" : ""}`}
    >
      <WhatYouGetCardIcon accent={card.accent} />
      <h3 className="font-serif text-base font-bold leading-snug text-balance text-[#7A1E2C] sm:text-lg lg:text-xl">
        {card.title}
      </h3>
      <p className="mt-1.5 flex-1 text-sm leading-snug text-[#3D3428] sm:mt-2 sm:text-[0.9375rem] sm:leading-relaxed">
        {card.body}
      </p>

      <button
        type="button"
        className="mt-2 inline-flex min-h-[2.25rem] self-start items-center rounded-full border border-[#C9A84A]/55 bg-[#FFFDF7] px-3 py-1.5 text-xs font-semibold text-[#7A1E2C] transition-colors hover:border-[#C9A84A] hover:bg-[#FBF7EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:mt-4 sm:px-3.5 sm:text-[0.8125rem]"
        aria-expanded={isOpen}
        aria-controls={detailId}
        onClick={onToggle}
      >
        {isOpen ? expandLess : expandMore}
      </button>

      <div
        id={detailId}
        aria-hidden={!isOpen}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-2 border-t border-[#C9A84A]/40 pt-2 sm:mt-3 sm:pt-3">
            <p className="text-sm leading-snug text-[#3D3428] sm:text-[0.9375rem] sm:leading-relaxed">
              {card.detail}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}

const marketplaceCardAccents = [
  {
    ring: "border-[#7A1E2C]/35",
    bg: "bg-[#7A1E2C]/10",
    text: "text-[#7A1E2C]",
    dot: "bg-[#7A1E2C]",
  },
  {
    ring: "border-[#2A4536]/35",
    bg: "bg-[#2A4536]/10",
    text: "text-[#2A4536]",
    dot: "bg-[#2A4536]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-[#C9A84A]/12",
    text: "text-[#8A6B1F]",
    dot: "bg-[#C9A84A]",
  },
  {
    ring: "border-[#7A1E2C]/35",
    bg: "bg-gradient-to-br from-[#7A1E2C]/10 to-[#C9A84A]/12",
    text: "text-[#7A1E2C]",
    dot: "bg-[#7A1E2C]",
  },
  {
    ring: "border-[#2A4536]/35",
    bg: "bg-[#2A4536]/10",
    text: "text-[#2A4536]",
    dot: "bg-[#2A4536]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-[#C9A84A]/12",
    text: "text-[#8A6B1F]",
    dot: "bg-[#C9A84A]",
  },
] as const;

function MarketplaceCategoryIcon({ index }: { index: number }) {
  const accent = marketplaceCardAccents[index];
  return (
    <span
      className={`mb-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 sm:mb-3 sm:h-9 sm:w-9 ${accent.ring} ${accent.bg}`}
      aria-hidden
    >
      <span className={`h-2.5 w-2.5 rounded-full ${accent.dot}`} />
    </span>
  );
}

function MarketplaceSection({
  eyebrow,
  headline,
  intro,
  bridge,
  featuredCard,
  cards,
  cardsAria,
  closing,
  exploreCta,
  exploreCtaAriaLabel,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  bridge: string;
  featuredCard: MarketplaceFeaturedCategoryCard;
  cards: [
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
    MarketplaceCategoryCard,
  ];
  cardsAria: string;
  closing: string;
  exploreCta: { label: string; href: string };
  exploreCtaAriaLabel?: string;
}) {
  const exploreCtaClassName =
    "mt-3 inline-flex min-h-[2.5rem] items-center text-sm font-semibold text-[#C9A84A] underline decoration-[#C9A84A]/50 underline-offset-[0.25em] transition-colors hover:text-[#EDE6D6] hover:decoration-[#EDE6D6]/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A84A] sm:mt-4 sm:text-[0.9375rem]";
  return (
    <section
      id="marketplace"
      className={sectionShellClass}
      aria-labelledby="marketplace-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="marketplace-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>
      <p className="mt-2 max-w-2xl text-sm font-semibold leading-snug text-[#2A4536] sm:mt-4 sm:text-[0.9375rem] sm:leading-relaxed lg:max-w-3xl xl:max-w-[42rem]">
        {bridge}
      </p>

      <article
        className={`mt-3 w-full ${cardShellClass} border-2 border-[#C9A84A]/55 bg-gradient-to-br from-[#FFF9F0] via-[#FFFDF7] to-[#F8F4EA] p-4 shadow-[0_14px_36px_-18px_rgba(122,30,44,0.22)] sm:mt-6 sm:p-6`}
        aria-labelledby="marketplace-featured-ofertas-locales"
      >
        <span
          className="inline-flex rounded-full border border-[#C9A84A]/70 bg-[#C9A84A]/15 px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#8A6B1F] sm:text-[0.7rem]"
        >
          {featuredCard.badge}
        </span>
        <h3
          id="marketplace-featured-ofertas-locales"
          className="mt-2 font-serif text-lg font-bold leading-snug text-balance text-[#7A1E2C] sm:mt-3 sm:text-xl lg:text-2xl"
        >
          {featuredCard.title}
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-snug text-[#3D3428] sm:mt-3 sm:text-[0.9375rem] sm:leading-relaxed lg:max-w-4xl">
          {featuredCard.body}
        </p>
        <p className="mt-2 max-w-2xl text-sm font-semibold leading-snug text-[#2A4536] sm:mt-3 sm:text-[0.9375rem] sm:leading-relaxed lg:max-w-3xl">
          {featuredCard.supportingLine}
        </p>
      </article>

      <ul
        className="mt-3 grid min-w-0 list-none gap-2 p-0 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
        aria-label={cardsAria}
      >
        {cards.map((card, index) => (
          <li key={index} className="flex min-w-0">
            <article
              className={`flex h-full w-full min-w-0 flex-col ${cardShellClass} border-l-[3px] border-l-[#C9A84A]/45 p-3 sm:p-5`}
            >
              <MarketplaceCategoryIcon index={index} />
              <h3 className="font-serif text-[0.9375rem] font-bold leading-snug text-balance text-[#7A1E2C] sm:text-lg">
                {card.title}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-[#3D3428] sm:mt-2 sm:text-[0.875rem] sm:leading-relaxed">
                {card.body}
              </p>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-2xl border border-[#2A4536]/25 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-3 shadow-[0_16px_40px_-18px_rgba(42,69,54,0.55)] sm:mt-8 sm:p-6">
        <p className="max-w-3xl font-serif text-[0.9375rem] font-bold leading-snug text-balance text-[#F8F4EA] sm:text-xl lg:max-w-4xl">
          {closing}
        </p>
        <a
          href={exploreCta.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={exploreCtaAriaLabel}
          className={exploreCtaClassName}
        >
          {exploreCta.label}
        </a>
      </div>
    </section>
  );
}

function WhatYouGetSection({
  eyebrow,
  headline,
  intro,
  cards,
  expandMore,
  expandLess,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  cards: WhatYouGetCard[];
  expandMore: string;
  expandLess: string;
}) {
  const [openCards, setOpenCards] = useState<Set<number>>(() => new Set());

  const toggleCard = (index: number) => {
    setOpenCards((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section
      id="que-obtienes"
      className={sectionShellClass}
      aria-labelledby="what-you-get-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="what-you-get-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>

      <ul className="mt-3 grid list-none gap-2 p-0 sm:mt-8 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        {cards.map((card, index) => {
          return (
            <li key={index} className="flex min-w-0">
              <WhatYouGetCardArticle
                card={card}
                index={index}
                isOpen={openCards.has(index)}
                expandMore={expandMore}
                expandLess={expandLess}
                onToggle={() => toggleCard(index)}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const processStepBadgeStyles = [
  "bg-[#7A1E2C] text-white ring-[#C9A84A]/45",
  "bg-[#2A4536] text-[#F8F4EA] ring-[#C9A84A]/40",
  "bg-[#C9A84A] text-[#1F241C] ring-[#7A1E2C]/20",
  "bg-[#7A1E2C] text-white ring-[#2A4536]/35",
] as const;

function HowItWorksSection({
  eyebrow,
  headline,
  intro,
  steps,
  stepsAria,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  steps: [ProcessStep, ProcessStep, ProcessStep, ProcessStep];
  stepsAria: string;
}) {
  return (
    <section
      id="como-funciona"
      className={sectionShellClass}
      aria-labelledby="como-funciona-title"
    >
      <span id="how-it-works" className="block h-0" aria-hidden />
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="como-funciona-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>

      <ol
        className="mt-3 grid list-none gap-2 p-0 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:items-stretch lg:grid-cols-2 lg:gap-6 2xl:grid-cols-4"
        aria-label={stepsAria}
      >
        {steps.map((step, index) => (
          <li key={index} className="flex min-w-0">
            <article className={`flex h-full w-full min-w-0 flex-col ${cardShellClass} p-3 sm:p-6`}>
              <span
                className={`mb-2 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ring-2 sm:mb-4 sm:h-10 sm:w-10 ${processStepBadgeStyles[index]}`}
                aria-hidden
              >
                {index + 1}
              </span>
              <h3 className="font-serif text-base font-bold leading-snug text-balance text-[#7A1E2C] sm:text-lg lg:text-xl">
                {step.title}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-[#3D3428] sm:mt-2 sm:text-[0.9375rem] sm:leading-relaxed">
                {step.body}
              </p>
            </article>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HeroQrAccessStrip({
  eyebrow,
  callout,
  summary,
  buttonLabel,
  href,
}: {
  eyebrow: string;
  callout: string;
  summary: string;
  buttonLabel: string;
  href: string;
}) {
  return (
    <aside
      className="mt-4 rounded-xl border border-[#2A4536]/15 bg-gradient-to-br from-[#F8F4EA] to-[#FFFDF7] px-3.5 py-3 sm:mt-5 sm:px-4 sm:py-4"
      aria-labelledby="hero-qr-strip-title"
    >
      <p className="text-[0.65rem] font-bold tracking-[0.12em] text-[#7A1E2C] sm:text-[0.68rem]">
        {eyebrow}
      </p>
      <p
        id="hero-qr-strip-title"
        className="mt-1 font-serif text-base font-bold leading-snug text-[#2A4536] sm:text-lg"
      >
        {callout}
      </p>
      <p className="mt-1.5 text-sm leading-snug text-[#3D3428] sm:text-[0.9375rem] sm:leading-relaxed">
        {summary}
      </p>
      <Link
        href={href}
        className="mt-2.5 inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-full border-2 border-[#2A4536]/35 bg-[#2A4536] px-4 py-2 text-center text-[0.8125rem] font-bold text-[#F8F4EA] transition hover:bg-[#223528] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:mt-3 sm:w-auto sm:px-5 sm:text-sm"
      >
        {buttonLabel}
      </Link>
    </aside>
  );
}

const QR_SECTION_CTA_COPY = {
  es: {
    openLens: "Probar Google Lens",
    translateSite: "Traducir LeonixMedia.com con Google",
    qrGuide: "Ver guía QR",
    guardrail:
      "Google Lens ayuda con páginas impresas, pantallas y capturas. Google Translate ayuda a navegar LeonixMedia.com en otro idioma.",
  },
  en: {
    openLens: "Try Google Lens",
    translateSite: "Translate LeonixMedia.com with Google",
    qrGuide: "View QR guide",
    guardrail:
      "Google Lens helps with printed pages, screens, and screenshots. Google Translate helps browse LeonixMedia.com in another language.",
  },
} as const;

function qrSectionCtaCopy(lang: SupportedLang) {
  return lang === "es" ? QR_SECTION_CTA_COPY.es : QR_SECTION_CTA_COPY.en;
}

const qrSectionCtaButtonClass =
  "inline-flex min-h-[2.5rem] w-full items-center justify-center rounded-full border-2 px-4 py-2 text-center text-[0.8125rem] font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:w-auto sm:px-5 sm:text-sm";

function QrSectionTranslationCtas({ lang }: { lang: SupportedLang }) {
  const labels = qrSectionCtaCopy(lang);
  const googleTranslateWebsiteHref = buildGoogleTranslateWebsiteUrl({
    targetLang: lang,
    siteUrl: LEONIX_TRANSLATE_SITE_ORIGIN,
  });
  const qrGuideHref = magazinePrintGuideHref(lang, {
    sourcePage: "coming-soon-v2",
    sourceCta: "qr_guide",
  });

  return (
    <div className="mt-4 min-w-0 sm:mt-5">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
        <a
          href={LENS_WEB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={`${qrSectionCtaButtonClass} border-[#2A4536]/35 bg-[#2A4536] text-[#F8F4EA] hover:bg-[#223528]`}
        >
          {labels.openLens}
        </a>
        <a
          href={googleTranslateWebsiteHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${qrSectionCtaButtonClass} border-[#C9A84A] bg-[#FFFDF7] text-[#2A4536] hover:border-[#b89742] hover:bg-[#FBF7EF]`}
        >
          {labels.translateSite}
        </a>
        <Link
          href={qrGuideHref}
          className={`${qrSectionCtaButtonClass} border-[#7A1E2C]/35 bg-[#FFFDF7] text-[#7A1E2C] hover:border-[#7A1E2C] hover:bg-[#FBF7EF]`}
        >
          {labels.qrGuide}
        </Link>
      </div>
      <p className="mt-2.5 text-xs leading-snug text-[#3D3428]/90 sm:text-[0.8125rem] sm:leading-relaxed">
        {labels.guardrail}
      </p>
    </div>
  );
}

function QrAccessSection({
  lang,
  eyebrow,
  headline,
  detailNote,
  intro,
  callout,
  explanation,
  mobileNote,
  openReaderLabel,
  readerHref,
  benefits,
  benefitsAria,
}: {
  lang: SupportedLang;
  eyebrow: string;
  headline: string;
  detailNote: string;
  intro: string;
  callout: string;
  explanation: string;
  mobileNote: string;
  openReaderLabel: string;
  readerHref: string;
  benefits: [QrBenefitCard, QrBenefitCard, QrBenefitCard];
  benefitsAria: string;
}) {
  return (
    <section
      id="qr"
      className={sectionShellClass}
      aria-labelledby="qr-title"
    >
      <span id="qr-access" className="block h-0" aria-hidden />
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="qr-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#8A6B1F] sm:text-[0.8125rem]">
        {detailNote}
      </p>
      <p className={sectionIntroClass}>{intro}</p>

      <div className="mt-3 grid min-w-0 items-start gap-2.5 sm:mt-8 sm:gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0 lg:max-w-xl">
          <p className="text-[0.9375rem] leading-snug text-[#3D3428] sm:text-[1.0625rem] sm:leading-relaxed">
            {explanation}
          </p>
          <p className="mt-3 rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-3 text-sm leading-snug text-[#3D3428] sm:mt-4 sm:p-4 sm:text-[0.9375rem] sm:leading-relaxed">
            {mobileNote}
          </p>
          <QrSectionTranslationCtas lang={lang} />
        </div>

        <div className="flex min-w-0 max-w-md flex-col items-center gap-3 self-center rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] px-3.5 py-3.5 sm:gap-4 sm:px-6 sm:py-6 lg:max-w-none lg:self-start">
          <MagazinePrintQrBridge
            lang={lang}
            qrCaption=""
            mobileNote=""
            openReaderLabel=""
            readerHref={readerHref}
            variant="compact"
            tone="onDark"
            showQrImage
            className="text-[#F8F4EA]"
          />
          <p className="max-w-xs text-center font-serif text-base font-bold leading-snug text-[#F8F4EA] sm:text-lg">
            {callout}
          </p>
        </div>
      </div>

      <ul
        className="mt-3 grid list-none gap-2 p-0 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:items-stretch lg:grid-cols-3"
        aria-label={benefitsAria}
      >
        {benefits.map((benefit, index) => (
          <li key={index} className="flex">
            <article className={`h-full w-full ${cardShellClass} p-3 sm:p-6`}>
              <h3 className="font-serif text-base font-bold leading-snug text-[#7A1E2C] sm:text-lg">
                {benefit.title}
              </h3>
              <p className="mt-1.5 text-sm leading-snug text-[#3D3428] sm:mt-2 sm:text-[0.9375rem] sm:leading-relaxed">
                {benefit.body}
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

const mediaKitPreviewAccents = [
  {
    ring: "border-[#7A1E2C]/35",
    bg: "bg-[#7A1E2C]/10",
    text: "text-[#7A1E2C]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-[#C9A84A]/12",
    text: "text-[#8A6B1F]",
  },
  {
    ring: "border-[#2A4536]/35",
    bg: "bg-[#2A4536]/10",
    text: "text-[#2A4536]",
  },
  {
    ring: "border-[#C9A84A]/55",
    bg: "bg-gradient-to-br from-[#7A1E2C]/12 to-[#C9A84A]/15",
    text: "text-[#7A1E2C]",
  },
] as const;

function MediaKitPreviewCardIcon({ index }: { index: number }) {
  const accent = mediaKitPreviewAccents[index];
  return (
    <span
      className={`mb-3 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 sm:mb-4 sm:h-10 sm:w-10 ${accent.ring} ${accent.bg} ${accent.text}`}
      aria-hidden
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 4h10v16H7V4zm2 2v12h6V6H9zm1.5 2h3v1.5h-3V8zm0 2.5h3v1.5h-3v-1.5z"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function MediaKitPreviewSection({
  lang,
  eyebrow,
  headline,
  intro,
  pdfHonestyLine,
  cards,
  cardsAria,
  ctaHeading,
  viewCta,
  downloadCta,
  dualPdfEsLabel,
  dualPdfEnLabel,
  requestInfoCta,
  supportingLine,
}: {
  lang: SupportedLang;
  eyebrow: string;
  headline: string;
  intro: string;
  pdfHonestyLine: string;
  cards: [
    MediaKitPreviewCard,
    MediaKitPreviewCard,
    MediaKitPreviewCard,
    MediaKitPreviewCard,
  ];
  cardsAria: string;
  ctaHeading: string;
  viewCta: { label: string; href: string };
  downloadCta: { label: string; href: string };
  dualPdfEsLabel: string;
  dualPdfEnLabel: string;
  requestInfoCta: { label: string; href: string };
  supportingLine: string;
}) {
  const viewLinkCta: HeroCta = {
    label: viewCta.label,
    href: viewCta.href,
    variant: "secondary",
    external: isExternalHref(viewCta.href),
  };
  const requestInfoLinkCta: HeroCta = {
    label: requestInfoCta.label,
    href: requestInfoCta.href,
    variant: "primary",
  };
  const dualMediaKit = showDualMediaKitPdfButtons(lang);

  return (
    <section
      id="media-kit-preview"
      className={sectionShellClass}
      aria-labelledby="media-kit-preview-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="media-kit-preview-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={sectionIntroClass}>{intro}</p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#3D3428]/90 sm:mt-3 sm:text-[0.9375rem] lg:max-w-4xl">
        {pdfHonestyLine}
      </p>

      <ul
        className="mt-3 grid list-none gap-2 p-0 sm:mt-8 sm:grid-cols-2 sm:gap-5 sm:items-stretch lg:grid-cols-2 lg:gap-6 2xl:grid-cols-4"
        aria-label={cardsAria}
      >
        {cards.map((card, index) => (
          <li key={index} className="flex min-w-0">
            <article
              className={`flex h-full w-full min-w-0 flex-col ${cardShellClass} p-3 ring-1 ring-[#C9A84A]/10 sm:p-6`}
            >
              <MediaKitPreviewCardIcon index={index} />
              <h3 className="font-serif text-base font-bold leading-snug text-balance text-[#7A1E2C] sm:text-lg">
                {card.title}
              </h3>
              <p className="mt-1.5 flex-1 text-sm leading-snug text-[#3D3428] sm:mt-2 sm:text-[0.9375rem] sm:leading-relaxed">
                {card.body}
              </p>
            </article>
          </li>
        ))}
      </ul>

      <div className="mt-3 rounded-2xl border border-[#C9A84A]/40 bg-gradient-to-br from-[#FFFDF7] to-[#FBF7EF] p-3 shadow-[0_12px_32px_-18px_rgba(31,36,28,0.18)] ring-1 ring-[#C9A84A]/15 sm:mt-8 sm:p-7">
        <h3 className="font-serif text-base font-bold text-[#2A4536] sm:text-xl">
          {ctaHeading}
        </h3>
        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:mt-4 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2.5">
          <HeroCtaLink cta={viewLinkCta} />
          {dualMediaKit ? (
            <>
              <MediaKitDownloadLink
                label={dualPdfEsLabel}
                href={MAGAZINE_KIT_PDF_ES}
                tone="light"
              />
              <MediaKitDownloadLink
                label={dualPdfEnLabel}
                href={MAGAZINE_KIT_PDF_EN}
                tone="light"
              />
            </>
          ) : (
            <MediaKitDownloadLink
              label={downloadCta.label}
              href={downloadCta.href}
              tone="light"
            />
          )}
          <HeroCtaLink cta={requestInfoLinkCta} />
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#3D3428]/90 sm:text-[0.9375rem]">
          {supportingLine}
        </p>
      </div>
    </section>
  );
}

function DigitalMagazineSection({
  eyebrow,
  headline,
  intro,
  visualNote,
  highlightsNote,
  mobileNote,
  readHighlightsCta,
  openOriginalCta,
  learnQrCta,
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  visualNote: string;
  highlightsNote: string;
  mobileNote: string;
  readHighlightsCta: { label: string; href: string };
  openOriginalCta: { label: string; href: string };
  learnQrCta: { label: string; href: string };
}) {
  return (
    <section
      id="digital-magazine"
      className={sectionShellClass}
      aria-labelledby="digital-magazine-title"
    >
      <p className={sectionEyebrowClass}>{eyebrow}</p>
      <h2 id="digital-magazine-title" className={sectionTitleClass}>
        {headline}
      </h2>
      <p className={`${sectionIntroClass} max-w-3xl`}>{intro}</p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:mt-3 sm:text-[0.9375rem]">
        {visualNote}
      </p>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-[0.9375rem]">
        {highlightsNote}
      </p>

      <div className="mt-3 flex min-w-0 flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-2.5">
        <HeroCtaLink
          cta={{
            label: readHighlightsCta.label,
            href: readHighlightsCta.href,
            variant: "primary",
          }}
        />
        <HeroCtaLink
          cta={{
            label: openOriginalCta.label,
            href: openOriginalCta.href,
            variant: "secondary",
          }}
        />
        <Link
          href={learnQrCta.href}
          className="inline-flex min-h-[2.75rem] w-full items-center justify-center rounded-full border-2 border-[#2A4536]/35 bg-[#FFFDF7] px-5 py-2.5 text-center text-[0.8125rem] font-bold text-[#2A4536] transition hover:border-[#2A4536] hover:bg-[#FBF7EF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:min-h-[3.125rem] sm:w-auto sm:px-6 sm:py-3 sm:text-[0.9375rem]"
        >
          {learnQrCta.label}
        </Link>
      </div>

      <p className="mt-3 max-w-3xl rounded-xl border border-[#C9A84A]/35 bg-[#FFFDF7] p-3 text-sm leading-snug text-[#3D3428] sm:mt-4 sm:p-4 sm:text-[0.9375rem] sm:leading-relaxed">
        {mobileNote}
      </p>
    </section>
  );
}

function HeroMediaKitQuickActions({
  lang,
  eyebrow,
  downloadCta,
  dualPdfEsLabel,
  dualPdfEnLabel,
  requestInfoCta,
}: {
  lang: SupportedLang;
  eyebrow: string;
  downloadCta: { label: string; href: string };
  dualPdfEsLabel: string;
  dualPdfEnLabel: string;
  requestInfoCta: { label: string; href: string };
}) {
  const dualMediaKit = showDualMediaKitPdfButtons(lang);

  return (
    <div
      className="mt-3 rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7] p-3 shadow-sm sm:mt-4 sm:p-4"
      aria-label={eyebrow}
    >
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#556B3E] sm:text-xs">
        {eyebrow}
      </p>
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-2">
        {dualMediaKit ? (
          <>
            <MediaKitDownloadLink
              label={dualPdfEsLabel}
              href={MAGAZINE_KIT_PDF_ES}
              tone="light"
            />
            <MediaKitDownloadLink
              label={dualPdfEnLabel}
              href={MAGAZINE_KIT_PDF_EN}
              tone="light"
            />
          </>
        ) : (
          <MediaKitDownloadLink label={downloadCta.label} href={downloadCta.href} tone="light" />
        )}
        <HeroCtaLink
          cta={{
            label: requestInfoCta.label,
            href: requestInfoCta.href,
            variant: "primary",
          }}
        />
      </div>
    </div>
  );
}

function MediaKitDownloadLink({
  label,
  href,
  tone = "dark",
}: {
  label: string;
  href: string;
  tone?: "dark" | "light";
}) {
  const toneClass =
    tone === "dark"
      ? "border-[#C9A84A]/40 bg-[#1a2d24]/35 text-[#EDE6D6] hover:border-[#C9A84A]/60 hover:bg-[#1a2d24]/55"
      : "border-[#C9A84A]/55 bg-[#FFFDF7] text-[#2A4536] hover:border-[#C9A84A] hover:bg-[#FBF7EF]";

  return (
    <a
      href={href}
      download
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex min-h-[3rem] w-full items-center justify-center rounded-full border px-5 py-3 text-center text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7A1E2C] sm:min-h-[3.125rem] sm:w-auto sm:px-6 sm:text-[0.9375rem] ${toneClass}`}
    >
      {label}
    </a>
  );
}

function FinalCtaActions({
  ctas,
  mediaKitDownload,
}: {
  ctas: [HeroCta, HeroCta, HeroCta];
  mediaKitDownload: { label: string; href: string };
}) {
  const [advertiseCta, mediaKitViewCta, joinCta] = ctas;

  return (
    <div className="mt-3 flex flex-col gap-1.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
      <HeroCtaLink cta={advertiseCta} />
      <div className="grid grid-cols-2 gap-1.5 sm:contents">
        <HeroCtaLink cta={mediaKitViewCta} />
        <MediaKitDownloadLink
          label={mediaKitDownload.label}
          href={mediaKitDownload.href}
        />
      </div>
      <HeroCtaLink cta={joinCta} />
    </div>
  );
}

function FinalContactSection({
  finalCta,
  contact,
  newsletter,
  lang,
}: {
  finalCta: {
    eyebrow: string;
    headline: string;
    body: string;
    ctas: [HeroCta, HeroCta, HeroCta];
    mediaKitDownload: { label: string; href: string };
  };
  contact: {
    title: string;
    body: string;
    emailLabel: string;
    email: string;
    phoneLabel: string;
    phone: string;
    phoneHref: string;
    addressLabel: string;
    address: string;
    areaLabel: string;
    area: string;
  };
  newsletter: {
    title: string;
    body: string;
    formAria: string;
    emailLabel: string;
    placeholder: string;
    button: string;
    consent: string;
    consentError: string;
  };
  lang: LeonixSiteLang;
}) {
  return (
    <section
      id="contacto"
      className={sectionShellClass}
      aria-labelledby="contacto-title"
    >
      <span id="contact" className="block h-0" aria-hidden />

      <div className="rounded-2xl border border-[#C9A84A]/35 bg-gradient-to-br from-[#2A4536] via-[#2A4536] to-[#1a2d24] p-3.5 shadow-[0_20px_48px_-24px_rgba(31,36,28,0.55)] sm:p-8">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[#C9A84A] sm:text-xs">
          {finalCta.eyebrow}
        </p>
        <h2
          id="contacto-title"
          className="mt-2 max-w-2xl font-serif text-xl font-bold leading-snug tracking-tight text-[#F8F4EA] sm:mt-3 sm:text-[1.75rem] lg:text-3xl"
        >
          {finalCta.headline}
        </h2>
        <p className="mt-3 max-w-2xl text-[0.9375rem] leading-snug text-[#EDE6D6] sm:mt-4 sm:text-[1.0625rem] sm:leading-relaxed">
          {finalCta.body}
        </p>
        <FinalCtaActions
          ctas={finalCta.ctas.map((cta) => ({
            ...cta,
            href: cta.href.includes("lang=") ? withLeonixLang(cta.href, lang) : cta.href,
          })) as [HeroCta, HeroCta, HeroCta]}
          mediaKitDownload={finalCta.mediaKitDownload}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-[#D6C7AD]/85 bg-[#FFFDF7] p-3.5 shadow-[0_10px_28px_-16px_rgba(31,36,28,0.18)] sm:mt-8 sm:p-8">
        <h2 className="font-serif text-lg font-bold text-[#2A4536] sm:text-2xl">
          {contact.title}
        </h2>
        <p className="mt-2 max-w-2xl text-[0.9375rem] leading-snug text-[#3D3428] sm:mt-3 sm:text-[1.0625rem] sm:leading-relaxed">
          {contact.body}
        </p>
        <dl className="mt-4 grid gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.emailLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold sm:text-base">
              <a
                href={`mailto:${contact.email}`}
                className="text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-[0.2em] hover:text-[#5e1721]"
              >
                {contact.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.phoneLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold sm:text-base">
              <a
                href={contact.phoneHref}
                className="text-[#7A1E2C] underline decoration-[#C9A84A]/60 underline-offset-[0.2em] hover:text-[#5e1721]"
              >
                {contact.phone}
              </a>
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.addressLabel}
            </dt>
            <dd className="mt-1 text-sm leading-relaxed text-[#3D3428] sm:text-base">
              {contact.address}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#556B3E]">
              {contact.areaLabel}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-[#2A4536] sm:text-base">
              {contact.area}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[#2A4536]/20 bg-[#2A4536] p-3.5 shadow-[0_16px_40px_-18px_rgba(42,69,54,0.55)] sm:mt-8 sm:p-8">
        <h2 className="font-serif text-lg font-bold text-[#F8F4EA] sm:text-2xl">
          {newsletter.title}
        </h2>
        <p className="mt-1.5 max-w-xl text-sm leading-snug text-[#EDE6D6] sm:mt-2 sm:text-base sm:leading-relaxed">
          {newsletter.body}
        </p>
        <ComingSoonLaunchSignupForm
          lang={lang}
          source="coming-soon-v2"
          formAria={newsletter.formAria}
          buttonLabel={newsletter.button}
          placeholder={newsletter.placeholder}
          consentLabel={newsletter.consent}
          consentErrorLabel={newsletter.consentError}
          compact
        />
      </div>
    </section>
  );
}

function ComingSoonV2Footer({ text }: { text: string }) {
  return (
    <footer className="border-t border-[#D6C7AD]/55 bg-[#FAF6EE] py-5 sm:py-7">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <p className="text-sm font-medium text-[#3D3428]">{text}</p>
      </div>
    </footer>
  );
}

function launchHref(lang: LeonixSiteLang) {
  return `/newsletter?source=coming-soon-v2&inquiryType=launch&lang=${lang}`;
}

function HeaderLogoMark() {
  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10 lg:h-10 lg:w-10">
      <Image
        src={HEADER_LOGO_SRC}
        alt=""
        width={40}
        height={40}
        className="h-full w-full object-contain"
        priority
        aria-hidden
      />
    </span>
  );
}

function LaunchCtaLink({
  lang,
  label,
  className = "",
}: {
  lang: LeonixSiteLang;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={launchHref(lang)}
      data-coming-soon-header-launch-cta=""
      className={`hidden min-h-[2.25rem] shrink-0 items-center justify-center rounded-full bg-[#7A1E2C] px-3 py-1.5 text-center text-[0.7rem] font-bold leading-tight text-white shadow-[0_3px_10px_-3px_rgba(122,30,44,0.55)] transition-colors hover:bg-[#5e1721] sm:px-3.5 sm:text-xs lg:inline-flex lg:min-h-[2.125rem] lg:text-sm ${className}`}
    >
      <span className="truncate">{label}</span>
    </Link>
  );
}

function ComingSoonMobileNavPills({
  items,
  ariaLabel,
}: {
  items: NavItem[];
  ariaLabel: string;
}) {
  return (
    <nav
      className="flex items-center gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 pb-2 pt-0.5 snap-x snap-proximity [-ms-overflow-style:none] [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={`min-h-[2rem] shrink-0 snap-start whitespace-nowrap rounded-full px-3 py-1.5 text-[0.6875rem] font-semibold sm:px-3.5 sm:text-xs ${
            item.active
              ? "bg-[#7A1E2C]/10 text-[#7A1E2C] ring-1 ring-[#7A1E2C]/25"
              : "bg-[#FFFDF7] text-[#3D3428] ring-1 ring-[#D6C7AD]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function ComingSoonV2Shell() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center bg-[#F5F0E6] text-[#3D3428]"
          aria-busy="true"
        />
      }
    >
      <ComingSoonV2ShellContent />
    </Suspense>
  );
}

function ComingSoonV2ShellContent() {
  const searchParams = useSearchParams();
  const urlLang = searchParams?.get("lang");
  const routeLang = resolveLeonixSiteLang(urlLang);

  const t = useMemo(() => getComingSoonV2Copy(routeLang), [routeLang]);
  const h = t.hero;
  const mp = t.marketplace;
  const wyg = t.whatYouGet;
  const hiw = t.howItWorks;
  const qr = t.qrAccess;
  const mkp = t.mediaKitPreview;
  const dm = t.digitalMagazine;
  const final = t.finalCta;
  const contact = t.contact;
  const newsletter = t.newsletter;

  return (
    <div lang={routeLang} className="min-h-screen overflow-x-hidden bg-[#F5F0E6] text-[#1F241C]">
      <header className="sticky top-0 z-50 border-b border-[#D6C7AD] bg-[#FAF6EE]/95 shadow-[0_1px_0_0_rgba(201,168,74,0.35)] backdrop-blur-sm supports-[backdrop-filter]:bg-[#FAF6EE]/90">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="lg:hidden">
            <div className="flex items-center justify-between gap-2 py-1.5">
              <Link
                href="#inicio"
                className="flex min-w-0 items-center gap-2"
                aria-label={t.brandName}
              >
                <HeaderLogoMark />
                <span className="sr-only">{t.brandName}</span>
              </Link>

              <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/coming-soon-v2" />
            </div>

            <ComingSoonMobileNavPills items={t.nav} ariaLabel={t.navAria} />
          </div>

          <div className="hidden lg:block">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 py-2">
              <Link
                href="#inicio"
                className="flex shrink-0 items-center gap-2"
                aria-label={t.brandName}
              >
                <HeaderLogoMark />
                <span className="font-serif text-[0.9375rem] font-bold leading-tight text-[#2A4536]">
                  {t.brandName}
                </span>
              </Link>

              <nav
                className="flex min-w-0 items-center justify-center gap-x-4 text-[0.8125rem] font-medium text-[#3D3428] xl:gap-x-5 xl:text-[0.875rem]"
                aria-label={t.navAria}
              >
                {t.nav.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={
                      item.active
                        ? "whitespace-nowrap text-[#7A1E2C] underline decoration-[#7A1E2C] decoration-2 underline-offset-[0.3em]"
                        : "whitespace-nowrap hover:text-[#7A1E2C]"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="flex shrink-0 items-center justify-end gap-2">
                <LeonixHeaderLanguageSelector variant="full" pathnameOverride="/coming-soon-v2" />
                <LaunchCtaLink lang={routeLang} label={t.launchCta} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main
        id="inicio"
        className={`relative mx-auto max-w-6xl px-4 sm:px-6 ${ANCHOR_SCROLL}`}
        aria-label={t.mainAria}
      >
        <section
          className="pb-5 pt-2 sm:pb-12 sm:pt-3 lg:pb-14 lg:pt-4"
          aria-labelledby="hero-title"
        >
          <div className="grid items-start gap-4 sm:gap-8 lg:grid-cols-2 lg:items-start lg:gap-10 xl:gap-12">
            <div className="min-w-0 max-w-3xl lg:max-w-none">
              <p className="inline-flex rounded-full border border-[#C9A84A]/65 bg-[#FFFDF7] px-3.5 py-1 text-[0.68rem] font-bold tracking-[0.14em] text-[#7A1E2C] sm:text-xs">
                {h.badge}
              </p>

              <h1
                id="hero-title"
                className="mt-4 font-serif text-[2rem] font-bold leading-[1.08] tracking-tight text-[#2A4536] sm:mt-6 sm:text-5xl sm:leading-[1.05] lg:text-[3.15rem]"
              >
                {h.title}
              </h1>

              <ul
                className="mt-4 space-y-1.5 border-l-[3px] border-[#C9A84A]/55 pl-4 sm:mt-7 sm:space-y-3 sm:pl-5"
                aria-label={h.valueAria}
              >
                {h.valueLines.map((line, index) => (
                  <li
                    key={index}
                    className={
                      index === 2
                        ? `${heroLineClass} rounded-xl border border-[#C9A84A]/40 bg-[#FFFDF7] px-3 py-2 sm:px-4 sm:py-2.5`
                        : heroLineClass
                    }
                  >
                    <HeroLineText line={line} />
                  </li>
                ))}
              </ul>

              <p className="mt-4 max-w-[38rem] text-[0.9375rem] leading-snug text-[#3D3428] sm:mt-8 sm:text-[1.0625rem] sm:leading-relaxed lg:max-w-[42rem]">
                {h.paragraph}
              </p>

              <HeroQrAccessStrip
                eyebrow={qr.eyebrow}
                callout={qr.callout}
                summary={qr.heroStripSummary}
                buttonLabel={qr.openReaderLabel}
                href={comingSoonQrReaderHref(routeLang, "hero_qr_steps")}
              />

              <div className="mt-4 flex flex-col gap-1.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
                <HeroCtaLink cta={h.ctas[0]} />
                <HeroCtaLink cta={heroPromoProductsCta(routeLang)} />
                <HeroCtaLink cta={h.ctas[2]} />
                <HeroCtaLink
                  cta={{
                    label: h.magazineCta,
                    href: dm.readHighlightsCta.href,
                    variant: "green",
                  }}
                />
                <HeroCtaLink cta={h.ctas[1]} />
              </div>

              <HeroMediaKitQuickActions
                lang={routeLang}
                eyebrow={mkp.eyebrow}
                downloadCta={mkp.downloadCta}
                dualPdfEsLabel={mkp.dualPdfEsLabel}
                dualPdfEnLabel={mkp.dualPdfEnLabel}
                requestInfoCta={mkp.requestInfoCta}
              />

              <ul
                className="mt-4 flex flex-col gap-1.5 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-4"
                aria-label={h.trustAria}
              >
                {h.trustChips.map((chip) => (
                  <li
                    key={chip}
                    className="flex items-center text-xs font-semibold text-[#3D3428] sm:text-sm"
                  >
                    <TrustChipIcon />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <HeroMediaVisual
              label={h.mediaVisual.label}
              qrOverlay={h.mediaVisual.qrOverlay}
              magazineAlt={h.mediaVisual.magazineAlt}
            />
          </div>
        </section>

        <MarketplaceSection
          eyebrow={mp.eyebrow}
          headline={mp.headline}
          intro={mp.intro}
          bridge={mp.bridge}
          featuredCard={mp.featuredCard}
          cards={mp.cards}
          cardsAria={mp.cardsAria}
          closing={mp.closing}
          exploreCta={mp.exploreCta}
          exploreCtaAriaLabel={
            routeLang === "en"
              ? "Open Leonix classifieds visual catalog in a new tab"
              : "Abrir catálogo visual de Clasificados Leonix en una nueva pestaña"
          }
        />

        <WhatYouGetSection
          eyebrow={wyg.eyebrow}
          headline={wyg.headline}
          intro={wyg.intro}
          cards={wyg.cards}
          expandMore={wyg.expandMore}
          expandLess={wyg.expandLess}
        />

        <HowItWorksSection
          eyebrow={hiw.eyebrow}
          headline={hiw.headline}
          intro={hiw.intro}
          steps={hiw.steps}
          stepsAria={hiw.stepsAria}
        />

        <QrAccessSection
          lang={routeLang}
          eyebrow={qr.eyebrow}
          headline={qr.headline}
          detailNote={qr.detailNote}
          intro={qr.intro}
          callout={qr.callout}
          explanation={qr.explanation}
          mobileNote={qr.mobileNote}
          openReaderLabel={qr.openReaderLabel}
          readerHref={comingSoonQrReaderHref(routeLang, "qr_steps")}
          benefits={qr.benefits}
          benefitsAria={qr.benefitsAria}
        />

        <MediaKitPreviewSection
          lang={routeLang}
          eyebrow={mkp.eyebrow}
          headline={mkp.headline}
          intro={mkp.intro}
          pdfHonestyLine={mkp.pdfHonestyLine}
          cards={mkp.cards}
          cardsAria={mkp.cardsAria}
          ctaHeading={mkp.ctaHeading}
          viewCta={mkp.viewCta}
          downloadCta={mkp.downloadCta}
          dualPdfEsLabel={mkp.dualPdfEsLabel}
          dualPdfEnLabel={mkp.dualPdfEnLabel}
          requestInfoCta={mkp.requestInfoCta}
          supportingLine={mkp.supportingLine}
        />

        <DigitalMagazineSection
          eyebrow={dm.eyebrow}
          headline={dm.headline}
          intro={dm.intro}
          visualNote={dm.visualNote}
          highlightsNote={dm.highlightsNote}
          mobileNote={dm.mobileNote}
          readHighlightsCta={dm.readHighlightsCta}
          openOriginalCta={dm.openOriginalCta}
          learnQrCta={dm.learnQrCta}
        />

        <FinalContactSection
          finalCta={final}
          contact={contact}
          newsletter={newsletter}
          lang={routeLang}
        />
      </main>

      <ComingSoonV2Footer text={t.footer} />
    </div>
  );
}
