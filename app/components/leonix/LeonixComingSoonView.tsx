"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useState, type FormEvent, type ReactNode } from "react";
import { submitLeadForm } from "@/app/(site)/lib/submitLeadForm";
import {
  LEONIX_COMING_SOON_COPY,
  LEONIX_COMING_SOON_NEWSLETTER_SOURCE,
  leonixAdvertiseHref,
  leonixLaunchHref,
  leonixMediaKitHref,
  type HeroAccent,
  type HeroLine,
  type LeonixComingSoonLang,
} from "@/app/lib/leonix/leonixComingSoonCopy";

export type LeonixComingSoonViewMode = "page" | "gate";

type LeonixComingSoonViewProps = {
  mode?: LeonixComingSoonViewMode;
};

const heroLineClass =
  "text-lg font-semibold leading-snug tracking-tight text-[#3D3428] sm:text-xl sm:leading-snug";

const heroAccentClass: Record<HeroAccent, string> = {
  burgundy: "font-bold text-[#7A1E2C]",
  gold: "font-bold text-[#9A7B28] underline decoration-[#C9A84A]/70 decoration-2 underline-offset-[0.2em]",
};

const categoryIconTone: Record<
  "burgundy" | "green" | "gold",
  { ring: string; bg: string; text: string }
> = {
  burgundy: { ring: "border-[#7A1E2C]/40", bg: "bg-[#7A1E2C]/12", text: "text-[#7A1E2C]" },
  green: { ring: "border-[#556B3E]/40", bg: "bg-[#556B3E]/12", text: "text-[#556B3E]" },
  gold: { ring: "border-[#C9A84A]/50", bg: "bg-[#C9A84A]/15", text: "text-[#9A7B28]" },
};

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

function ArrowIcon() {
  return (
    <svg className="ml-2 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrustIcon() {
  return (
    <span
      className="mr-2 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/60 bg-[#C9A84A]/15 text-[#9A7B28]"
      aria-hidden
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.2l5-.7L12 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function CategoryIcon({ tone }: { tone: "burgundy" | "green" | "gold" }) {
  const c = categoryIconTone[tone];
  return (
    <span
      className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 ${c.ring} ${c.bg} ${c.text}`}
      aria-hidden
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function FeatureIcon() {
  return (
    <span
      className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-[#C9A84A]/55 bg-[#FFFDF7] text-[#9A7B28] shadow-sm"
      aria-hidden
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 12h10M12 7v10"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

function SocialPlaceholder({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-[#4A4F47] bg-[#2A2E28] text-xs font-semibold text-[#C9A84A]/80 opacity-80"
    >
      ···
    </button>
  );
}

function CtaLink({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "primary" | "outline" | "outline-burgundy";
  children: ReactNode;
}) {
  const base =
    "inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-center text-sm font-bold shadow-md transition sm:w-auto sm:text-base";
  const styles = {
    primary: `${base} bg-[#7A1E2C] text-white hover:bg-[#5e1721]`,
    outline: `${base} border-2 border-[#C9A84A] bg-[#FFFDF7] text-[#1F241C] shadow-sm hover:bg-[#FBF7EF]`,
    "outline-burgundy": `${base} border-2 border-[#7A1E2C]/35 bg-[#FFFDF7] text-[#7A1E2C] shadow-sm hover:bg-[#FBF7EF]`,
  };
  return (
    <Link href={href} className={styles[variant]}>
      {children}
      <ArrowIcon />
    </Link>
  );
}

export function LeonixComingSoonView({ mode = "page" }: LeonixComingSoonViewProps) {
  const [lang, setLang] = useState<LeonixComingSoonLang>("es");
  const emailId = useId();
  const t = LEONIX_COMING_SOON_COPY[lang];
  const [email, setEmail] = useState("");
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);

  useEffect(() => {
    if (mode !== "gate") return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [mode]);

  async function onNewsletterSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newsletterLoading || newsletterSuccess) return;
    setNewsletterError(null);
    setNewsletterLoading(true);

    const result = await submitLeadForm(
      "/api/newsletter/subscribe",
      {
        email,
        source: LEONIX_COMING_SOON_NEWSLETTER_SOURCE,
        lang,
        preferredLanguage: lang,
      },
      lang
    );

    setNewsletterLoading(false);
    if (result.ok) {
      setNewsletterSuccess(true);
      return;
    }
    setNewsletterError(result.message || t.notifyError);
  }

  const shellClass =
    mode === "gate"
      ? "fixed inset-0 z-[9999] overflow-y-auto overscroll-none bg-[#F8F4EA] text-[#1F241C]"
      : "min-h-screen bg-[#F8F4EA] text-[#1F241C]";

  return (
    <div
      lang={lang}
      className={shellClass}
      role={mode === "gate" ? "dialog" : undefined}
      aria-modal={mode === "gate" ? true : undefined}
      aria-label={t.pageAria}
    >
      <header className="sticky top-0 z-20 border-b border-[#D6C7AD]/80 bg-[#FBF7EF]/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link href="#inicio" className="shrink-0">
              <Image
                src="/logo-clean.png"
                alt="Leonix Media"
                width={160}
                height={56}
                className="h-11 w-auto object-contain sm:h-12"
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
                  {LEONIX_COMING_SOON_COPY[code].langToggle[code]}
                </button>
              ))}
            </div>
          </div>
          <nav
            className="hidden flex-wrap items-center justify-end gap-x-5 gap-y-1 text-sm font-medium text-[#3D3428] lg:flex"
            aria-label={lang === "es" ? "Principal" : "Main"}
          >
            {t.nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={
                  item.active
                    ? "border-b-2 border-[#7A1E2C] pb-0.5 text-[#7A1E2C]"
                    : "hover:text-[#7A1E2C]"
                }
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={leonixLaunchHref(lang)}
              className="rounded-full bg-[#7A1E2C] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:bg-[#5e1721]"
            >
              {t.navLaunch}
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 sm:pt-10">
        <section id="inicio" className="scroll-mt-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.9fr)] lg:items-center lg:gap-12">
            <div>
              <p className="inline-flex rounded-full border border-[#C9A84A]/70 bg-[#FFFDF7] px-3 py-1 text-xs font-bold tracking-[0.12em] text-[#7A1E2C]">
                {t.badge}
              </p>
              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight text-[#2F4A38] sm:text-5xl lg:text-[3.25rem]">
                {t.heroTitle}
              </h1>
              <ul
                className="mt-5 max-w-xl space-y-2 border-l-[3px] border-[#C9A84A]/55 pl-4 sm:pl-5"
                aria-label={t.heroValueAria}
              >
                {t.heroLines.map((line, index) => (
                  <li key={index} className={heroLineClass}>
                    <HeroLineText line={line} />
                  </li>
                ))}
              </ul>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#3D3428] sm:mt-6 sm:text-lg">
                {t.heroParagraph}
              </p>
              <div
                id="anunciate"
                className="mt-8 flex scroll-mt-24 flex-col gap-3 sm:flex-row sm:flex-wrap"
              >
                <CtaLink href={leonixAdvertiseHref(lang)} variant="primary">
                  {t.ctaAdvertise}
                </CtaLink>
                <CtaLink href={leonixMediaKitHref(lang)} variant="outline">
                  {t.ctaMediaKit}
                </CtaLink>
                <CtaLink href={leonixLaunchHref(lang)} variant="outline-burgundy">
                  {t.ctaLaunch}
                </CtaLink>
              </div>
              <ul className="mt-7 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-4" aria-label={t.trustAria}>
                {t.trustChips.map((chip) => (
                  <li
                    key={chip}
                    className="flex items-center text-sm font-semibold text-[#3D3428] sm:text-[0.95rem]"
                  >
                    <TrustIcon />
                    {chip}
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="ediciones"
              className="scroll-mt-24 mx-auto w-full max-w-sm lg:max-w-none lg:justify-self-end"
            >
              <div className="overflow-hidden rounded-2xl border-2 border-[#C9A84A]/45 bg-[#FFFDF7] shadow-[0_18px_40px_-12px_rgba(31,36,28,0.22)]">
                <div className="border-b border-[#D6C7AD] bg-[#7A1E2C] px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-[#F8F4EA]">
                  {t.magazineRibbon}
                </div>
                <div className="relative flex items-center justify-center bg-gradient-to-b from-[#E8DCC5]/40 to-[#F8F4EA] p-4 sm:p-5">
                  <div className="relative aspect-[3/4] w-full max-w-[280px] overflow-hidden rounded-lg border border-[#D6C7AD]/80 bg-[#FFFDF7] shadow-lg">
                    <Image
                      src="/magazine/leonix-media-launch-es.png"
                      alt={t.magazineAlt}
                      fill
                      className="object-contain object-center p-1"
                      sizes="280px"
                      priority
                    />
                  </div>
                </div>
                <p className="px-4 py-3 text-center text-xs text-[#5F6258]">{t.magazineCaption}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="beneficios" className="mt-16 scroll-mt-24">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {t.cards.map((card) => (
              <article
                key={card.title}
                className="flex flex-col rounded-2xl border border-[#D6C7AD]/90 bg-[#FFFDF7] p-6 shadow-[0_8px_24px_-12px_rgba(31,36,28,0.18)]"
              >
                <CategoryIcon tone={card.iconTone} />
                <h2 className="font-serif text-xl font-bold text-[#7A1E2C]">{card.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{card.subtitle}</p>
                {card.tagline ? (
                  <p className="mt-3 text-sm font-bold text-[#C9A84A]">{card.tagline}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {t.features.map((feature) => (
              <article
                key={feature.title}
                className="flex flex-col rounded-2xl border border-[#D6C7AD]/80 bg-[#FBF7EF] p-5 text-center shadow-sm sm:text-left"
              >
                <FeatureIcon />
                <h3 className="font-serif text-base font-bold text-[#2F4A38] sm:text-lg">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#3D3428]">{feature.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section
          id="multilingual"
          className="mt-16 scroll-mt-24 rounded-2xl border border-[#D6C7AD]/90 bg-[#FBF7EF] p-6 shadow-[0_8px_24px_-12px_rgba(31,36,28,0.12)] sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#556B3E]">{t.multilingualLabel}</p>
          <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-[#7A1E2C] sm:text-3xl">
            {t.multilingualTitle}
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#3D3428] sm:text-base">
            {t.multilingualBody}
          </p>
        </section>
      </main>

      <section
        id="sobre"
        className="scroll-mt-24 border-y border-[#5e1721]/30 bg-gradient-to-r from-[#7A1E2C] via-[#6d1a26] to-[#5e1721] text-[#F8F4EA]"
        aria-labelledby="launch-strip-title"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex max-w-xl gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#C9A84A]/50 bg-[#C9A84A]/20 text-[#F8F4EA]"
              aria-hidden
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6h16v12H4V6zm0 0l8 6 8-6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <h2 id="launch-strip-title" className="text-xl font-bold sm:text-2xl">
                {t.launchTitle}
              </h2>
              <p className="mt-2 text-sm leading-relaxed opacity-95 sm:text-base">{t.launchBody}</p>
            </div>
          </div>
          {newsletterSuccess ? (
            <p
              className="rounded-lg border border-[#C9A84A]/40 bg-[#FFFDF7]/10 px-4 py-3 text-sm font-semibold text-[#F8F4EA] lg:max-w-md"
              role="status"
            >
              {t.notifySuccess}
            </p>
          ) : (
            <form
              className="flex w-full max-w-xl flex-col gap-3 sm:flex-row lg:shrink-0"
              onSubmit={onNewsletterSubmit}
              noValidate
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={newsletterLoading}
                placeholder={t.emailPlaceholder}
                className="min-w-0 flex-1 rounded-lg border border-[#D6C7AD] bg-[#FFFDF7] px-4 py-3 text-[#1F241C] placeholder:text-[#5F6258] disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="inline-flex items-center justify-center rounded-lg bg-[#C9A84A] px-6 py-3 text-sm font-bold text-[#1F241C] shadow-md transition hover:bg-[#d4bc6a] disabled:cursor-not-allowed disabled:opacity-70 sm:text-base"
              >
                {newsletterLoading ? t.notifySubmitting : t.notifyButton}
                {!newsletterLoading ? <ArrowIcon /> : null}
              </button>
            </form>
          )}
        </div>
        {newsletterError ? (
          <p className="mx-auto max-w-6xl px-4 pb-6 text-sm font-medium text-[#F8F4EA]/95 sm:px-6" role="alert">
            {newsletterError}
          </p>
        ) : null}
      </section>

      <footer className="bg-[#1F241C] text-[#E8DCC5]">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left sm:px-6">
          <p className="text-sm font-medium tracking-wide">{t.footerGeo}</p>
          <div className="flex gap-2" aria-label={t.socialAria}>
            <SocialPlaceholder label="Facebook" />
            <SocialPlaceholder label="Instagram" />
            <SocialPlaceholder label="WhatsApp" />
            <SocialPlaceholder label="YouTube" />
          </div>
          <p className="text-xs text-[#A8AD9F] sm:text-right">{t.footerCopyright}</p>
        </div>
      </footer>
    </div>
  );
}
